import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { Role } from "@/types/prisma";

// Obter configurações do formulário
export async function GET() {
  try {
    const settings = await prisma.formSettings.findMany();
    
    // Converter array para objeto chave-valor
    const settingsObj = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);
    
    // Se não houver configuração de texto, retornar o texto padrão
    if (!settingsObj.formIntroText) {
      settingsObj.formIntroText = `Este formulário tem como objetivo cadastrar e avaliar projetos de grupos ilegais para atuação dentro do servidor CPX XP. Para que a proposta seja considerada, é necessário que o grupo tenha no mínimo 20 membros ativos, e que o LÍDER possua idade mínima de 18 anos.

👉 Projetos voltados para RESTAURANTES deverão contar com no mínimo 5 integrantes, e o projeto deverá apresentar toda a estrutura do restaurante, incluindo organização interna, funcionamento, cargos/funções, proposta temática e forma de atuação dentro do servidor.

O projeto deverá ser enviado obrigatoriamente em Google Docs, sendo aceitos apenas links com acesso liberado para visualização pela equipe do elenco. Outros formatos de envio não serão considerados.

A aprovação deste formulário não garante o ingresso direto como facção oficial no servidor. Caso o projeto seja aprovado na análise inicial, o grupo deverá obrigatoriamente passar pelo processo da Pista, onde será avaliado dentro do jogo antes de qualquer possível oficialização.

Agradecemos o interesse e desejamos boa sorte no processo.

Att,
Equipe do Elenco CPX XP`;
    }
    
    return NextResponse.json(settingsObj);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar configurações" },
      { status: 500 }
    );
  }
}

// Atualizar configurações (apenas ADMIN)
export async function PATCH(request: NextRequest) {
  try {
    await requireRole([Role.ADMIN]);
    
    const { key, value } = await request.json();
    
    if (!key || value === undefined) {
      return NextResponse.json(
        { error: "key e value são obrigatórios" },
        { status: 400 }
      );
    }
    
    const setting = await prisma.formSettings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    
    return NextResponse.json(setting);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao atualizar configuração" },
      { status: error instanceof Error && error.message === "Sem permissão" ? 403 : 500 }
    );
  }
}
