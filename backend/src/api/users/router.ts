import express, { NextFunction, Request, Response, Router } from "express";
import UserController from "./controller/UserController";

import verifyUser from "../../middlewares/verifyUser";
export const userRouter = Router();

const userController = new UserController();

userRouter.get("/", [verifyUser], (req: Request, res: Response) =>
  userController.getUser(req, res)
);

userRouter.post("/", [verifyUser], (req: Request, res: Response) =>
  userController.storeUser(req, res)
);

userRouter.get("/checkusername", (req: Request, res: Response) =>
  userController.checkUsername(req, res)
);

userRouter.get("/", (req: Request, res: Response, next: NextFunction) =>
  userController.getUserFromEmail(req, res, next)
);

userRouter.patch("/", (req: Request, res: Response, next: NextFunction) =>
  userController.updateUser(req, res, next)
);
