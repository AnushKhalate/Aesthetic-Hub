const { default: mongoose } = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/Asthetic_Hub")
.then(function(){
    console.log("db connected sucssefully")
})
.catch(function(err){
    console.log(err)
})

module.exports=mongoose.connection;