require("dotenv").config();
import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "./catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import jwt, { JwtPayload } from "jsonwebtoken"; // Import JwtPayload
import userModal from "../models/user.model";

// Define a new interface that extends the existing Request interface
interface CustomRequest extends Request {
  user?: any; // Define the user property and its type
}

// Authenticated user
export const isAuthenticated = CatchAsyncError(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (
      !authHeader ||
      authHeader === "Bearer undefined" ||
      !authHeader.startsWith("Bearer ")
    ) {
      return next(new ErrorHandler("Please login to continue", 401));
    }

    const token = authHeader.split(" ")[1];
    let decoded: JwtPayload | string; // Specify the type of decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string); // Use type assertion
    } catch (err) {
      return next(new ErrorHandler("Invalid token", 401));
    }

    if (!decoded || typeof decoded === "string") {
      return next(new ErrorHandler("Invalid token", 401));
    }

    req.user = await userModal.findById((decoded as JwtPayload).id); // Cast decoded to JwtPayload

    next();
  }
);
