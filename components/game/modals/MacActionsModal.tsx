"use client";

import { Button } from "@/components/ui/button";

interface MacActionsModalProps {
  actionsRemaining: number;
  onSelectAction: (action: "karate" | "confession" | "challenge" | "protein") => void;
  onClose: () => void;
}

export function MacActionsModal({
  actionsRemaining,
  onSelectAction,
  onClose,
}: MacActionsModalProps) {
  const handleActionClick = (action: "karate" | "confession" | "challenge" | "protein" | "bodyguard", isImplemented: boolean) => {
    if (actionsRemaining <= 0) {
      alert("No actions remaining!");
      return;
    }
    
    if (!isImplemented) {
      if (action === "bodyguard") {
        alert("Bodyguard: Use this during a drink prompt to shield another player!");
      } else if (action === "protein") {
        alert("Protein Share: Use this when YOU need to drink to split it with another player!");
      }
      return;
    }
    
    // Only call onSelectAction for implemented actions
    if (action !== "bodyguard") {
      onSelectAction(action);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-70 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg p-8 shadow-2xl max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              Mac&apos;s Actions
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {actionsRemaining > 0 ? (
                <span className="text-green-600 font-semibold">
                  {actionsRemaining} action{actionsRemaining !== 1 ? "s" : ""} remaining
                </span>
              ) : (
                <span className="text-red-600 font-semibold">
                  All actions used - You must drink double for the rest of the game!
                </span>
              )}
            </p>
          </div>
          <Button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </Button>
        </div>

        <div className="space-y-3">
          {/* 1. Bodyguard */}
          <Button
            onClick={() => handleActionClick("bodyguard", false)}
            disabled={actionsRemaining <= 0}
            className="w-full text-left p-4 bg-blue-50 hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg border-2 border-blue-200 transition-all"
          >
            <div className="font-bold text-lg">🛡️ 1. Bodyguard</div>
            <div className="text-sm text-gray-600">
              Shield another player from a drink penalty
            </div>
          </Button>

          {/* 2. Karate Demonstration */}
          <button
            onClick={() => handleActionClick("karate", true)}
            disabled={actionsRemaining <= 0}
            className="w-full text-left p-4 bg-blue-50 hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg border-2 border-blue-200 transition-all"
          >
            <div className="font-bold text-lg">🥋 2. Karate Demonstration</div>
            <div className="text-sm text-gray-600">
              Force a player to type/act out a karate move or drink
            </div>
          </button>

          {/* 3. Confession Time */}
          <button
            onClick={() => handleActionClick("confession", true)}
            disabled={actionsRemaining <= 0}
            className="w-full text-left p-4 bg-blue-50 hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg border-2 border-blue-200 transition-all"
          >
            <div className="font-bold text-lg">🗣️ 3. Confession Time</div>
            <div className="text-sm text-gray-600">
              Pick a player to confess something or drink
            </div>
          </button>

          {/* 4. Protein Share */}
          <button
            onClick={() => handleActionClick("protein", false)}
            disabled={actionsRemaining <= 0}
            className="w-full text-left p-4 bg-blue-50 hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg border-2 border-blue-200 transition-all"
          >
            <div className="font-bold text-lg">🥤 4. Protein Share</div>
            <div className="text-sm text-gray-600">
              Assign half your drink to another player
            </div>
          </button>

          {/* 5. Challenge of Toughness */}
          <button
            onClick={() => handleActionClick("challenge", true)}
            disabled={actionsRemaining <= 0}
            className="w-full text-left p-4 bg-blue-50 hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg border-2 border-blue-200 transition-all"
          >
            <div className="font-bold text-lg">🎲 5. Challenge of Toughness</div>
            <div className="text-sm text-gray-600">
              Dice roll challenge - loser drinks double
            </div>
          </button>
        </div>

        <Button
          onClick={onClose}
          className="mt-6 w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
        >
          Close
        </Button>
      </div>
    </div>
  );
}
