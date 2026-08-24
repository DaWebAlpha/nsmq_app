import mongoose from "mongoose";
import { mongooseOptions } from "../constants/index.js";
import { config } from "../config/index.js";

const connectDatabase = async () => {
    try{
        await mongoose.connect(config.mongoUri, mongooseOptions);
    }catch(error){
        console.error({err: error}, "Database connection error");
        throw error;
    }
}

mongoose.connection.on("connected", () => {
    console.log("Database has been connected");
})

mongoose.connection.on("disconnected", () => {
    console.warn("Database has been disconnected");
})

mongoose.connection.on("error", (error) => {
    console.error({err: error}, "Database connection error")
})

export {
    connectDatabase,
}