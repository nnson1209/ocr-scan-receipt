import { Router } from "express";
import multer from "multer";
import { handleOCR } from "../controllers/ocr.controller";

const router = Router();
const upload = multer({ dest: "uploads/" });

// POST /api/ocr/scan
router.post("/scan", upload.single("receipt"), handleOCR);

export default router;

