import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  // Clean all test users and data
  await p.todo.deleteMany();
  await p.wishItem.deleteMany();
  await p.user.deleteMany();

  // Delete all old invite codes and create fresh ones
  await p.inviteCode.deleteMany();
  await p.inviteCode.create({
    data: { code: "COUPLE2024", maxUses: 2, usedCount: 0, isActive: true },
  });
  await p.inviteCode.create({
    data: { code: "LOVESPACE2024", maxUses: 2, usedCount: 0, isActive: true },
  });

  console.log("\n✅ 数据库已重置，所有测试数据已清理\n");
  console.log("📨 可用邀请码（分享给你对象）：\n");
  console.log("   COUPLE2024  （可用 2 次）");
  console.log("   LOVESPACE2024 （可用 2 次）\n");

  await p.$disconnect();
}

main().catch(console.error);
