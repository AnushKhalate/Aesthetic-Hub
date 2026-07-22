const { default: mongoose } = require("mongoose")



const productShema = mongoose.Schema({
    image:Buffer,
    name:String,
    price:Number,
    discount:Number,
    bgcolor:String,
    panelcolor:String,
    textcolor:String
})


module.exports=mongoose.model("Product",productShema)