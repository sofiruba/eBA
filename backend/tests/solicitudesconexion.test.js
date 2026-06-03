const request = require("supertest");
const app = require("../app");

describe("Solicitudes de conexión", () => {
  test("debería enviar una solicitud de conexión", async () => {
    const res = await request(app)
      .post("/api/solicitudes-conexion")
      .send({
        emisorId: "ID_USUARIO_1",
        receptorId: "ID_USUARIO_2"
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.solicitud.estado).toBe("pendiente");
  });

  test("no debería permitir enviarse solicitud a uno mismo", async () => {
    const res = await request(app)
      .post("/api/solicitudes-conexion")
      .send({
        emisorId: "ID_USUARIO_1",
        receptorId: "ID_USUARIO_1"
      });

    expect(res.statusCode).toBe(400);
  });

  test("no debería duplicar una solicitud pendiente", async () => {
    await request(app)
      .post("/api/solicitudes-conexion")
      .send({
        emisorId: "ID_USUARIO_1",
        receptorId: "ID_USUARIO_2"
      });

    const res = await request(app)
      .post("/api/solicitudes-conexion")
      .send({
        emisorId: "ID_USUARIO_1",
        receptorId: "ID_USUARIO_2"
      });

    expect(res.statusCode).toBe(400);
  });
});