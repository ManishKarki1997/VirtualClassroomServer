const multer = require('multer');

// Image Upload Filters

// Destination and Image Name
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/resources')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + file.originalname)
    }
})

// File Filters
let fileFilter = (req, file, cb) => {

    const allowedMimeTypes = ['application/msword', 'application/epub+zip', 'image/jpeg', 'application/vnd.ms-powerpoint', 'application/rtf', 'application/vnd.rar', 'application/zip', 'image/png'];

    // If user uploaded file's mimetype is not valid, return an error message
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb({
            success: false,
            message: "Invalid file type."
        }, false)
    }
}

const multerObj = {
    storage,
    limits: {
        fileSize: 20 * 1024 * 1024 * 1024 //20mb max filesize
    },
    fileFilter
}

const upload = multer(multerObj).single('resource');

module.exports = (req, res, next) => {
    upload(req, res, function (error) {
        if (error) {
            res.status(500);
            if (error.code === 'LIMIT_FILE_SIZE') {
                error.message = "Maximum allowed file size is 20MB";
                error.error = true;
            }
            return res.send(error);
        } else {
            next();
        }
    })
}