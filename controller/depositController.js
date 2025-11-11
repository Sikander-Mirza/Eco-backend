import Deposit from "../model/depositeModel.js";
import uploadToCloudinary from "../helper/cloudinary.js";

export const createDeposit = async (req, res) => {
  try {
    const { userId, amount, transactionId, dateTime } = req.body;

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
