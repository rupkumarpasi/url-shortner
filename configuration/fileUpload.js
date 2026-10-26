import multer, { diskStorage } from "multer"
import path from "node:path";


const avatarStorage = multer.diskStorage({
destination: (req,file,cb)=>{
    cb(null,"public/uploads/avatar");
},

filename: (req,file,cb)=>{
    const extension = path.extname(file.originalname);
    cb(null,`${Date.now()}_${Math.random()}_${extension}`);
}
});


const avatarFilter = (req,file,cb)=>{
    if(file.mimetype.startsWith("image/"))
    {
        cb(null,true);
    }
    else{
        cb(new Error("only image file type is supported"),false);
    }
};

export const avatarUpload = multer({
    storage: avatarStorage,
    fileFilter: avatarFilter,
    limits: {fileSize: 5 * 1024 * 1024} //5mb


})