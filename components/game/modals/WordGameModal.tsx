"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Player } from "@/lib/types";

const ALWAYS_SUNNY_EPISODES = [
  "The Gang Gets Racist",
  "Charlie Wants an Abortion",
  "Underage Drinking: A National Concern",
  "Charlie Has Cancer",
  "Gun Fever",
  "The Gang Finds a Dead Guy",
  "Charlie Gets Crippled",
  "The Gang Goes Jihad",
  "The Gang Gives Back",
  "Dennis and Dee Go on Welfare",
  "Mac Bangs Dennis' Mom",
  "Hundred Dollar Baby",
  "The Gang Exploits a Miracle",
  "Dennis Looks Like a Registered Sex Offender",
  "Mac is a Serial Killer",
  "The Gang Solves the North Korea Situation",
  "The Gang Gets Invincible",
  "Dennis Reynolds: An Erotic Life",
  "Dee Reynolds: Shaping America's Youth",
  "Sweet Dee's Dating a Retarded Person",
  "Mac and Charlie: White Trash",
  "Dee Gets Audited",
  "The Gang Gets Held Hostage",
  "The Gang Finds a Dumpster Baby",
  "The Gang Gets Extreme: Home Makeover Edition",
  "America's Next Top Paddy's Billboard Model Contest",
  "The Aluminum Monster vs. Fatty Magoo",
  "Who Pooped the Bed?",
  "The Nightman Cometh",
  "Mac and Dennis: Manhunters",
  "The Gang Hits the Road",
  "The Great Recession",
  "The Gang Gets a New Member",
  "Mac and Charlie Write a Movie",
  "The Gang Cracks the Liberty Bell",
  "The Gang Wrestles for the Troops",
  "The Gang Reignites the Rivalry",
  "Paddy's Pub: Home of the Original Kitten Mittens",
  "Mac and Dennis Break Up",
  "The D.E.N.N.I.S. System",
  "Mac and Charlie: White Trash",
  "The Gang Gives Frank an Intervention",
  "Dee Gives Birth",
];

interface WordGame {
  type: "7-episodes" | "9-rhyme" | "10-category";
  currentWord?: string;
  usedWords: string[];
  currentPlayerIndex: number;
  startingPlayer: string;
}

interface WordGameModalProps {
  wordGame: WordGame;
  players: Player[];
  currentPlayerId: string | null;
  lobbyId: string;
  currentLobbyPlayerId: string;
  turnNumber: number;
  addMatesToDrinkList: (players: string[]) => string[];
}

export function WordGameModal({
  wordGame,
  players,
  currentPlayerId,
  lobbyId,
  currentLobbyPlayerId,
  turnNumber,
  addMatesToDrinkList,
}: WordGameModalProps) {
  const supabase = createClient();

  const handleSubmit = async (value: string) => {
    if (!value) return;

    // Validation logic
    if (wordGame.type === "7-episodes") {
      const isValid = ALWAYS_SUNNY_EPISODES.some(
        (ep) => ep.toLowerCase() === value.toLowerCase()
      );
      const isRepeat = wordGame.usedWords.some(
        (w) => w.toLowerCase() === value.toLowerCase()
      );

      if (!isValid) {
        alert("That's not a valid Always Sunny episode!");
        return;
      }
      if (isRepeat) {
        alert("That episode was already used! You get one more chance.");
        return;
      }
    }

    // Check for duplicates in rhyme and category games
    if (wordGame.type === "9-rhyme" && wordGame.currentWord) {
      const isRepeat = wordGame.usedWords.some(
        (w) => w.toLowerCase() === value.toLowerCase()
      );
      if (isRepeat) {
        alert('That word was already used! Try again or click "I Don\'t Know"');
        return;
      }
    }

    if (wordGame.type === "10-category" && wordGame.currentWord) {
      const isRepeat = wordGame.usedWords.some(
        (w) => w.toLowerCase() === value.toLowerCase()
      );
      if (isRepeat) {
        alert('That answer was already used! Try again or click "I Don\'t Know"');
        return;
      }
    }

    // For rhyme/category game, if this is the first input, it's setting the word/category
    const isSettingInitial =
      (wordGame.type === "9-rhyme" || wordGame.type === "10-category") &&
      !wordGame.currentWord;
    const newUsedWords = isSettingInitial
      ? []
      : [...wordGame.usedWords, value];
    const nextPlayerIndex = (wordGame.currentPlayerIndex + 1) % players.length;

    await supabase
      .from("lobbies")
      .update({
        word_game: {
          type: wordGame.type,
          current_word: wordGame.currentWord || value,
          used_words: newUsedWords,
          current_player_index: nextPlayerIndex,
          starting_player: wordGame.startingPlayer,
        },
      })
      .eq("id", lobbyId);
  };

  const handleCantAnswer = async () => {
    const currentPlayer = players[wordGame.currentPlayerIndex];
    const failedDrinkers = addMatesToDrinkList([currentPlayer.name]);
    await supabase
      .from("lobbies")
      .update({
        active_prompt: {
          type: "drink",
          card_code: "7S",
          drawn_by: currentPlayer.name,
          data: {
            players: failedDrinkers,
            message: `${currentPlayer.name} couldn't answer - Drink!`,
          },
          confirmed_players: [],
        },
        word_game: null,
      })
      .eq("id", lobbyId);
  };

  const handleChallenge = async () => {
    const lastAnswer = wordGame.usedWords[wordGame.usedWords.length - 1];
    const confirm = window.confirm(
      `Challenge "${lastAnswer}"? If you're right, the player who said it drinks!`
    );
    
    if (!confirm) return;

    const previousPlayerIndex =
      (wordGame.currentPlayerIndex - 1 + players.length) % players.length;
    const challengedPlayer = players[previousPlayerIndex];

    await supabase
      .from("lobbies")
      .update({
        active_prompt: {
          type: "drink",
          card_code: wordGame.type === "9-rhyme" ? "9S" : "0S",
          drawn_by: players.find((p) => p.id === currentPlayerId)?.name || "Someone",
          data: {
            players: [challengedPlayer.name],
            message: `${challengedPlayer.name}'s answer "${lastAnswer}" was challenged - Drink!`,
          },
          confirmed_players: [],
        },
        word_game: null,
      })
      .eq("id", lobbyId);
  };

  const handleEndGame = async () => {
    const currentPlayerIndex = players.findIndex(
      (p) => p.id === currentLobbyPlayerId
    );
    const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    const nextPlayer = players[nextPlayerIndex];

    await supabase
      .from("lobbies")
      .update({
        word_game: null,
        current_player_id: nextPlayer.id,
        turn_number: turnNumber + 1,
      })
      .eq("id", lobbyId);
  };

  const isCurrentPlayer = currentPlayerId === players[wordGame.currentPlayerIndex]?.id;

  const getPlaceholder = () => {
    if (wordGame.type === "7-episodes") return "Episode name...";
    if (wordGame.type === "9-rhyme" && !wordGame.currentWord)
      return "Enter a word to rhyme...";
    if (wordGame.type === "10-category" && !wordGame.currentWord)
      return "Enter a category (e.g., Countries, Animals)...";
    if (wordGame.type === "10-category")
      return `Name something in category: ${wordGame.currentWord}`;
    return "Your answer...";
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-60 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg p-8 shadow-2xl max-w-2xl w-full mx-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
          {wordGame.type === "7-episodes" && "Name an Always Sunny Episode!"}
          {wordGame.type === "9-rhyme" &&
            `Rhyme with: ${wordGame.currentWord || "(waiting for word)"}`}
          {wordGame.type === "10-category" && (
            <span>
              Category:{" "}
              <span className="text-blue-600">
                {wordGame.currentWord || "(waiting for category)"}
              </span>
            </span>
          )}
        </h2>

        {wordGame.type === "10-category" && !wordGame.currentWord && (
          <p className="text-center text-sm text-gray-600 mb-4">
            {wordGame.startingPlayer} sets the category! (e.g., &quot;Countries&quot;,
            &quot;Animals&quot;, &quot;TV Shows&quot;)
          </p>
        )}

        {wordGame.type === "10-category" && wordGame.currentWord && (
          <p className="text-center text-sm text-orange-600 mb-4 font-semibold">
            ⚠️ Players: Challenge invalid answers! If someone&apos;s answer doesn&apos;t
            fit, they drink!
          </p>
        )}

        <div className="mb-6">
          <p className="text-center text-lg font-semibold mb-2">
            Current Player: {players[wordGame.currentPlayerIndex]?.name}
          </p>
          {wordGame.usedWords.length > 0 && (
            <div className="bg-gray-100 rounded p-4">
              <p className="text-sm text-gray-600 font-semibold mb-2 text-center">
                Last Answer:
              </p>

              {wordGame.type === "7-episodes" && (
                <div className="w-full text-lg font-bold text-gray-700 py-2 px-4 text-center bg-white rounded border-2 border-gray-300">
                  &quot;{wordGame.usedWords[wordGame.usedWords.length - 1]}&quot;
                </div>
              )}

              {(wordGame.type === "9-rhyme" || wordGame.type === "10-category") && (
                <button
                  onClick={handleChallenge}
                  className="w-full text-lg font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 py-2 px-4 rounded transition-all border-2 border-blue-300 hover:border-blue-500"
                >
                  &quot;{wordGame.usedWords[wordGame.usedWords.length - 1]}&quot;
                  <span className="block text-xs text-gray-500 mt-1">
                    Click to challenge if wrong
                  </span>
                </button>
              )}
            </div>
          )}
        </div>

        {isCurrentPlayer ? (
          <div className="space-y-4">
            <input
              type="text"
              placeholder={getPlaceholder()}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
              id="word-game-input"
              onKeyDown={async (e) => {
                if (e.key === "Enter") {
                  const value = e.currentTarget.value.trim();
                  e.currentTarget.value = "";
                  await handleSubmit(value);
                }
              }}
            />
            <div className="flex gap-4">
              <Button
                onClick={async () => {
                  const input = document.getElementById(
                    "word-game-input"
                  ) as HTMLInputElement;
                  const value = input?.value.trim();
                  if (input) input.value = "";
                  if (value) await handleSubmit(value);
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
              >
                Submit
              </Button>
              <Button
                onClick={handleCantAnswer}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
              >
                I Don&apos;t Know
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-600 text-lg">
            Waiting for {players[wordGame.currentPlayerIndex]?.name} to answer...
          </p>
        )}

        <Button
          onClick={handleEndGame}
          className="mt-6 w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
        >
          End Game
        </Button>
      </div>
    </div>
  );
}
