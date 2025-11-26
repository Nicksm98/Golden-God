"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Player } from "@/lib/types";

interface BruceVotingModalProps {
  bruceVoting: {
    bruce: string;
    target: string;
    reason: string;
    votes: Record<string, boolean>;
  };
  players: Player[];
  currentPlayerId: string | null;
  lobbyId: string;
  onClose: () => void;
  addMatesToDrinkList: (playerNames: string[]) => string[];
}

export function BruceVotingModal({
  bruceVoting,
  players,
  currentPlayerId,
  lobbyId,
  onClose,
  addMatesToDrinkList,
}: BruceVotingModalProps) {
  const supabase = createClient();
  const currentPlayerName = players.find((p) => p.id === currentPlayerId)?.name;
  const isBruce = currentPlayerName === bruceVoting.bruce;
  const hasVoted =
    currentPlayerName ? bruceVoting.votes[currentPlayerName] !== undefined : false;
  const totalVotes = Object.keys(bruceVoting.votes).length;
  const scamVotes = Object.values(bruceVoting.votes).filter((v) => v).length;
  const legitimateVotes = totalVotes - scamVotes;
  const eligibleVoters = players.length - 1; // Exclude Bruce from voting

  const handleVote = async (isScam: boolean) => {
    if (!currentPlayerName || hasVoted) return;

    const newVotes = {
      ...bruceVoting.votes,
      [currentPlayerName]: isScam,
    };

    const newTotalVotes = Object.keys(newVotes).length;

    if (newTotalVotes >= eligibleVoters) {
      // All votes are in, determine outcome
      const newScamVotes = Object.values(newVotes).filter((v) => v).length;
      const newLegitimateVotes = newTotalVotes - newScamVotes;

      if (newScamVotes > newLegitimateVotes) {
        // Scam wins - Bruce drinks
        const drinkPlayers = addMatesToDrinkList([bruceVoting.bruce]);
        await supabase
          .from("lobbies")
          .update({
            bruce_voting: null,
            active_prompt: {
              type: "drink",
              card_code: "QH",
              drawn_by: bruceVoting.bruce,
              data: {
                players: drinkPlayers,
                message: `Bruce's charity was voted a SCAM! Bruce drinks!`,
              },
              confirmed_players: [],
            },
          })
          .eq("id", lobbyId);
      } else {
        // Legitimate wins - Target drinks
        const drinkPlayers = addMatesToDrinkList([bruceVoting.target]);
        await supabase
          .from("lobbies")
          .update({
            bruce_voting: null,
            active_prompt: {
              type: "drink",
              card_code: "QH",
              drawn_by: bruceVoting.bruce,
              data: {
                players: drinkPlayers,
                message: `Bruce's charity was LEGITIMATE! ${bruceVoting.target} drinks!`,
              },
              confirmed_players: [],
            },
          })
          .eq("id", lobbyId);
      }
      onClose();
    } else {
      // Update votes
      await supabase
        .from("lobbies")
        .update({
          bruce_voting: {
            ...bruceVoting,
            votes: newVotes,
          },
        })
        .eq("id", lobbyId);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-70 animate-in fade-in duration-200">
      <div className="bg-linear-to-br from-blue-50 to-cyan-50 rounded-xl p-8 shadow-2xl max-w-2xl w-full mx-4 border-4 border-blue-400">
        <h2 className="text-3xl font-bold text-blue-900 mb-2 text-center">
          💰 Bruce&apos;s Charity: Vote Time!
        </h2>
        <p className="text-gray-700 text-center mb-4">
          Is this charity legitimate or a scam?
        </p>

        <div className="bg-white rounded-lg p-6 mb-6 border-2 border-blue-200">
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-600">Bruce:</span>
              <p className="text-xl font-bold text-blue-900">
                {bruceVoting.bruce}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Target:</span>
              <p className="text-xl font-bold text-blue-900">
                {bruceVoting.target}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Reason:</span>
              <p className="text-lg text-gray-800 italic">
                &quot;{bruceVoting.reason}&quot;
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
              <span className="text-red-600 font-semibold">Scam:</span>{" "}
              {scamVotes} | <span className="text-green-600 font-semibold">Legit:</span>{" "}
              {legitimateVotes}
            </div>
          </div>
        </div>

        {!isBruce && !hasVoted ? (
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => handleVote(true)}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-6 rounded-lg text-lg"
            >
              🚫 SCAM!
            </Button>
            <Button
              onClick={() => handleVote(false)}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-lg text-lg"
            >
              ✅ LEGITIMATE
            </Button>
          </div>
        ) : (
          <div className="text-center">
            {isBruce ? (
              <p className="text-gray-700 font-semibold">
                Waiting for other players to vote...
              </p>
            ) : (
              <p className="text-green-600 font-semibold">
                ✓ You&apos;ve voted! Waiting for others...
              </p>
            )}
          </div>
        )}

        <p className="text-xs text-gray-500 text-center mt-6">
          If SCAM wins, Bruce drinks. If LEGITIMATE wins, {bruceVoting.target}{" "}
          drinks.
        </p>
      </div>
    </div>
  );
}
