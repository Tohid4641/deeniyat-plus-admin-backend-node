const multer = require("multer");
const path = require('path');

//File_Storage
const Storage = multer({
  storage:multer.diskStorage({
    // File_Path
    destination: (req,file,cb) =>{
        cb(null,'public/uploads')
    },
    // File_Name
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}_${file.originalname}`);
    }
}),fileFilter:(req,file,cb)=>{
  
if (file.mimetype.startsWith('image')) {
  cb(null,true)
} else {
 let err= new Error('Please select image file')
 
  cb(err,false)
}
}
});
const Storage1 = multer({
  storage:multer.diskStorage({
    // File_Path
    destination: (req,file,cb) =>{
        cb(null,'public/assist')
    },
    // File_Name
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}_${file.originalname}`);
    }
}),fileFilter:(req,file,cb)=>{
  
if (file.mimetype.startsWith('image')) {
  cb(null,true)
} else {
 let err= new Error('Please select image file')
 
  cb(err,false)
}
}
});
//File_Upload
const assist = multer(Storage1);
const upload = multer(Storage);

module.exports = {upload,assist};