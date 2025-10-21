import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import { requireRole } from "../middlewares/roleMiddleware.js";
import {
  getMedicalRecords,
  createMedicalRecord,
  deleteMedicalRecord,
} from "../controllers/MedicalRecordController.js";

const router = express.Router();

// Ver historiales
router.get("/:patientId", verifyToken, requireRole("PACIENTE", "MEDICO", "ADMINISTRADOR"), getMedicalRecords);
// Crear historial
router.post("/", verifyToken, requireRole("MEDICO", "ADMINISTRADOR"), createMedicalRecord);

// Eliminar historial
router.delete("/:id", verifyToken, requireRole("ADMINISTRADOR"), deleteMedicalRecord);

export default router;
