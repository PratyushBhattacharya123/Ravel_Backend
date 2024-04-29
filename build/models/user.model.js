"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const emailRegexPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const userSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: [true, "Name field cannot be empty"],
    },
    userName: {
        type: String,
    },
    bio: {
        type: String,
    },
    email: {
        type: String,
        required: [true, "Email field cannot be empty"],
        validate: {
            validator: function (value) {
                return emailRegexPattern.test(value);
            },
            message: "Please enter a valid Email address",
        },
        unique: true,
    },
    password: {
        type: String,
        minlength: [6, "Password must be at least 6 characters"],
        select: false, // Hide the password
    },
    avatar: {
        public_id: {
            type: String,
        },
        url: {
            type: String,
        },
    },
    followers: [
        {
            userId: {
                type: String,
            },
        },
    ],
    following: [
        {
            userId: {
                type: String,
            },
        },
    ],
}, { timestamps: true });
// hash password before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        next();
    }
    this.password = await bcryptjs_1.default.hash(this.password, 10);
    next();
});
// compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcryptjs_1.default.compare(enteredPassword, this.password);
};
// jwt token
userSchema.methods.getJwtToken = function () {
    return jsonwebtoken_1.default.sign({ id: this._id }, process.env.JWT_SECRET_KEY || "", {
        expiresIn: process.env.JWT_EXPIRES,
    });
};
const userModal = mongoose_1.default.model("User", userSchema);
exports.default = userModal;
