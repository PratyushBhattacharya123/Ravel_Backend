require("dotenv").config();
import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const emailRegexPattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface IUser extends Document {
  name: string;
  email: string;
  userName: string;
  bio: string;
  password: string;
  avatar: {
    public_id: string;
    url: string;
  };
  followers: Array<{ userId: string }>;
  following: Array<{ userId: string }>;
  comparePassword: (password: string) => Promise<boolean>;
  getJwtToken: () => string;
}

const userSchema: Schema<IUser> = new mongoose.Schema(
  {
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
        validator: function (value: string) {
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
  },
  { timestamps: true }
);

// hash password before saving
userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// compare password
userSchema.methods.comparePassword = async function (
  enteredPassword: string
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

// jwt token
userSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY || "", {
    expiresIn: process.env.JWT_EXPIRES,
  });
};

const userModal: Model<IUser> = mongoose.model("User", userSchema);

export default userModal;
