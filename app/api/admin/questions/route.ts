import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { Role } from "@/types/prisma";

// Listar todas as perguntas
export async function GET() {
  try {
    const questions = await prisma.formQuestion.findMany({
      include: {
        options: true,
      },
      orderBy: {
        order: "asc",
      },
    });
    
    return NextResponse.json(questions);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar perguntas" },
      { status: 500 }
    );
  }
}

// Criar nova pergunta
export async function POST(request: NextRequest) {
  try {
    await requireRole([Role.ADMIN]);
    
    const { question, type, required, options } = await request.json();
    
    if (!question || !type) {
      return NextResponse.json(
        { error: "question e type são obrigatórios" },
        { status: 400 }
      );
    }
    
    // Pegar o maior order atual
    const maxOrder = await prisma.formQuestion.findFirst({
      orderBy: { order: "desc" },
      select: { order: true },
    });
    
    const newQuestion = await prisma.formQuestion.create({
      data: {
        question,
        type,
        required: required ?? true,
        order: (maxOrder?.order ?? 0) + 1,
        options: options ? {
          create: options.map((opt: { value: string; label: string }) => ({
            value: opt.value,
            label: opt.label,
          })),
        } : undefined,
      },
      include: {
        options: true,
      },
    });
    
    return NextResponse.json(newQuestion);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao criar pergunta" },
      { status: 500 }
    );
  }
}

// Atualizar pergunta
export async function PATCH(request: NextRequest) {
  try {
    await requireRole([Role.ADMIN]);
    
    const { id, question, type, required, options } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: "id é obrigatório" },
        { status: 400 }
      );
    }
    
    // Deletar opções antigas se existirem
    await prisma.questionOption.deleteMany({
      where: { questionId: id },
    });
    
    const updatedQuestion = await prisma.formQuestion.update({
      where: { id },
      data: {
        question,
        type,
        required,
        options: options ? {
          create: options.map((opt: { value: string; label: string }) => ({
            value: opt.value,
            label: opt.label,
          })),
        } : undefined,
      },
      include: {
        options: true,
      },
    });
    
    return NextResponse.json(updatedQuestion);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao atualizar pergunta" },
      { status: 500 }
    );
  }
}

// Deletar pergunta
export async function DELETE(request: NextRequest) {
  try {
    await requireRole([Role.ADMIN]);
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "id é obrigatório" },
        { status: 400 }
      );
    }
    
    await prisma.formQuestion.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao deletar pergunta" },
      { status: 500 }
    );
  }
}
