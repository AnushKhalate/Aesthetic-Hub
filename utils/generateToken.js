const  jwt = require('jsonwebtoken')

const generateToken=(user)=>{
let token = jwt.sign({email:user.email},process.env.JWT_KEY);
}
 module.exports.generateToken=this.generateToken;