import { Request, Response } from "express";
import PaymentModel from "../../models/payment/paymentModel";
import Stripe from "stripe";

export default class PaymentController {
  private model: PaymentModel;
  private stripe: Stripe;

  constructor(model: PaymentModel) {
    this.model = model;
    
    // Initialize Stripe with secret key from environment
    const secretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!secretKey || secretKey === 'your_stripe_secret_key_here') {
      throw new Error("STRIPE_SECRET_KEY is not properly configured in .env file");
    }
    
    this.stripe = new Stripe(secretKey, {
      apiVersion: "2025-10-29.clover",
    });
  }

  /**
   * Create a Stripe Payment Intent for accommodation booking
   */
  async createPaymentIntent(req: any, res: any) {
    try {
      const { amount, currency = "usd", bookingId, customerEmail } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid amount is required",
        });
      }

      // Create a PaymentIntent with Stripe
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency,
        metadata: {
          bookingId: bookingId?.toString() || "",
          customerEmail: customerEmail || "",
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.json({
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        },
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create payment intent",
      });
    }
  }

  /**
   * Create a new payment
   */
  async createPayment(req: any, res: any) {
    try {
      const {
        amount,
        paymentMethod,
        transactionId,
        accommodationBookingId,
        status,
      } = req.body;

      if (!amount || !paymentMethod || !transactionId) {
        return res.status(400).json({
          success: false,
          message: "amount, paymentMethod, and transactionId are required",
        });
      }

      const payment = await this.model.createPayment(
        amount,
        paymentMethod,
        transactionId,
        accommodationBookingId,
        status || "pending"
      );

      res.status(201).json({
        success: true,
        data: payment,
        message: "Payment created successfully",
      });
    } catch (error: any) {
      console.error("Error in createPayment:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create payment",
      });
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(req: any, res: any) {
    try {
      const { id } = req.params;

      const payment = await this.model.getPaymentById(parseInt(id));

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found",
        });
      }

      res.json({
        success: true,
        data: payment,
      });
    } catch (error: any) {
      console.error("Error in getPaymentById:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get payment",
      });
    }
  }

  /**
   * Get payment by transaction ID
   */
  async getPaymentByTransactionId(req: any, res: any) {
    try {
      const { transactionId } = req.params;

      const payment = await this.model.getPaymentByTransactionId(transactionId);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found",
        });
      }

      res.json({
        success: true,
        data: payment,
      });
    } catch (error: any) {
      console.error("Error in getPaymentByTransactionId:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get payment",
      });
    }
  }

  /**
   * Get all payments with pagination and filters
   */
  async getAllPayments(req: any, res: any) {
    try {
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;

      const filters: any = {};
      if (req.query.status) filters.status = req.query.status;
      if (req.query.paymentMethod) filters.paymentMethod = req.query.paymentMethod;
      if (req.query.accommodationBookingId)
        filters.accommodationBookingId = parseInt(req.query.accommodationBookingId);
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate);

      const result = await this.model.getAllPayments(
        page,
        pageSize,
        Object.keys(filters).length > 0 ? filters : undefined
      );

      res.json({
        success: true,
        data: result.payments,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
        },
      });
    } catch (error: any) {
      console.error("Error in getAllPayments:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get payments",
      });
    }
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(req: any, res: any) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: "status is required",
        });
      }

      const payment = await this.model.updatePaymentStatus(parseInt(id), status);

      res.json({
        success: true,
        data: payment,
        message: "Payment status updated successfully",
      });
    } catch (error: any) {
      console.error("Error in updatePaymentStatus:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update payment status",
      });
    }
  }

  /**
   * Get payments by accommodation booking ID
   */
  async getPaymentsByAccommodationBookingId(req: any, res: any) {
    try {
      const { accommodationBookingId } = req.params;

      const payments = await this.model.getPaymentsByAccommodationBookingId(
        parseInt(accommodationBookingId)
      );

      res.json({
        success: true,
        data: payments,
      });
    } catch (error: any) {
      console.error("Error in getPaymentsByAccommodationBookingId:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get payments",
      });
    }
  }

  /**
   * Get payment summary statistics
   */
  async getPaymentSummary(req: any, res: any) {
    try {
      const filters: any = {};
      if (req.query.status) filters.status = req.query.status;
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate);

      const summary = await this.model.getPaymentSummary(
        Object.keys(filters).length > 0 ? filters : undefined
      );

      res.json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      console.error("Error in getPaymentSummary:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get payment summary",
      });
    }
  }

  /**
   * Delete payment
   */
  async deletePayment(req: any, res: any) {
    try {
      const { id } = req.params;

      await this.model.deletePayment(parseInt(id));

      res.json({
        success: true,
        message: "Payment deleted successfully",
      });
    } catch (error: any) {
      console.error("Error in deletePayment:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to delete payment",
      });
    }
  }
}
