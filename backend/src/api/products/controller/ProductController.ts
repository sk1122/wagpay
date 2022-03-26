import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import verifyUser from "../../../middlewares/verifyUser";
import { supabase } from "./../../../client";
export interface Product {
  id: number;
  discounted_price: number;
  price: number;
  name: string;
  description: string;
  links: string[];
  sold: number;
  user: number;
  image: File;
}

class ProductController {
  prisma = new PrismaClient();

  get = async (req: Request, res: Response) => {
    const id: number = Number(req.query["id"]);
    let product;
    try {
      product = await this.prisma.product.findFirst({
        where: {
          id: id,
        },
      });
    } catch (e) {
      res.status(400).send({
        error: e,
        status: 400,
      });
    }
    res.status(200).send(product);
  };

  post = async (req: Request, res: Response) => {
    const producData = req.body;
    let product;
    try {
      product = await this.prisma.product.create({
        data: producData,
      });
    } catch (e) {
      res.status(400).send({
        error: e,
        status: 400,
      });
    }
    res.status(200).send(product);
  };

  update = async (req: Request, res: Response) => {
    const productId: number = Number(req.query.id);
    const productData: any = JSON.parse(req.body) as Product;
    let updatedProduct;
    try {
      updatedProduct = await this.prisma.product.update({
        where: {
          id: productId,
        },
        data: productData,
      });
    } catch (e) {
      res.status(400).send({
        error: e,
        status: 400,
      });
    }
    res.status(201).send(updatedProduct);
  };
  delete = async (req: Request, res: Response) => {
    const { id } = req.query;
    let product;

    try {
      product = await this.prisma.product.delete({
        where: {
          id: Number(id),
        },
      });
    } catch (e) {
      res.status(400).send({
        error: e,
        status: 400,
      });
      return;
    }

    res.status(204).send(product);
  };
}

export default ProductController;
