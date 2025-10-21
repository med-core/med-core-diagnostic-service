import { PrismaClient } from "@prisma/client";
import fs from "fs";
const prisma = new PrismaClient();

class DiagnosticService {
    // Crear un nuevo diagnóstico
    async createDiagnostic(patientId, doctorId, diagnosticData, files) {
        try {
            //verificar que el paciente y el doctor existan
            const patient = await prisma.patient.findUnique({
                where: { id: patientId },
                include: { user: true },
            });
            if (!patient) {
                throw new Error("Paciente no encontrado");
            }

            if (patient.state === "INACTIVE") {
                throw new Error("El paciente está inactivo");
            }
            const doctor = await prisma.users.findUnique({
                where: { id: doctorId },
            });
            if (!doctor) {
                throw new Error("Doctor no encontrado");
            }
            if (!doctor || doctor.role !== "MEDICO" && doctor.role !== "ADMINISTRADOR") {
                throw new Error("Solo los Doctores pueden crear diagnósticos");
            }
            //crear el diagnóstico con documentos
            const diagnostic = await prisma.$transaction(async (tx) => {
                // Crear el diagnóstico
                const newDiagnostic = await tx.diagnostic.create({
                    data: {
                        patientId: patientId,
                        doctorId: doctorId,
                        title: diagnosticData.title,
                        description: diagnosticData.description,
                        symptoms: diagnosticData.symptoms,
                        diagnosis: diagnosticData.diagnosis,
                        treatment: diagnosticData.treatment,
                        observations: diagnosticData.observations,
                        nextAppointment: diagnosticData.nextAppointment ? new Date(diagnosticData.nextAppointment) : null,
                    },
                });
                // Si hay archivos, crear registros de documentos
                if (files && files.length > 0) {
                    const documentRecords = files.map((file) => ({
                        diagnosticId: newDiagnostic.id,
                        fileName: file.originalname,
                        storedFileName: file.filename,
                        filePath: file.path,
                        fileType: file.originalname.split(".").pop().toLowerCase(),
                        mimeType: file.mimetype,
                        fileSize: file.size,
                        description: null,
                        uploadedBy: doctorId,
                    }));
                    await tx.diagnosticDocument.createMany({ data: documentRecords });
                }
                // Retornar el diagnóstico completo
                return await tx.diagnostic.findUnique({
                    where: { id: newDiagnostic.id },
                    include: {
                        patient: {
                            include: {
                                user: {
                                    select: { id: true, email: true, fullname: true }
                                }
                            }
                        }, doctor: {
                            select: { id: true, email: true, fullname: true, specialization: true }
                        },
                        documents: true,
                    },
                });
            });
            return diagnostic;
        } catch (error) {
            //si hay un error, eliminar los archivos subidos
            if (files && files.length > 0) {
                for (const file of files) {
                    try {
                        await fs.unlinkSync(file.filePath);
                    } catch (unlinkError) {
                        console.error("Error al eliminar el archivo:", unlinkError);
                    }
                }
            }
            throw error;
        }
    }
}
export default new DiagnosticService();
