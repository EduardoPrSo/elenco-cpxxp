import { NextResponse } from "next/server";
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
