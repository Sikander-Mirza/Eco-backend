import mongoose from "mongoose";

const withdrawalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [1, "Withdrawal amount must be greater than 0"],
    },
    walletNumber: {
      type: String,
      required: true,
    },
    walletType: {
      type: String,
      required: true,
    },
    walletName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Withdrawal", withdrawalSchema);
