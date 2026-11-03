import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/auth/password";

async function main() {
  const email = "admin@reversun.com";
  const password = "admin@12345";
  const passwordHash = hashPassword(password);

  console.log(`Setting up administrator: ${email}`);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: "SUPER_ADMIN",
      isActive: true,
      name: "REVERSUN Administrator",
      displayName: "ReversunAdmin",
    },
    create: {
      firebaseUid: "admin_reversun_default_uid",
      email,
      name: "REVERSUN Administrator",
      displayName: "ReversunAdmin",
      role: "SUPER_ADMIN",
      isActive: true,
      passwordHash,
      bio: "Official administrator of REVERSUN Quizzes, Leaderboards, and Competitions.",
    },
  });

  console.log("✅ Successfully created/updated admin account in database:");
  console.log({
    id: user.id,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    passwordHashConfigured: Boolean(user.passwordHash),
  });
}

main()
  .catch((err) => {
    console.error("❌ Error setting up admin user:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
