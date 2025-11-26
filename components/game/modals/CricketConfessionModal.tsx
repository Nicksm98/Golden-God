"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface CricketConfessionModalProps {
  cricketPlayerName: string;
  lobbyId: string;
  onClose: () => void;
}

export function CricketConfessionModal({
  cricketPlayerName,
  lobbyId,
  onClose,
}: CricketConfessionModalProps) {
  const supabase = createClient();

  const handleConfession = async () => {
    const confession = prompt("What do you confess, Cricket?");
    if (!confession) return;

    await supabase
      .from("lobbies")
      .update({
        active_prompt: {
          type: "drink",
          card_code: "JH",
          drawn_by: cricketPlayerName,
          data: {
            players: [cricketPlayerName],
            message: `⛪ Cricket confesses: "${confession}" - Cricket drinks!`,
          },
          confirmed_players: [],
        },
        cricket_denials: {},
      })
      .eq("id", lobbyId);

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-70 animate-in fade-in duration-200">
      <div className="bg-linear-to-br from-blue-50 to-purple-50 rounded-xl p-8 shadow-2xl max-w-md w-full mx-4 border-4 border-blue-400">
        <h2 className="text-3xl font-bold text-blue-900 mb-4 text-center">
          ⛪ Cricket&apos;s Confession
        </h2>
        <p className="text-gray-700 text-center mb-6">
          You&apos;ve used all 3 &quot;God says no!&quot; denials.
        </p>
        <p className="text-lg text-red-600 font-bold text-center mb-6">
          Time to confess your sins!
        </p>

        <div className="flex flex-col gap-3">
          <Button
            onClick={handleConfession}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg text-lg transition-all"
          >
            📖 Make Confession
          </Button>
          <Button
            onClick={onClose}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
