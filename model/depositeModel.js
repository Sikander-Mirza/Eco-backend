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
    attachment: {
      type: [String], // storing array of uploaded Cloudinary URLs
      required: false,
    },
    dateTime: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Deposit = mongoose.model("Deposit", depositSchema);

export default Deposit;
