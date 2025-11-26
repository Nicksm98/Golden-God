"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Player } from "@/lib/types";

interface GinoSwapTargetModalProps {
  ginoSwapVoting: {
    swapper: string;
    target: string;
    excuse: string;
    votes: Record<string, boolean>;
  };
  players: Player[];
  currentPlayerId: string | null;
  lobbyId: string;
  onClose: () => void;
}

export function GinoSwapTargetModal({
  ginoSwapVoting,
  players,
  currentPlayerId,
  lobbyId,
  onClose,
}: GinoSwapTargetModalProps) {
  const supabase = createClient();
  const currentPlayerName = players.find((p) => p.id === currentPlayerId)?.name;
  const isGino = currentPlayerName === ginoSwapVoting.swapper;

  const handleSelectTarget = async (targetPlayer: Player) => {
    try {
      console.log("Gino selecting target:", targetPlayer.name);
      console.log("Lobby ID:", lobbyId);
      console.log("Current gino_swap_voting state:", ginoSwapVoting);
      
      const updateData = {
        gino_swap_voting: {
          swapper: ginoSwapVoting.swapper,
          target: targetPlayer.name,
          excuse: ginoSwapVoting.excuse,
          votes: ginoSwapVoting.votes,
        },
      };
      
      console.log("Attempting to update with:", updateData);
      
      const { data, error } = await supabase
        .from("lobbies")
        .update(updateData)
        .eq("id", lobbyId)
        .select();

      if (error) {
        console.error("Failed to update gino_swap_voting:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        alert(`Failed to select target: ${error.message || "Unknown error"}`);
        return;
      }

      console.log("Successfully updated target:", data);
    } catch (err) {
      console.error("Error in handleSelectTarget:", err);
      alert(`An error occurred: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-70 animate-in fade-in duration-200">
      <div className="bg-linear-to-br from-orange-50 to-red-50 rounded-xl p-8 shadow-2xl max-w-2xl w-full mx-4 border-4 border-orange-400">
        <h2 className="text-3xl font-bold text-orange-900 mb-2 text-center">
          🔄 Choose Your Swap Target
        </h2>
        <p className="text-gray-700 text-center mb-6">
          Who do you want to swap your drink with?
        </p>

        <div className="bg-white rounded-lg p-4 mb-6 border-2 border-orange-200">
          <p className="text-sm text-gray-600 mb-1">Your Excuse:</p>
          <p className="text-lg text-gray-800 italic">
            &quot;{ginoSwapVoting.excuse}&quot;
          </p>
        </div>

        {isGino ? (
          <div className="grid grid-cols-2 gap-3">
            {players
              .filter((p) => p.name !== currentPlayerName)
              .map((player) => (
                <Button
                  key={player.id}
                  onClick={() => handleSelectTarget(player)}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-lg transition-all"
                >
                  {player.name}
                </Button>
              ))}
          </div>
        ) : (
          <p className="text-gray-700 text-center font-semibold">
            Waiting for {ginoSwapVoting.swapper} to choose a target...
          </p>
        )}

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
