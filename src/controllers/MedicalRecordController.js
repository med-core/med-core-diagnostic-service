import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET /api/medical-records/:patientId
 * Permite:
 * - Médicos y administradores: ver historial de cualquier paciente
 * - Pacientes: solo su propio historial
 */
export const getMedicalRecords = async (req, res) => {
  const { patientId } = req.params;
  const user = req.user; // del verifyToken

  try {
    // Si es paciente y quiere ver otro historial → prohibido
    if (user.role === "PACIENTE" && user.id !== patientId) {
      return res.status(403).json({ message: "No puedes ver historiales de otros pacientes." });
    }

    // Enfermero no puede ver historiales
    if (user.role === "ENFERMERO") {
      return res.status(403).json({ message: "Los enfermeros no tienen acceso a historiales clínicos." });
    }

    // Busca los historiales
    const records = await prisma.medicalRecords.findMany({
      where: { patientId },
      include: {
        createdBy: {
          select: { id: true, fullname: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!records || records.length === 0) {
      return res.status(404).json({ message: "No se encontraron historiales para este paciente." });
    }

    res.json(records);
  } catch (error) {
    console.error("Error al obtener historiales:", error);
    res.status(500).json({ message: "Error interno al obtener historiales." });
  }
};

/**
 * POST /api/medical-records
 * Permite:
 * - Médicos y administradores: crear un nuevo historial
 * 
 * body: { patientId, title, description }
 */
export const createMedicalRecord = async (req, res) => {
  const { patientId, title, description } = req.body;
  const user = req.user;

  try {
    // Solo médico o admin pueden crear historiales
    if (user.role !== "MEDICO" && user.role !== "ADMINISTRADOR") {
      return res.status(403).json({ message: "No tienes permiso para crear historiales clínicos." });
    }

    // Validación de datos
    if (!patientId || !title) {
      return res.status(400).json({ message: "Faltan datos obligatorios (patientId o title)." });
    }

    // Verificar que el paciente exista
    const patient = await prisma.users.findUnique({ where: { id: patientId } });
    if (!patient) {
      return res.status(404).json({ message: "Paciente no encontrado." });
    }

    // Crear historial
    const record = await prisma.medicalRecords.create({
      data: {
        title,
        description: description || null,
        patientId,
        createdById: user.id,
      },
    });

    res.status(201).json({ message: "Historial clínico creado correctamente.", record });
  } catch (error) {
    console.error("Error al crear historial clínico:", error);
    res.status(500).json({ message: "Error interno al crear historial clínico." });
  }
};

/**
 * DELETE /api/medical-records/:id
 * Permite:
 * - Solo ADMIN eliminar historiales
 */
export const deleteMedicalRecord = async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  try {
    if (user.role !== "ADMINISTRADOR") {
      return res.status(403).json({ message: "Solo los administradores pueden eliminar historiales." });
    }

    const record = await prisma.medicalRecords.findUnique({ where: { id } });
    if (!record) {
      return res.status(404).json({ message: "Historial no encontrado." });
    }

    await prisma.medicalRecords.delete({ where: { id } });

    res.json({ message: "Historial clínico eliminado correctamente." });
  } catch (error) {
    console.error("Error al eliminar historial:", error);
    res.status(500).json({ message: "Error interno al eliminar historial clínico." });
  }
};
