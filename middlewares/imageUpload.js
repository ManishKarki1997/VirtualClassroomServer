const multer = require("multer");

// Destination and Image Name
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/images");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + file.originalname);
  },
});

// File Filters
let fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/pjepeg", "image/png"];

  // If user uploaded file's mimetype is not valid, return an error message
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      {
        success: false,
        message: "Invalid file type. Only jpg and png image files are allowed",
      },
      false
    );
  }
};

const multerObj = {
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 * 1024, //5mb max filesize
  },
  fileFilter,
};

const upload = multer(multerObj).single("image");

module.exports = (req, res, next) => {
  upload(req, res, function (error) {
    if (error) {
      res.status(500);
      if (error.code === "LIMIT_FILE_SIZE") {
        error.message = "Maximum allowed file size is 5MB";
        error.error = true;
      }
      return res.send(error);
    } else {
      next();
    }
  });
};
