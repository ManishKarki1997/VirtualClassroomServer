const multer = require("multer");

// Destination and Image Name
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/assignments");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + file.originalname);
  },
});

const multerObj = {
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024 * 1024, //20mb max filesize
  },
};

const upload = multer(multerObj).single("assignmentFile");

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
