"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const post_controller_1 = require("../controllers/post.controller");
const postRouter = express_1.default.Router();
postRouter.post("/create-post", post_controller_1.createPost);
postRouter.get("/posts", post_controller_1.getAllPosts);
postRouter.put("/update-likes", post_controller_1.updateLikes);
postRouter.put("/add-replies", post_controller_1.addReplies);
postRouter.put("/add-reply", post_controller_1.addReply);
postRouter.put("/update-replies-react", post_controller_1.updateReplyLikes);
postRouter.put("/update-reply-react", post_controller_1.updateRepliesReplyLike);
postRouter.delete("/delete-post/:id", post_controller_1.deletePost);
exports.default = postRouter;
