import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";

// Listar todos os usuários
export async function GET() {
  try {
    await requireRole(["ADMIN"]);
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        discordId: true,
        role: true,
        email: true,
        image: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao buscar usuários" },
      { status: error instanceof Error && error.message === "Sem permissão" ? 403 : 500 }
    );
  }
}

// Atualizar role de um usuário
export async function PATCH(request: NextRequest) {
  try {
    await requireRole(["ADMIN"]);
    
    const { userId, role } = await request.json();
    
    if (!userId || !role) {
      return NextResponse.json(
        { error: "userId e role são obrigatórios" },
        { status: 400 }
      );
    }
    
    if (!["USER", "READER", "ADMIN"].includes(role)) {
      return NextResponse.json(
        { error: "Role inválida" },
        { status: 400 }
      );
    }
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        discordId: true,
        role: true,
      },
    });
    
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao atualizar usuário" },
      { status: 500 }
    );
  }
}
