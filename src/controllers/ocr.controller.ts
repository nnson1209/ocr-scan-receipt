import { Request, Response } from "express";
import { extractTextFromImage } from "../services/ocr.service";

export const handleOCR = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const text = await extractTextFromImage(req.file.path);
    return res.json({ text });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "OCR processing failed" });
  }
};

