const multer = require("multer");
const path = require("path");
const fs = require("fs");

const qrDest = path.join(__dirname, "../uploads/qrcodes");
if (!fs.existsSync(qrDest)) {
  fs.mkdirSync(qrDest, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, qrDest);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExt = /jpeg|jpg|png|webp/;
  const extOk = allowedExt.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = /^image\/(jpeg|png|webp)$/i.test(file.mimetype);

  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG, or WEBP images are allowed for QR codes"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

module.exports = upload;

