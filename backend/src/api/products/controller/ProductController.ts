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
  getProduct = async (req: Request, res: Response) => {
    const id: any = req.query["id"];

    const product = await this.prisma.product.findFirst({
      where: {
        id: id,
      },
    });

    if (product) {
      res.status(201).send(product);
      return;
    }

    res.status(400).send("Page was not found ");
  };

  createProduct = async (req: Request, res: Response, next: NextFunction) => {
    let jwt = await verifyUser(req, res, next);
    let { user, error } = await supabase.auth.api.getUser(
      req.headers["bearer-token"] as string
    );
    const product: any = JSON.parse(req.body) as Product;
    const newProduct = await this.prisma.product.create({
      data: product,
    });
    if (newProduct) {
      res.status(201).send(product);
      return;
    }

    res.status(400).send("Page was not found ");
  };

  incrementSold = async (req: Request, res: Response) => {
    const body = JSON.parse(req.body);
    const product = await this.prisma.product.update({
      data: {
        sold: {
          increment: 1,
        },
      },
      where: {
        id: body.product_id,
      },
    });

    if (product) {
      res.status(201).send(product);
      return;
    }

    res.status(400).send("Product not updated ");
  };

  moneyEarned = async (req: Request, res: Response, next: NextFunction) => {
    let jwt = await verifyUser(req, res, next);
    let { user, error } = await supabase.auth.api.getUser(
      req.headers["bearer-token"] as string
    );
    const userData = await this.prisma.user.findFirst({
      where: {
        email: user?.email,
      },
      include: {
        Product: true,
        Pages: true,
      },
    });


    if (req.method === "GET") {
      const { data, error } = await supabase.rpc("total_money_earned", {
        user_id: userData[0].id,
      });

      console.log(data, userData[0].id, "dasdsa");
      if (!data || error) {
        console.log(error);
        res.status(400).send("Page was not created " + JSON.stringify(error));
        return;
      }

      console.log(data);
      res.status(201).send(data);
    }
  };












  
  productSold = async (req: Request, res: Response) => {};
  userProducts = async (req: Request, res: Response) => {};
}

export default ProductController;
