export {};
import express from "express";
import PaymentController from "../../controllers/payment/paymentController";
import PaymentModel from "../../models/payment/paymentModel";

const router = express.Router();
const paymentModel = new PaymentModel();
const paymentController = new PaymentController(paymentModel);

// Create a Stripe payment intent
router.post(
  "/create-payment-intent",
  paymentController.createPaymentIntent.bind(paymentController)
);

// Create a new payment
router.post(
  "/",
  paymentController.createPayment.bind(paymentController)
);

// Get all payments with pagination and filters
router.get(
  "/",
  paymentController.getAllPayments.bind(paymentController)
);

// Get payment summary statistics
router.get(
  "/summary/statistics",
  paymentController.getPaymentSummary.bind(paymentController)
);

// Get payment by transaction ID
router.get(
  "/transaction/:transactionId",
  paymentController.getPaymentByTransactionId.bind(paymentController)
);

// Get payments by accommodation booking ID
router.get(
  "/booking/:accommodationBookingId",
  paymentController.getPaymentsByAccommodationBookingId.bind(paymentController)
);

// Get payment by ID
router.get(
  "/:id",
  paymentController.getPaymentById.bind(paymentController)
);

// Update payment status
router.patch(
  "/:id/status",
  paymentController.updatePaymentStatus.bind(paymentController)
);

// Delete payment
router.delete(
  "/:id",
  paymentController.deletePayment.bind(paymentController)
);

module.exports = router;
