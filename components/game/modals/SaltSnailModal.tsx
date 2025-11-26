"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface SaltSnailModalProps {
  snailPlayerName: string;
  lobbyId: string;
  onClose: () => void;
}

export function SaltSnailModal({
  snailPlayerName,
  lobbyId,
  onClose,
}: SaltSnailModalProps) {
  const supabase = createClient();

  const handleSalt = async () => {
    // Snail must finish drink
    await supabase
      .from("lobbies")
      .update({
        active_prompt: {
          type: "drink",
          card_code: "AD",
          drawn_by: snailPlayerName,
          data: {
            players: [snailPlayerName],
            message: `🧂 THE SNAIL HAS BEEN SALTED! ${snailPlayerName} must FINISH THEIR DRINK!`,
          },
          confirmed_players: [],
        },
        snail_player: null,
      })
      .eq("id", lobbyId);

    // Remove Gail role - find player by name and clear role
    const { data: players } = await supabase
      .from("players")
      .select("*")
      .eq("lobby_id", lobbyId);

    const snailPlayer = players?.find((p) => p.name === snailPlayerName);
    if (snailPlayer) {
      await supabase
        .from("players")
        .update({ role: null })
        .eq("id", snailPlayer.id);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-70 animate-in fade-in duration-200">
      <div className="bg-linear-to-br from-green-100 to-green-200 rounded-xl p-8 shadow-2xl max-w-md w-full mx-4 border-4 border-green-600">
        <h2 className="text-3xl font-bold text-green-900 mb-4 text-center">
          🧂 SALT THE SNAIL!
        </h2>
        <p className="text-gray-700 text-center mb-6 text-lg">
          Are you sure you want to salt {snailPlayerName}?
        </p>
        <p className="text-sm text-red-600 text-center mb-6 font-bold">
          They will have to finish their entire drink!
        </p>

        <div className="flex flex-col gap-3">
          <Button
            onClick={handleSalt}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-lg text-lg transition-all"
          >
            🧂 YES, SALT THE SNAIL!
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
