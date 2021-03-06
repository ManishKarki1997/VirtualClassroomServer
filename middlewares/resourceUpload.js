const multer = require("multer");

// Image Upload Filters

// Destination and Image Name
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/resources");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + file.originalname);
  },
});

// File Filters
let fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["application/msword", "application/epub+zip", "image/jpeg", "application/vnd.ms-powerpoint", "application/rtf", "application/vnd.rar", "application/zip", "application/x-zip-compressed", "image/png", "application/pdf", "font/otf"];

  // If user uploaded file's mimetype is not valid, return an error message
  if (allowedMimeTypes.includes(file.mimetype)) {
    if (file.mimetype === "image/png" || file.mimetype === "image/jpeg") {
      req.resourceFileType = "image";
    } else if ((file.mimetype === "application/msword" || file.mimetype === "application/vnd.ms-powerpoint" || file.mimetype === "application/rtf", file.mimetype === "application/pdf")) {
      req.resourceFileType = "office";
    } else if (file.mimetype === "application/epub+zip" || file.mimetype === "application/vnd.rar" || file.mimetype === "application/zip" || file.mimetype === "application/x-zip-compressed") {
      req.resourceFileType = "zip";
    } else {
      req.resourceFileType = "other";
    }
    cb(null, true);
  } else {
    cb(
      {
        error: true,
        message: "Invalid file type.",
      },
      false
    );
  }
};

const multerObj = {
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024 * 1024, //20mb max filesize
  },
  fileFilter,
};

const upload = multer(multerObj).single("resource");

module.exports = (req, res, next) => {
  upload(req, res, function (error) {
    if (error) {
      if (error.code === "LIMIT_FILE_SIZE") {
        error.message = "Maximum allowed file size is 20MB";
        error.error = true;
      }
      return res.send(error);
    } else {
      next();
    }
  });
};
