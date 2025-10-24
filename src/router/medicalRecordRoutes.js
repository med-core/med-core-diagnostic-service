import express from "express";
import { attachUserFromToken } from "../middlewares/verifyToken.js";
import { requireRole } from "../middlewares/roleMiddleware.js";
import {
  getMedicalRecords,
  createMedicalRecord,
  deleteMedicalRecord,
} from "../controllers/MedicalRecordController.js";
import multer from "multer";
const upload = multer();

const router = express.Router();

// Listar diagnósticos de un paciente
router.get(
  "/patients/:patientId/diagnostics",
  attachUserFromToken,
  requireRole("PACIENTE", "MEDICO", "ADMINISTRADOR"),
  getMedicalRecords
);

// Crear diagnóstico
router.post(
  "/patients/:patientId/diagnostics",
  attachUserFromToken,
  requireRole("MEDICO", "ADMINISTRADOR"),
  upload.any(),
  createMedicalRecord
);

// Eliminar diagnóstico
router.delete(
  "/diagnostics/:id",
  attachUserFromToken,
  requireRole("ADMINISTRADOR"),
  deleteMedicalRecord
);

export default router;
