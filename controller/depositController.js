import Deposit from "../model/depositeModel.js";
import uploadToCloudinary from "../helper/cloudinary.js";
import User from "../model/UserModel.js";
import asyncHandler from "express-async-handler";


export const createDeposit = async (req, res) => {
  try {
    const { userId, amount, transactionId, dateTime, accounttype } = req.body;

    let attachmentUrls = [];

    // Upload attachments to Cloudinary if present
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploadedUrl = await uploadToCloudinary(file.buffer);
        attachmentUrls.push(uploadedUrl);
      }
    }

    const newDeposit = new Deposit({
      userId,
      amount,
      transactionId,
      accounttype,
      attachment: attachmentUrls,
      dateTime: dateTime || new Date(),
    });

    await newDeposit.save();

    return res.status(201).json({
      success: true,
      message: "Deposit submitted successfully",
      data: newDeposit,
    });
  } catch (error) {
    console.error("❌ Deposit creation failed:", error);
    return res.status(500).json({
      success: false,
      message: "Error while creating deposit",
      error: error.message,
    });
  }
};


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