const fs = require("fs");
const path = require("path");

const deleteFile = async (fileName, folderName) => {
  const imagePath = path.join(process.cwd(), `uploads/${folderName}`, fileName);
  try {
    fs.unlink(imagePath, (err) => {
      if (err) {
        console.log(err);
      }
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports = deleteFile;
