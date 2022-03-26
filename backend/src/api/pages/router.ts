import express, { Request, Response, Router } from "express"
import PageController from "./controllers/PageController"

import verifyUser from "../../middlewares/verifyUser"
export const pageRouter = Router() 

const pagesController = new PageController()

pageRouter.get("/", [verifyUser], (req: Request, res: Response) => pagesController.get(req, res))
pageRouter.post("/", [verifyUser], (req: Request, res: Response) => pagesController.post(req, res))
pageRouter.patch("/", [verifyUser], (req: Request, res: Response) => pagesController.update(req, res))
pageRouter.delete("/", [verifyUser], (req: Request, res: Response) => pagesController.delete(req, res))
