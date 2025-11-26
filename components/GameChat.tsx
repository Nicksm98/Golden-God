"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send } from "lucide-react";
import type { ChatMessage, GameChatProps } from "@/lib/types";

export function GameChat({ lobbyId, playerName, isOpen, onClose }: GameChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!isOpen) return;

    const loadMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("lobby_id", lobbyId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (data) {
        setMessages(data);
        setTimeout(scrollToBottom, 100);
      }
    };

    loadMessages();

    const channel = supabase
      .channel(`chat-${lobbyId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `lobby_id=eq.${lobbyId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
          setTimeout(scrollToBottom, 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, lobbyId, supabase]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await supabase.from("chat_messages").insert({
        lobby_id: lobbyId,
        player_name: playerName,
        message: newMessage.trim(),
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-2xl w-96 h-[500px] flex flex-col z-90 border-2 border-gray-200">
      <div className="flex items-center justify-between p-3 border-b bg-gray-50 rounded-t-lg">
        <h3 className="font-bold text-gray-900">Chat</h3>
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-gray-200"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
        {messages.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-4">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-lg p-2 ${
                msg.player_name === playerName
                  ? "bg-blue-500 text-white ml-8"
                  : "bg-white border border-gray-200 mr-8"
              }`}
            >
              <p
                className={`text-xs font-semibold mb-1 ${
                  msg.player_name === playerName ? "text-blue-100" : "text-gray-600"
                }`}
              >
                {msg.player_name}
              </p>
              <p className="text-sm wrap-break-words">{msg.message}</p>
              <p
                className={`text-xs mt-1 ${
                  msg.player_name === playerName ? "text-blue-200" : "text-gray-400"
                }`}
              >
                {new Date(msg.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-3 border-t bg-white rounded-b-lg">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            maxLength={200}
            disabled={isSending}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newMessage.trim() || isSending}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
