const multer =require('multer')

const storage =multer.memoryStorage();
const uplod=multer({storage:storage})

module.exports=uplod;