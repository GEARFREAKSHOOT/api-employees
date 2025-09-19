import { Router } from "express";
import { User } from "../models/user.model.js";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";

const router = Router();

// ------ setup multer ------
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  }
});
const upload = multer({ storage });

// util para URLs
function baseUrl(req) {
  return process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
}
function avatarUrl(req, user) {
  return user.avatar ? `${baseUrl(req)}/uploads/${user.avatar}` : "";
}

// POST /api/users  (registro con avatar opcional, active=false y activationToken)
router.post("/", upload.single("avatar"), async (req, res) => {
  try {
    const { name, email, password, bio } = req.body || {};
    const activationToken = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    const avatar = req.file?.filename || "";

    const user = await User.create({
      name, email, password, bio,
      active: false,
      avatar,
      activationToken
    });

    const activationUrl = `${baseUrl(req)}/api/users/confirm/${user.activationToken}`;

    return res.status(201).json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      bio: user.bio,
      active: user.active,
      avatarUrl: avatarUrl(req, user),
      activationUrl,           // para Postman/demo (no hace falta envío real de email)
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (err) {
    if (err.name === "ValidationError" || err.code === 11000)
      return res.status(400).json({ code: "bad_request" });
    return res.status(500).json({ code: "internal_error" });
  }
});

// GET /api/users/confirm/:token  (activa cuenta)
router.get("/confirm/:token", async (req, res) => {
  const { token } = req.params;
  const user = await User.findOne({ activationToken: token });
  if (!user) return res.status(404).json({ code: "not_found" });

  user.active = true;
  user.activationToken = "";
  await user.save();

  return res.status(200).json({ activated: true });
});

// (Opcional) GET /api/users/:id (devuelve avatarUrl)
router.get("/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ code: "not_found" });
  return res.json({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    bio: user.bio,
    active: user.active,
    avatarUrl: user.avatar ? `${baseUrl(req)}/uploads/${user.avatar}` : "",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  });
});

export default router;
