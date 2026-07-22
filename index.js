require("dotenv").config();
const express = require("express");
const app = express();

const cookieparser = require("cookie-parser");
const path = require("path");
const flash = require('connect-flash')
const expressSession = require('express-session')
const crypto = require('crypto');
const razorpayInstance = require("./config/razorpay");


// DB connection
const db = require("./config/mogoose-connection");

// Routers
const userRouter = require("./routes/userRouter");
const ownerRouter = require("./routes/ownerRouter");
const productsRouter = require("./routes/productsRouter");
const indexRouter = require("./routes/indexRouter");
const login = require("./routes/loginRouter");

// Basic settings
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieparser());


//it dont give session to anauthrized user    d
app.use(expressSession({
    resave:false,
    saveUninitialized:false,
    secret:process.env.EXPRESS_SESSION_SECRET
}))
app.use(flash());

// Static folder
app.use(express.static(path.join(__dirname, "public"))); 

// EJS setup
app.set("view engine", "ejs");

// Routes
app.use("/", indexRouter);
app.use("/users", userRouter);
app.use("/owners", ownerRouter);
app.use("/products", productsRouter);
app.use("/login", login);

app.listen(3000, () => {
    console.log("Server running on port 3000");
});