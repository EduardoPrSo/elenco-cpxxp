import { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { Adapter } from "next-auth/adapters";
import { Role } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
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
          role: 'USER',
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
          if (!dbUser.role || dbUser.role === 'USER') {
            const adminIds = process.env.ADMIN_DISCORD_IDS?.split(',').map(id => id.trim()) || [];
            if (adminIds.includes(dbUser.discordId)) {
              // Promover para admin
              await prisma.user.update({
                where: { id: user.id },
                data: { role: 'ADMIN' },
              });
              session.user.role = 'ADMIN';
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
      
      const discordAccount = accounts.find(acc => acc.provider === 'discord');
      
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
