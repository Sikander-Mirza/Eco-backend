import express from "express";
import multer from "multer";
import { protect, adminMiddleware } from '../middleware/authMiddleware.js';
import { createDeposit,getDeposits } from "../controller/depositController.js";

const router = express.Router();
const upload = multer(); // memory storage for buffer

// POST /api/deposit
router.post("/deposit", upload.array("attachment"), createDeposit);
router.get("/deposit", protect,adminMiddleware, getDeposits);


export default router;
