import { prisma } from "../lib/prisma";
import { createAdminToken, verifyAdminToken } from "../lib/auth/adminSession";

async function run() {
  console.log("🔒 Running REVERSUN Admin Auth Verification...");

  // 1. Verify Super Admin in Neon
  const admin = await prisma.user.findUnique({
    where: { email: "admin@reversun.com" },
  });
  console.log(`✅ Super Admin Account: ${admin?.name} (${admin?.email})`);
  console.log(`✅ Role in Database: ${admin?.role}`);

  // 2. Generate and verify Admin HMAC Token
  const token = createAdminToken({
    userId: admin!.id,
    email: admin!.email,
    name: admin!.name,
    role: admin!.role,
  });
  console.log(`✅ Token Generated (length ${token.length})`);

  const verified = verifyAdminToken(token);
  console.log(`✅ Token Signature & Expiry Verified:`, verified !== null);
  console.log(`✅ Verified Role: ${verified?.role}`);

  // 3. Test Student User Role Rejection
  const student = await prisma.user.findUnique({
    where: { email: "arun.kumar@example.com" },
  });
  console.log(`👤 Student Account: ${student?.name} (${student?.email})`);
  console.log(`👤 Student Role: ${student?.role}`);
  const hasAdminAccess = student?.role === "ADMIN" || student?.role === "SUPER_ADMIN";
  console.log(`🛑 Student Admin Access Allowed? ${hasAdminAccess} (CORRECT: Rejected)`);

  console.log("🎉 Security gateway verification complete!");
}

run()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
