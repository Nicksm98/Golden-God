"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Player, Lobby } from "@/lib/types";

interface DaymanActionsModalProps {
  players: Player[];
  currentPlayerId: string | null;
  lobby: Lobby;
  onClose: () => void;
  onSelectNightman: () => void;
}

export function DaymanActionsModal({
  players,
  currentPlayerId,
  lobby,
  onClose,
  onSelectNightman,
}: DaymanActionsModalProps) {
  const supabase = createClient();
  const currentPlayer = players.find((p) => p.id === currentPlayerId);

  if (!currentPlayer || currentPlayer.role !== "charlie") return null;

  const nightmanData = lobby?.dayman_nightman;

  const handleCallOutNightman = async () => {
    if (!nightmanData) return;

    await supabase
      .from("lobbies")
      .update({
        active_prompt: {
          type: "nightman-response",
          card_code: "KD",
          drawn_by: currentPlayer.name,
          data: {
            dayman: currentPlayer.name,
            nightman: nightmanData.nightman,
            message: `${currentPlayer.name} (Dayman) has called out ${nightmanData.nightman} (Nightman)!`,
          },
        },
      })
      .eq("id", lobby.id);

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-70 animate-in fade-in duration-200">
      <div className="bg-linear-to-br from-yellow-50 to-orange-50 rounded-xl p-8 shadow-2xl max-w-2xl w-full mx-4 border-4 border-yellow-400">
        <h2 className="text-3xl font-bold text-yellow-900 mb-2 text-center">
          ☀️ Dayman Actions
        </h2>
        <p className="text-gray-700 text-center mb-6">
          Fighter of the Nightman!
        </p>

        {nightmanData ? (
          <div className="space-y-4">
            <div className="bg-gray-800 text-white p-4 rounded-lg text-center">
              <p className="text-sm text-gray-300">Current Nightman</p>
              <p className="text-2xl font-bold text-yellow-300">
                🌙 {nightmanData.nightman}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                {nightmanData.rounds_remaining} rounds remaining
              </p>
            </div>

            <Button
              onClick={handleCallOutNightman}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 px-6 rounded-lg text-lg"
            >
              ☀️ Call Out the Nightman!
            </Button>

            <p className="text-sm text-gray-600 text-center">
              The Nightman must respond with &quot;Ah-ah-ahhh!&quot; within 10
              seconds or drink!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-center text-gray-700">
              You haven&apos;t chosen a Nightman yet!
            </p>
            <Button
              onClick={onSelectNightman}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 px-6 rounded-lg text-lg"
            >
              🌙 Choose Nightman
            </Button>
          </div>
        )}

        <Button
          onClick={onClose}
          className="mt-6 w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
        >
          Close
        </Button>
      </div>
    </div>
  );
}
