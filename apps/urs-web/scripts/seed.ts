import bcrypt from "bcryptjs";
import prisma from "@investment/urs";

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 10);

  const user = await prisma.users.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      email: "admin@example.com",
      name: "Administrator",
      password: hashedPassword,
      is_active: true,
    },
  });

  console.log("Created/Updated user:", user);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
