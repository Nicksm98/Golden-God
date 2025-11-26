"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Player, ActivePrompt } from "@/lib/types";
import { useState } from "react";

interface FrankPerformancePromptModalProps {
  activePrompt: ActivePrompt;
  players: Player[];
  currentPlayerId: string | null;
  lobbyId: string;
  frankPerformances: Record<string, number>;
  addMatesToDrinkList: (players: string[]) => string[];
}

export function FrankPerformancePromptModal({
  activePrompt,
  players,
  currentPlayerId,
  lobbyId,
  frankPerformances,
  addMatesToDrinkList,
}: FrankPerformancePromptModalProps) {
  const supabase = createClient();
  const [showingPerformanceChoice, setShowingPerformanceChoice] = useState(false);

  const currentPlayerName = players.find((p) => p.id === currentPlayerId)?.name;
  const targetName = activePrompt.data?.target;
  const isTarget = currentPlayerName === targetName;

  const handleChooseToPerform = () => {
    setShowingPerformanceChoice(true);
  };

  const handlePerformanceSelected = async (performanceType: string) => {
    // Track performance
    const newPerformances = {
      ...frankPerformances,
      [targetName || ""]: (frankPerformances[targetName || ""] || 0) + 1,
    };

    await supabase
      .from("lobbies")
      .update({ frank_performances: newPerformances })
      .eq("id", lobbyId);

    // Update prompt to ask Frank if they were moved by the art
    await supabase
      .from("lobbies")
      .update({
        active_prompt: {
          type: "frank-judge",
          card_code: "KC",
          drawn_by: activePrompt.drawnBy,
          data: {
            target: targetName,
            performanceType: performanceType,
            message: `${targetName} performed a ${performanceType}. Was Ongo Gablogian moved by the art?`,
          },
        },
      })
      .eq("id", lobbyId);
  };

  const handleMovedByArt = async () => {
    // Frank was moved and must drink
    const frankDrinkers = addMatesToDrinkList([activePrompt.drawnBy]);
    await supabase
      .from("lobbies")
      .update({
        active_prompt: {
          type: "drink",
          card_code: "KC",
          drawn_by: activePrompt.drawnBy,
          data: {
            players: frankDrinkers,
            message: `Ongo Gablogian was moved by ${activePrompt.data?.target}'s ${activePrompt.data?.performanceType} and must drink!`,
          },
          confirmed_players: [],
        },
      })
      .eq("id", lobbyId);
  };

  const handleNotMoved = async () => {
    // Frank was not moved, performer drinks
    const performerDrinkers = addMatesToDrinkList([activePrompt.data?.target || ""]);
    await supabase
      .from("lobbies")
      .update({
        active_prompt: {
          type: "drink",
          card_code: "KC",
          drawn_by: activePrompt.drawnBy,
          data: {
            players: performerDrinkers,
            message: `Ongo Gablogian was NOT moved by the art. ${activePrompt.data?.target} must drink!`,
          },
          confirmed_players: [],
        },
      })
      .eq("id", lobbyId);
  };

  const handleRefuse = async () => {
    const targetDrinkers = addMatesToDrinkList([targetName || ""]);
    await supabase
      .from("lobbies")
      .update({
        active_prompt: {
          type: "drink",
          card_code: "KC",
          drawn_by: activePrompt.drawnBy,
          data: {
            players: targetDrinkers,
            message: `${targetName} refused to perform for Ongo Gablogian!`,
          },
          confirmed_players: [],
        },
      })
      .eq("id", lobbyId);
  };

  const performanceOptions = [
    { type: "dance", emoji: "💃", label: "Dance" },
    { type: "song", emoji: "🎤", label: "Sing a Song" },
    { type: "impression", emoji: "🎭", label: "Do an Impression" },
    { type: "joke", emoji: "😂", label: "Tell a Joke" },
    { type: "poem", emoji: "📜", label: "Recite a Poem" },
    { type: "freestyle", emoji: "🎨", label: "Freestyle Performance" },
  ];

  const frankPlayerName = activePrompt.drawnBy;
  const isFrank = currentPlayerName === frankPlayerName;
  const isJudgingPhase = activePrompt.type === "frank-judge";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-60 animate-in fade-in duration-200">
      <div className="bg-linear-to-br from-purple-50 to-pink-50 rounded-lg p-8 shadow-2xl max-w-2xl w-full mx-4 border-4 border-purple-400">
        <h2 className="text-2xl font-bold text-purple-900 mb-4 text-center">
          🎭 Ongo Gablogian {isJudgingPhase ? "Judges the Art" : "Demands a Performance"}!
        </h2>
        <p className="text-center text-gray-700 mb-6 text-lg">
          {activePrompt.data?.message}
        </p>

        {isJudgingPhase ? (
          isFrank ? (
            <div className="flex flex-col gap-4">
              <p className="text-center text-purple-800 font-semibold mb-2">
                Were you moved by this performance?
              </p>
              <Button
                onClick={handleMovedByArt}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-lg text-lg"
              >
                ✨ Yes, I am moved! (I drink)
              </Button>
              <Button
                onClick={handleNotMoved}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-8 rounded-lg text-lg"
              >
                🗑️ Derivative! (They drink)
              </Button>
            </div>
          ) : (
            <p className="text-center text-gray-600 text-lg">
              Waiting for Ongo Gablogian to judge the art...
            </p>
          )
        ) : isTarget ? (
          showingPerformanceChoice ? (
            <div className="flex flex-col gap-3">
              <p className="text-center text-gray-700 font-semibold mb-2">
                Choose your performance:
              </p>
              {performanceOptions.map((option) => (
                <Button
                  key={option.type}
                  onClick={() => handlePerformanceSelected(option.type)}
                  className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 px-6 rounded-lg text-lg"
                >
                  {option.emoji} {option.label}
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <Button
                onClick={handleChooseToPerform}
                className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 px-8 rounded-lg text-lg"
              >
                🎭 Perform
              </Button>
              <Button
                onClick={handleRefuse}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-8 rounded-lg text-lg"
              >
                🚫 Refuse (Drink)
              </Button>
            </div>
          )
        ) : (
          <p className="text-center text-gray-600 text-lg">
            Waiting for {targetName} to decide...
          </p>
        )}
      </div>
    </div>
  );
}
