import express from "express";
import {
  followUnfollowUser,
  getAllUsers,
  getNotification,
  getUser,
  loginUser,
  logoutUser,
  registrationUser,
  updateUserAvatar,
  updateUserInfo,
  userDetails,
} from "../controllers/user.controller";
import { isAuthenticated } from "../middleware/auth";

const userRouter = express.Router();

userRouter.post("/registration", registrationUser);

userRouter.post("/login", loginUser);

userRouter.get("/logout", isAuthenticated, logoutUser);

userRouter.get("/me", userDetails);

userRouter.get("/users", getAllUsers);

userRouter.put("/add-user", followUnfollowUser);

userRouter.put("/update-avatar", updateUserAvatar);

userRouter.put("/update-profile", updateUserInfo);

userRouter.get("/get-notifications/:userId", getNotification);

userRouter.get("/get-user/:id", getUser);

export default userRouter;
