import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// Submeter respostas do formulário
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    
    const { responses } = await request.json();
    
    if (!responses || !Array.isArray(responses)) {
      return NextResponse.json(
        { error: "responses deve ser um array" },
        { status: 400 }
      );
    }
    
    // Deletar respostas anteriores do usuário
    await prisma.formResponse.deleteMany({
      where: { userId: user.id },
    });
    
    // Criar novas respostas
    const createdResponses = await prisma.formResponse.createMany({
      data: responses.map((r: { questionId: string; answer: string }) => ({
        userId: user.id,
        questionId: r.questionId,
        answer: r.answer,
      })),
    });
    
    // Buscar webhooks ativos
    const webhooks = await prisma.webhook.findMany({
      where: { isActive: true },
    });
    
    // Se houver webhooks, buscar as perguntas com as respostas para enviar
    if (webhooks.length > 0) {
      const questionsWithAnswers = await prisma.formResponse.findMany({
        where: { userId: user.id },
        include: {
          question: true,
        },
      });
      
      // Criar embed para Discord
      const embed = {
        title: "📝 Novo Formulário Recebido",
        color: 0x5865F2, // Azul Discord
        fields: questionsWithAnswers.map((qa) => ({
          name: qa.question.question,
          value: qa.answer || "_(não respondido)_",
          inline: false,
        })),
        footer: {
          text: `Enviado por ${user.name} (${user.discordId})`,
        },
        timestamp: new Date().toISOString(),
      };
      
      // Enviar para todos os webhooks ativos
      const webhookPromises = webhooks.map(async (webhook) => {
        try {
          const response = await fetch(webhook.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: 'Projetos CPX XP',
              embeds: [embed],
            }),
          });
          
          if (!response.ok) {
            console.error(`Erro ao enviar para webhook ${webhook.name}:`, await response.text());
          }
        } catch (error) {
          console.error(`Erro ao enviar para webhook ${webhook.name}:`, error);
        }
      });
      
      // Executar todas as chamadas aos webhooks em paralelo (sem aguardar)
      Promise.all(webhookPromises).catch(console.error);
    }
    
    return NextResponse.json({ 
      success: true, 
      count: createdResponses.count 
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao enviar respostas" },
      { status: 500 }
    );
  }
}

// Buscar respostas do usuário atual
export async function GET() {
  try {
    const user = await requireAuth();
    
    const responses = await prisma.formResponse.findMany({
      where: { userId: user.id },
      include: {
        question: {
          include: {
            options: true,
          },
        },
      },
    });
    
    return NextResponse.json(responses);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao buscar respostas" },
      { status: 500 }
    );
  }
}
