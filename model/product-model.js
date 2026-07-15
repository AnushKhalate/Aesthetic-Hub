const { default: mongoose } = require("mongoose")



const productShema = mongoose.Schema({
    image:String,
    name:String,
    price:Number,
    discount:Number,
    bgcolor:String,
    panelcolor:String,
    textcolor:String
})


module.exports=mongoose.model("User",productShema)