"use client";

import { Button } from "@/components/ui/button";
import type { Player, ActivePrompt } from "@/lib/types";

interface MateSelectionModalProps {
  activePrompt: ActivePrompt;
  players: Player[];
  currentPlayerId: string | null;
  onMateSelection: (playerName: string) => void;
}

export function MateSelectionModal({
  activePrompt,
  players,
  currentPlayerId,
  onMateSelection,
}: MateSelectionModalProps) {
  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  // Handle both snake_case (from DB) and camelCase (from type)
  const promptData = activePrompt as unknown as Record<string, unknown>;
  const drawerName = (promptData.drawn_by || promptData.drawnBy) as string;
  const isCurrentPlayerDrawer = currentPlayer?.name === drawerName;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-60 animate-in fade-in duration-200">
      <div className="bg-linear-to-br from-pink-500 via-red-500 to-purple-600 rounded-lg p-8 shadow-2xl max-w-md w-full mx-4 bounce-in">
        <h2 className="text-3xl font-bold text-white mb-4 text-center">
          💕 Choose Your Mate!
        </h2>
        <p className="text-white/90 mb-6 text-center">
          {drawerName}, pick someone to be your drinking mate for the rest of
          the game!
        </p>
        <div className="grid grid-cols-2 gap-3">
          {players
            .filter((p) => p.name !== drawerName)
            .map((player) => (
              <Button
                key={player.id}
                onClick={() => onMateSelection(player.name)}
                className="bg-white hover:bg-gray-100 text-purple-600 font-bold py-4 px-4 rounded-lg transition-all hover-lift"
                disabled={!isCurrentPlayerDrawer}
              >
                {player.name}
              </Button>
            ))}
        </div>
        {!isCurrentPlayerDrawer && (
          <p className="text-white/70 text-sm mt-4 text-center">
            Waiting for {drawerName} to choose...
          </p>
        )}
      </div>
    </div>
  );
}
