import { IUser } from "../models/user.model";
import { Response } from "express";

interface ITokenOptions {
  expires: Date;
  httpOnly: boolean;
  sameSite: "lax" | "strict" | "none" | undefined;
  secure?: boolean;
}

// create token and saving that in cookies
export const sendToken = (user: IUser, statusCode: number, res: Response) => {
  const token = user.getJwtToken();

  // Options for cookies
  const options: ITokenOptions = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: "none",
    secure: true,
  };

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    user,
    token,
  });
};
