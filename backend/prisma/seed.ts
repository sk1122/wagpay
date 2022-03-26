import { PrismaClient } from "@prisma/client";
import pages from "./../data/pages";
import products from "./../data/products";
import submission from "./../data/submission";
import users from "./../data/users";

const prisma = new PrismaClient();

async function main() {
  // await prisma.user.createMany({
  //   data: users,
  // });

  await prisma.pages.createMany({
    data: pages,
  });

  await prisma.product.createMany({
    data: products,
  });

  await prisma.submission.createMany({
    data: submission,
  });
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
