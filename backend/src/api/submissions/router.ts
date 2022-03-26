import express, { Request, Response, Router } from "express"
import SubmissionController from "./controllers/SubmissionController"

import verifyUser from "../../middlewares/verifyUser"
export const submissionRouter = Router() 

const submissionsController = new SubmissionController()

submissionRouter.get("/", [verifyUser], (req: Request, res: Response) => submissionsController.get(req, res))
submissionRouter.post("/", [verifyUser], (req: Request, res: Response) => submissionsController.post(req, res))
submissionRouter.patch("/", [verifyUser], (req: Request, res: Response) => submissionsController.update(req, res))
submissionRouter.delete("/", [verifyUser], (req: Request, res: Response) => submissionsController.delete(req, res))
