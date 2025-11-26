import express from "express";
import { getCurrentUser, loginUser, logoutUser, profile, registerUser , updateProfile ,verifyOtp,getMyReferrals,updatePassword,forgotPassword, resetPassword } from "../controller/userController.js";
import { adminMiddleware, creatorMiddleware, protect } from "../middleware/authMiddleware.js";
import { deleteUser, getAllUsers, getAdminStats } from "../controller/adminContoller.js";

const route=express.Router()

route.post("/register", registerUser);
route.post("/login", loginUser);
route.post("/logout", logoutUser); 
route.get("/profile", protect, profile);
route.post("/verify-otp",verifyOtp);
route.post("/forget-password",forgotPassword)
route.post("/change-password",updatePassword);
route.get("/referrals/:userId",getMyReferrals)
route.post("/reset-password",resetPassword)
route.get("/me", protect, getCurrentUser); // Add this new route



route.get("/admin/users", protect, adminMiddleware, getAllUsers);
route.get("/stats",protect,adminMiddleware ,getAdminStats);
route.delete("/admin/users/:id", protect, adminMiddleware, deleteUser);
route.put("/profile/update", protect, updateProfile); // New route for updating profile



export default route;