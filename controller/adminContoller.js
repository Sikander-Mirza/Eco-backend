import asyncHandler from "express-async-handler";
import User from "../model/UserModel.js";
import MiningMachine from "../model/MiningMachine.js";
import Transaction from "../model/withdrawals.js";
import Deposit from "../model/depositeModel.js"
import Contact from "../model/Contact.js";

export const deleteUser = asyncHandler(async (req ,res) => {
  const { id } = req.params;

  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Cannot Delete User" });
  }
});



export const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const users = await User.find({});

    if (users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
});


export const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalMachines = await MiningMachine.countDocuments();
    const totalDeposits = await Deposit.countDocuments();
    const totalWithdrawals = await Transaction.countDocuments();
const contacts = await Contact.countDocuments();
    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalMachines,
        totalDeposits,
      totalWithdrawals,
      contacts
      }
    });

  } catch (error) {
    console.error("Admin Stats Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
