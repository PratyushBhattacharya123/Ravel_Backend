import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import cloudinary from "cloudinary";
import PostModal from "../models/post.model";
import ErrorHandler from "../utils/ErrorHandler";
import NotificationModal from "../models/notification.model";

// Create Post
export const createPost = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, image, replies } = req.body;

      let myCloud;

      if (image) {
        myCloud = await cloudinary.v2.uploader.upload(image, {
          folder: "posts",
        });
      }

      let repliesData = await Promise.all(
        replies.map(async (item: any) => {
          if (item.image) {
            const replyImage = await cloudinary.v2.uploader.upload(item.image, {
              folder: "posts",
            });
            item.image = {
              public_id: replyImage.public_id,
              url: replyImage.secure_url,
            };
          }
          return item;
        })
      );

      const post = await PostModal.create({
        title: title,
        image: image
          ? {
              public_id: myCloud?.public_id,
              url: myCloud?.secure_url,
            }
          : null,
        user: req.body.user,
        replies: repliesData,
      });

      res.status(201).json({
        success: true,
        post,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// get all users
export const getAllPosts = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const posts = await PostModal.find().sort({
        createdAt: -1,
      });

      res.status(201).json({
        success: true,
        posts,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// add or remove likes
export const updateLikes = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user, postId } = req.body;

      const loggedInUserId = user?._id;

      const post = await PostModal.findById(postId);

      const isLikedBefore = post?.likes.find(
        (item) => item.userId === loggedInUserId
      );

      if (isLikedBefore) {
        await PostModal.findByIdAndUpdate(postId, {
          $pull: {
            likes: {
              userId: loggedInUserId,
            },
          },
        });

        if (loggedInUserId !== post?.user._id) {
          await NotificationModal.deleteOne({
            "creator._id": loggedInUserId,
            userId: post?.user._id,
            type: "Like",
          });
        }

        res.status(200).json({
          success: true,
          message: "Like removed successfully",
        });
      } else {
        await PostModal.updateOne(
          { _id: postId },
          {
            $push: {
              likes: {
                name: user?.name,
                userName: user?.userName,
                userId: loggedInUserId,
                userAvatar: user?.avatar.url,
                postId,
              },
            },
          }
        );

        if (loggedInUserId !== post?.user._id) {
          await NotificationModal.create({
            creator: user,
            type: "Like",
            title: post?.title ? post.title : "Liked your post",
            userId: post?.user._id,
            postId: postId,
          });
        }

        res.status(200).json({
          success: true,
          message: "Like Added successfully",
        });
      }
    } catch (error: any) {
      console.log(error);
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// add replies in post
export const addReplies = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user, postId, image, title } = req.body;

      let myCloudReply;

      if (image) {
        myCloudReply = await cloudinary.v2.uploader.upload(image, {
          folder: "posts",
        });
      }

      const replyData: any = {
        user,
        title,
        image: image
          ? {
              public_id: myCloudReply?.public_id,
              url: myCloudReply?.secure_url,
            }
          : null,
        likes: [],
      };

      // Find the post by its ID
      let post = await PostModal.findById(postId);

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      // If replies array doesn't exist, initialize it
      if (!post?.replies) {
        post.replies = [];
      }

      // Add the reply data to the 'replies' array of the post
      post.replies.push(replyData);

      // Save the updated post
      await post.save();

      res.status(201).json({
        success: true,
        post,
      });
    } catch (error: any) {
      console.log(error);
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// add or remove likes on replies
export const updateReplyLikes = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user, postId, replyId, replyTitle } = req.body;

      const post = await PostModal.findById(postId);

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      // Find the reply in the 'replies' array based on the given replyId
      const reply = post.replies.find(
        (reply) => reply._id.toString() === replyId
      );

      if (!reply) {
        return res.status(404).json({
          success: false,
          message: "Reply not found",
        });
      }

      const isLikedBefore = reply.likes.find(
        (item) => item.userId === user._id
      );

      if (isLikedBefore) {
        // If liked before, remove the like from the reply.likes array
        reply.likes = reply.likes.filter((like) => like.userId !== user._id);

        if (user._id !== post.user._id) {
          await NotificationModal.deleteOne({
            "creator._id": user._id,
            userId: post.user._id,
            type: "Reply",
            postId: postId,
          });
        }

        await post.save();

        return res.status(200).json({
          success: true,
          message: "Like removed from reply successfully",
        });
      }

      // If not liked before, add the like to the reply.likes array
      const newLike: any = {
        name: user.name,
        userName: user.userName,
        userId: user._id,
        userAvatar: user?.avatar?.url,
      };

      reply.likes.push(newLike);

      if (user._id !== post.user._id) {
        await NotificationModal.create({
          creator: user,
          type: "Like",
          title: replyTitle ? replyTitle : "Liked your Reply",
          userId: post.user._id,
          postId: postId,
        });
      }

      await post.save();

      return res.status(200).json({
        success: true,
        message: "Like added to reply successfully",
      });
    } catch (error: any) {
      console.log(error);
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// add reply in replies
export const addReply = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user, postId, replyId, image, title } = req.body;

      let myCloudRepliesReply;

      if (image) {
        myCloudRepliesReply = await cloudinary.v2.uploader.upload(image, {
          folder: "posts",
        });
      }

      const replyData: any = {
        user,
        title,
        image: image
          ? {
              public_id: myCloudRepliesReply?.public_id,
              url: myCloudRepliesReply?.secure_url,
            }
          : null,
        likes: [],
      };

      // Find the post by its ID
      let post = await PostModal.findById(replyId);

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      // Find the reply by its ID
      let data = post.replies.find((reply) => reply._id.toString() === postId);

      if (!data) {
        return next(new ErrorHandler("Reply not found", 401));
      }

      // If replies array doesn't exist, initialize it
      if (!data?.reply) {
        data.reply = [];
      }

      data.reply.push(replyData);

      // Save the updated post
      await post.save();

      res.status(201).json({
        success: true,
        post,
      });
    } catch (error: any) {
      console.log(error);
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// add or remove likes on replies reply
export const updateRepliesReplyLike = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user, postId, replyId, replyTitle, singleReplyId } = req.body;

      const post = await PostModal.findById(postId);

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      // Find the reply in the 'replies' array based on the given replyId
      const replyObject = post.replies.find(
        (reply) => reply._id.toString() === replyId
      );

      if (!replyObject) {
        return res.status(404).json({
          success: false,
          message: "Reply not found",
        });
      }

      // Find the specific 'reply' object inside 'replyObject.reply' based on the given replyId
      const reply = replyObject.reply.find(
        (reply) => reply._id.toString() === singleReplyId
      );

      if (!reply) {
        return res.status(404).json({
          success: false,
          message: "Reply not found",
        });
      }

      // Check if the user has already liked the reply
      const isLikedBefore = reply.likes.some(
        (like) => like.userId === user._id
      );

      if (isLikedBefore) {
        // If liked before, remove the like from the reply.likes array
        reply.likes = reply.likes.filter((like) => like.userId !== user._id);

        if (user._id !== post.user._id) {
          await NotificationModal.deleteOne({
            "creator._id": user._id,
            userId: post.user._id,
            type: "Reply",
            postId: postId,
          });
        }

        await post.save();

        return res.status(200).json({
          success: true,
          message: "Like removed from reply successfully",
        });
      }

      // If not liked before, add the like to the reply.likes array
      const newLike: any = {
        name: user.name,
        userName: user.userName,
        userId: user._id,
        userAvatar: user?.avatar?.url,
      };

      reply.likes.push(newLike);

      if (user._id !== post.user._id) {
        await NotificationModal.create({
          creator: user,
          type: "Like",
          title: replyTitle ? replyTitle : "Liked your Reply",
          userId: post.user._id,
          postId: postId,
        });
      }

      await post.save();

      return res.status(200).json({
        success: true,
        message: "Like added to reply successfully",
      });
    } catch (error: any) {
      console.log(error);
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// delete post
export const deletePost = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const post = await PostModal.findById(req.params.id);
      if (!post) {
        return next(new ErrorHandler("Post is not found with this id", 404));
      }

      // if (post.image) {
      //   const imageId = post?.image?.public_id;
      //   await cloudinary.v2.uploader.destroy(imageId);
      // }

      await PostModal.deleteOne({ _id: req.params.id });
      res.status(201).json({
        success: true,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
