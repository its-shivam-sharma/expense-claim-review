import "dotenv/config";
import express from "express";
import cors from "cors";
import claimsRouter from "./routes/claims.js";
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/claims", claimsRouter);

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Expense Claim API is running",
  });
});

const PORT = Number(process.env.PORT) || 5001;

const server = app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
});