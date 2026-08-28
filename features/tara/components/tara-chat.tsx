"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { AIConversationScope, AIMessageRole } from "@prisma/client";
import { Paperclip, RefreshCw, Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarkdownMessage } from "./markdown-message";
import { TaraFeedbackForm } from "./tara-feedback-form";

type Conversation = {
  id: string;
  title: string;
  messages: Array<{ id: string; role: AIMessageRole; content: string; createdAt: Date }>;
};

type ClientMessage = {
  id: string;
  role: AIMessageRole;
  content: string;
  createdAt: Date;
};

export function TaraChat({
  scope,
  suggestions,
  conversations,
  title,
  subtitle,
  templateKey
}: {
  scope: AIConversationScope;
  suggestions: string[];
  conversations: Conversation[];
  title: string;
  subtitle: string;
  templateKey?: string;
}) {
  const [conversationId, setConversationId] = useState(conversations[0]?.id);
  const [messages, setMessages] = useState<ClientMessage[]>(conversations[0]?.messages ?? []);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [currentAssistantId, setCurrentAssistantId] = useState<string>();
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const lastUserMessage = useMemo(() => [...messages].reverse().find((message) => message.role === "USER")?.content, [messages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  async function sendMessage(message: string) {
    if (!message.trim() || streaming) return;
    const localUserMessage: ClientMessage = { id: crypto.randomUUID(), role: "USER", content: message, createdAt: new Date() };
    const localAssistantId = crypto.randomUUID();
    setMessages((value) => [...value, localUserMessage, { id: localAssistantId, role: "ASSISTANT", content: "", createdAt: new Date() }]);
    setInput("");
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;
    const response = await fetch("/api/tara/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, message, scope, templateKey }),
      signal: controller.signal
    });

    if (!response.ok || !response.body) {
      setMessages((value) => value.map((item) => item.id === localAssistantId ? { ...item, content: "Tara could not respond. Please try again." } : item));
      setStreaming(false);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";
      for (const event of events) {
        const eventName = event.split("\n").find((line) => line.startsWith("event:"))?.replace("event:", "").trim();
        const dataLine = event.split("\n").find((line) => line.startsWith("data:"))?.replace("data:", "").trim();
        if (!dataLine) continue;
        const data = JSON.parse(dataLine) as { token?: string; conversationId?: string; messageId?: string };
        if (eventName === "meta") {
          if (data.conversationId) setConversationId(data.conversationId);
          setCurrentAssistantId(data.messageId);
        }
        if (eventName === "token" && data.token) {
          setMessages((value) => value.map((item) => item.id === localAssistantId ? { ...item, content: item.content + data.token } : item));
        }
      }
    }
    setStreaming(false);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <div className="grid min-h-[calc(100vh-80px)] gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="hidden rounded-lg bg-brand-card p-4 lg:block">
        <h2 className="text-lg font-black text-brand-dark">Conversations</h2>
        <div className="mt-4 space-y-2">
          {conversations.length === 0 ? <p className="text-sm font-semibold text-brand-muted">No conversations yet.</p> : conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              className="w-full rounded-lg bg-white px-4 py-3 text-left text-sm font-bold text-brand-muted transition hover:text-brand-red"
              onClick={() => {
                setConversationId(conversation.id);
                setMessages(conversation.messages);
              }}
            >
              {conversation.title}
            </button>
          ))}
        </div>
      </aside>

      <section className="flex min-h-[calc(100vh-80px)] flex-col rounded-lg bg-brand-card">
        <div className="border-b border-black/5 p-5 md:p-6">
          <p className="text-sm font-black uppercase tracking-normal text-brand-red">Tara AI</p>
          <h1 className="mt-2 text-3xl font-black text-brand-dark md:text-4xl">{title}</h1>
          <p className="mt-2 text-base leading-7 text-brand-muted">{subtitle}</p>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5 md:p-6">
          {messages.length === 0 ? (
            <div className="grid h-full place-items-center">
              <div className="max-w-3xl text-center">
                <h2 className="text-3xl font-black text-brand-dark">Ask Tara anything about your Skill City work.</h2>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {suggestions.map((suggestion) => (
                    <button key={suggestion} type="button" onClick={() => void sendMessage(suggestion)} className="rounded-lg bg-white px-5 py-4 text-left font-bold text-brand-muted transition hover:text-brand-red">
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "USER" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[850px] rounded-lg px-5 py-4 ${message.role === "USER" ? "bg-brand-red text-white" : "bg-white text-brand-dark"}`}>
                {message.role === "USER" ? <p className="whitespace-pre-wrap text-base leading-8">{message.content}</p> : <MarkdownMessage content={message.content || "Tara is thinking..."} />}
                {message.role === "ASSISTANT" && conversationId && (currentAssistantId || message.id) ? <TaraFeedbackForm conversationId={conversationId} messageId={currentAssistantId ?? message.id} /> : null}
              </div>
            </div>
          ))}
          {streaming ? <p className="text-sm font-bold text-brand-muted">Tara is typing...</p> : null}
          <div ref={endRef} />
        </div>

        <Card className="rounded-none border-t border-black/5 bg-white shadow-none">
          <CardContent className="p-4">
            <form onSubmit={submit} className="flex items-end gap-3">
              <Button type="button" variant="secondary" className="h-12 w-12 px-0" aria-label="Attach file" title="File attachments are ready for future storage integration">
                <Paperclip className="h-5 w-5" />
              </Button>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                rows={2}
                className="min-h-12 flex-1 resize-none rounded-lg border border-black/10 bg-white px-4 py-3 text-base text-brand-dark focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10"
                placeholder="Message Tara..."
              />
              {streaming ? (
                <Button type="button" variant="secondary" className="h-12 w-12 px-0" aria-label="Stop generation" onClick={() => abortRef.current?.abort()}>
                  <Square className="h-5 w-5" />
                </Button>
              ) : (
                <Button type="button" variant="secondary" className="h-12 w-12 px-0" aria-label="Regenerate response" disabled={!lastUserMessage} onClick={() => lastUserMessage && void sendMessage(lastUserMessage)}>
                  <RefreshCw className="h-5 w-5" />
                </Button>
              )}
              <Button className="h-12 w-12 px-0" aria-label="Send message">
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
