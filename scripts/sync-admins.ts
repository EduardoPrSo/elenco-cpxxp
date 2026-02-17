import "dotenv/config";
import { prisma } from "../lib/prisma.js";

async function syncAdmins() {
  const adminIds = process.env.ADMIN_DISCORD_IDS?.split(",").map((id) => id.trim()) || [];
  
  if (adminIds.length === 0) {
    console.log("❌ Nenhum Discord ID configurado em ADMIN_DISCORD_IDS");
    return;
  }
  
  console.log(`🔍 Procurando usuários com os seguintes Discord IDs: ${adminIds.join(", ")}`);
  
  // Atualizar usuários que devem ser admins
  const result = await prisma.user.updateMany({
    where: {
      discordId: {
        in: adminIds,
      },
    },
    data: {
      role: "ADMIN",
    },
  });
  
  console.log(`✅ ${result.count} usuário(s) promovido(s) a ADMIN`);
  
  // Listar todos os admins atuais
  const admins = await prisma.user.findMany({
    where: {
      role: "ADMIN",
    },
    select: {
      name: true,
      discordId: true,
      email: true,
    },
  });
  
  console.log("\n📋 Admins atuais no banco:");
  admins.forEach((admin) => {
    console.log(`  - ${admin.name} (${admin.discordId})`);
  });
  
  // Avisar sobre IDs que não foram encontrados
  const foundIds = admins.map(a => a.discordId);
  const missingIds = adminIds.filter(id => !foundIds.includes(id));
  
  if (missingIds.length > 0) {
    console.log("\n⚠️  Os seguintes Discord IDs não foram encontrados no banco:");
    console.log("   Esses usuários se tornarão admins automaticamente quando fizerem login.");
    missingIds.forEach(id => console.log(`  - ${id}`));
  }
}

syncAdmins()
  .catch((e) => {
    console.error("❌ Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
