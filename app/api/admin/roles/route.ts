import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-utils";
import { Role } from "@/types/prisma";
import { prisma } from "@/lib/prisma";

// GET - Listar todas as roles pré-configuradas e usuários existentes
export async function GET(req: NextRequest) {
  try {
    const user = await requireRole([Role.ADMIN]);
    if (!user) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Buscar roles pré-configuradas
    const preConfiguredRoles = await prisma.preConfiguredRole.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Buscar usuários existentes
    const users = await prisma.user.findMany({
      select: {
        id: true,
        discordId: true,
        role: true,
        createdAt: true,
        name: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      preConfiguredRoles,
      users,
    });
  } catch (error) {
    console.error("Erro ao buscar roles:", error);
    return NextResponse.json(
      { error: "Erro ao buscar roles" },
      { status: 500 }
    );
  }
}

// POST - Criar nova role pré-configurada
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole([Role.ADMIN]);
    if (!user) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { discordId, role } = await req.json();

    if (!discordId || !role) {
      return NextResponse.json(
        { error: "Discord ID e role são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se já existe um usuário cadastrado com esse Discord ID
    const existingUser = await prisma.user.findUnique({
      where: { discordId },
    });

    if (existingUser) {
      // Se o usuário já existe, atualizar a role dele
      const updatedUser = await prisma.user.update({
        where: { discordId },
        data: { role },
      });

      return NextResponse.json({
        type: "user",
        data: updatedUser,
        message: "Role do usuário existente atualizada",
      });
    }

    // Se não existe usuário, criar uma role pré-configurada
    const preConfiguredRole = await prisma.preConfiguredRole.upsert({
      where: { discordId },
      create: {
        discordId,
        role,
      },
      update: {
        role,
      },
    });

    return NextResponse.json({
      type: "preconfigured",
      data: preConfiguredRole,
      message: "Role pré-configurada criada",
    });
  } catch (error) {
    console.error("Erro ao criar role:", error);
    return NextResponse.json(
      { error: "Erro ao criar role" },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar role de usuário ou role pré-configurada
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireRole([Role.ADMIN]);
    if (!user) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { id, role, type } = await req.json();

    if (!id || !role) {
      return NextResponse.json(
        { error: "ID e role são obrigatórios" },
        { status: 400 }
      );
    }

    if (type === "user") {
      // Atualizar role de usuário cadastrado
      const updatedUser = await prisma.user.update({
        where: { id },
        data: { role },
      });

      return NextResponse.json({
        message: "Role do usuário atualizada",
        data: updatedUser,
      });
    } else if (type === "preconfigured") {
      // Atualizar role pré-configurada
      const updatedRole = await prisma.preConfiguredRole.update({
        where: { id },
        data: { role },
      });

      return NextResponse.json({
        message: "Role pré-configurada atualizada",
        data: updatedRole,
      });
    }

    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  } catch (error) {
    console.error("Erro ao atualizar role:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar role" },
      { status: 500 }
    );
  }
}

// DELETE - Remover role pré-configurada
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireRole([Role.ADMIN]);
    if (!user) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    await prisma.preConfiguredRole.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Role pré-configurada removida",
    });
  } catch (error) {
    console.error("Erro ao remover role:", error);
    return NextResponse.json(
      { error: "Erro ao remover role" },
      { status: 500 }
    );
  }
}
