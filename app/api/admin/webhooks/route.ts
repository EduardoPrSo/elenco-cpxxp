import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

// GET - Listar todos os webhooks
export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(["ADMIN"]);
    
    const webhooks = await prisma.webhook.findMany({
      orderBy: { createdAt: "desc" },
    });
    
    return NextResponse.json(webhooks);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

// POST - Criar novo webhook
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(["ADMIN"]);
    const body = await req.json();
    const { name, url } = body;
    
    if (!name || !url) {
      return NextResponse.json(
        { error: "Nome e URL são obrigatórios" },
        { status: 400 }
      );
    }
    
    // Validar se a URL é válida
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "URL inválida" },
        { status: 400 }
      );
    }
    
    const webhook = await prisma.webhook.create({
      data: {
        name,
        url,
      },
    });
    
    return NextResponse.json(webhook);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

// PATCH - Atualizar webhook
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireRole(["ADMIN"]);
    const body = await req.json();
    const { id, name, url, isActive } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: "ID é obrigatório" },
        { status: 400 }
      );
    }
    
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (url !== undefined) {
      // Validar URL se fornecida
      try {
        new URL(url);
        updateData.url = url;
      } catch {
        return NextResponse.json(
          { error: "URL inválida" },
          { status: 400 }
        );
      }
    }
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const webhook = await prisma.webhook.update({
      where: { id },
      data: updateData,
    });
    
    return NextResponse.json(webhook);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

// DELETE - Deletar webhook
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireRole(["ADMIN"]);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "ID é obrigatório" },
        { status: 400 }
      );
    }
    
    await prisma.webhook.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
