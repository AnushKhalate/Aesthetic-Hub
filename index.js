require("dotenv").config();

const express = require("express");
const app = express();

const cookieparser = require("cookie-parser");
const path = require("path");
const flash = require("connect-flash");
const expressSession = require("express-session");

// Database connection
const connectDatabase = require("./config/mogoose-connection");

// Routers
const userRouter = require("./routes/userRouter");
const ownerRouter = require("./routes/ownerRouter");
const productsRouter = require("./routes/productsRouter");
const indexRouter = require("./routes/indexRouter");
const loginRouter = require("./routes/loginRouter");

// EJS setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieparser());

app.use(
    expressSession({
        resave: false,
        saveUninitialized: false,
        secret: process.env.EXPRESS_SESSION_SECRET
    })
);

app.use(flash());

app.use(express.static(path.join(__dirname, "public")));

// Wait for MongoDB before every route
app.use(async function (req, res, next) {
    try {
        await connectDatabase();
        next();
    } catch (error) {
        console.error(
            "Database middleware error:",
            error.message
        );

        res.status(503).send(
            "Database connection is temporarily unavailable."
        );
    }
});

// Routes
app.use("/", indexRouter);
app.use("/users", userRouter);
app.use("/owners", ownerRouter);
app.use("/products", productsRouter);
app.use("/login", loginRouter);

// Local server
if (require.main === module) {
    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// Vercel export
module.exports = app;