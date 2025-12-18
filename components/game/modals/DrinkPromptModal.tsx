"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Lobby, Player, ActivePrompt } from "@/lib/types";

interface DrinkPromptModalProps {
  activePrompt: ActivePrompt;
  lobby: Lobby;
  players: Player[];
  currentPlayerId: string | null;
  onBarbaraDiceRoll: (rolling: boolean, result: number | null, playerName: string) => void;
  onMacProteinShare: () => void;
  onBruceDonation: () => void;
  onGinoSwap: (excuse: string) => void;
}

export function DrinkPromptModal({
  activePrompt,
  lobby,
  players,
  currentPlayerId,
  onBarbaraDiceRoll,
  onMacProteinShare,
  onBruceDonation,
  onGinoSwap,
}: DrinkPromptModalProps) {
  const supabase = createClient();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  const confirmedPlayers = activePrompt.confirmed_players || [];
  const drinkPlayers = Array.isArray(activePrompt.data?.players)
    ? (activePrompt.data.players as string[])
    : activePrompt.data?.players === "all"
    ? players.map((p) => p.name)
    : [activePrompt.drawnBy];

  const hasCurrentPlayerConfirmed =
    currentPlayer && confirmedPlayers.includes(currentPlayer.name);
  const shouldCurrentPlayerDrink =
    currentPlayer && drinkPlayers.includes(currentPlayer.name);

  const isNonBinary = currentPlayer?.gender === "non-binary";
  const isGenderCard = activePrompt.data?.gender_card !== undefined;
  const nonBinaryPasses = lobby?.non_binary_passes || {};
  const nonBinaryPassCount = currentPlayer?.name ? (nonBinaryPasses[currentPlayer.name] || 0) : 0;
  const canUseNonBinaryPass = isNonBinary && isGenderCard && nonBinaryPassCount < 4;

  async function handleDoneDrinking() {
    if (!lobby || !currentPlayer || isProcessing) return;
    setIsProcessing(true);

    const newConfirmedPlayers = [...confirmedPlayers, currentPlayer.name];
    const allDone = drinkPlayers.every((name) =>
      newConfirmedPlayers.includes(name)
    );

    if (allDone) {
      const shouldSkipTurnAdvance = activePrompt.data?.no_turn_advance === true;
      
      if (shouldSkipTurnAdvance) {
        console.log("Skipping turn advancement (Mac action or similar)");
        await supabase.from("lobbies").update({ active_prompt: null }).eq("id", lobby.id);

        return;
      }
      
      const drawerPlayer = players.find((p) => p.name === activePrompt.drawnBy);
      if (!drawerPlayer) {
        console.error("Could not find player who drew card:", activePrompt.drawnBy);
        const currentPlayerIndex = players.findIndex((p) => p.id === lobby.current_player_id);
        if (currentPlayerIndex === -1) {
          console.error("Could not find current player in players list");
          await supabase.from("lobbies").update({ active_prompt: null }).eq("id", lobby.id);
  
          return;
        }
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

        return;
      }

      const drawerIndex = players.findIndex((p) => p.id === drawerPlayer.id);
      const nextPlayerIndex = (drawerIndex + 1) % players.length;
      const nextPlayer = players[nextPlayerIndex];

      console.log("Drink prompt done, advancing turn:", {
        drawer: activePrompt.drawnBy,
        drawerIndex,
        nextPlayer: nextPlayer.name,
        nextPlayerIndex,
      });

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
  }

  async function handleNonBinaryPass() {
    if (!lobby || !currentPlayer || isProcessing) return;
    setIsProcessing(true);

    const passes = lobby?.non_binary_passes || {};
    const passCount = passes[currentPlayer.name] || 0;
    const newPasses = {
      ...passes,
      [currentPlayer.name]: passCount + 1,
    };

    const newConfirmedPlayers = [...confirmedPlayers, currentPlayer.name];
    const allDone = drinkPlayers.every((name) =>
      newConfirmedPlayers.includes(name)
    );

    const updateData: {
      non_binary_passes: Record<string, number>;
      active_prompt?: ActivePrompt | null;
      current_player_id?: string;
      turn_number?: number;
    } = {
      non_binary_passes: newPasses,
    };

    if (allDone) {
      const drawerPlayer = players.find((p) => p.name === activePrompt.drawnBy);
      if (!drawerPlayer) {
        console.error("Could not find player who drew card:", activePrompt.drawnBy);
        updateData.active_prompt = null;
        const { error } = await supabase.from("lobbies").update(updateData).eq("id", lobby.id).select();
        if (error) console.error("Failed to clear prompt:", error.message);
        return;
      }
      
      const drawerIndex = players.findIndex((p) => p.id === drawerPlayer.id);
      const nextPlayerIndex = (drawerIndex + 1) % players.length;
      const nextPlayer = players[nextPlayerIndex];

      console.log("Non-binary pass done, advancing turn:", {
        drawer: activePrompt.drawnBy,
        drawerIndex,
        nextPlayer: nextPlayer.name,
        nextPlayerIndex,
      });

      updateData.active_prompt = null;
      updateData.current_player_id = nextPlayer.id;
      updateData.turn_number = lobby.turn_number + 1;
    } else {
      updateData.active_prompt = {
        type: activePrompt.type,
        card_code: activePrompt.card_code,
        drawn_by: activePrompt.drawnBy,
        data: activePrompt.data,
        confirmed_players: newConfirmedPlayers,
      } as unknown as ActivePrompt;
    }

    const { error } = await supabase
      .from("lobbies")
      .update(updateData)
      .eq("id", lobby.id)
      .select();
    
    if (error) {
      console.error("Failed to use non-binary pass:", error.message);
      return;
    }

  }

  async function handleGoldenGodRefuse() {
    if (!lobby || !currentPlayer) return;

    const redirects = lobby?.golden_god_redirects || {};
    const redirectCount = redirects[currentPlayer.name] || 0;
    const newRedirects = {
      ...redirects,
      [currentPlayer.name]: redirectCount + 1,
    };

    const newDrinkPlayers = drinkPlayers.filter(
      (name) => name !== currentPlayer.name
    );
    const newConfirmedPlayers = [...confirmedPlayers, currentPlayer.name];

    const allDone =
      newDrinkPlayers.length === 0 ||
      newDrinkPlayers.every((name) => newConfirmedPlayers.includes(name));

    await supabase
      .from("lobbies")
      .update({
        golden_god_redirects: newRedirects,
      })
      .eq("id", lobby.id);

    if (allDone) {
      const shouldSkipTurnAdvance = activePrompt.data?.no_turn_advance === true;
      
      if (shouldSkipTurnAdvance) {
        console.log("Skipping turn advancement after Golden God refuse (Mac action or similar)");
        await supabase
          .from("lobbies")
          .update({ active_prompt: null })
          .eq("id", lobby.id);
        return;
      }

      const drawerPlayer = players.find((p) => p.name === activePrompt.drawnBy);
      if (!drawerPlayer) {
        console.error("Could not find player who drew card:", activePrompt.drawnBy);
        await supabase
          .from("lobbies")
          .update({ active_prompt: null })
          .eq("id", lobby.id);
        return;
      }

      const drawerIndex = players.findIndex((p) => p.id === drawerPlayer.id);
      const nextPlayerIndex = (drawerIndex + 1) % players.length;
      const nextPlayer = players[nextPlayerIndex];

      console.log("Golden God refused, everyone done drinking, advancing turn:", {
        drawer: activePrompt.drawnBy,
        drawerIndex,
        nextPlayer: nextPlayer.name,
        nextPlayerIndex,
      });

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
            type: activePrompt.type,
            card_code: activePrompt.card_code,
            drawn_by: activePrompt.drawnBy,
            data: {
              ...activePrompt.data,
              players: newDrinkPlayers,
            },
            confirmed_players: newConfirmedPlayers,
          },
        })
        .eq("id", lobby.id);
    }
  }

  async function handleUncleJackTinyHands() {
    if (!lobby || !currentPlayer) return;

    const uses = lobby?.uncle_jack_uses || {};
    const useCount = uses[currentPlayer.name] || 0;
    const newUses = {
      ...uses,
      [currentPlayer.name]: useCount + 1,
    };

    const newConfirmedPlayers = [...confirmedPlayers, currentPlayer.name];
    const allDone = drinkPlayers.every((name) =>
      newConfirmedPlayers.includes(name)
    );

    const updateData: Record<string, unknown> = {
      uncle_jack_uses: newUses,
    };

    if (allDone) {
      updateData.active_prompt = null;
    } else {
      updateData.active_prompt = {
        type: activePrompt.type,
        card_code: activePrompt.card_code,
        drawn_by: activePrompt.drawnBy,
        data: activePrompt.data,
        confirmed_players: newConfirmedPlayers,
      };
    }

    await supabase.from("lobbies").update(updateData).eq("id", lobby.id);

  }

  async function handleCricketDeny() {
    if (!lobby || !currentPlayer) return;

    const denials = lobby?.cricket_denials || {};
    const denialCount = denials[currentPlayer.name] || 0;
    const newDenials = {
      ...denials,
      [currentPlayer.name]: denialCount + 1,
    };

    const newDrinkPlayers = drinkPlayers.filter(
      (name) => name !== currentPlayer.name
    );
    const newConfirmedPlayers = [...confirmedPlayers, currentPlayer.name];

    const allDone =
      newDrinkPlayers.length === 0 ||
      newDrinkPlayers.every((name) => newConfirmedPlayers.includes(name));

    await supabase
      .from("lobbies")
      .update({
        cricket_denials: newDenials,
      })
      .eq("id", lobby.id);

    if (allDone) {
      const shouldSkipTurnAdvance = activePrompt.data?.no_turn_advance === true;
      
      if (shouldSkipTurnAdvance) {
        console.log("Skipping turn advancement after Cricket deny (Mac action or similar)");
        await supabase
          .from("lobbies")
          .update({ active_prompt: null })
          .eq("id", lobby.id);
        return;
      }

      const drawerPlayer = players.find((p) => p.name === activePrompt.drawnBy);
      if (!drawerPlayer) {
        console.error("Could not find player who drew card:", activePrompt.drawnBy);
        await supabase
          .from("lobbies")
          .update({ active_prompt: null })
          .eq("id", lobby.id);
        return;
      }

      const drawerIndex = players.findIndex((p) => p.id === drawerPlayer.id);
      const nextPlayerIndex = (drawerIndex + 1) % players.length;
      const nextPlayer = players[nextPlayerIndex];

      console.log("Cricket denied, everyone done drinking, advancing turn:", {
        drawer: activePrompt.drawnBy,
        drawerIndex,
        nextPlayer: nextPlayer.name,
        nextPlayerIndex,
      });

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
            type: activePrompt.type,
            card_code: activePrompt.card_code,
            drawn_by: activePrompt.drawnBy,
            data: {
              ...activePrompt.data,
              players: newDrinkPlayers,
            },
            confirmed_players: newConfirmedPlayers,
          },
        })
        .eq("id", lobby.id);
    }
  }

  async function handleMacBodyguard(targetPlayerName: string) {
    if (!lobby || !currentPlayer) return;

    const macUses = lobby?.mac_action_uses || {};
    const usedActions = macUses[currentPlayer.name] || 0;
    const newUses = {
      ...macUses,
      [currentPlayer.name]: usedActions + 1,
    };

    const macLastActionTurn = lobby?.mac_last_action_turn || {};
    const newLastActionTurn = {
      ...macLastActionTurn,
      [currentPlayer.name]: lobby.turn_number,
    };

    const newDrinkPlayers = drinkPlayers.filter(
      (name) => name !== targetPlayerName
    );
    const newConfirmedPlayers = [...confirmedPlayers, targetPlayerName];

    const allDone =
      newDrinkPlayers.length === 0 ||
      newDrinkPlayers.every((name) => newConfirmedPlayers.includes(name));

    await supabase
      .from("lobbies")
      .update({
        mac_action_uses: newUses,
        mac_last_action_turn: newLastActionTurn,
      })
      .eq("id", lobby.id);

    if (allDone) {
      const shouldSkipTurnAdvance = activePrompt.data?.no_turn_advance === true;
      
      if (shouldSkipTurnAdvance) {
        console.log("Skipping turn advancement after Mac bodyguard (Mac action or similar)");
        await supabase
          .from("lobbies")
          .update({ active_prompt: null })
          .eq("id", lobby.id);
        return;
      }

      const drawerPlayer = players.find((p) => p.name === activePrompt.drawnBy);
      if (!drawerPlayer) {
        console.error("Could not find player who drew card:", activePrompt.drawnBy);
        await supabase
          .from("lobbies")
          .update({ active_prompt: null })
          .eq("id", lobby.id);
        return;
      }

      const drawerIndex = players.findIndex((p) => p.id === drawerPlayer.id);
      const nextPlayerIndex = (drawerIndex + 1) % players.length;
      const nextPlayer = players[nextPlayerIndex];

      console.log("Mac shielded player, everyone done drinking, advancing turn:", {
        drawer: activePrompt.drawnBy,
        drawerIndex,
        nextPlayer: nextPlayer.name,
        nextPlayerIndex,
        shielded: targetPlayerName,
      });

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
            type: activePrompt.type,
            card_code: activePrompt.card_code,
            drawn_by: activePrompt.drawnBy,
            data: {
              ...activePrompt.data,
              players: newDrinkPlayers,
              message: `${targetPlayerName} was shielded by ${currentPlayer.name}! ${
                activePrompt.data?.message || ""
              }`,
            },
            confirmed_players: newConfirmedPlayers,
          },
        })
        .eq("id", lobby.id);
    }
  }

  const noDrinkers = drinkPlayers.length === 0 || confirmedPlayers.includes("_skip");

  async function handleSkipPrompt() {
    if (!lobby) return;
    
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
  }

  if (noDrinkers) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-60 animate-in fade-in duration-300">
        <div className="bg-linear-to-br from-blue-400 via-purple-500 to-pink-600 rounded-lg p-12 shadow-2xl max-w-2xl w-full mx-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-8 drop-shadow-lg">
            🎴 Gender Card 🎴
          </h2>
          <p className="text-2xl font-semibold text-white mb-8">
            {activePrompt.data?.message}
          </p>
          <Button
            onClick={handleSkipPrompt}
            className="bg-white hover:bg-gray-100 text-black font-bold py-4 px-12 rounded-lg text-xl transition-all"
          >
            Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-60 animate-in fade-in duration-300">
      <div className="bg-linear-to-br from-yellow-400 via-orange-500 to-red-600 rounded-lg p-12 shadow-2xl max-w-2xl w-full mx-4 text-center animate-pulse bounce-in">
        <h2 className="text-5xl font-bold text-white mb-8 drop-shadow-lg animate-bounce">
          🍺 DRINK! 🍺
        </h2>
        <p className="text-3xl font-semibold text-white mb-4">
          {activePrompt.data?.message ||
            `${activePrompt.drawnBy} - Take a drink!`}
        </p>

        <div className="mt-6 mb-4 bg-white/20 rounded-lg p-4">
          <p className="text-white font-semibold mb-2">Drinking:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {drinkPlayers.map((playerName, index) => (
              <span
                key={`${playerName}-${index}`}
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  confirmedPlayers.includes(playerName)
                    ? "bg-green-500 text-white"
                    : "bg-white/50 text-gray-900"
                }`}
              >
                {playerName} {confirmedPlayers.includes(playerName) && "✓"}
              </span>
            ))}
          </div>
        </div>

        {shouldCurrentPlayerDrink && !hasCurrentPlayerConfirmed ? (
          <div className="flex flex-col gap-4 mt-6">
            <Button
              onClick={handleDoneDrinking}
              disabled={isProcessing}
              className="bg-white hover:bg-gray-100 disabled:bg-gray-400 text-black font-bold py-4 px-12 rounded-lg text-xl transition-all"
            >
              Done Drinking
            </Button>

            {canUseNonBinaryPass && (
              <Button
                onClick={handleNonBinaryPass}
                disabled={isProcessing}
                className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white font-bold py-4 px-12 rounded-lg text-xl transition-all"
              >
                ⚧️ PASS ({4 - nonBinaryPassCount}/4 remaining)
              </Button>
            )}
            {isNonBinary && isGenderCard && !canUseNonBinaryPass && (
              <p className="text-white/70 text-sm italic">
                Passes used (4/4) - Must drink!
              </p>
            )}

            {currentPlayer?.role === "golden-god" &&
              (() => {
                const redirects = lobby?.golden_god_redirects || {};
                const redirectCount = redirects[currentPlayer.name] || 0;
                const canRefuse = redirectCount < 3;

                return canRefuse ? (
                  <Button
                    onClick={handleGoldenGodRefuse}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-4 px-12 rounded-lg text-xl transition-all"
                  >
                    ⚡ REFUSE (Golden God) - {3 - redirectCount} left
                  </Button>
                ) : (
                  <p className="text-white/70 text-sm italic">
                    Golden God redirects used (3/3)
                  </p>
                );
              })()}

            {currentPlayer?.role === "uncle-jack" &&
              (() => {
                const uses = lobby?.uncle_jack_uses || {};
                const useCount = uses[currentPlayer.name] || 0;
                const withinSafeCount = useCount < 3;

                return (
                  <Button
                    onClick={handleUncleJackTinyHands}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-12 rounded-lg text-xl transition-all"
                  >
                    🤏 TINY HANDS!{" "}
                    {withinSafeCount
                      ? `(${useCount}/3 safe)`
                      : `(${useCount} - risky!)`}
                  </Button>
                );
              })()}

            {currentPlayer?.role === "cricket" &&
              (() => {
                const denials = lobby?.cricket_denials || {};
                const denialCount = denials[currentPlayer.name] || 0;
                const canDeny = denialCount < 3;

                return canDeny ? (
                  <Button
                    onClick={handleCricketDeny}
                    className="bg-blue-900 hover:bg-blue-800 text-white font-bold py-4 px-12 rounded-lg text-xl transition-all"
                  >
                    ⛪ GOD SAYS NO!! ({3 - denialCount} left)
                  </Button>
                ) : (
                  <p className="text-white/70 text-sm italic">
                    God Says No used (3/3) - Must drink!
                  </p>
                );
              })()}

            {currentPlayer?.role === "barbara" && (
              <Button
                onClick={() => {
                  if (currentPlayer) {
                    onBarbaraDiceRoll(true, null, currentPlayer.name);
                    setTimeout(() => {
                      const roll = Math.floor(Math.random() * 6) + 1;
                      onBarbaraDiceRoll(false, roll, currentPlayer.name);
                    }, 2000);
                  }
                }}
                className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 px-12 rounded-lg text-xl transition-all"
              >
                🎲 ROLL THE DICE (Barbara)
              </Button>
            )}

            {currentPlayer?.role === "mac" &&
              (() => {
                const macUses = lobby?.mac_action_uses || {};
                const usedActions = macUses[currentPlayer.name] || 0;
                if (usedActions >= 5) return null;

                const macLastActionTurn = lobby?.mac_last_action_turn || {};
                const lastActionTurn =
                  macLastActionTurn[currentPlayer.name] || -1;
                const currentTurn = lobby?.turn_number || 0;
                const usedActionThisTurn = lastActionTurn === currentTurn;

                if (usedActionThisTurn) {
                  return (
                    <p className="text-white/70 text-sm italic">
                      Already used an action this turn!
                    </p>
                  );
                }

                return (
                  <Button
                    onClick={onMacProteinShare}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-12 rounded-lg text-xl transition-all"
                  >
                    🥤 PROTEIN SHARE (Mac)
                  </Button>
                );
              })()}

            {currentPlayer?.role === "bruce" && (
              <Button
                onClick={onBruceDonation}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-12 rounded-lg text-xl transition-all"
              >
                🎁 DONATE EXTRA DRINK (Bruce)
              </Button>
            )}

            {currentPlayer?.role === "gino" &&
              (() => {
                const swapsUsed = lobby?.gino_swaps_used || {};
                const playerSwaps = swapsUsed[currentPlayer.name] || 0;
                const currentTurn = lobby?.turn_number || 0;
                const roundsPlayed = Math.floor(currentTurn / players.length);

                if (playerSwaps >= roundsPlayed + 1) return null;

                return (
                  <Button
                    onClick={() => {
                      const excuse = prompt(
                        "Enter your ridiculous excuse for swapping:"
                      );
                      if (excuse) {
                        onGinoSwap(excuse);
                      }
                    }}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-12 rounded-lg text-xl transition-all"
                  >
                    🔄 SWAP DRINK (Gino - {playerSwaps}/{roundsPlayed + 1})
                  </Button>
                );
              })()}
          </div>
        ) : shouldCurrentPlayerDrink && hasCurrentPlayerConfirmed ? (
          <p className="mt-6 text-white text-lg font-semibold">
            ✓ You&apos;ve confirmed! Waiting for others...
          </p>
        ) : (
          <div className="mt-6">
            <p className="text-white text-lg font-semibold mb-4">
              Waiting for players to finish drinking...
            </p>
            
            {currentPlayer?.role === "mac" &&
              (() => {
                const macUses = lobby?.mac_action_uses || {};
                const usedActions = macUses[currentPlayer.name] || 0;
                if (usedActions >= 5) return null;

                const macLastActionTurn = lobby?.mac_last_action_turn || {};
                const lastActionTurn = macLastActionTurn[currentPlayer.name] || -1;
                const currentTurn = lobby?.turn_number || 0;
                const usedActionThisTurn = lastActionTurn === currentTurn;

                if (usedActionThisTurn) return null;

                const unconfirmedDrinkers = drinkPlayers.filter(
                  (name) => !confirmedPlayers.includes(name)
                );

                if (unconfirmedDrinkers.length === 0) return null;

                return (
                  <div className="bg-white/10 rounded-lg p-4 mt-4">
                    <p className="text-white text-sm font-semibold mb-3">
                      🛡️ Mac&apos;s Bodyguard - Shield a player:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {unconfirmedDrinkers.map((playerName) => (
                        <Button
                          key={playerName}
                          onClick={() => handleMacBodyguard(playerName)}
                          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition-all"
                        >
                          Shield {playerName}
                        </Button>
                      ))}
                    </div>
                    <p className="text-white/70 text-xs mt-2">
                      {5 - usedActions} actions remaining
                    </p>
                  </div>
                );
              })()}
          </div>
        )}
      </div>
    </div>
  );
}
