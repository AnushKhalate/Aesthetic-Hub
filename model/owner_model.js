const { default: mongoose } = require("mongoose")

const ownerShema = mongoose.Schema({
    fullName:String,
    email:String,
    password:String,
    product:[],
    contact:Number,
    pictuer:String,
    
})


module.exports=mongoose.model("owner",ownerShemaShema)