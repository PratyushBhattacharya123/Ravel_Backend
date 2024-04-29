"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
require("dotenv").config();
const express_1 = __importStar(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const error_1 = require("./middleware/error");
const express_rate_limit_1 = require("express-rate-limit");
const user_router_1 = __importDefault(require("./routes/user.router"));
const post_route_1 = __importDefault(require("./routes/post.route"));
exports.app = (0, express_1.default)();
// body parser
exports.app.use(express_1.default.json({ limit: "50mb" }));
exports.app.use((0, express_1.urlencoded)({ limit: "50mb", extended: true }));
// cookie parser
exports.app.use((0, cookie_parser_1.default)());
// enable CORS(cross origin resource sharing)
exports.app.use((0, cors_1.default)({
    // origin: process.env.ORIGIN,
    origin: ["http://localhost:8081"],
    credentials: true,
}));
// api request limit
const limiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-7",
    legacyHeaders: false,
});
// routes
exports.app.use("/api/v1", user_router_1.default, post_route_1.default);
// testing api
exports.app.get("/test", (req, res, next) => {
    res.status(200).json({
        success: true,
        message: "API is working",
    });
});
// unknown routes
exports.app.all("*", (req, res, next) => {
    const err = new Error(`Route ${req.originalUrl} not found`);
    err.statusCode = 404;
    next(err);
});
// Middleware calls
// Apply the rate limiting middleware to all requests.
exports.app.use(limiter);
exports.app.use(error_1.ErrorMiddleware);
