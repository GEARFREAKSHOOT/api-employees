// routes/posts.routes.js
import { Router } from "express";
import { Post } from "../models/post.model.js";

const router = Router();

function mapMongooseErrors(err) {
  const out = {};
  if (err?.errors) {
    for (const [path, e] of Object.entries(err.errors)) out[path] = e.message;
  }
  return out;
}

// 1) CREATE
router.post("/", async (req, res) => {
  try {
    const { title, text, author } = req.body;
    const post = await Post.create({ title, text, author });
    return res.status(201).json(post);
  } catch (err) {
    console.error("[POST /api/posts] error:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ code: "bad_request", errors: mapMongooseErrors(err) });
    }
    return res.status(500).json({ code: "internal_error" });
  }
});

// 2) LIST
router.get("/", async (_req, res) => {
  const posts = await Post.find().sort({ createdAt: -1 });
  return res.json(posts);
});

// 3) DETAIL
router.get("/:id", async (req, res) => {
  const post = await Post.findOne({ id: req.params.id });
  if (!post) return res.status(404).json({ code: "not_found" });
  return res.json(post);
});

// 4) PATCH (parcial)
router.patch("/:id", async (req, res) => {
  try {
    const allowed = ["title", "text", "author"];
    const update = {};
    for (const k of allowed) if (k in req.body) update[k] = req.body[k];

    const post = await Post.findOneAndUpdate({ id: req.params.id }, update, {
      new: true,          // devuelve actualizado
      runValidators: true // respeta minlength/required
    });
    if (!post) return res.status(404).json({ code: "not_found" });
    return res.json(post);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ code: "bad_request", errors: mapMongooseErrors(err) });
    }
    return res.status(500).json({ code: "internal_error" });
  }
});

// 5) DELETE
router.delete("/:id", async (req, res) => {
  const result = await Post.deleteOne({ id: req.params.id });
  if (result.deletedCount === 0) return res.status(404).json({ code: "not_found" });
  return res.status(204).send();
});

export default router;
