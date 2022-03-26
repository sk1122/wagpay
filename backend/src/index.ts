import express, { Request, Response } from "express";

import cors from "cors";
import * as dotenv from "dotenv";
import http from "http";
import { pageRouter } from "./api/pages/router";
import { userRouter } from "./api/users/router";
import { submissionRouter } from "./api/submissions/router";
import { paymentIntentRouter } from "./api/payment_intent/router";

dotenv.config();

const PORT: number = parseInt(process.env.PORT as string, 10) | 5000;
const app = express();
const server = http.createServer(app);

app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    allowedHeaders: ["Content-Type"],
    origin: ["http://localhost:3000"],
  })
);
app.use(express.json());

app.get("/", async (req: Request, res: Response) => {
  res.status(200).send("gm");
});

app.use("/api/pages/", pageRouter);
app.use("/api/submissions/", submissionRouter);
app.use("/api/paymentIntents/", paymentIntentRouter);

server.listen(PORT, () => {
  console.log(`Server listening @ ${PORT}`);
});
