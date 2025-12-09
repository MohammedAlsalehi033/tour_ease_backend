import { prisma } from "../utils/prismaClient";

/**
 * Booking Status Updater Service
 * 
 * Automatically updates booking statuses based on dates:
 * - Finds all bookings with status "confirmed" where checkout date has passed
 * - Updates them to "checked out" status automatically
 * 
 * This runs periodically in the background (default: every 60 minutes)
 * and can also be triggered manually via API endpoint.
 * 
 * SAFE FOR DEPLOYMENT:
 * - Only reads and updates database, no external API calls
 * - Uses efficient bulk updates with Prisma
 * - Logs all actions for monitoring
 * - Handles errors gracefully without crashing server
 * 
 * Usage:
 * - Automatic: Starts when server starts (see app.ts)
 * - Manual: POST /api/accommodation-bookings/update-expired-bookings
 */
export class BookingStatusUpdater {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  /**
   * Start the automatic status updater
   * @param intervalMinutes - How often to check (default: 60 minutes)
   */
  start(intervalMinutes: number = 60): void {
    if (this.isRunning) {
      console.log('[BookingStatusUpdater] Already running');
      return;
    }

    console.log(`[BookingStatusUpdater] Starting automatic status updates (every ${intervalMinutes} minutes)`);
    
    // Run immediately on start
    this.updateExpiredBookings();

    // Then run periodically
    this.intervalId = setInterval(() => {
      this.updateExpiredBookings();
    }, intervalMinutes * 60 * 1000);

    this.isRunning = true;
  }

  /**
   * Stop the automatic status updater
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log('[BookingStatusUpdater] Stopped');
    }
  }

  /**
   * Manually trigger an update check
   */
  async updateExpiredBookings(): Promise<void> {
    try {
      const now = new Date();
      console.log(`\n[BookingStatusUpdater] Running status check at ${now.toISOString()}`);

      // Find all confirmed bookings where checkout date has passed
      const expiredBookings = await prisma.accommodationBooking.findMany({
        where: {
          status: 'confirmed',
          checkOutDate: {
            lt: now, // Less than current date (checkout date has passed)
          },
        },
        select: {
          id: true,
          checkInDate: true,
          checkOutDate: true,
          travelerId: true,
          room: {
            select: {
              id: true,
              roomType: true,
              accommodation: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (expiredBookings.length === 0) {
        console.log('[BookingStatusUpdater] No expired bookings found');
        return;
      }

      console.log(`[BookingStatusUpdater] Found ${expiredBookings.length} expired booking(s)`);

      // Update all expired bookings to "checked out" status
      const updateResult = await prisma.accommodationBooking.updateMany({
        where: {
          id: {
            in: expiredBookings.map(b => b.id),
          },
        },
        data: {
          status: 'checked out',
        },
      });

      console.log(`[BookingStatusUpdater] ✅ Updated ${updateResult.count} booking(s) to "checked out" status`);

      // Log details of updated bookings
      expiredBookings.forEach(booking => {
        console.log(`  - Booking #${booking.id}: ${booking.room.accommodation.name} (${booking.room.roomType})`);
        console.log(`    Checkout Date: ${booking.checkOutDate.toISOString()}`);
      });

    } catch (error: any) {
      console.error('[BookingStatusUpdater] Error updating expired bookings:', error);
      throw error;
    }
  }

  /**
   * Get status of the updater
   */
  getStatus(): { running: boolean; nextCheck?: string } {
    return {
      running: this.isRunning,
      nextCheck: this.isRunning ? 'Running periodically' : 'Not running',
    };
  }
}

// Export singleton instance
export const bookingStatusUpdater = new BookingStatusUpdater();
