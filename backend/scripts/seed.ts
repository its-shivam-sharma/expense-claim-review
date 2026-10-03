import { prisma } from "../src/lib/prisma.js";

async function main() {
  const existingPolicy = await prisma.policy.findFirst({
    where: {
      category: "Meals",
    },
  });

  if (existingPolicy) {
    await prisma.policy.update({
      where: {
        id: existingPolicy.id,
      },
      data: {
        name: "Meals Policy",
        category: "Meals",
        content:
          "Employee meals with clients are reimbursable up to the configured limit. Receipt is required.",
        categoryLimit: 2000,
        currency: "INR",
      },
    });

    console.log("Meals Policy updated.");
  } else {
    await prisma.policy.create({
      data: {
        name: "Meals Policy",
        category: "Meals",
        content:
          "Employee meals with clients are reimbursable up to the configured limit. Receipt is required.",
        categoryLimit: 2000,
        currency: "INR",
      },
    });

    console.log("Meals Policy created.");
  }
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });