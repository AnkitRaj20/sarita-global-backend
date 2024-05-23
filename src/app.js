import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser"

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}))

// Used to accept the json
app.use(express.json({
    limit: "16kb"
}));

// Used to accept the data from url
app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}));

// Used to store files temporarily in public folder
app.use(express.static("public"))

app.use(cookieParser());

// Import Routes
import userRoutes from "./routes/user.routes.js";

// Routes declaration
app.use("/api/v1/users", userRoutes);


export { app };
