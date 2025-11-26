"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Player } from "@/lib/types";

interface BruceDonationModalProps {
  players: Player[];
  currentPlayerId: string | null;
  lobbyId: string;
  currentPlayerName: string;
  onClose: () => void;
  onStartVoting: (targetPlayer: string, reason: string) => void;
}

export function BruceDonationModal({
  players,
  currentPlayerId,
  lobbyId,
  currentPlayerName,
  onClose,
  onStartVoting,
}: BruceDonationModalProps) {
  const supabase = createClient();
  const currentPlayer = players.find((p) => p.id === currentPlayerId);

  if (!currentPlayer || currentPlayer.role !== "bruce") return null;

  const handleSelectTarget = async (targetPlayer: Player) => {
    const reason = prompt(
      `Why are you donating drinks to ${targetPlayer.name}? (This will be voted on by other players)`
    );

    if (!reason) return;

    await supabase
      .from("lobbies")
      .update({
        bruce_voting: {
          bruce: currentPlayerName,
          target: targetPlayer.name,
          reason: reason,
          votes: {},
        },
      })
      .eq("id", lobbyId);

    onStartVoting(targetPlayer.name, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-70 animate-in fade-in duration-200">
      <div className="bg-linear-to-br from-blue-50 to-cyan-50 rounded-xl p-8 shadow-2xl max-w-2xl w-full mx-4 border-4 border-blue-400">
        <h2 className="text-3xl font-bold text-blue-900 mb-2 text-center">
          💰 Bruce&apos;s Charity Donation
        </h2>
        <p className="text-gray-700 text-center mb-6">
          Choose a player to donate drinks to and provide a reason
        </p>

        <div className="grid grid-cols-2 gap-3">
          {players
            .filter((p) => p.name !== currentPlayerName)
            .map((player) => (
              <Button
                key={player.id}
                onClick={() => handleSelectTarget(player)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-all"
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
