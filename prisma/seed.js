const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  // Create initial invite code
  const inviteCode = await prisma.inviteCode.upsert({
    where: { code: "COUPLE2024" },
    update: {},
    create: {
      code: "COUPLE2024",
      maxUses: 2,
      usedCount: 0,
      isActive: true,
    },
  });

  console.log(`\n📨 Invite code: ${inviteCode.code} (uses: ${inviteCode.usedCount}/${inviteCode.maxUses})`);
  console.log(`\nShare this code with your partner to register!\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
