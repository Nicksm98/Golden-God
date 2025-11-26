"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Player } from "@/lib/types";

interface GinoSwapVotingModalProps {
  ginoSwapVoting: {
    swapper: string;
    target: string;
    excuse: string;
    votes: Record<string, boolean>;
  };
  players: Player[];
  currentPlayerId: string | null;
  lobbyId: string;
  onClose: () => void;
  addMatesToDrinkList: (playerNames: string[]) => string[];
}

export function GinoSwapVotingModal({
  ginoSwapVoting,
  players,
  currentPlayerId,
  lobbyId,
  onClose,
  addMatesToDrinkList,
}: GinoSwapVotingModalProps) {
  const supabase = createClient();
  const currentPlayerName = players.find((p) => p.id === currentPlayerId)?.name;
  const isGino = currentPlayerName === ginoSwapVoting.swapper;
  const hasVoted =
    currentPlayerName ? ginoSwapVoting.votes[currentPlayerName] !== undefined : false;
  const totalVotes = Object.keys(ginoSwapVoting.votes).length;
  const approveVotes = Object.values(ginoSwapVoting.votes).filter((v) => v).length;
  const eligibleVoters = players.length - 1;

  const handleVote = async (approve: boolean) => {
    if (!currentPlayerName || hasVoted) return;

    const newVotes = {
      ...ginoSwapVoting.votes,
      [currentPlayerName]: approve,
    };

    const newTotalVotes = Object.keys(newVotes).length;

    if (newTotalVotes >= eligibleVoters) {
      const newApproveVotes = Object.values(newVotes).filter((v) => v).length;
      const majority = Math.ceil(eligibleVoters / 2);

      if (newApproveVotes >= majority) {
        const drinkPlayers = addMatesToDrinkList([ginoSwapVoting.target]);
        await supabase
          .from("lobbies")
          .update({
            gino_swap_voting: null,
            active_prompt: {
              type: "drink",
              card_code: "AC",
              drawn_by: ginoSwapVoting.swapper,
              data: {
                players: drinkPlayers,
                message: `Gino's excuse was approved! ${ginoSwapVoting.target} drinks instead!`,
              },
              confirmed_players: [],
            },
          })
          .eq("id", lobbyId);
      } else {
        const drinkPlayers = addMatesToDrinkList([ginoSwapVoting.swapper]);
        await supabase
          .from("lobbies")
          .update({
            gino_swap_voting: null,
            active_prompt: {
              type: "drink",
              card_code: "AC",
              drawn_by: ginoSwapVoting.swapper,
              data: {
                players: drinkPlayers,
                message: `Gino's excuse was rejected! ${ginoSwapVoting.swapper} drinks!`,
              },
              confirmed_players: [],
            },
          })
          .eq("id", lobbyId);
      }
      onClose();
    } else {
      await supabase
        .from("lobbies")
        .update({
          gino_swap_voting: {
            ...ginoSwapVoting,
            votes: newVotes,
          },
        })
        .eq("id", lobbyId);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-70 animate-in fade-in duration-200">
      <div className="bg-linear-to-br from-orange-50 to-red-50 rounded-xl p-8 shadow-2xl max-w-2xl w-full mx-4 border-4 border-orange-400">
        <h2 className="text-3xl font-bold text-orange-900 mb-2 text-center">
          🔄 Gino&apos;s Excuse: Vote Time!
        </h2>
        <p className="text-gray-700 text-center mb-4">
          Does this excuse justify the swap?
        </p>

        <div className="bg-white rounded-lg p-6 mb-6 border-2 border-orange-200">
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-600">Gino (Swapper):</span>
              <p className="text-xl font-bold text-orange-900">
                {ginoSwapVoting.swapper}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Target:</span>
              <p className="text-xl font-bold text-orange-900">
                {ginoSwapVoting.target}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Excuse:</span>
              <p className="text-lg text-gray-800 italic">
                &quot;{ginoSwapVoting.excuse}&quot;
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-100 rounded-lg p-4 mb-6">
          <div className="flex justify-between text-sm">
            <div>
              <span className="font-semibold">Votes Cast:</span> {totalVotes} /{" "}
              {eligibleVoters}
            </div>
            <div>
              <span className="text-green-600 font-semibold">Approve:</span>{" "}
              {approveVotes} |{" "}
              <span className="text-red-600 font-semibold">Reject:</span>{" "}
              {totalVotes - approveVotes}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Need {Math.ceil(eligibleVoters / 2)} votes to approve
          </p>
        </div>

        {!isGino && !hasVoted ? (
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => handleVote(true)}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-lg text-lg"
            >
              ✅ APPROVE
            </Button>
            <Button
              onClick={() => handleVote(false)}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 rounded-lg text-lg"
            >
              🚫 REJECT
            </Button>
          </div>
        ) : (
          <div className="text-center">
            {isGino ? (
              <p className="text-gray-700 font-semibold">
                Waiting for other players to vote on your excuse...
              </p>
            ) : (
              <p className="text-green-600 font-semibold">
                ✓ You&apos;ve voted! Waiting for others...
              </p>
            )}
          </div>
        )}

        <p className="text-xs text-gray-500 text-center mt-6">
          If approved, {ginoSwapVoting.target} drinks. If rejected,{" "}
          {ginoSwapVoting.swapper} drinks.
        </p>
      </div>
    </div>
  );
}
