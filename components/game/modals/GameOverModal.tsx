"use client";

import { Button } from "@/components/ui/button";
import type { Player } from "@/lib/types";

interface GameOverModalProps {
  players: Player[];
  currentPlayerId: string | null;
  onReset: () => Promise<void>;
  onBackToLobby: () => void;
}

export function GameOverModal({
  players,
  currentPlayerId,
  onReset,
  onBackToLobby,
}: GameOverModalProps) {
  const isHost = players.find((p) => p.id === currentPlayerId)?.is_host;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg p-8 max-w-md bounce-in">
        <h2 className="text-3xl font-bold mb-4 text-center">Game Over!</h2>
        <p className="text-gray-600 mb-6 text-center">
          All cards have been drawn. What would you like to do?
        </p>
        <div className="space-y-3">
          {isHost && (
            <Button
              onClick={onReset}
              className="w-full bg-green-500 hover:bg-green-600 text-white"
            >
              Reset Game
            </Button>
          )}
          <Button
            onClick={onBackToLobby}
            className="w-full bg-gray-500 hover:bg-gray-600 text-white"
          >
            Back to Lobby
          </Button>
        </div>
      </div>
    </div>
  );
}
