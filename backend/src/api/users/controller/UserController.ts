import { NextFunction, Request, Response } from "express";
import { definitions } from "../../../types";
import { PrismaClient, User } from "@prisma/client";
import { supabase } from "../../../../../core/supabase";
import verifyUser from "../../../middlewares/verifyUser";

class UserController {
  prisma = new PrismaClient();

  get = async (req: Request, res: Response) => {
    res.status(200).send(res.locals.user);
  };

  getUser = async (req: Request, res: Response) => {
    let userId = req.params.id;
    let user;
    try {
      user = await this.prisma.user.findFirst({
        where: {
          id: userId,
        },
      });

      res.status(200).send(user);
    } catch (e) {
      res.status(400).send({
        error: e,
        status: 400,
      });
    }
  };

  post = async (req: Request, res: Response) => {
    let userData = req.body;
    userData.is_paid = false;
    try {
      let user = await this.prisma.user.create({
        data: userData,
      });
      res.send(201).send(user);
    } catch (e) {
      res.status(400).send({
        error: e,
        status: 400,
      });
    }
  };

  getUserFrom = async (req: Request, res: Response, next: NextFunction) => {
    const email: string = String(req.query["email"]);
    const username: string = String(req.query["username"]);
    let user;

    try {
      if (email) {
        user = await this.prisma.user.findFirst({
          where: {
            email: email,
          },
        });
      } else if (username) {
        user = await this.prisma.user.findFirst({
          where: {
            username: username,
          },
        });
      }
    } catch (e) {
      res.status(400).send({
        error: e,
        status: 400,
      });
    }
    res.status(200).send(user as User);

    next();
  };

  update = async (req: Request, res: Response) => {
    const userBody = req.body;
    let updatedUser;
    try {
      updatedUser = await this.prisma.user.update({
        where: {
          id: res.locals.user.id,
        },
        data: userBody,
      });
    } catch (e) {
      res.status(400).send({
        error: e,
        status: 400,
      });
    }
    res.status(201).send(updatedUser);
  };

  delete = async (req: Request, res: Response) => {
    const userId = req.query.id as string;
    let user;

    try {
      user = await this.prisma.user.delete({
        where: {
          id: userId,
        },
      });
    } catch (e) {
      res.status(400).send({
        error: e,
        status: 400,
      });
      return;
    }

    res.status(204).send(user);
  };
}

export default UserController;
