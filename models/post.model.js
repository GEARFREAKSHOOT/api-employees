// models/post.model.js
import mongoose from "mongoose";

const PostSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    title:  { type: String, required: true, minlength: 6, trim: true },
    text:   { type: String, required: true, minlength: 6, trim: true },
    author: { type: String, required: true, trim: true }
  },
  {
    // dejamos _id por defecto (más estable)
    timestamps: true,        // createdAt / updatedAt
    versionKey: false
  }
);

// evita "Cannot overwrite `Post` model once compiled"
export const Post = mongoose.models.Post || mongoose.model("Post", PostSchema);
