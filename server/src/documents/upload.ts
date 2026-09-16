import multer from "multer";
import path from "node:path";
import fs from "node:fs";

const uploadDirectory = path.resolve(
  process.cwd(),
  "uploads",
  "documents",
);

fs.mkdirSync(uploadDirectory, {
  recursive: true,
});

const allowedMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
]);

const allowedExtensions = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".png",
  ".jpg",
  ".jpeg",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname);

    const safeName =
      path
        .basename(
          file.originalname,
          extension,
        )
        .replace(/[^a-zA-Z0-9-_]/g, "-")
        .slice(0, 50) || "document";

    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1_000_000,
    )}`;

    cb(
      null,
      `${safeName}-${uniqueName}${extension}`,
    );
  },
});

export const advisoryDocumentUpload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (
      !allowedMimeTypes.has(file.mimetype) ||
      !allowedExtensions.has(extension)
    ) {
      return cb(
        new Error(
          "Unsupported file type. Please upload PDF, Word, Excel, PowerPoint, PNG, or JPG files.",
        ),
      );
    }

    cb(null, true);
  },
});