import express, { NextFunction, Request, Response, Router } from "express";
import ProductController from "./controller/ProductController";
import verifyUser from "../../middlewares/verifyUser";
export const productRouter = Router();
const productController = new ProductController();

productRouter.get("/", (req: Request, res: Response) =>
  productController.get(req, res)
);
productRouter.post("/", (req: Request, res: Response) =>
  productController.post(req, res)
);
productRouter.post("/", (req: Request, res: Response) =>
  productController.update(req, res)
);
productRouter.post("/", (req: Request, res: Response) =>
  productController.delete(req, res)
);
