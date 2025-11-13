import Deposit from "../model/depositeModel.js";
import uploadToCloudinary from "../helper/cloudinary.js";
import User from "../model/UserModel.js";
import asyncHandler from "express-async-handler";


export const createDeposit = asyncHandler(async (req, res) => {
  try {
    const { amount, transactionId, dateTime, accounttype } = req.body;
const userId = req.user._id;
    let attachmentUrls = [];

    // Upload attachments to Cloudinary if present
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploadedUrl = await uploadToCloudinary(file.buffer);
        attachmentUrls.push(uploadedUrl);
      }
    }

    // Create deposit record
    const newDeposit = new Deposit({
      userId,
      amount,
      transactionId,
      accounttype,
      attachment: attachmentUrls,
      dateTime: dateTime || new Date(),
      status: "Pending", // default status
    });

    await newDeposit.save();

    // ✅ Update user's main balance immediately
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.mainBalance += Number(amount);
    await user.save();

    return res.status(201).json({
      success: true,
      message: "Deposit submitted successfully and balance updated",
      data: newDeposit,
      updatedBalance: user.mainBalance,
    });
  } catch (error) {
    console.error("❌ Deposit creation failed:", error);
    return res.status(500).json({
      success: false,
      message: "Error while creating deposit",
      error: error.message,
    });
  }
});


export const getDeposits = asyncHandler(async (req, res) => {
  console.log("api hit")
  const userId = req.user._id;
  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  let deposits;

  if (user.role === "admin") {
    // Admin sees all deposits
    deposits = await Deposit.find()
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 });
  } else {
    // User sees their own deposits only
    deposits = await Deposit.find({ userId })
      .sort({ createdAt: -1 });
  }

  res.status(200).json({
    success: true,
    count: deposits.length,
    data: deposits,
  });
});