"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Player, ActivePrompt } from "@/lib/types";

interface MacPlayerSelectionModalProps {
  macAction: "karate" | "confession" | "challenge" | "protein";
  players: Player[];
  macPlayer: Player;
  lobbyId: string;
  lobby: {
    id: string;
    current_player_id: string | null;
    turn_number: number;
  } | null;
  turnNumber: number;
  macUses: Record<string, number>;
  usedActions: number;
  activePrompt: ActivePrompt | null;
  addMatesToDrinkList: (players: string[]) => string[];
  onClose: () => void;
  onActionComplete: () => void;
}

const rollDice = () => Math.floor(Math.random() * 6) + 1;

export function MacPlayerSelectionModal({
  macAction,
  players,
  macPlayer,
  lobbyId,
  lobby,
  turnNumber,
  macUses,
  usedActions,
  activePrompt,
  addMatesToDrinkList,
  onClose,
  onActionComplete,
}: MacPlayerSelectionModalProps) {
  const supabase = createClient();

  const actionTitles = {
    karate: "Karate Demonstration",
    confession: "Confession Time",
    challenge: "Challenge of Toughness",
    protein: "Protein Share",
  };

  const actionDescriptions = {
    karate: "Select a player to perform a karate move or drink",
    confession: "Select a player to confess something or drink",
    challenge: "Select a player for a dice roll challenge",
    protein: "Select a player to share your drink with",
  };

  const broadcastChange = async () => {
    // Send a broadcast to notify all clients of the change
    const channel = supabase.channel(`room:${lobbyId}`);
    await channel.send({
      type: 'broadcast',
      event: 'lobby_update',
      payload: { id: lobbyId }
    });
    await supabase.removeChannel(channel);
  };

  const handlePlayerSelect = async (player: Player) => {
    const newUses = {
      ...macUses,
      [macPlayer.name]: usedActions + 1,
    };
    const macLastActionTurn: Record<string, number> = {};
    macLastActionTurn[macPlayer.name] = turnNumber;

    console.log(`[MAC ACTION] Updating counter for ${macPlayer.name}: ${usedActions} -> ${usedActions + 1}`);
    console.log("[MAC ACTION] New mac_action_uses:", newUses);
    console.log("[MAC ACTION] Lobby ID:", lobbyId);

    const currentTurnPlayer = players.find((p) => p.id === lobby?.current_player_id);
    const drawnByName = currentTurnPlayer?.name || macPlayer.name;

    console.log("[MAC ACTION] Will set drawn_by to:", drawnByName, "(current turn or Mac)");

    if (macAction === "karate") {
      const { error } = await supabase
        .from("lobbies")
        .update({
          mac_action_uses: newUses,
          mac_last_action_turn: macLastActionTurn,
          active_prompt: {
            type: "mac-action",
            card_code: "KH",
            drawn_by: drawnByName,
            data: {
              action: "karate",
              message: `${macPlayer.name} demands you perform a karate move!`,
              target: player.name,
              mac_player: macPlayer.name,
              no_turn_advance: true,
            },
            confirmed_players: [],
          },
        })
        .eq("id", lobbyId);

      if (error) {
        console.error("[MAC ACTION] Failed to update counter:", error);
      } else {
        console.log("[MAC ACTION] Counter update successful");
        await broadcastChange();
      }
    } else if (macAction === "confession") {
      const { error } = await supabase
        .from("lobbies")
        .update({
          mac_action_uses: newUses,
          mac_last_action_turn: macLastActionTurn,
          active_prompt: {
            type: "mac-action",
            card_code: "KH",
            drawn_by: drawnByName,
            data: {
              action: "confession",
              message: `${macPlayer.name} demands you confess something embarrassing!`,
              target: player.name,
              mac_player: macPlayer.name,
              no_turn_advance: true,
            },
            confirmed_players: [],
          },
        })
        .eq("id", lobbyId);

      if (error) {
        console.error("[MAC ACTION] Failed to update counter:", error);
      } else {
        console.log("[MAC ACTION] Counter update successful");
        await broadcastChange();
      }
    } else if (macAction === "challenge") {
      const macRoll = rollDice();
      const targetRoll = rollDice();

      if (macRoll === targetRoll) {
        const tieDrinkers = addMatesToDrinkList([macPlayer.name, player.name]);
        const { error } = await supabase
          .from("lobbies")
          .update({
            mac_action_uses: newUses,
            mac_last_action_turn: macLastActionTurn,
            active_prompt: {
              type: "drink",
              card_code: "KH",
              drawn_by: drawnByName,
              data: {
                players: tieDrinkers,
                message: `Toughness Challenge tied! (${macRoll} vs ${targetRoll}) - Both drink!`,
                no_turn_advance: true,
              },
              confirmed_players: [],
            },
          })
          .eq("id", lobbyId);

        if (error) {
          console.error("[MAC ACTION] Failed to update counter:", error);
        } else {
          console.log("[MAC ACTION] Counter update successful");
          await broadcastChange();
        }
      } else {
        const loser = macRoll > targetRoll ? player.name : macPlayer.name;
        const loserDrinkers = addMatesToDrinkList([loser, loser]);
        const { error } = await supabase
          .from("lobbies")
          .update({
            mac_action_uses: newUses,
            mac_last_action_turn: macLastActionTurn,
            active_prompt: {
              type: "drink",
              card_code: "KH",
              drawn_by: drawnByName,
              data: {
                players: loserDrinkers,
                message: `${loser} lost the Toughness Challenge! (${macRoll} vs ${targetRoll}) - Drink DOUBLE!`,
                no_turn_advance: true,
              },
              confirmed_players: [],
            },
          })
          .eq("id", lobbyId);

        if (error) {
          console.error("[MAC ACTION] Failed to update counter:", error);
        } else {
          console.log("[MAC ACTION] Counter update successful");
          await broadcastChange();
        }
      }
    } else if (macAction === "protein" && activePrompt) {
      const drinkPlayers = activePrompt.data?.players || [];
      const confirmedPlayers = activePrompt.confirmed_players || [];

      const baseDrinkPlayers = [...drinkPlayers, player.name];
      const newDrinkPlayers = addMatesToDrinkList(baseDrinkPlayers);
      const newConfirmedPlayers = [...confirmedPlayers, macPlayer.name];

      const allDone = newDrinkPlayers.every((name) =>
        newConfirmedPlayers.includes(name)
      );

      if (allDone) {
        const { error } = await supabase
          .from("lobbies")
          .update({ 
            mac_action_uses: newUses,
            mac_last_action_turn: macLastActionTurn,
            active_prompt: null 
          })
          .eq("id", lobbyId);

        if (error) {
          console.error("[MAC ACTION] Failed to update counter:", error);
        } else {
          console.log("[MAC ACTION] Counter update successful");
          await broadcastChange();
        }
      } else {
        const { error } = await supabase
          .from("lobbies")
          .update({
            mac_action_uses: newUses,
            mac_last_action_turn: macLastActionTurn,
            active_prompt: {
              type: activePrompt.type,
              card_code: activePrompt.card_code,
              drawn_by: activePrompt.drawnBy,
              data: {
                ...activePrompt.data,
                players: newDrinkPlayers,
                message: `Mac shares gains! ${macPlayer.name} and ${player.name} drink!`,
                no_turn_advance: true,
              },
              confirmed_players: newConfirmedPlayers,
            },
          })
          .eq("id", lobbyId);

        if (error) {
          console.error("[MAC ACTION] Failed to update counter:", error);
        } else {
          console.log("[MAC ACTION] Counter update successful");
          await broadcastChange();
        }
      }
    }

    onActionComplete();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-70 animate-in fade-in duration-200">
      <div className="bg-linear-to-br from-red-50 to-orange-50 rounded-xl p-8 shadow-2xl max-w-2xl w-full mx-4 border-4 border-red-400">
        <h2 className="text-3xl font-bold text-red-900 mb-2 text-center">
          {actionTitles[macAction]}
        </h2>
        <p className="text-gray-700 text-center mb-6">
          {actionDescriptions[macAction]}
        </p>

        <div className="grid grid-cols-2 gap-3">
          {players
            .filter((p) => p.name !== macPlayer.name)
            .map((player) => (
              <Button
                key={player.id}
                onClick={() => handlePlayerSelect(player)}
                className="bg-white hover:bg-gray-100 text-red-600 font-bold py-3 px-4 rounded-lg transition-all shadow-md hover:shadow-lg"
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
