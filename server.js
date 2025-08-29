import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

// Resolución de ruta del JSON (modo ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const employees = (await import(path.join(__dirname, "employees.json"), { assert: { type: "json" } }).catch(async () => {
  // Fallback si tu Node no soporta import JSON con assert:
  return { default: (await import("node:fs/promises").then(fs => fs.readFile(path.join(__dirname, "employees.json"), "utf8").then(JSON.parse))) };
})).default;

// Copia en memoria (para POST)
let employeesMem = [...employees];

const app = express();
app.use(express.json());

// --------------------- SCHEMA (validación para POST) ---------------------
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

// --------------------- HELPERS ---------------------
function paginate(list, pageNum) {
  const n = Number.parseInt(pageNum ?? "0", 10);
  if (!n || n < 1) return list; // sin página → todo
  const start = 2 * (n - 1);
  const end = start + 2; // slice no incluye end; devuelve 2 elementos
  return list.slice(start, end);
}

function filterByPrivileges(list, userFlag) {
  if (String(userFlag) === "true") {
    return list.filter(e => e.privileges === "user");
  }
  return list;
}

function filterByBadge(list, badge) {
  if (!badge) return list;
  return list.filter(e => Array.isArray(e.badges) && e.badges.includes(badge));
}

// --------------------- RUTAS ---------------------

// 1,2,3,5,7 → GET /api/employees con filtros y paginación
app.get("/api/employees", (req, res) => {
  const { page, user, badges } = req.query;

  let data = [...employeesMem];

  // 5) ?user=true
  data = filterByPrivileges(data, user);

  // 7) ?badges=black
  data = filterByBadge(data, badges);

  // 2,3) ?page=N
  data = paginate(data, page);

  res.json(data);
});

// 4) /api/employees/oldest
app.get("/api/employees/oldest", (req, res) => {
  if (employeesMem.length === 0) return res.status(404).json({ code: "not_found" });
  let oldest = employeesMem[0];
  for (let i = 1; i < employeesMem.length; i++) {
    if (employeesMem[i].age > oldest.age) {
      oldest = employeesMem[i];
    }
  }
  res.json(oldest);
});

// 8) /api/employees/:name  (definir DESPUÉS de /oldest para no colisionar)
app.get("/api/employees/:name", (req, res) => {
  const { name } = req.params;
  const found = employeesMem.find(e => e.name.toLowerCase() === String(name).toLowerCase());
  if (!found) return res.status(404).json({ code: "not_found" });
  res.json(found);
});

// 6) POST /api/employees (valida esquema y agrega a memoria)
app.post("/api/employees", (req, res) => {
  const parse = employeeSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ code: "bad_request" });
  }
  employeesMem.push(parse.data);
  res.status(201).json(parse.data);
});

// Health check (útil para Postman)
app.get("/health", (_req, res) => res.json({ ok: true }));

// Arranque
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`✅ API running on http://localhost:${PORT}`);
});

export default app; // para tests (Supertest)
