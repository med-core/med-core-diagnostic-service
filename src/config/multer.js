import multer from "multer";
import fs from "fs";
import path from "path";

/* -------------------------------------------
   Utilidad: Crear directorio si no existe
--------------------------------------------*/
const ensureDirectoryExists = (directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

/* -------------------------------------------
   Configuración: Subida de Diagnósticos
--------------------------------------------*/
const diagnosticStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join("uploads", "patients", "diagnostics");
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const patientId = req.params.patientId || "unknown";
    const timestamp = Date.now();
    const randomString = Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const filename = `diagnostic-${patientId}-${timestamp}_${randomString}${ext}`;
    cb(null, filename);
  },
});

/* -------------------------------------------
   Filtro de tipos permitidos
--------------------------------------------*/
const diagnosticFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
  ];

  const allowedExtensions = /\.(pdf|jpeg|jpg|png)$/i;

  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedMimeTypes.includes(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  }

  cb(
    new Error(
      `Tipo de archivo no permitido. Solo se permiten: PDF, JPEG, JPG, PNG. Recibido: ${file.mimetype}`
    )
  );
};

/* -------------------------------------------
   Configuración principal para diagnósticos
--------------------------------------------*/
const uploadDiagnostic = multer({
  storage: diagnosticStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: diagnosticFileFilter,
});

const csvFileFilter = (req, file, cb) => {
  if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
    cb(null, true);
  } else {
    cb(new Error("Solo se permiten archivos CSV"));
  }
};

const uploadCSV = multer({
  storage: csvStorage,
  fileFilter: csvFileFilter,
});

/* -------------------------------------------
   Exportaciones
--------------------------------------------*/
export const uploadDiagnosticSingle = uploadDiagnostic.single("document");
export const uploadDiagnosticMultiple = uploadDiagnostic.array("documents", 5);

