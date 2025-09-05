import mongoose from "mongoose";

const PostSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    title: { type: String, required: true, minlength: 6, trim: true },
    text:  { type: String, required: true, minlength: 6, trim: true },
    author:{ type: String, required: true, trim: true }
  },
  {
    _id: false,
    timestamps: true,    // createdAt / updatedAt
    versionKey: false
  }
);

export const Post = mongoose.model("Post", PostSchema);
