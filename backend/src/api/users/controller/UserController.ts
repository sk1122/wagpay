import { NextFunction, Request, Response } from "express";

import { PrismaClient } from "@prisma/client";

class UserController {
  prisma = new PrismaClient();

  get = async (req: Request, res: Response) => {
    res.status(200).send(res.locals.user);
  };
  getUser = async (req: Request, res: Response) => {
    let userId: any = req.params.id;
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
    try {
      let user = await this.prisma.user.create({
        data: userData,
      });
      console.log(user);
      res.status(200).send(user);
    } catch (e) {
      res.status(400).send({
        error: e,
        status: 400,
      });
    }
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
      res.status(201).send(updatedUser);
    } catch (e) {
      res.status(400).send({
        error: e,
        status: 400,
      });
    }
  };

  delete = async (req: Request, res: Response) => {
    const userId: any = req.query.id as string;

    try {
      await this.prisma.user.delete({
        where: {
          id: userId,
        },
      });
      res.status(204).send({
        data: "user deleted",
      });
    } catch (e) {
      res.status(400).send({
        error: e,
        status: 400,
      });
    }
  };
}

export default UserController;
