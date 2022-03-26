import { Request, Response } from "express";
import { definitions } from "../../../types";
import { PrismaClient } from "@prisma/client";
import { supabase } from "./../../../client";

class StoreController {
  prisma = new PrismaClient();

  getStore = async (req: Request, res: Response) => {
    let store_id = req.params["id"];

    const { data, error } = await supabase
      .from("Store")
      .select("*")
      .eq("user", res.locals.user[0].id)
      .eq("id", store_id);

    if (error || data?.length === 0) {
      res.status(400).send("User was not created " + JSON.stringify(error));
      return;
    }

    res.status(200).send(data);
  };
}

export default StoreController;
