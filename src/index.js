import express from "express";
import cors from "cors";
import { connectDB } from "./config/database.js";
import diagnosticRoutes from "./router/medicalRecordRoutes.js";
import { sendError } from "./utils/errorHandler.js"

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Endpoint de salud estándar (usado por Docker Healthcheck)
app.get("/health", (req, res) => {
 res.status(200).json({ status: "ok" });
});

// Rutas reales del microservicio
app.use("/api/v1", diagnosticRoutes);

// Ruta de prueba
app.get("/", (req, res) => {
 res.send("Diagnostic Service funcionando correctamente");
});
app.use((err, req, res, next) => {
  sendError(err, res);
});


async function startServer() {
    try {
        await connectDB(); 
        console.log("Conectado a MongoDB mediante Prisma (Diagnostic Service)");

        app.listen(PORT, () => {
           console.log(`Diagnostic Service corriendo en puerto ${PORT}`);
        });

    } catch (error) {
        console.error("Fallo crítico al iniciar el Diagnostic Service:", error.message);
        process.exit(1);
    }
}

startServer();

