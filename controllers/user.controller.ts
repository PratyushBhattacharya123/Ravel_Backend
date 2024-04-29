import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import userModal, { IUser } from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import { sendToken } from "../utils/jwt";
import NotificationModal from "../models/notification.model";

// Register User
export const registrationUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password, avatar } = req.body;
      const isEmailExist = await userModal.findOne({ email });
      if (isEmailExist)
        throw new ErrorHandler("This email already exists", 400);

      const userNameWithoutSpace = name.replace(/\s/g, "");
      const uniqueNumber = Math.floor(Math.random() * 1000000);

      if (avatar) {
        const myCloud = await cloudinary.v2.uploader.upload(avatar, {
          folder: "avatars",
        });
        const user = await userModal.create({
          name,
          email,
          password,
          userName: userNameWithoutSpace + uniqueNumber,
          avatar: { public_id: myCloud.public_id, url: myCloud.secure_url },
        });
        sendToken(user, 201, res);
      } else {
        const user = await userModal.create({
          name,
          email,
          password,
          userName: userNameWithoutSpace + uniqueNumber,
          avatar: null,
        });
        sendToken(user, 201, res);
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Login User
interface ILoginRequest {
  email: string;
  password: string;
}

export const loginUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as ILoginRequest;
      if (!email || !password) {
        return next(new ErrorHandler("Please enter email and password", 400));
      }
      const user = await userModal.findOne({ email }).select("+password");
      if (!user) {
        return next(new ErrorHandler("Invalid email or password", 400));
      }
      const isPasswordMatch = await user.comparePassword(password);
      if (!isPasswordMatch) {
        return next(new ErrorHandler("Invalid email or password", 400));
      }
      sendToken(user, 200, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// logout user
export const logoutUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
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
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

//  Get user Details
export const userDetails = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const user = await userModal.findById(userId);
      res.status(200).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// get all users
export const getAllUsers = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const loggedInUser = req.user?.id;
      const users = await userModal.find({ _id: { $ne: loggedInUser } }).sort({
        createdAt: -1,
      });

      res.status(201).json({
        success: true,
        users,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Follow and unfollow user
export const followUnfollowUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user, followUserId } = req.body;

      const userId = user?._id;

      const loggedInUser = await userModal.findById(userId);

      const isFollowedBefore = loggedInUser?.following.find(
        (item: any) => item.userId === followUserId
      );
      const loggedInUserId = loggedInUser?._id;

      if (!!isFollowedBefore) {
        await userModal.updateOne(
          { _id: followUserId },
          { $pull: { followers: { userId: loggedInUserId } } }
        );

        await userModal.updateOne(
          { _id: loggedInUserId },
          { $pull: { following: { userId: followUserId } } }
        );

        const deletedNotfication = await NotificationModal.deleteOne({
          "creator._id": user?._id,
          userId: followUserId,
          type: "Follow",
        });

        console.log("Deleted Notification", deletedNotfication);

        res.status(200).json({
          success: true,
          message: "User unfollowed successfully",
        });
      } else {
        await userModal.updateOne(
          { _id: followUserId },
          { $push: { followers: { userId: loggedInUserId } } }
        );

        await userModal.updateOne(
          { _id: loggedInUserId },
          { $push: { following: { userId: followUserId } } }
        );

        await NotificationModal.create({
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
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 401));
    }
  }
);

// get user notification
export const getNotification = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.userId;
      const notifications = await NotificationModal.find({ userId }).sort({
        createdAt: -1,
      });

      res.status(201).json({
        success: true,
        notifications,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 401));
    }
  }
);

// get single user
export const getUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userModal.findById(req.params.id);

      res.status(201).json({ success: true, user });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 401));
    }
  }
);

// update user avatar
export const updateUserAvatar = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user, avatar } = req.body;

      const userId = user?._id;

      let existsUser = await userModal.findById(userId);

      if (existsUser && avatar !== "") {
        const imageId = existsUser?.avatar?.public_id;

        let myCloudAvatar;

        if (imageId) {
          await cloudinary.v2.uploader.destroy(imageId);
          myCloudAvatar = await cloudinary.v2.uploader.upload(req.body.avatar, {
            folder: "avatars",
            width: 150,
          });
        } else {
          myCloudAvatar = await cloudinary.v2.uploader.upload(req.body.avatar, {
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
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 401));
    }
  }
);

// update user info
export const updateUserInfo = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user, name, userName, bio } = req.body;

      const existsUser = await userModal.findById(user._id);

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
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 401));
    }
  }
);
