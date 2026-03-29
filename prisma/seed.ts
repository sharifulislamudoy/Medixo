import "dotenv/config";
import { PrismaClient, Role, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();   // 🔥 NO OPTIONS HERE

async function main() {
  const hashedPassword = await bcrypt.hash("medixoadmin", 10);

  await prisma.user.upsert({
    where: { email: "admin@medixo.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@medixo.com",
      phone: "01995322033",
      password: hashedPassword,
      address: "Head Office",
      role: Role.ADMIN,
      status: UserStatus.APPROVED,
      shopName: "Medixo"
    },
  });

  console.log("✅ Admin created successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });