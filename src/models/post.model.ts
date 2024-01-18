import mongoose, { Document, Schema, Types } from "mongoose";
import { IUser } from "./user.model";

interface IPost extends Document {
  title: string;
  description: string;
  isCompleted: boolean;
  ownerOfPost: Types.ObjectId | IUser;
}

const postSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    ownerOfPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Post = mongoose.model<IPost>("Post", postSchema);
