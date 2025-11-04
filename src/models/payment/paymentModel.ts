import { prisma } from "../../utils/prismaClient";
import { Payment } from "@prisma/client";

export default class PaymentModel {
  /**
   * Create a new payment
   */
  async createPayment(
    amount: number,
    paymentMethod: string,
    transactionId: string,
    accommodationBookingId?: number,
    status: string = "pending"
  ): Promise<Payment> {
    try {
      const payment = await prisma.payment.create({
        data: {
          amount,
          paymentMethod,
          transactionId,
          accommodationBookingId,
          status,
        },
      });
      return payment;
    } catch (error) {
      console.error("Error creating payment:", error);
      throw error;
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(id: number): Promise<Payment | null> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id },
        include: {
          accommodationBooking: {
            include: {
              room: {
                include: {
                  accommodation: true,
                },
              },
              traveler: true,
            },
          },
        },
      });
      return payment;
    } catch (error) {
      console.error("Error getting payment:", error);
      throw error;
    }
  }

  /**
   * Get payment by transaction ID
   */
  async getPaymentByTransactionId(transactionId: string): Promise<Payment | null> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { transactionId },
        include: {
          accommodationBooking: {
            include: {
              room: {
                include: {
                  accommodation: true,
                },
              },
              traveler: true,
            },
          },
        },
      });
      return payment;
    } catch (error) {
      console.error("Error getting payment by transaction ID:", error);
      throw error;
    }
  }

  /**
   * Get all payments with filters and pagination
   */
  async getAllPayments(
    page: number = 1,
    pageSize: number = 10,
    filters?: {
      status?: string;
      paymentMethod?: string;
      accommodationBookingId?: number;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{
    payments: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * pageSize;
      const where: any = {};

      if (filters) {
        if (filters.status) where.status = filters.status;
        if (filters.paymentMethod) where.paymentMethod = filters.paymentMethod;
        if (filters.accommodationBookingId)
          where.accommodationBookingId = filters.accommodationBookingId;
        if (filters.startDate || filters.endDate) {
          where.createdAt = {};
          if (filters.startDate) where.createdAt.gte = filters.startDate;
          if (filters.endDate) where.createdAt.lte = filters.endDate;
        }
      }

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where,
          skip,
          take: pageSize,
          include: {
            accommodationBooking: {
              include: {
                room: {
                  include: {
                    accommodation: true,
                  },
                },
                traveler: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        }),
        prisma.payment.count({ where }),
      ]);

      const totalPages = Math.ceil(total / pageSize);

      return {
        payments,
        total,
        page,
        pageSize,
        totalPages,
      };
    } catch (error) {
      console.error("Error getting all payments:", error);
      throw error;
    }
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    id: number,
    status: string
  ): Promise<Payment> {
    try {
      const payment = await prisma.payment.update({
        where: { id },
        data: { status },
        include: {
          accommodationBooking: {
            include: {
              room: {
                include: {
                  accommodation: true,
                },
              },
              traveler: true,
            },
          },
        },
      });
      return payment;
    } catch (error) {
      console.error("Error updating payment status:", error);
      throw error;
    }
  }

  /**
   * Get payments by accommodation booking ID
   */
  async getPaymentsByAccommodationBookingId(
    accommodationBookingId: number
  ): Promise<Payment[]> {
    try {
      const payments = await prisma.payment.findMany({
        where: { accommodationBookingId },
        include: {
          accommodationBooking: {
            include: {
              room: {
                include: {
                  accommodation: true,
                },
              },
              traveler: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      return payments;
    } catch (error) {
      console.error("Error getting payments by booking ID:", error);
      throw error;
    }
  }

  /**
   * Get payment summary statistics
   */
  async getPaymentSummary(filters?: {
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    totalAmount: number;
    totalCount: number;
    successfulPayments: number;
    pendingPayments: number;
    failedPayments: number;
    averagePayment: number;
  }> {
    try {
      const where: any = {};

      if (filters) {
        if (filters.status) where.status = filters.status;
        if (filters.startDate || filters.endDate) {
          where.createdAt = {};
          if (filters.startDate) where.createdAt.gte = filters.startDate;
          if (filters.endDate) where.createdAt.lte = filters.endDate;
        }
      }

      const payments = await prisma.payment.findMany({
        where,
        select: {
          amount: true,
          status: true,
        },
      });

      const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const successfulPayments = payments.filter(p => p.status === "completed").length;
      const pendingPayments = payments.filter(p => p.status === "pending").length;
      const failedPayments = payments.filter(p => p.status === "failed").length;
      const averagePayment = payments.length > 0 ? totalAmount / payments.length : 0;

      return {
        totalAmount,
        totalCount: payments.length,
        successfulPayments,
        pendingPayments,
        failedPayments,
        averagePayment,
      };
    } catch (error) {
      console.error("Error getting payment summary:", error);
      throw error;
    }
  }

  /**
   * Delete payment
   */
  async deletePayment(id: number): Promise<void> {
    try {
      await prisma.payment.delete({
        where: { id },
      });
    } catch (error) {
      console.error("Error deleting payment:", error);
      throw error;
    }
  }
}
