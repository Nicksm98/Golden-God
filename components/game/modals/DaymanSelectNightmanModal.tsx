"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Player } from "@/lib/types";

interface DaymanSelectNightmanModalProps {
  players: Player[];
  currentPlayerId: string | null;
  lobbyId: string;
  onClose: () => void;
}

export function DaymanSelectNightmanModal({
  players,
  currentPlayerId,
  lobbyId,
  onClose,
}: DaymanSelectNightmanModalProps) {
  const supabase = createClient();
  const currentPlayer = players.find((p) => p.id === currentPlayerId);

  if (!currentPlayer || currentPlayer.role !== "charlie") return null;

  const handleSelectNightman = async (targetPlayer: Player) => {
    await supabase
      .from("lobbies")
      .update({
        dayman_nightman: {
          dayman: currentPlayer.name,
          nightman: targetPlayer.name,
          rounds_remaining: 3,
        },
      })
      .eq("id", lobbyId);

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-70 animate-in fade-in duration-200">
      <div className="bg-linear-to-br from-gray-800 to-gray-900 rounded-xl p-8 shadow-2xl max-w-2xl w-full mx-4 border-4 border-yellow-400">
        <h2 className="text-3xl font-bold text-yellow-300 mb-2 text-center">
          🌙 Choose the Nightman
        </h2>
        <p className="text-yellow-100 text-center mb-6">
          Select a player to be the Nightman for 3 rounds
        </p>

        <div className="grid grid-cols-2 gap-3">
          {players
            .filter((p) => p.name !== currentPlayer.name)
            .map((player) => (
              <Button
                key={player.id}
                onClick={() => handleSelectNightman(player)}
                className="bg-gray-700 hover:bg-gray-600 text-yellow-300 font-semibold py-3 px-4 rounded-lg transition-all"
              >
                {player.name}
              </Button>
            ))}
        </div>

        <Button
          onClick={onClose}
          className="mt-6 w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
