import { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { Adapter } from "next-auth/adapters";
import { Role } from "@/types/prisma";

// Custom adapter que previne duplicação de usuários
function CustomPrismaAdapter(p: typeof prisma): Adapter {
  const baseAdapter = PrismaAdapter(p) as Adapter;
  
  return {
    ...baseAdapter,
    async createUser(user) {
      // Verificar se já existe um usuário com este discordId
      if (user.discordId) {
        const existingUser = await p.user.findUnique({
          where: { discordId: user.discordId as string },
        });
        
        if (existingUser) {
          // Atualizar o usuário existente ao invés de criar um novo
          return await p.user.update({
            where: { id: existingUser.id },
            data: {
              name: user.name,
              email: user.email,
              image: user.image,
              emailVerified: user.emailVerified,
            },
          }) as any;
        }
      }
      
      // Se não existir, criar normalmente
      return baseAdapter.createUser!(user);
    },
    async linkAccount(account) {
      // Verificar se já existe um usuário com este discordId (do providerAccountId)
      if (account.provider === 'discord') {
        const existingUser = await p.user.findUnique({
          where: { discordId: account.providerAccountId },
        });
        
        if (existingUser) {
          // Vincular a conta ao usuário existente
          account.userId = existingUser.id;
          
          // Verificar e aplicar role pré-configurada se existir
          const preConfiguredRole = await p.preConfiguredRole.findUnique({
            where: { discordId: account.providerAccountId },
          });
          
          if (preConfiguredRole) {
            await p.user.update({
              where: { id: existingUser.id },
              data: { role: preConfiguredRole.role },
            });
            
            await p.preConfiguredRole.delete({
              where: { discordId: account.providerAccountId },
            });
          }
        }
      }
      
      return baseAdapter.linkAccount!(account);
    },
  };
}

export const authOptions: NextAuthOptions = {
  adapter: CustomPrismaAdapter(prisma),
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.id,
          name: profile.username,
          email: profile.email,
          image: profile.avatar
            ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
            : null,
          discordId: profile.id,
          role: Role.USER,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        
        // Buscar o usuário no banco para pegar a role e discordId
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, discordId: true },
        });
        
        if (dbUser) {
          session.user.role = dbUser.role;
          session.user.discordId = dbUser.discordId;
          
          // Se o usuário não tem role definida ou é USER, verificar se é admin
          if (!dbUser.role || dbUser.role === Role.USER) {
            const adminIds = process.env.ADMIN_DISCORD_IDS?.split(',').map(id => id.trim()) || [];
            if (adminIds.includes(dbUser.discordId)) {
              // Promover para admin
              await prisma.user.update({
                where: { id: user.id },
                data: { role: Role.ADMIN },
              });
              session.user.role = Role.ADMIN;
            }
          }
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "database",
  },
  events: {
    async createUser({ user }) {
      // Garantir que o discordId seja salvo
      const accounts = await prisma.account.findMany({
        where: { userId: user.id },
      });
      
      const discordAccount = accounts.find((acc: any) => acc.provider === 'discord');
      
      if (discordAccount) {
        const discordId = discordAccount.providerAccountId;
        
        // Verificar se existe uma role pré-configurada
        const preConfiguredRole = await prisma.preConfiguredRole.findUnique({
          where: { discordId },
        });
        
        let role: Role = Role.USER;
        
        // Primeira prioridade: role pré-configurada
        if (preConfiguredRole) {
          role = preConfiguredRole.role;
          // Remover a role pré-configurada após usar
          await prisma.preConfiguredRole.delete({
            where: { discordId },
          });
        } else {
          // Segunda prioridade: verificar se está na lista de admin IDs do .env
          const adminIds = process.env.ADMIN_DISCORD_IDS?.split(',').map(id => id.trim()) || [];
          if (adminIds.includes(discordId)) {
            role = Role.ADMIN;
          }
        }
        
        await prisma.user.update({
          where: { id: user.id },
          data: {
            discordId,
            role,
          },
        });
      }
    },
  },
};
