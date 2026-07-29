import express from "express";
import multer from "multer";
import { protect, adminMiddleware } from "../middleware/authMiddleware.js";
import {
  createDeposit,
  createNowPaymentsDeposit,
  getDeposits,
  nowPaymentsIpn,
} from "../controller/depositController.js";

const router = express.Router();
const upload = multer();

router.post("/deposit", protect, upload.array("attachment"), createDeposit);
router.post("/deposit/nowpayments", protect, createNowPaymentsDeposit);
router.post("/nowpayments/ipn", nowPaymentsIpn);
router.get("/deposit", protect, adminMiddleware, getDeposits);

export default router;
