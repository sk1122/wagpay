import express, { NextFunction, Request, Response, Router } from "express";
import ProductController from "./controller/ProductController";
import verifyUser from "../../middlewares/verifyUser";
export const productRouter = Router();
const productController = new ProductController();

productRouter.get("/", (req: Request, res: Response) =>
  productController.getProduct(req, res)
);
productRouter.post("/", (req: Request, res: Response, next: NextFunction) =>
  productController.createProduct(req, res, next)
);
