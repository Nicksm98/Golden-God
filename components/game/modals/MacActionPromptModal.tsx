"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { ActivePrompt } from "@/lib/types";

interface MacActionPromptModalProps {
  activePrompt: ActivePrompt;
  currentPlayerName: string;
  lobbyId: string;
  addMatesToDrinkList: (players: string[]) => string[];
}

export function MacActionPromptModal({
  activePrompt,
  currentPlayerName,
  lobbyId,
  addMatesToDrinkList,
}: MacActionPromptModalProps) {
  const supabase = createClient();

  const targetName = activePrompt.data?.target;
  const macPlayer = activePrompt.data?.mac_player;
  const action = activePrompt.data?.action;
  const isTarget = currentPlayerName === targetName;

  const handlePerform = async () => {
    const input = (
      document.getElementById("mac-action-input") as HTMLTextAreaElement
    )?.value;

    if (!input || input.trim() === "") {
      alert(
        `Please type your ${
          action === "karate" ? "karate move" : "confession"
        } or choose to drink!`
      );
      return;
    }

    const originalDrawer = activePrompt.drawnBy;
    const macDrinkers = addMatesToDrinkList([String(macPlayer)]);
    await supabase
      .from("lobbies")
      .update({
        active_prompt: {
          type: "drink",
          card_code: "KH",
          drawn_by: originalDrawer,
          data: {
            players: macDrinkers,
            message: `${targetName} ${
              action === "karate" ? "performed" : "confessed"
            }: "${input}" - ${macPlayer} drinks!`,
            no_turn_advance: true,
          },
          confirmed_players: [],
        },
      })
      .eq("id", lobbyId);
  };

  const handleDrink = async () => {
    if (!targetName) return;
    const originalDrawer = activePrompt.drawnBy;
    const targetDrinkers = addMatesToDrinkList([targetName]);
    await supabase
      .from("lobbies")
      .update({
        active_prompt: {
          type: "drink",
          card_code: "KH",
          drawn_by: originalDrawer,
          data: {
            players: targetDrinkers,
            message: `${targetName} refused to ${
              action === "karate" ? "perform" : "confess"
            } - Drink!`,
            no_turn_advance: true,
          },
          confirmed_players: [],
        },
      })
      .eq("id", lobbyId);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-60 animate-in fade-in duration-200">
      <div className="bg-linear-to-br from-red-50 to-orange-50 rounded-xl p-8 shadow-2xl max-w-2xl w-full mx-4 border-4 border-red-400">
        <h2 className="text-3xl font-bold text-red-900 mb-4 text-center">
          {action === "karate"
            ? "🥋 Karate Demonstration!"
            : "🗣️ Confession Time!"}
        </h2>
        <p className="text-xl text-gray-800 text-center mb-6">
          {activePrompt.data?.message}
        </p>

        {isTarget ? (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {action === "karate"
                  ? "Type your karate move (or click Drink):"
                  : "Type your confession (or click Drink):"}
              </label>
              <textarea
                id="mac-action-input"
                className="w-full border-2 border-gray-300 rounded-lg p-3 text-gray-900"
                rows={3}
                placeholder={
                  action === "karate"
                    ? "e.g., 'HIIII-YAH! Roundhouse kick!'"
                    : "e.g., 'I once ate cereal with water...'"
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handlePerform}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition-all"
              >
                ✅ {action === "karate" ? "Perform" : "Confess"}
              </Button>

              <Button
                onClick={handleDrink}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-lg transition-all"
              >
                🍺 Drink Instead
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-center text-lg text-gray-600">
            Waiting for {targetName} to respond...
          </p>
        )}
      </div>
    </div>
  );
}
