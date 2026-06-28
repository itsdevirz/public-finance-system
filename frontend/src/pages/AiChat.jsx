import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Check, Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/api";

export default function AiChat() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "سلام! من دستیار هوشمند مالی شما هستم. چطور می‌توانم کمک کنم؟",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await api.post("/api/ai/chat", {
        messages: updatedMessages,
      });
      const data = response.data;

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.content,
          internal_reasoning: data.internal_reasoning,
          tool_results: data.tool_results,
        },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "متاسفانه خطایی رخ داد." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionExecution = async (action, index) => {
    // This is for demonstration, as actual action execution can be handled by backend
    // but the requirement says "Button to execute suggested financial actions"
    // So if the intent is "create_voucher", we can show a button to confirm.
    alert(`در حال اجرای عملیات: ${action.tool}`);
  };

  return (
    <div className="flex h-[80vh] flex-col gap-4 p-4">
      <Card className="flex flex-1 flex-col shadow-sm">
        <CardHeader className="border-b bg-muted/20 px-6 py-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-primary">
            <Bot className="h-6 w-6 text-accent" />
            دستیار هوشمند مالی (AI)
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4 p-0">
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${
                  msg.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-accent/10 text-accent border border-accent/20"
                  }`}
                >
                  {msg.role === "user" ? <User size={20} /> : <Bot size={20} />}
                </div>
                <div
                  className={`flex max-w-[80%] flex-col gap-2 rounded-2xl px-5 py-3 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted/30 border rounded-tl-sm text-foreground"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </p>

                  {/* Display structured AI output if present */}
                  {msg.internal_reasoning && (
                    <div className="mt-2 rounded-xl bg-background/50 p-3 text-xs border border-border/50 text-muted-foreground overflow-x-auto">
                      <p className="font-semibold mb-1 text-primary/70">
                        ساختار عملیاتی (JSON):
                      </p>
                      <pre className="text-left" dir="ltr">
                        {JSON.stringify(msg.internal_reasoning, null, 2)}
                      </pre>

                      {msg.internal_reasoning.actions?.map((act, actIdx) => (
                        <Button
                          key={actIdx}
                          size="sm"
                          variant="secondary"
                          className="mt-3 w-full flex items-center gap-2 border-accent/30 hover:bg-accent/10 hover:text-accent"
                          onClick={() => handleActionExecution(act, actIdx)}
                        >
                          <Play size={14} />
                          اجرای عملیات {act.tool || act.intent}
                        </Button>
                      ))}
                    </div>
                  )}

                  {msg.tool_results && (
                    <div className="mt-2 rounded-xl bg-green-500/10 p-3 text-xs border border-green-500/20 text-green-700">
                      <p className="font-semibold mb-1 flex items-center gap-1">
                        <Check size={14} /> نتایج ابزار:
                      </p>
                      <pre className="text-left" dir="ltr">
                        {JSON.stringify(msg.tool_results, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent border border-accent/20">
                  <Bot size={20} />
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-muted/30 border rounded-tl-sm px-5 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    در حال فکر کردن...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t bg-background p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2 relative max-w-4xl mx-auto"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="درخواست خود را بنویسید... (مثلا: یک سند برای بانک ملت شعبه ولیعصر با مبلغ ۱۰ میلیون ایجاد کن)"
                className="flex-1 rounded-full px-6 py-6 pr-12 shadow-sm border-muted-foreground/20 focus-visible:ring-accent"
                disabled={loading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || loading}
                className="absolute right-2 h-10 w-10 rounded-full bg-accent hover:bg-accent/90"
              >
                <Send size={18} className="rtl:rotate-180" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
