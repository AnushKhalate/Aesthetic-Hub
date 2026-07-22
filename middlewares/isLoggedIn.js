const jwt = require("jsonwebtoken");
const userModel = require("../model/user-model");

module.exports = async function (req, res, next) {
    // Check if token exists
    if (!req.cookies.token) {
        req.flash("error", "You need to login first.");
        return res.redirect("/login");
    }

    try {
        // Verify JWT token
        let decoded = jwt.verify(req.cookies.token, process.env.JWT_KEY);

        // Find user (excluding password)
        let user = await userModel
            .findOne({ email: decoded.email })
            .select("-password");

        if (!user) {
            req.flash("error", "User not found.");
            return res.redirect("/");
        }

        // Store user in request
        req.user = user;

        next();
    } catch (err) {
        req.flash("error", "Something went wrong.");
        return res.redirect("/");
    }
};