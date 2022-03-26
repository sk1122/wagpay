import express, { Request, Response } from "express";

import cors from "cors";
import * as dotenv from "dotenv";
import http from "http";
import { pageRouter } from "./api/pages/router";
import { pageRouter } from "./api/users/router";

dotenv.config();

if (!process.env.PORT) {
  process.exit(1);
}

const PORT: number = parseInt(process.env.PORT as string, 10);
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

server.listen(PORT, () => {
  console.log(`Server listening @ ${PORT}`);
});
