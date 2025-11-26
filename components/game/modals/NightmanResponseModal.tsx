"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Lobby, Player, ActivePrompt } from "@/lib/types";

interface NightmanResponseModalProps {
  activePrompt: ActivePrompt;
  lobby: Lobby;
  players: Player[];
  currentPlayerId: string | null;
  nightmanTimer: number;
  addMatesToDrinkList: (playerNames: string[]) => string[];
}

export function NightmanResponseModal({
  activePrompt,
  lobby,
  players,
  currentPlayerId,
  nightmanTimer,
  addMatesToDrinkList,
}: NightmanResponseModalProps) {
  const supabase = createClient();
  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  const isNightman = currentPlayer?.name === activePrompt.data?.nightman;

  async function handleCorrectResponse() {
    await supabase
      .from("lobbies")
      .update({ active_prompt: null })
      .eq("id", lobby.id);
  }

  async function handleFailedResponse() {
    const nightmanDrinkers = addMatesToDrinkList([
      activePrompt.data?.nightman || "",
    ]);
    await supabase
      .from("lobbies")
      .update({
        active_prompt: {
          type: "drink",
          card_code: "KD",
          drawn_by: activePrompt.drawnBy,
          data: {
            players: nightmanDrinkers,
            message: `${activePrompt.data?.nightman} failed to respond as the Nightman!`,
          },
          confirmed_players: [],
        },
      })
      .eq("id", lobby.id);
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-60 animate-in fade-in duration-200">
      <div className="bg-linear-to-br from-gray-800 to-gray-900 rounded-lg p-8 shadow-2xl max-w-2xl w-full mx-4 border-4 border-yellow-400">
        <h2 className="text-2xl font-bold text-yellow-300 mb-4 text-center">
          🌙 NIGHTMAN!
        </h2>
        <p className="text-center text-yellow-100 mb-6 text-lg">
          {activePrompt.data?.message}
        </p>
        <p className="text-center text-yellow-200 mb-4">
          The Nightman must respond &quot;Dayman!&quot; or drink!
        </p>

        {/* Countdown Timer */}
        <div className="mb-6 flex items-center justify-center">
          <div
            className={`text-6xl font-bold ${
              nightmanTimer <= 3
                ? "text-red-500 animate-pulse"
                : "text-yellow-300"
            }`}
          >
            {nightmanTimer}
          </div>
        </div>

        {/* Nightman must respond */}
        {isNightman ? (
          <div className="flex flex-col gap-4">
            <Button
              onClick={handleCorrectResponse}
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-4 px-8 rounded-lg text-lg"
            >
              ☀️ &quot;Dayman!&quot;
            </Button>
            <Button
              onClick={handleFailedResponse}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-8 rounded-lg text-lg"
            >
              🚫 Failed to Respond (Drink)
            </Button>
          </div>
        ) : (
          <p className="text-center text-yellow-200 text-lg">
            Waiting for {activePrompt.data?.nightman} to respond...
          </p>
        )}
      </div>
    </div>
  );
}
