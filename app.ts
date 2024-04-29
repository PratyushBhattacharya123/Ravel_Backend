require("dotenv").config();
import express, { NextFunction, Request, Response, urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ErrorMiddleware } from "./middleware/error";
import { rateLimit } from "express-rate-limit";
import userRouter from "./routes/user.router";
import postRouter from "./routes/post.route";

export const app = express();

// body parser
app.use(express.json({ limit: "50mb" }));
app.use(urlencoded({ limit: "50mb", extended: true }));

// cookie parser
app.use(cookieParser());

// enable CORS(cross origin resource sharing)
app.use(
  cors({
    // origin: process.env.ORIGIN,
    origin: ["http://localhost:8081"],
    credentials: true,
  })
);

// api request limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

// routes
app.use("/api/v1", userRouter, postRouter);

// testing api
app.get("/test", (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    success: true,
    message: "API is working",
  });
});

// unknown routes
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  const err = new Error(`Route ${req.originalUrl} not found`) as any;
  err.statusCode = 404;
  next(err);
});

// Middleware calls
// Apply the rate limiting middleware to all requests.
app.use(limiter);
app.use(ErrorMiddleware);
