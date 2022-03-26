import express, { Request, Response, Router } from "express"
import PaymentIntentController from "./controllers/PaymentIntentController"

import verifyUser from "../../middlewares/verifyUser"
export const paymentIntentRouter = Router() 

const paymentIntentController = new PaymentIntentController()

paymentIntentRouter.get("/", [verifyUser], (req: Request, res: Response) => paymentIntentController.get(req, res))
paymentIntentRouter.post("/", [verifyUser], (req: Request, res: Response) => paymentIntentController.post(req, res))
paymentIntentRouter.patch("/", [verifyUser], (req: Request, res: Response) => paymentIntentController.update(req, res))
paymentIntentRouter.delete("/", [verifyUser], (req: Request, res: Response) => paymentIntentController.delete(req, res))
