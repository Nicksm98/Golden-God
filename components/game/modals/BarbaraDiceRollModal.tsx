"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Lobby, Player, ActivePrompt } from "@/lib/types";

interface BarbaraDiceRollModalProps {
  barbaraDiceRoll: {
    rolling: boolean;
    result: number | null;
    playerName: string;
  };
  lobby: Lobby;
  players: Player[];
  currentPlayerId: string | null;
  activePrompt: ActivePrompt;
  onClose: () => void;
  addMatesToDrinkList: (playerNames: string[]) => string[];
}

export function BarbaraDiceRollModal({
  barbaraDiceRoll,
  lobby,
  players,
  activePrompt,
  onClose,
  addMatesToDrinkList,
}: BarbaraDiceRollModalProps) {
  const supabase = createClient();

  const handlePlayerSelection = async (targetPlayerName: string) => {
    if (!barbaraDiceRoll.result) return;

    const drinkPlayers = addMatesToDrinkList([targetPlayerName]);

    await supabase
      .from("lobbies")
      .update({
        active_prompt: {
          type: "drink",
          card_code: activePrompt.card_code,
          drawn_by: activePrompt.drawnBy,
          data: {
            players: drinkPlayers,
            message: `Barbara manipulated the outcome! ${targetPlayerName} drinks instead.`,
          },
          confirmed_players: [],
        },
      })
      .eq("id", lobby.id);

    onClose();
  };

  const handleDoneDrinking = async () => {
    if (!barbaraDiceRoll.playerName) return;

    const confirmedPlayers = activePrompt.confirmed_players || [];
    const drinkPlayers = Array.isArray(activePrompt.data?.players)
      ? activePrompt.data.players
      : [barbaraDiceRoll.playerName];

    const newConfirmedPlayers = [...confirmedPlayers, barbaraDiceRoll.playerName];

    const allDone = drinkPlayers.every((name: string) =>
      newConfirmedPlayers.includes(name)
    );

    if (allDone) {
      const currentPlayerIndex = players.findIndex(
        (p) => p.id === lobby.current_player_id
      );
      const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
      const nextPlayer = players[nextPlayerIndex];

      await supabase
        .from("lobbies")
        .update({
          active_prompt: null,
          current_player_id: nextPlayer.id,
          turn_number: lobby.turn_number + 1,
        })
        .eq("id", lobby.id);
    } else {
      await supabase
        .from("lobbies")
        .update({
          active_prompt: {
            ...activePrompt,
            confirmed_players: newConfirmedPlayers,
          },
        })
        .eq("id", lobby.id);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-70 animate-in fade-in duration-200">
      <div className="bg-linear-to-br from-purple-500 to-pink-600 rounded-lg p-12 shadow-2xl max-w-md w-full mx-4 text-center">
        <h2 className="text-3xl font-bold text-white mb-6">
          Barbara&apos;s Manipulation Roll!
        </h2>

        {barbaraDiceRoll.rolling ? (
          <div className="space-y-6">
            <div className="text-8xl animate-bounce">🎲</div>
            <p className="text-xl text-white font-semibold">Rolling...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-8xl">{barbaraDiceRoll.result}</div>
            <div className="bg-white/20 rounded-lg p-4">
              <p className="text-2xl font-bold text-white mb-2">
                {barbaraDiceRoll.result && barbaraDiceRoll.result % 2 === 1
                  ? "ODD - Choose someone else!"
                  : "EVEN - You drink!"}
              </p>
              <p className="text-lg text-white">
                {barbaraDiceRoll.result && barbaraDiceRoll.result % 2 === 1
                  ? "Barbara's manipulation worked!"
                  : "Barbara's manipulation failed!"}
              </p>
            </div>

            {barbaraDiceRoll.result && barbaraDiceRoll.result % 2 === 1 ? (
              <div className="space-y-3">
                <p className="text-white font-semibold">
                  Choose a player to drink instead:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {players
                    .filter((p) => {
                      const barbaraPlayer = players.find(
                        (player) => player.role === "barbara"
                      );
                      return p.name !== barbaraPlayer?.name;
                    })
                    .map((player) => (
                      <Button
                        key={player.id}
                        onClick={() => handlePlayerSelection(player.name)}
                        className="bg-white hover:bg-gray-100 text-purple-600 font-semibold py-3 px-4 rounded-lg transition-all"
                      >
                        {player.name}
                      </Button>
                    ))}
                </div>
              </div>
            ) : (
              <Button
                onClick={handleDoneDrinking}
                className="w-full bg-white hover:bg-gray-100 text-purple-600 font-bold py-4 px-8 rounded-lg text-xl"
              >
                Done Drinking
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
