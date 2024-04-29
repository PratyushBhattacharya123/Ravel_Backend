import express from "express";
import { isAuthenticated } from "../middleware/auth";
import {
  addReplies,
  addReply,
  createPost,
  deletePost,
  getAllPosts,
  updateLikes,
  updateRepliesReplyLike,
  updateReplyLikes,
} from "../controllers/post.controller";

const postRouter = express.Router();

postRouter.post("/create-post", createPost);

postRouter.get("/posts", getAllPosts);

postRouter.put("/update-likes", updateLikes);

postRouter.put("/add-replies", addReplies);

postRouter.put("/add-reply", addReply);

postRouter.put("/update-replies-react", updateReplyLikes);

postRouter.put("/update-reply-react", updateRepliesReplyLike);

postRouter.delete("/delete-post/:id", deletePost);

export default postRouter;
