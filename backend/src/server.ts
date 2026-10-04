import "dotenv/config";
import express from "express";
import cors from "cors";
import claimsRouter from "./routes/claims.js";
import { errorHandler } from "./lib/errorHandler.js";

const app = express();

// FRONTEND_URL can hold several origins, separated by commas.
const allowedOrigins = (process.env.FRONTEND_URL ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim());

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.use("/api/claims", claimsRouter);

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Expense Claim API is running",
  });
});

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5001;

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on port ${PORT}`);
});

process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
});