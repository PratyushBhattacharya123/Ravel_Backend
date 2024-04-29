"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuthenticated = void 0;
require("dotenv").config();
const catchAsyncError_1 = require("./catchAsyncError");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken")); // Import JwtPayload
const user_model_1 = __importDefault(require("../models/user.model"));
// Authenticated user
exports.isAuthenticated = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader ||
        authHeader === "Bearer undefined" ||
        !authHeader.startsWith("Bearer ")) {
        return next(new ErrorHandler_1.default("Please login to continue", 401));
    }
    const token = authHeader.split(" ")[1];
    let decoded; // Specify the type of decoded
    try {
        decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET_KEY); // Use type assertion
    }
    catch (err) {
        return next(new ErrorHandler_1.default("Invalid token", 401));
    }
    if (!decoded || typeof decoded === "string") {
        return next(new ErrorHandler_1.default("Invalid token", 401));
    }
    req.user = await user_model_1.default.findById(decoded.id); // Cast decoded to JwtPayload
    next();
});
