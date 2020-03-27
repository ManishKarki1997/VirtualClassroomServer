const fs = require("fs");
const path = require('path');

const deleteImage = async (fileName) => {

    const imagePath = path.join(process.cwd(), 'uploads/images', fileName)
    try {
        fs.unlink(imagePath, err => {
            if (err) {
                console.log(err)
            }
        })

    } catch (error) {
        console.log(error)
    }

}

module.exports = deleteImage;