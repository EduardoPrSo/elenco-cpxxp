import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { Role } from "@/types/prisma";

// Listar todas as respostas (apenas READER e ADMIN)
export async function GET() {
  try {
    await requireRole([Role.READER, Role.ADMIN]);
    
    const responses = await prisma.formResponse.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            discordId: true,
            image: true,
          },
        },
        question: {
          include: {
            options: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    // Agrupar por usuário
    const groupedByUser = responses.reduce((acc: Record<string, any>, response: any) => {
      if (!acc[response.userId]) {
        acc[response.userId] = {
          user: response.user,
          responses: [],
          submittedAt: response.createdAt,
        };
      }
      acc[response.userId].responses.push({
        question: response.question,
        answer: response.answer,
      });
      return acc;
    }, {} as Record<string, any>);
    
    return NextResponse.json(Object.values(groupedByUser));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao buscar respostas" },
      { status: error instanceof Error && error.message === "Sem permissão" ? 403 : 500 }
    );
  }
}

// Deletar respostas de um usuário (apenas ADMIN)
export async function DELETE(request: NextRequest) {
  try {
    await requireRole([Role.ADMIN]);
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      );
    }
    
    await prisma.formResponse.deleteMany({
      where: { userId },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao deletar respostas" },
      { status: error instanceof Error && error.message === "Sem permissão" ? 403 : 500 }
    );
  }
}
