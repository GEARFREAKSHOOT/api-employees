import { Router } from "express";
import { User } from "../models/user.model.js";

const router = Router();

// POST /api/users  (registro)
router.post("/", async (req, res) => {
  try {
    const { name, email, password, bio } = req.body || {};
    const user = await User.create({ name, email, password, bio });
    // Devuelve datos públicos (no password)
    return res.status(201).json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      bio: user.bio,
      active: user.active,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (err) {
    // Validación o email duplicado -> 400
    if (err.name === "ValidationError" || err.code === 11000) {
      return res.status(400).json({ code: "bad_request" });
    }
    return res.status(500).json({ code: "internal_error" });
  }
});

export default router;
