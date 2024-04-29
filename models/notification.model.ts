import mongoose, { Document, Model, Schema } from "mongoose";

interface INotification {
  creator: object;
  type: string;
  title?: string;
  postId: string;
  userId: string;
}

const notificationSchema = new Schema<INotification>(
  {
    creator: {
      type: Object,
    },
    type: {
      type: String,
    },
    title: {
      type: String,
    },
    postId: {
      type: String,
    },
    userId: {
      type: String,
    },
  },
  { timestamps: true }
);

const NotificationModal: Model<INotification> = mongoose.model(
  "Notification",
  notificationSchema
);

export default NotificationModal;
