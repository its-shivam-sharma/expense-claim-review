import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "./errors.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) { 
    return res.status(400).json({
      success: false,
      message: err.issues[0]?.message ?? "Invalid request",
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  console.error("Unhandled error:", err);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}