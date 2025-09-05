// server.js
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import postsRouter from "./routes/posts.routes.js";
import { connectDB } from "./config/db.config.js";

// ---------- Carga employees.json (ESM + fallback) ----------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const employees = (await import(path.join(__dirname, "employees.json"), { assert: { type: "json" } })
  .catch(async () => {
    const fs = await import("node:fs/promises");
    const str = await fs.readFile(path.join(__dirname, "employees.json"), "utf8");
    return { default: JSON.parse(str) };
  })
).default;

let employeesMem = [...employees];

// ---------- App ----------
const app = express();
app.use(express.json());

// ---------- Posts CRUD (Mongo en memoria) ----------
app.use("/api/posts", postsRouter);

// ---------- Employees (tarea previa) ----------
const phoneSchema = z.object({
  personal: z.string(),
  work: z.string(),
  ext: z.string()
});

const favoritesSchema = z.object({
  artist: z.string(),
  food: z.string()
});

const pointsSchema = z.object({
  points: z.number(),
  bonus: z.number()
});

const employeeSchema = z.object({
  name: z.string(),
  age: z.number().int().nonnegative(),
  phone: phoneSchema,
  privileges: z.enum(["user", "admin"]),
  favorites: favoritesSchema,
  finished: z.array(z.number().int().nonnegative()),
  badges: z.array(z.string()),
  points: z.array(pointsSchema).min(1)
});

function paginate(list, pageNum) {
  const n = Number.parseInt(pageNum ?? "0", 10);
  if (!n || n < 1) return list;
  const start = 2 * (n - 1);
  const end = start + 2;
  return list.slice(start, end);
}
function filterByPrivileges(list, userFlag) {
  if (String(userFlag) === "true") return list.filter(e => e.privileges === "user");
  return list;
}
function filterByBadge(list, badge) {
  if (!badge) return list;
  return list.filter(e => Array.isArray(e.badges) && e.badges.includes(badge));
}

app.get("/api/employees", (req, res) => {
  const { page, user, badges } = req.query;
  let data = [...employeesMem];
  data = filterByPrivileges(data, user);
  data = filterByBadge(data, badges);
  data = paginate(data, page);
  res.json(data);
});

app.get("/api/employees/oldest", (_req, res) => {
  if (employeesMem.length === 0) return res.status(404).json({ code: "not_found" });
  let oldest = employeesMem[0];
  for (let i = 1; i < employeesMem.length; i++) if (employeesMem[i].age > oldest.age) oldest = employeesMem[i];
  res.json(oldest);
});

app.get("/api/employees/:name", (req, res) => {
  const { name } = req.params;
  const found = employeesMem.find(e => e.name.toLowerCase() === String(name).toLowerCase());
  if (!found) return res.status(404).json({ code: "not_found" });
  res.json(found);
});

app.post("/api/employees", (req, res) => {
  const parse = employeeSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ code: "bad_request" });
  employeesMem.push(parse.data);
  res.status(201).json(parse.data);
});

// Health
app.get("/health", (_req, res) => res.json({ ok: true }));

// ---------- Boot ----------
const PORT = process.env.PORT || 8000;

// Usamos top-level await para levantar DB antes del server
await connectDB();

app.listen(PORT, () => {
  console.log(`✅ API running on http://localhost:${PORT}`);
});

export default app;
