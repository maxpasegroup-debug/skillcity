import type { AIConversationScope } from "@prisma/client";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getCurrentUser } from "@/server/auth/session";
import { buildTaraContext } from "@/server/ai/context";
import { getConversationMessages, getOrCreateConversation, saveMessage } from "@/server/ai/memory";
import { ensurePromptTemplates } from "@/server/ai/prompts";
import { generateTaraResponse, logTaraUsage } from "@/server/ai/tara";
import { summarizeContextTools } from "@/server/ai/tools";

type TaraRequest = {
  conversationId?: string;
  message: string;
  scope: AIConversationScope;
  templateKey?: string;
};

function chunkText(text: string) {
  const chunks = text.match(/.{1,18}(\s|$)/g);
  return chunks && chunks.length > 0 ? chunks : [text];
}

function canUseScope(roles: string[], scope: AIConversationScope) {
  if (scope === "DIRECTOR") return roles.includes("Director") || roles.includes("Admin");
  if (scope === "TRAINER") return roles.includes("Trainer") || roles.includes("Director") || roles.includes("Admin");
  if (scope === "ADMISSION") return roles.includes("Admission") || roles.includes("Director") || roles.includes("Admin");
  if (scope === "BDM") return roles.includes("Business Development") || roles.includes("Director") || roles.includes("Admin");
  return true;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as TaraRequest;
  if (!body.message?.trim() || !["STUDENT", "DIRECTOR", "TRAINER", "ADMISSION", "BDM"].includes(body.scope)) {
    return NextResponse.json({ error: "Invalid Tara request" }, { status: 400 });
  }

  const roles = user.roles.map((item) => item.role.name);
  if (!canUseScope(roles, body.scope)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limited = checkRateLimit(`tara:${user.id}`, 12, 60_000);
  if (!limited.allowed) {
    return NextResponse.json({ error: "Tara is receiving too many requests. Please wait a minute." }, { status: 429 });
  }

  await ensurePromptTemplates();
  const context = await buildTaraContext(user.id, body.scope);
  const conversation = await getOrCreateConversation({
    conversationId: body.conversationId,
    userId: user.id,
    scope: body.scope,
    context,
    title: body.message.slice(0, 80)
  });
  const priorMessages = await getConversationMessages(conversation.id);
  await saveMessage({
    conversationId: conversation.id,
    userId: user.id,
    role: "USER",
    content: body.message,
    metadata: { tools: summarizeContextTools(context) }
  });

  const response = await generateTaraResponse({
    context,
    messages: priorMessages,
    userMessage: body.message,
    templateKey: body.templateKey
  });
  const assistantMessage = await saveMessage({
    conversationId: conversation.id,
    role: "ASSISTANT",
    content: response.content,
    metadata: { provider: response.provider, model: response.model }
  });
  await logTaraUsage({ userId: user.id, conversationId: conversation.id, response });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`event: meta\ndata: ${JSON.stringify({ conversationId: conversation.id, messageId: assistantMessage.id })}\n\n`));
      for (const chunk of chunkText(response.content)) {
        controller.enqueue(encoder.encode(`event: token\ndata: ${JSON.stringify({ token: chunk })}\n\n`));
        await new Promise((resolve) => setTimeout(resolve, 8));
      }
      controller.enqueue(encoder.encode("event: done\ndata: {}\n\n"));
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
