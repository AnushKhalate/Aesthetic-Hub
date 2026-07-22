const mongoose = require("mongoose");

let connectionPromise = null;

async function connectDatabase() {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is missing.");
    }

    if (!connectionPromise) {
        connectionPromise = mongoose.connect(
            process.env.MONGODB_URI,
            {
                serverSelectionTimeoutMS: 10000
            }
        );
    }

    try {
        await connectionPromise;

        console.log("MongoDB Atlas Connected Successfully");

        return mongoose.connection;
    } catch (error) {
        connectionPromise = null;
        throw error;
    }
}

module.exports = connectDatabase;