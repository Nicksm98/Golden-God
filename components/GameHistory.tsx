"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { GameHistoryProps } from "@/lib/types";

interface GameEvent {
  id: string;
  lobby_id: string;
  event_type: "card_drawn" | "drink" | "role_assigned" | "special_action" | "mate_assigned" | "mate_broken";
  player_name: string;
  details: {
    card_code?: string;
    role?: string;
    action?: string;
    target?: string;
    message?: string;
    [key: string]: unknown;
  };
  created_at: string;
}

export function GameHistory({ lobbyId, isOpen, onClose }: GameHistoryProps) {
  const [events, setEvents] = useState<GameEvent[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (!isOpen) return;

    const loadEvents = async () => {
      const { data } = await supabase
        .from("game_events")
        .select("*")
        .eq("lobby_id", lobbyId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (data) {
        setEvents(data);
      }
    };

    loadEvents();

    const channel = supabase
      .channel(`game-events-${lobbyId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "game_events",
          filter: `lobby_id=eq.${lobbyId}`,
        },
        (payload) => {
          setEvents((prev) => [payload.new as GameEvent, ...prev].slice(0, 100));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, lobbyId, supabase]);

  if (!isOpen) return null;

  const getEventIcon = (type: string) => {
    switch (type) {
      case "card_drawn":
        return "🃏";
      case "drink":
        return "🍺";
      case "role_assigned":
        return "👑";
      case "special_action":
        return "⚡";
      case "mate_assigned":
        return "💕";
      case "mate_broken":
        return "💔";
      default:
        return "📝";
    }
  };

  const getEventMessage = (event: GameEvent) => {
    switch (event.event_type) {
      case "card_drawn":
        return `drew ${event.details.card_code}`;
      case "drink":
        return event.details.message || "drank";
      case "role_assigned":
        return `became ${event.details.role}`;
      case "special_action":
        return event.details.action || "performed an action";
      case "mate_assigned":
        return `is now mates with ${event.details.target}`;
      case "mate_broken":
        return `mate bond broken`;
      default:
        return event.details.message || "performed an action";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-100">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Game History</h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {events.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No events yet. Start playing!
            </p>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getEventIcon(event.event_type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-semibold">{event.player_name}</span>{" "}
                      {getEventMessage(event)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(event.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t bg-gray-50">
          <Button
            onClick={onClose}
            className="w-full bg-black hover:bg-gray-800 text-white"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
