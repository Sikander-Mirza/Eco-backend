import express from "express";
import multer from "multer";
import { createDeposit } from "../controller/depositController.js";

const router = express.Router();
const upload = multer(); // memory storage for buffer

// POST /api/deposit
router.post("/deposit", upload.array("attachment"), createDeposit);


export default router;
