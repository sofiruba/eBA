const request = require("supertest");
const app = require("../app");

describe("Usuarios API", () => {
  test("debería registrar un usuario correctamente", async () => {
    const res = await request(app)
      .post("/api/usuarios/registro")
      .send({
        nombre: "Sofi",
        email: "sofi@test.com",
        password: "123456",
        edad: 21,
        intereses: ["musica", "teatro"]
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("mensaje");
    expect(res.body.usuario.email).toBe("sofi@test.com");
    expect(res.body.usuario.password).toBeUndefined();
  });

  test("no debería permitir registrar dos usuarios con el mismo email", async () => {
    await request(app)
      .post("/api/usuarios/registro")
      .send({
        nombre: "Sofi",
        email: "duplicado@test.com",
        password: "123456",
        edad: 21,
        intereses: ["musica"]
      });

    const res = await request(app)
      .post("/api/usuarios/registro")
      .send({
        nombre: "Otra",
        email: "duplicado@test.com",
        password: "abcdef",
        edad: 22,
        intereses: ["teatro"]
      });

    expect(res.statusCode).toBe(400);
  });

  test("no debería registrar usuario sin email", async () => {
    const res = await request(app)
      .post("/api/usuarios/registro")
      .send({
        nombre: "Sofi",
        password: "123456",
        edad: 21
      });

    expect(res.statusCode).toBe(400);
  });
});