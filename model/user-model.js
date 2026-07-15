const { default: mongoose } = require("mongoose")


const userShema = mongoose.Schema({
    fullName:String,
    email:String,
    password:String,
    cart:[],
    isadmin:Boolean,
    order:[],
    contact:Number,
    pictuer:String
})


module.exports=mongoose.model("User",userShema)