import express, { Request, Response, Router } from "express";
import StoreController from "./controllers/StoreController";

import verifyUser from "../../middlewares/verifyUser";
export const userRouter = Router();

const storeController = new StoreController();

userRouter.get("/:id", [verifyUser], (req: Request, res: Response) =>
  storeController.getStore(req, res)
);


