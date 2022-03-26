import { NextFunction, Request, Response } from "express";
import { definitions } from "../../../types";
import { PrismaClient } from "@prisma/client";
import { supabase } from "../../../../../core/supabase";
import verifyUser from "../../../middlewares/verifyUser";

interface User {
  id?: number;
  username?: string;
  is_available?: boolean;
  eth_address?: string;
  sol_address?: string;
  email?: string;
  is_paid?: boolean;
}
class UserController {
  prisma = new PrismaClient();

  getUser = async (req: Request, res: Response) => {
    res.status(200).send(res.locals.user);
  };

  storeUser = async (req: Request, res: Response) => {
    req.body = JSON.parse(req.body);
    let userData = req.body as User;
    userData.is_paid = false;
    let user = await this.prisma.user.create({
      data: userData,
    });

    res.send(201).send(user);
  };

  checkUsername = async (req: Request, res: Response) => {
    const username: any = req.query["username"];
    const user = await this.prisma.user.findFirst({
      where: {
        username: username,
      },
    });

    if (user == null) {
      const returnData: User = {
        username: username as string,
        is_available: true,
      };
      res.status(200).send(returnData);
      return;
    }
    const returnData: User = {
      username: username as string,
      is_available: false,
    };

    res.status(400).send(returnData);
  };

  getUserFromEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const email: any = req.query["email"];
    if (email) {
      const user = await this.prisma.user.findMany({
        where: {
          email: email,
        },
      });
      res.status(200).send(user as User);
    }
    next();
  };

  updateUser = async (req: Request, res: Response, next: NextFunction) => {
    let jwt: any = await verifyUser(req, res, next);
    let { user, error } = await supabase.auth.api.getUser(
      req.headers["bearer-token"] as string
    );
    const userBody = JSON.parse(req.body) as User;
    const updatedUser = await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: userBody,
    });

    res.status(201).send(updatedUser);
  };
}

export default UserController;
