import express from "express";
import morgan from "morgan";
import dotenv from "dotenv";
import ocrRoutes from "./routes/ocr.routes";

dotenv.config();

const app = express();

// middlewares
app.use(express.json());
app.use(morgan("dev"));

// routes
app.use("/api/ocr", ocrRoutes);

export default app;

