"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserInfo = exports.updateUserAvatar = exports.getUser = exports.getNotification = exports.followUnfollowUser = exports.getAllUsers = exports.userDetails = exports.logoutUser = exports.loginUser = exports.registrationUser = void 0;
const catchAsyncError_1 = require("../middleware/catchAsyncError");
const user_model_1 = __importDefault(require("../models/user.model"));
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const jwt_1 = require("../utils/jwt");
const notification_model_1 = __importDefault(require("../models/notification.model"));
// Register User
exports.registrationUser = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { name, email, password, avatar } = req.body;
        const isEmailExist = await user_model_1.default.findOne({ email });
        if (isEmailExist)
            throw new ErrorHandler_1.default("This email already exists", 400);
        const userNameWithoutSpace = name.replace(/\s/g, "");
        const uniqueNumber = Math.floor(Math.random() * 1000000);
        if (avatar) {
            const myCloud = await cloudinary_1.default.v2.uploader.upload(avatar, {
                folder: "avatars",
            });
            const user = await user_model_1.default.create({
                name,
                email,
                password,
                userName: userNameWithoutSpace + uniqueNumber,
                avatar: { public_id: myCloud.public_id, url: myCloud.secure_url },
            });
            (0, jwt_1.sendToken)(user, 201, res);
        }
        else {
            const user = await user_model_1.default.create({
                name,
                email,
                password,
                userName: userNameWithoutSpace + uniqueNumber,
                avatar: null,
            });
            (0, jwt_1.sendToken)(user, 201, res);
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
exports.loginUser = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return next(new ErrorHandler_1.default("Please enter email and password", 400));
        }
        const user = await user_model_1.default.findOne({ email }).select("+password");
        if (!user) {
            return next(new ErrorHandler_1.default("Invalid email or password", 400));
        }
        const isPasswordMatch = await user.comparePassword(password);
        if (!isPasswordMatch) {
            return next(new ErrorHandler_1.default("Invalid email or password", 400));
        }
        (0, jwt_1.sendToken)(user, 200, res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// logout user
exports.logoutUser = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        res.cookie("token", null, {
            expires: new Date(Date.now()),
            httpOnly: true,
            sameSite: "none",
            secure: true,
        });
        res.status(200).json({
            success: true,
            message: "Logged out successfully!",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
//  Get user Details
exports.userDetails = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const user = await user_model_1.default.findById(userId);
        res.status(200).json({
            success: true,
            user,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// get all users
exports.getAllUsers = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const loggedInUser = req.user?.id;
        const users = await user_model_1.default.find({ _id: { $ne: loggedInUser } }).sort({
            createdAt: -1,
        });
        res.status(201).json({
            success: true,
            users,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// Follow and unfollow user
exports.followUnfollowUser = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { user, followUserId } = req.body;
        const userId = user?._id;
        const loggedInUser = await user_model_1.default.findById(userId);
        const isFollowedBefore = loggedInUser?.following.find((item) => item.userId === followUserId);
        const loggedInUserId = loggedInUser?._id;
        if (!!isFollowedBefore) {
            await user_model_1.default.updateOne({ _id: followUserId }, { $pull: { followers: { userId: loggedInUserId } } });
            await user_model_1.default.updateOne({ _id: loggedInUserId }, { $pull: { following: { userId: followUserId } } });
            const deletedNotfication = await notification_model_1.default.deleteOne({
                "creator._id": user?._id,
                userId: followUserId,
                type: "Follow",
            });
            console.log("Deleted Notification", deletedNotfication);
            res.status(200).json({
                success: true,
                message: "User unfollowed successfully",
            });
        }
        else {
            await user_model_1.default.updateOne({ _id: followUserId }, { $push: { followers: { userId: loggedInUserId } } });
            await user_model_1.default.updateOne({ _id: loggedInUserId }, { $push: { following: { userId: followUserId } } });
            await notification_model_1.default.create({
                creator: user,
                type: "Follow",
                title: "Followed you",
                userId: followUserId,
            });
            res.status(200).json({
                success: true,
                message: "User followed successfully",
            });
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 401));
    }
});
// get user notification
exports.getNotification = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const userId = req.params.userId;
        const notifications = await notification_model_1.default.find({ userId }).sort({
            createdAt: -1,
        });
        res.status(201).json({
            success: true,
            notifications,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 401));
    }
});
// get single user
exports.getUser = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const user = await user_model_1.default.findById(req.params.id);
        res.status(201).json({ success: true, user });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 401));
    }
});
// update user avatar
exports.updateUserAvatar = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { user, avatar } = req.body;
        const userId = user?._id;
        let existsUser = await user_model_1.default.findById(userId);
        if (existsUser && avatar !== "") {
            const imageId = existsUser?.avatar?.public_id;
            let myCloudAvatar;
            if (imageId) {
                await cloudinary_1.default.v2.uploader.destroy(imageId);
                myCloudAvatar = await cloudinary_1.default.v2.uploader.upload(req.body.avatar, {
                    folder: "avatars",
                    width: 150,
                });
            }
            else {
                myCloudAvatar = await cloudinary_1.default.v2.uploader.upload(req.body.avatar, {
                    folder: "avatars",
                    width: 150,
                });
            }
            existsUser.avatar = {
                public_id: myCloudAvatar.public_id,
                url: myCloudAvatar.secure_url,
            };
            await existsUser.save();
            res.status(200).json({
                success: true,
                user: existsUser,
            });
        }
        res.status(200).json({
            success: true,
            user: existsUser,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 401));
    }
});
// update user info
exports.updateUserInfo = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { user, name, userName, bio } = req.body;
        const existsUser = await user_model_1.default.findById(user._id);
        if (existsUser) {
            existsUser.name = name;
            existsUser.userName = userName;
            existsUser.bio = bio;
            await existsUser.save();
            res.status(201).json({
                success: true,
                user: existsUser,
            });
        }
        res.status(201).json({
            success: true,
            user: existsUser,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 401));
    }
});
