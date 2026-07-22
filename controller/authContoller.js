const bcrypt=require('bcrypt')
const jwt =require('jsonwebtoken')
const userModel=require('../model/user-model')
const { generateToken }=require('../utils/generateToken')
const flash=require('connect-flash')
const ownerModel=require('../model/owner_model')


module.exports.registerUser=async (req,res)=>{
    try{
        let {email,fullName,password}=req.body;

        let user =await userModel.findOne({email:email})

      if (user) {
    req.flash("error", "You are already registered by this email.");
    return res.redirect("/");
}

        bcrypt.genSalt(10,function(err,salt){
            bcrypt.hash(password,salt,async function(err,hash){
                if(err) res.send(err.message)
                    else { 
                let user = await userModel.create({
            fullName,
            email,
            password:hash
        })}

       let token = jwt.sign({email},process.env.JWT_KEY);
        res.cookie("token",token)
        res.redirect("/login/")
            });
        });
        
    }
    catch(err){  

        res.send(err.message)

    }
}


module.exports.loginUser = async (req, res) => {
    try {

        const { email, password } = req.body;

        const user = await userModel.findOne({ email });
        const owner = await ownerModel.findOne({ email });

    
        if(user){ bcrypt.compare(password, user.password, (err, result) => {

            if (err) {
                req.flash("error", "Something went wrong.");
                return res.redirect("/login");
            }

            if (!result) {
                req.flash("error", "Invalid email or password.");
                return res.redirect("/login");
            }
            const token = jwt.sign(
                { email: user.email },
                process.env.JWT_KEY
            );
            res.cookie("token", token, {
                httpOnly: true
            });
            console.log(process.env.NODE_ENV)
            return res.redirect("/shop");

        });}

        if(owner){
            bcrypt.compare(password, owner.password, (err, result) => {

            if (err) {
                req.flash("error", "Something went wrong.");
                return res.redirect("/login");
            }

            if (!result) {
                req.flash("error", "Invalid email or password.");
                return res.redirect("/login");
            }
            const token = jwt.sign(
                { email: owner.email },
                process.env.JWT_KEY
            );
            res.cookie("token", token, {
                httpOnly: true
            });
            
            return res.redirect("/owners/admin");

        });
        }
       

    } catch (err) {
        console.log(err);
        req.flash("error", "Something went wrong.");
        return res.redirect("/login");
    }
};


module.exports.logout=async(req,res)=>{
    res.clearCookie("token","");
    res.redirect("/");
};