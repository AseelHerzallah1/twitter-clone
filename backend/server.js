import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import {v2 as cloudinary} from "cloudinary";

import authRoutes from './routes/auth.route.js';
import userRoutes from './routes/user.route.js';
import postRoutes from './routes/post.route.js';
import notificationRoutes from './routes/notification.route.js';
import searchRoutes from './routes/search.route.js';
import messageRoutes from './routes/message.route.js';
import nestRoutes from './routes/nest.route.js';

import connectMongoDB from './db/connectMongoDB.js';

dotenv.config();

if (process.env.OPENAI_API_KEY) {
    console.log("Nest AI: enabled");
} else {
    console.log("Nest AI: disabled — add OPENAI_API_KEY to .env");
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();

const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",").map((url) => url.trim())
    : ["http://localhost:3000"];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({limit: "5mb"})); // to parse request body as JSON

app.use(express.urlencoded({ extended: true })); // to parse URL-encoded data

app.use(cookieParser()); // to parse cookies

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/nest", nestRoutes);

if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "/frontend/dist")));
    app.get("/{*path}", (req, res) => {
        res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
    });
}

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connectMongoDB();
});