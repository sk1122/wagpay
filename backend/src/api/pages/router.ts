import express, { Request, Response, Router } from "express"
import PageController from "./controllers/PageController"

import verifyUser from "../../middlewares/verifyUser"
export const pageRouter = Router() 

const pagesController = new PageController()

pageRouter.get("/", [verifyUser], (req: Request, res: Response) => pagesController.get(req, res))
