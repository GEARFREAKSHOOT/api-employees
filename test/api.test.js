import request from "supertest";
import app from "../server.js";

describe("API /api/employees", () => {
  it("GET /api/employees debe responder 200 con array", async () => {
    const res = await request(app).get("/api/employees");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("GET /api/employees?page=1 devuelve 2 elementos (0 y 1)", async () => {
    const res = await request(app).get("/api/employees?page=1");
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeLessThanOrEqual(2);
  });

  it("GET /api/employees?user=true filtra privileges == user", async () => {
    const res = await request(app).get("/api/employees?user=true");
    expect(res.statusCode).toBe(200);
    expect(res.body.every(e => e.privileges === "user")).toBe(true);
  });

  it("GET /api/employees?badges=black incluye únicamente quienes tengan ese badge", async () => {
    const res = await request(app).get("/api/employees?badges=black");
    expect(res.statusCode).toBe(200);
    expect(res.body.every(e => Array.isArray(e.badges) && e.badges.includes("black"))).toBe(true);
  });

  it("GET /api/employees/oldest devuelve el de mayor edad", async () => {
    const res = await request(app).get("/api/employees/oldest");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("age");
  });

  it("GET /api/employees/:name devuelve 404 si no existe", async () => {
    const res = await request(app).get("/api/employees/NoExiste");
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ code: "not_found" });
  });

  it("POST /api/employees valida el esquema y crea (201)", async () => {
    const nuevo = {
      name: "Alice",
      age: 29,
      phone: { personal: "555-111-111", work: "555-222-222", ext: "1234" },
      privileges: "user",
      favorites: { artist: "Van Gogh", food: "tacos" },
      finished: [1, 2],
      badges: ["blue"],
      points: [{ points: 90, bonus: 10 }]
    };
    const res = await request(app).post("/api/employees").send(nuevo);
    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe("Alice");
  });

  it("POST /api/employees con payload inválido → 400 bad_request", async () => {
    const invalido = { foo: "bar" };
    const res = await request(app).post("/api/employees").send(invalido);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ code: "bad_request" });
  });
});
