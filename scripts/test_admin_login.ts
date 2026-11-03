import { prisma } from "../lib/prisma";
import { verifyPassword } from "../lib/auth/password";
import { createAdminToken } from "../lib/auth/adminSession";

async function testLogin() {
  const email = "admin@reversun.com";
  const password = "admin@12345";

  console.log(`Testing login for: ${email}`);

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("User not found in database");
  }

  console.log(`User found: ${user.name}, Role: ${user.role}, IsActive: ${user.isActive}`);

  if (!user.passwordHash) {
    throw new Error("No passwordHash found on user record");
  }

  const isValid = verifyPassword(password, user.passwordHash);
  console.log(`Password verification result for '${password}': ${isValid ? "PASSED ✅" : "FAILED ❌"}`);

  if (!isValid) {
    throw new Error("Password did not match");
  }

  const token = createAdminToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  console.log("Session token created successfully:", token.slice(0, 30) + "...");
  console.log("🎉 Admin credentials 'admin@reversun.com' with 'admin@12345' are 100% verified!");
}

testLogin()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
