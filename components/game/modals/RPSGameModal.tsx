"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Player, RPSGame, ActivePrompt } from "@/lib/types";

interface RPSGameModalProps {
  rpsGame: RPSGame;
  players: Player[];
  currentPlayerId: string | null;
  lobbyId: string;
  activePrompt: ActivePrompt | null;
  addMatesToDrinkList: (players: string[]) => string[];
}

export function RPSGameModal({
  rpsGame,
  players,
  currentPlayerId,
  lobbyId,
  activePrompt,
  addMatesToDrinkList,
}: RPSGameModalProps) {
  const supabase = createClient();

  const handleChoice = async (choice: "rock" | "paper" | "scissors") => {
    const currentPlayer = players.find((p) => p.id === currentPlayerId);
    if (!currentPlayer) return;

    if (
      currentPlayer.name === rpsGame.player1 &&
      !rpsGame.player1_choice
    ) {
      await supabase
        .from("lobbies")
        .update({
          rps_game: {
            player1: rpsGame.player1,
            player2: rpsGame.player2,
            player1_choice: choice,
            player2_choice: rpsGame.player2_choice,
            player1_score: rpsGame.player1_score,
            player2_score: rpsGame.player2_score,
            round: rpsGame.round,
          },
        })
        .eq("id", lobbyId);
    } else if (
      currentPlayer.name === rpsGame.player2 &&
      !rpsGame.player2_choice
    ) {
      await supabase
        .from("lobbies")
        .update({
          rps_game: {
            player1: rpsGame.player1,
            player2: rpsGame.player2,
            player1_choice: rpsGame.player1_choice,
            player2_choice: choice,
            player1_score: rpsGame.player1_score,
            player2_score: rpsGame.player2_score,
            round: rpsGame.round,
          },
        })
        .eq("id", lobbyId);
    }
  };

  const handleContinue = async () => {
    const currentPlayer = players.find((p) => p.id === currentPlayerId);
    if (!currentPlayer) return;

    const confirmedPlayers = rpsGame.confirmed_players || [];
    const hasConfirmed = confirmedPlayers.includes(currentPlayer.name);

    if (hasConfirmed) return;

    const newConfirmed = [...confirmedPlayers, currentPlayer.name];

    if (newConfirmed.length >= 2) {
      const p1 = rpsGame.player1_choice!;
      const p2 = rpsGame.player2_choice!;
      let newP1Score = rpsGame.player1_score;
      let newP2Score = rpsGame.player2_score;

      if (p1 !== p2) {
        if (
          (p1 === "rock" && p2 === "scissors") ||
          (p1 === "scissors" && p2 === "paper") ||
          (p1 === "paper" && p2 === "rock")
        ) {
          newP1Score++;
        } else {
          newP2Score++;
        }
      }

      const cardCode = activePrompt?.card_code || "4S";

      if (newP1Score >= 2) {
        const losers = addMatesToDrinkList([rpsGame.player2]);
        await supabase
          .from("lobbies")
          .update({
            active_prompt: {
              type: "drink",
              card_code: cardCode,
              drawn_by: rpsGame.player2,
              data: {
                players: losers,
                message: `${rpsGame.player2} lost - Drink!`,
              },
              confirmed_players: [],
            },
            rps_game: null,
          })
          .eq("id", lobbyId);
      } else if (newP2Score >= 2) {
        const losers = addMatesToDrinkList([rpsGame.player1]);
        await supabase
          .from("lobbies")
          .update({
            active_prompt: {
              type: "drink",
              card_code: cardCode,
              drawn_by: rpsGame.player1,
              data: {
                players: losers,
                message: `${rpsGame.player1} lost - Drink!`,
              },
              confirmed_players: [],
            },
            rps_game: null,
          })
          .eq("id", lobbyId);
      } else {
        await supabase
          .from("lobbies")
          .update({
            rps_game: {
              player1: rpsGame.player1,
              player2: rpsGame.player2,
              player1_choice: undefined,
              player2_choice: undefined,
              player1_score: newP1Score,
              player2_score: newP2Score,
              round: rpsGame.round + 1,
              confirmed_players: [],
            },
          })
          .eq("id", lobbyId);
      }
    } else {
      await supabase
        .from("lobbies")
        .update({
          rps_game: {
            player1: rpsGame.player1,
            player2: rpsGame.player2,
            player1_choice: rpsGame.player1_choice,
            player2_choice: rpsGame.player2_choice,
            player1_score: rpsGame.player1_score,
            player2_score: rpsGame.player2_score,
            round: rpsGame.round,
            confirmed_players: newConfirmed,
          },
        })
        .eq("id", lobbyId);
    }
  };

  const getRoundWinner = () => {
    if (!rpsGame.player1_choice || !rpsGame.player2_choice) return null;
    
    const p1 = rpsGame.player1_choice;
    const p2 = rpsGame.player2_choice;
    
    if (p1 === p2) return "tie";
    if (
      (p1 === "rock" && p2 === "scissors") ||
      (p1 === "scissors" && p2 === "paper") ||
      (p1 === "paper" && p2 === "rock")
    ) {
      return "player1";
    }
    return "player2";
  };

  const getChoiceEmoji = (choice?: string) => {
    if (choice === "rock") return "🪨";
    if (choice === "paper") return "📄";
    if (choice === "scissors") return "✂️";
    return "";
  };

  const isPlayer1 = currentPlayerId === players.find((p) => p.name === rpsGame.player1)?.id;
  const isPlayer2 = currentPlayerId === players.find((p) => p.name === rpsGame.player2)?.id;
  const isParticipant = isPlayer1 || isPlayer2;

  // Display names and scores from the current player's perspective
  const getDisplayNames = () => {
    if (isPlayer1) {
      return { yourName: rpsGame.player1, opponentName: rpsGame.player2 };
    } else if (isPlayer2) {
      return { yourName: rpsGame.player2, opponentName: rpsGame.player1 };
    }
    return { yourName: rpsGame.player1, opponentName: rpsGame.player2 };
  };

  const getDisplayScore = () => {
    if (isPlayer1) {
      return { yourScore: rpsGame.player1_score, opponentScore: rpsGame.player2_score };
    } else if (isPlayer2) {
      return { yourScore: rpsGame.player2_score, opponentScore: rpsGame.player1_score };
    }
    return { yourScore: rpsGame.player1_score, opponentScore: rpsGame.player2_score };
  };

  const { yourName, opponentName } = getDisplayNames();
  const { yourScore, opponentScore } = getDisplayScore();

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-60 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg p-8 shadow-2xl max-w-3xl w-full mx-4">
        <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
          Rock Paper Scissors!
        </h2>
        <div className="text-center mb-6">
          <p className="text-xl font-semibold">
            {yourName} vs {opponentName}
          </p>
          <p className="text-lg text-gray-600 mt-2">
            Round {rpsGame.round} - First to 2 wins!
          </p>
          <p className="text-2xl font-bold mt-4">
            Score: {yourScore} - {opponentScore}
          </p>
        </div>

        {!rpsGame.player1_choice || !rpsGame.player2_choice ? (
          <div className="space-y-6">
            <p className="text-center text-lg font-semibold">
              {!rpsGame.player1_choice && isPlayer1
                ? "Choose your move!"
                : !rpsGame.player2_choice && isPlayer2
                ? "Choose your move!"
                : "Waiting for players to choose..."}
            </p>
            <div className="grid grid-cols-3 gap-4">
              {(["rock", "paper", "scissors"] as const).map((choice) => (
                <Button
                  key={choice}
                  onClick={() => handleChoice(choice)}
                  disabled={
                    (isPlayer1 && !!rpsGame.player1_choice) ||
                    (isPlayer2 && !!rpsGame.player2_choice) ||
                    !isParticipant
                  }
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-6 px-4 rounded-lg text-2xl transition-all"
                >
                  {getChoiceEmoji(choice)}
                  <br />
                  <span className="text-sm">{choice}</span>
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-2xl mb-4">
                {rpsGame.player1}: {getChoiceEmoji(rpsGame.player1_choice)}
                {" vs "}
                {rpsGame.player2}: {getChoiceEmoji(rpsGame.player2_choice)}
              </p>
              <p className="text-xl font-bold">
                {(() => {
                  const winner = getRoundWinner();
                  if (winner === "tie") return "It's a tie! Go again!";
                  if (winner === "player1") return `${rpsGame.player1} wins this round!`;
                  return `${rpsGame.player2} wins this round!`;
                })()}
              </p>
            </div>

            <div className="mb-4 text-center">
              <p className="text-sm text-gray-600">
                Confirmed:{" "}
                {rpsGame.confirmed_players?.includes(rpsGame.player1) && (
                  <span className="text-green-600 font-semibold">
                    {rpsGame.player1} ✓
                  </span>
                )}
                {rpsGame.confirmed_players?.includes(rpsGame.player1) &&
                  rpsGame.confirmed_players?.includes(rpsGame.player2) &&
                  " | "}
                {rpsGame.confirmed_players?.includes(rpsGame.player2) && (
                  <span className="text-green-600 font-semibold">
                    {rpsGame.player2} ✓
                  </span>
                )}
              </p>
            </div>

            {isParticipant ? (
              <Button
                onClick={handleContinue}
                disabled={rpsGame.confirmed_players?.includes(
                  players.find((p) => p.id === currentPlayerId)?.name || ""
                )}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-lg transition-all"
              >
                {rpsGame.confirmed_players?.includes(
                  players.find((p) => p.id === currentPlayerId)?.name || ""
                )
                  ? "Waiting for other player..."
                  : "Continue"}
              </Button>
            ) : (
              <p className="text-center text-gray-600 py-4 font-semibold">
                Waiting for {rpsGame.player1} and {rpsGame.player2} to continue...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
