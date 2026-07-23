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

module.exports.loginUser = async function (req, res) {
    try {
        let { email, password } = req.body;

        email = email?.trim().toLowerCase();

        if (!email || !password) {
            req.flash("error", "Email and password are required.");
            return res.redirect("/login");
        }

        // Check owner first
        const owner = await ownerModel.findOne({ email });

        if (owner) {
            const ownerPasswordMatched = await bcrypt.compare(
                password,
                owner.password
            );

            if (ownerPasswordMatched) {
                const token = jwt.sign(
                    {
                        id: owner._id,
                        email: owner.email,
                        role: "owner"
                    },
                    process.env.JWT_KEY,
                    {
                        expiresIn: "7d"
                    }
                );

                res.cookie("token", token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "lax",
                    maxAge: 7 * 24 * 60 * 60 * 1000
                });

                return res.redirect("/owners/admin");
            }
        }

        // Check normal user
        const user = await userModel.findOne({ email });

        if (user) {
            const userPasswordMatched = await bcrypt.compare(
                password,
                user.password
            );

            if (userPasswordMatched) {
                const token = jwt.sign(
                    {
                        id: user._id,
                        email: user.email,
                        role: "user"
                    },
                    process.env.JWT_KEY,
                    {
                        expiresIn: "7d"
                    }
                );

                res.cookie("token", token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "lax",
                    maxAge: 7 * 24 * 60 * 60 * 1000
                });

                return res.redirect("/shop");
            }
        }

        req.flash("error", "Invalid email or password.");
        return res.redirect("/login");

    } catch (error) {
        console.error("Login error:", error);

        req.flash(
            "error",
            error.message || "Something went wrong."
        );

        return res.redirect("/login");
    }
};


module.exports.logout=async(req,res)=>{
    res.clearCookie("token","");
    res.redirect("/");
};