"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Player, ActivePrompt } from "@/lib/types";

interface ChoosePlayerModalProps {
  activePrompt: ActivePrompt;
  players: Player[];
  currentPlayerId: string | null;
  lobbyId: string;
  currentLobbyPlayerId: string;
  turnNumber: number;
  addMatesToDrinkList: (players: string[]) => string[];
}

export function ChoosePlayerModal({
  activePrompt,
  players,
  currentPlayerId,
  lobbyId,
  turnNumber,
  addMatesToDrinkList,
}: ChoosePlayerModalProps) {
  const supabase = createClient();

  const promptData = activePrompt as unknown as Record<string, unknown>;
  const drawerName = (promptData.drawn_by || promptData.drawnBy) as string;
  const isDrawer =
    players.find((p) => p.id === currentPlayerId)?.name === drawerName;

  const handlePlayerSelect = async (player: Player) => {
    if (activePrompt.data?.action === "drink") {
      const drinkPlayers = addMatesToDrinkList([player.name]);
      const { error } = await supabase
        .from("lobbies")
        .update({
          active_prompt: {
            type: "drink",
            card_code: activePrompt.card_code,
            drawn_by: drawerName,
            data: { players: drinkPlayers },
            confirmed_players: [],
          },
        })
        .eq("id", lobbyId);
      
      if (!error) {
        // Small delay then reload page to ensure change is visible
        setTimeout(() => window.location.reload(), 200);
      }
    } else if (activePrompt.data?.action === "rps") {
      const drawerPlayer = players.find((p) => p.name === drawerName);
      if (!drawerPlayer) {
        console.error("Could not find player who drew card:", drawerName);
        return;
      }
      
      const drawerIndex = players.findIndex((p) => p.id === drawerPlayer.id);
      const nextPlayerIndex = (drawerIndex + 1) % players.length;
      const nextPlayer = players[nextPlayerIndex];

      console.log("RPS started, advancing turn:", {
        drawer: drawerName,
        drawerIndex,
        nextPlayer: nextPlayer.name,
        nextPlayerIndex,
      });

      const { error } = await supabase
        .from("lobbies")
        .update({
          rps_game: {
            player1: drawerName,
            player2: player.name,
            player1_score: 0,
            player2_score: 0,
            round: 1,
            confirmed_players: [],
          },
          active_prompt: null,
          current_player_id: nextPlayer.id,
          turn_number: turnNumber + 1,
        })
        .eq("id", lobbyId);
      
      if (!error) {
        // Small delay then reload page to ensure change is visible
        setTimeout(() => window.location.reload(), 200);
      }
    }
  };

  const handleCancel = async () => {
    const drawerPlayer = players.find((p) => p.name === drawerName);
    if (!drawerPlayer) {
      console.error("Could not find player who drew card:", drawerName);
      return;
    }
    
    const drawerIndex = players.findIndex((p) => p.id === drawerPlayer.id);
    const nextPlayerIndex = (drawerIndex + 1) % players.length;
    const nextPlayer = players[nextPlayerIndex];

    console.log("Choose player canceled, advancing turn:", {
      drawer: drawerName,
      drawerIndex,
      nextPlayer: nextPlayer.name,
      nextPlayerIndex,
    });

    const { error } = await supabase
      .from("lobbies")
      .update({
        active_prompt: null,
        current_player_id: nextPlayer.id,
        turn_number: turnNumber + 1,
      })
      .eq("id", lobbyId);
    
    if (!error) {
      // Small delay then reload page to ensure change is visible
      setTimeout(() => window.location.reload(), 200);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-60 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg p-8 shadow-2xl max-w-2xl w-full mx-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          {activePrompt.data?.message || "Choose a Player"}
        </h2>

        {isDrawer ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              {players
                .filter((p) => p.name !== drawerName)
                .map((player) => (
                  <Button
                    key={player.id}
                    onClick={() => handlePlayerSelect(player)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-all"
                  >
                    {player.name}
                  </Button>
                ))}
            </div>
            <Button
              onClick={handleCancel}
              className="mt-6 w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
            >
              Cancel
            </Button>
          </>
        ) : (
          <p className="text-center text-lg text-gray-500">
            Waiting for {drawerName} to choose...
          </p>
        )}
      </div>
    </div>
  );
}
