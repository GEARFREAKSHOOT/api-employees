import { Router } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

// POST /api/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ code: "bad_request" });

  const user = await User.findOne({ email: String(email).toLowerCase() });
  if (!user) return res.status(401).json({ code: "unauthorized" });

  const ok = await user.comparePassword(password);
  if (!ok) return res.status(401).json({ code: "unauthorized" });

  const token = jwt.sign({ sub: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: "2h" });
  return res.json({ token });
});

export default router;
