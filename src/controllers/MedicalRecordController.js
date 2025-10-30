import { PrismaClient } from "@prisma/client";
import axios from "axios";

const prisma = new PrismaClient();
const PATIENT_SERVICE_URL = "http://med-core-patient-service:3000";
const AUTH_SERVICE_URL = "http://med-core-auth-service:3000";

// ================= GET DIAGNOSTICS BY PATIENT =================
export const getMedicalRecords = async (req, res) => {
  const { patientId } = req.params;
  const user = req.user;

  try {
    if (user.role === "ENFERMERO") {
      return res.status(403).json({ message: "Los enfermeros no tienen acceso a diagnósticos." });
    }

    if (user.role === "PACIENTE") {
      const resp = await axios.get(`${PATIENT_SERVICE_URL}/patients/user/${user.id}`);
      if (!resp.data || resp.data.id !== patientId) {
        return res.status(403).json({ message: "No puedes ver diagnósticos de otros pacientes." });
      }
    }

    const diagnostics = await prisma.diagnostic.findMany({
      where: { patientId },
      orderBy: { diagnosisDate: "desc" },
    });

    res.json({ diagnostics });
  } catch (error) {
    console.error("Error al obtener diagnósticos:", error.message);
    res.status(500).json({ message: "Error interno al obtener diagnósticos." });
  }
};

// ================= CREATE DIAGNOSTIC =================
export const createMedicalRecord = async (req, res) => {
  console.log("CONTROLADOR -> req.user:", req.user);
  console.log("CONTROLADOR -> req.body:", req.body);
  console.log("CONTROLADOR -> req.files:", req.files);

  try {
    const user = req.user;
    if (!user?.id) return res.status(401).json({ message: "Usuario no autenticado" });

    // patientId de la URL
    const patientId = req.params.patientId;

    // Campos de form-data
    const { title, description, symptoms, diagnosis, treatment, nextAppointment } = req.body;

    if (!title || !patientId) return res.status(400).json({ message: "Faltan datos obligatorios." });
    if (!["MEDICO", "ADMINISTRADOR"].includes(user.role)) {
      return res.status(403).json({ message: "No tienes permiso para crear diagnósticos." });
    }

    const newDiagnostic = await prisma.diagnostic.create({
      data: {
        patientId,
        doctorId: user.id,
        title,
        description: description || "",
        symptoms: symptoms || "",
        diagnosis: diagnosis || "",
        treatment: treatment || "",
        nextAppointment: nextAppointment ? new Date(nextAppointment) : null,
      },
    });

    res.status(201).json({ message: "Diagnóstico creado correctamente.", diagnostic: newDiagnostic });

  } catch (error) {
    console.error("Error creando diagnóstico:", error.message);
    res.status(500).json({ message: "Error interno al crear diagnóstico." });
  }
};

// ================= DELETE DIAGNOSTIC =================
export const deleteMedicalRecord = async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  try {
    if (user.role !== "ADMINISTRADOR") {
      return res.status(403).json({ message: "Solo administradores pueden eliminar diagnósticos." });
    }

    const diagnostic = await prisma.diagnostic.findUnique({ where: { id } });
    if (!diagnostic) return res.status(404).json({ message: "Diagnóstico no encontrado." });

    await prisma.diagnostic.delete({ where: { id } });
    res.json({ message: "Diagnóstico eliminado correctamente." });
  } catch (error) {
    console.error("Error eliminando diagnóstico:", error.message);
    res.status(500).json({ message: "Error interno al eliminar diagnóstico." });
  }
};

export const searchDiagnostics = async (req, res) => {
  try {
    const { diagnostic, dateFrom, dateTo } = req.query;
    const filters = {};

    if (diagnostic) {
      filters.title = { contains: String(diagnostic).trim(), mode: "insensitive" };
    }

    if (dateFrom || dateTo) {
      const dateFilter = {};
      if (dateFrom && !isNaN(new Date(dateFrom).getTime())) {
        dateFilter.gte = new Date(`${dateFrom}T00:00:00Z`);
      }
      if (dateTo && !isNaN(new Date(dateTo).getTime())) {
        dateFilter.lte = new Date(`${dateTo}T23:59:59Z`);
      }
      if (Object.keys(dateFilter).length > 0) {
        filters.diagnosisDate = dateFilter;
      }
    }

    const diagnostics = await prisma.diagnostic.findMany({
      where: filters,
      orderBy: { diagnosisDate: "desc" },
      select: {
        id: true,
        title: true,
        diagnosisDate: true,
        patientId: true,
      },
    });

    console.log("DIAGNÓSTICOS ENCONTRADOS:", diagnostics);

    return res.status(200).json({
      message: "Búsqueda completada",
      count: diagnostics.length,
      data: diagnostics,
    });
  } catch (err) {
    console.error("Error buscando diagnósticos:", err);
    return res.status(500).json({
      success: false,
      message: "Error buscando diagnósticos",
      error: err.message,
    });
  }
};