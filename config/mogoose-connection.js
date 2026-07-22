const mongoose = require("mongoose");

const mongoUri = process.env.MONGODB_URI;

mongoose
    .connect(mongoUri)
    .then(() => {
        console.log("✅ MongoDB Atlas Connected Successfully");
    })
    .catch((err) => {
        console.log("❌ Database connection failed");
        console.log(err.message);
    });

module.exports = mongoose.connection;