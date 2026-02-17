import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { Role } from "@/types/prisma";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Não autenticado");
  }
  return user;
}

export async function requireRole(allowedRoles: Role[]) {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Sem permissão");
  }
  return user;
}

export async function isAdmin() {
  const user = await getCurrentUser();
  return user?.role === Role.ADMIN;
}

export async function isReaderOrAdmin() {
  const user = await getCurrentUser();
  return user?.role === Role.READER || user?.role === Role.ADMIN;
}
