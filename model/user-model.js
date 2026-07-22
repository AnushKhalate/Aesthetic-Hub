const { default: mongoose } = require("mongoose")


const userShema = mongoose.Schema({
    fullName:String,
    email:String,
    password:String,
    cart:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Product"
    }],
    order:[],
    contact:Number,
    pictuer:String
})


module.exports=mongoose.model("User",userShema)