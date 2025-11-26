"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Player } from "@/lib/types";

interface FrankPerformModalProps {
  players: Player[];
  currentPlayerId: string | null;
  lobbyId: string;
  onClose: () => void;
}

export function FrankPerformModal({
  players,
  currentPlayerId,
  lobbyId,
  onClose,
}: FrankPerformModalProps) {
  const supabase = createClient();
  const currentPlayer = players.find((p) => p.id === currentPlayerId);

  if (!currentPlayer || currentPlayer.role !== "frank") return null;

  const handlePerformanceCall = async (targetPlayer: Player) => {
    await supabase
      .from("lobbies")
      .update({
        active_prompt: {
          type: "frank-perform",
          card_code: "KC",
          drawn_by: currentPlayer.name,
          data: {
            target: targetPlayer.name,
            message: `${currentPlayer.name} has called for a performance from ${targetPlayer.name}!`,
          },
        },
      })
      .eq("id", lobbyId);

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-70 animate-in fade-in duration-200">
      <div className="bg-linear-to-br from-purple-50 to-pink-50 rounded-xl p-8 shadow-2xl max-w-2xl w-full mx-4 border-4 border-purple-400">
        <h2 className="text-3xl font-bold text-purple-900 mb-2 text-center">
          🎭 Ongo Gablogian&apos;s Performance
        </h2>
        <p className="text-gray-700 text-center mb-6">
          As the world-famous art critic, call out a player to perform!
        </p>
        <p className="text-sm text-gray-600 text-center mb-6">
          If they refuse, they drink. If they perform, you must drink for
          being &quot;moved by the art.&quot;
        </p>

        <div className="grid grid-cols-2 gap-3">
          {players
            .filter((p) => p.name !== currentPlayer.name)
            .map((player) => (
              <Button
                key={player.id}
                onClick={() => handlePerformanceCall(player)}
                className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-4 rounded-lg transition-all"
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
