import multer from "multer";
const storage = multer.memoryStorage();
export const uploadStudentSpreadsheet = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const extOk = /\.(csv|xlsx|xls)$/i.test(file.originalname || "");
    const mimeOk = ["text/csv","text/plain","application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/octet-stream"].includes(file.mimetype);
    if (extOk || mimeOk) return cb(null, true);
    const err = new Error("Only CSV, XLSX or XLS student spreadsheets are supported.");
    err.statusCode = 400; cb(err);
  }
});
export const uploadCsv = uploadStudentSpreadsheet;
