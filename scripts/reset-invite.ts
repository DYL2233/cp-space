import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  // View current state
  const codes = await p.inviteCode.findMany();
  console.log("当前邀请码状态:");
  codes.forEach((c) =>
    console.log(`  ${c.code} — 已用 ${c.usedCount}/${c.maxUses}，活跃: ${c.isActive}`)
  );

  // Reset all existing codes
  for (const c of codes) {
    await p.inviteCode.update({
      where: { id: c.id },
      data: { usedCount: 0, isActive: true },
    });
    console.log(`  ✅ 重置 ${c.code}`);
  }

  // Also create a fresh backup code
  await p.inviteCode.create({
    data: { code: "LOVESPACE2024", maxUses: 2, usedCount: 0, isActive: true },
  });
  console.log(`  ✨ 创建新邀请码: LOVESPACE2024`);

  console.log("\n现在可用的邀请码:");
  const all = await p.inviteCode.findMany({ where: { isActive: true } });
  all.forEach((c) =>
    console.log(`  🎫 ${c.code}（剩余 ${c.maxUses - c.usedCount} 次）`)
  );

  await p.$disconnect();
}

main().catch(console.error);
