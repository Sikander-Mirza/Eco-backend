import mongoose from "mongoose";

const depositSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
    },
    accounttype: {
      type: String,
      required: true,
    },
    attachment: {
      type: [String],
      required: false,
    },
    dateTime: {
      type: Date,
      default: Date.now,
    },
    paymentProvider: {
      type: String,
      enum: ["manual", "nowpayments"],
      default: "manual",
    },
    paymentStatus: {
      type: String,
      default: "pending",
    },
    payCurrency: {
      type: String,
    },
    actuallyPaid: {
      type: Number,
    },
    nowPaymentsInvoiceId: {
      type: String,
    },
    nowPaymentsPaymentId: {
      type: String,
    },
    invoiceUrl: {
      type: String,
    },
    nowPaymentsRaw: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

const Deposit = mongoose.model("Deposit", depositSchema);

export default Deposit;
