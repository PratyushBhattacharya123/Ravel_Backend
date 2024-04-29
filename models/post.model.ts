import mongoose, { Document, Model, Schema } from "mongoose";
import { IUser } from "./user.model";

interface ILike extends Document {
  name: string;
  userName: string;
  userId: string;
  userAvatar: object;
}

interface IReply extends Document {
  user: IUser;
  title: string;
  image: object;
  likesNumber?: number;
  likes: ILike[];
  reply: IReply[];
}

interface IPost extends Document {
  title: string;
  image: object;
  user: IUser;
  likesNumber?: number;
  likes: ILike[];
  replies: IReply[];
}

const likeSchema = new Schema<ILike>({
  name: String,
  userName: String,
  userId: String,
  userAvatar: {
    public_id: {
      type: String,
    },
    url: {
      type: String,
    },
  },
});

const replySchema = new Schema<IReply>(
  {
    user: Object,
    title: String,
    image: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
    likesNumber: {
      type: Number,
      default: 0,
    },
    likes: [likeSchema],
  },
  { timestamps: true }
);

const repliesSchema = new Schema<IReply>(
  {
    user: Object,
    title: String,
    image: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
    likesNumber: {
      type: Number,
      default: 0,
    },
    likes: [likeSchema],
    reply: [replySchema],
  },
  { timestamps: true }
);

const postSchema = new Schema<IPost>(
  {
    user: Object,
    title: String,
    image: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
    likesNumber: {
      type: Number,
      default: 0,
    },
    likes: [likeSchema],
    replies: [repliesSchema],
  },
  { timestamps: true }
);

const PostModal: Model<IPost> = mongoose.model("Post", postSchema);

export default PostModal;
