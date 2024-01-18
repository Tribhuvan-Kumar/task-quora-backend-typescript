import express, { Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app: Express = express();

app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// all routes
import userRouter from "./routers/user.routers";
import postRouter from "./routers/post.routers";

// routes declaration
app.use("/api/v1/user", userRouter);
app.use("/api/v1/post", postRouter);

export { app };
