"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Player } from "@/lib/types";

// Calculate Levenshtein distance for fuzzy string matching
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[len1][len2];
}

// Check if input is close enough to any episode (allows for typos)
function isCloseMatch(input: string, episodes: string[]): { match: boolean; closestEpisode?: string } {
  const normalizedInput = input.toLowerCase().trim();
  
  // First check for exact match
  const exactMatch = episodes.find(ep => ep.toLowerCase() === normalizedInput);
  if (exactMatch) {
    return { match: true, closestEpisode: exactMatch };
  }
  
  // Much more lenient matching - allow up to 35% character differences
  // This handles abbreviations like "d makes a smt fim" for "Dee Made a Smut Film"
  const maxDistance = Math.max(4, Math.floor(normalizedInput.length * 0.35));
  
  let bestMatch: { episode: string; distance: number } | null = null;
  
  for (const episode of episodes) {
    const distance = levenshteinDistance(normalizedInput, episode.toLowerCase());
    if (distance <= maxDistance) {
      if (!bestMatch || distance < bestMatch.distance) {
        bestMatch = { episode, distance };
      }
    }
  }
  
  // Also try matching against episode without "The Gang" prefix for convenience
  if (!bestMatch) {
    const inputWithoutCommon = normalizedInput.replace(/^(the gang |gang |the )/i, '');
    const relaxedMaxDistance = Math.max(5, Math.floor(inputWithoutCommon.length * 0.4));
    
    for (const episode of episodes) {
      const episodeWithoutPrefix = episode.toLowerCase().replace(/^the gang /i, '');
      const distance = levenshteinDistance(inputWithoutCommon, episodeWithoutPrefix);
      if (distance <= relaxedMaxDistance) {
        if (!bestMatch || distance < bestMatch.distance) {
          bestMatch = { episode, distance };
        }
      }
    }
  }
  
  return bestMatch 
    ? { match: true, closestEpisode: bestMatch.episode }
    : { match: false };
}

const ALWAYS_SUNNY_EPISODES = [
  "The Gang Gets Racist",
  "Charlie Wants an Abortion",
  "Underage Drinking: A National Concern",
  "Charlie Has Cancer",
  "Gun Fever",
  "The Gang Finds a Dead Guy",
  "Charlie Got Molested",
  "Charlie Gets Crippled",
  "The Gang Goes Jihad",
  "Dennis and Dee Go on Welfare",
  "Mac Bangs Dennis' Mom",
  "Hundred Dollar Baby",
  "The Gang Gives Back",
  "The Gang Exploits a Miracle",
  "The Gang Runs For Office",
  "Charlie Goes America All Over Everbody's Ass",
  "Dennis and Dee Get A New Dad",
  "The Gang Finds a Dumpster Baby",
  "The Gang Gets Invincible",
  "Dennis and Dee's Mom Is Dead",
  "The Gang Gets Held Hostage",
  "The Aluminum Monster vs. Fatty Magoo",
  "The Gang Solves the North Korea Situation",
  "The Gang Sells Out",
  "Frank Sets Sweet Dee on Fire",
  "Sweet Dee's Dating a Retarded Person",
  "Mac is a Serial Killer",
  "Dennis Looks Like a Registered Sex Offender",
  "The Gang Gets Whacked, Part 1",
  "The Gang Gets Whacked, Part 2",
  "Bums: Making a Mess All Over the City",
  "The Gang Dances Their Asses Off",
  "Mac and Dennis: Manhunters",
  "The Gang Solves the Gas Crisis",
  "America's Next Top Paddy's Billboard Model Contest",
  "Mac's Banging the Waitress",
  "Mac and Charlie Die, Part 1",
  "Mac and Charlie Die, Part 2",
  "Who Pooped the Bed?",
  "Paddy's Pub: The Worst Bar in Philadelphia",
  "Dennis Reynolds: An Erotic Life",
  "Sweet Dee Has a Heart Attack",
  "The Gang Cracks the Liberty Bell",
  "The Gang Gets Extreme: Home Makeover Edition",
  "The Nightman Cometh",
  "The Gang Exploits the Mortgage Crisis",
  "The Gang Hits the Road",
  "The Great Recession",
  "The Gang Gives Frank an Intervention",
  "The Waitress Is Getting Married",
  "The World Series Defense",
  "The Gang Wrestles for the Troops",
  "Paddy's Pub: Home of the Original Kitten Mittens",
  "Mac and Dennis Break Up",
  "The D.E.N.N.I.S. System",
  "Mac and Charlie Write a Movie",
  "The Gang Reignites the Rivalry",
  "Mac Fights Gay Marriage",
  "Dennis Gets Divorced",
  "The Gang Buys a Boat",
  "Mac's Big Break",
  "Mac and Charlie: White Trash",
  "Mac's Mom Burns Her House Down",
  "Who Got Dee Pregnant?",
  "The Gang Gets a New Member",
  "Dee Reynolds: Shaping America's Youth",
  "Charlie Kelly: King of the Rats",
  "The Gang Gets Stranded in the Woods",
  "Dee Gives Birth",
  "It's a Very Sunny Christmas",
  "Frank's Pretty Woman",
  "The Gang Goes to the Jersey Shore",
  "Frank Reynolds' Little Beauties",
  "Sweet Dee Gets Audited",
  "Frank's Brother",
  "The Storm of the century",
  "Chardee MacDennis: the Game of Games",
  "The ANTI-Social Network",
  "The Gang Gets Trapped",
  "How Mac Got Fat",
  "Thunder Gun Express",
  "The High School Reunion",
  "The High School Reunion Part 2: The Gang's Revenge",
  "Pop-Pop: The Final Solution",
  "The Gang Recycles Their Trash",
  "The Maureen Ponderosa Wedding Massacre",
  "Charlie and Dee Find Love",
  "The Gang Gets Analyzed",
  "Charlie's Mom Has Cancer",
  "Frank's Back in Business",
  "Charlie Rules the World",
  "The Gang Dines Out",
  "Reynolds vs. Reynolds: The Cereal Defense",
  "The Gang Broke Dee",
  "Gun Fever Too: Still Hot",
  "The Gang Tries Desperately to Win an Award",
  "Mac and Dennis Buy a Timeshare",
  "Mac Day",
  "The Gang Saves the Day",
  "The Gang Gets Quarantined",
  "Flowers For Charlie",
  "The Gang Makes Lethal Weapon 6",
  "The Gang Squashes Their Beefs",
  "The Gang Beats Boggs",
  "The Gang Group Dates",
  "Pyscho Pete Returns",
  "Charlie Work",
  "The Gang Spies Like U.S.",
  "The Gang Misses the Boat",
  "Mac Kills His Dad",
  "The Gang Goes on Family Fight",
  "Frank Retires",
  "Ass Kickers United: Mac and Charlie Join a Cult",
  "Chardee MacDennis 2: Electric Boogaloo",
  "Frank Falls Out the Window",
  "The Gang Hits the Slopes",
  "Dee Made a Smut Film",
  "Mac & Dennis Move to the Suburbs",
  "Being Frank",
  "McPoyle vs. Ponderosa: The Trial of the Century",
  "Charlie Catches a Leprechaun",
  "The Gang Goes to Hell, Part 1",
  "The Gang Goes to Hell, Part 2",
  "The Gang Turns Black",
  "The Gang Goes to a Water Park",
  "Old Lady House: A Sitation Comedy",
  "Wolf Cola: A Relations Nightmare",
  "Making Dennis Reynolds a Murderer",
  "Hero or Hate Crime?",
  "PTSDee",
  "The Gang Tends Bar",
  "A Cricket's Tale",
  "Dennis' Double Life",
  "The Gang Makes Paddy's Great Again",
  "The Gang Escapes",
  "The Gang Beats Boggs: Ladies Reboot",
  "Time's Up for the Gang",
  "The Gang Gets New Wheels",
  "The Gang Solves the Bathroom Problem",
  "The Gang Does a Clip Show",
  "Charlie's Home Alone",
  "The Gang Wins the Big Game",
  "Mac Finds His Pride",
  "The Gang Gets Romantic",
  "Thunder Gun 4: Maximum Cool",
  "Dee Day",
  "The Gang Chokes",
  "The Gang Texts",
  "The Janitor Always Mops Twice",
  "The Gang Solves Global Warming",
  "Paddy's Has a Jumper",
  "A Woman's Right to Chop",
  "Waiting For Big Mo",
  "2020: A Year In Review",
  "The Gang Makes Lethal Weapon 7",
  "The Gang Buys A Roller Rink",
  "The Gang Replaces Dee With A Monkey",
  "The Gang Goes to Ireland",
  "The Gang's Still in Ireland",
  "Dee Sinks In A Bog",
  "The Gang Carries A Corpse Up A Mountain",
  "The Gang Inflates",
  "Frank Shoots Every Member of the Gang",
  "The Gang Gets Cursed",
  "Frank vs. Russia",
  "Celebrity Booze: The Ultimate Cash Grab",
  "Risk E. Rat's Pizza and Amusement Center",
  "The Gang Goes Bowling",
  "Dennis Takes a Mental Health Day",
  "The Gang F***s Up Abbott Elementary",
  "Frank Is In a Coma",
  "Mac and Dennis Become EMTs",
  "Thought Leadership: A Corporate Conversation",
  "The Gang Goes to a Dog Track",
  "Overage Drinking: A National Concern",
  "The Gang Gets Ready for Prime Time",
  "The Golden Bachelor Live",
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
  const [isProcessing, setIsProcessing] = useState(false);

  // Safety check - should never happen due to conditional rendering, but prevents race conditions
  if (!wordGame) return null;

  const handleSubmit = async (value: string) => {
    if (!value || !wordGame || isProcessing) return;
    setIsProcessing(true);

    if (wordGame.type === "7-episodes") {
      const { match: isValid, closestEpisode } = isCloseMatch(value, ALWAYS_SUNNY_EPISODES);
      const isRepeat = wordGame.usedWords.some(
        (w) => w.toLowerCase() === closestEpisode?.toLowerCase() || w.toLowerCase() === value.toLowerCase()
      );

      if (!isValid) {
        alert("That's not a valid Always Sunny episode!");
        // Player failed - end game and advance turn
        const currentPlayer = players[wordGame.currentPlayerIndex];
        const failedDrinkers = addMatesToDrinkList([currentPlayer.name]);
        
        const currentPlayerIndex = players.findIndex(
          (p) => p.id === currentLobbyPlayerId
        );
        const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
        const nextPlayer = players[nextPlayerIndex];
        
        await supabase
          .from("lobbies")
          .update({
            active_prompt: {
              type: "drink",
              card_code: "7S",
              drawn_by: currentPlayer.name,
              data: {
                players: failedDrinkers,
                message: `${currentPlayer.name} gave an invalid episode - Drink!`,
              },
              confirmed_players: [],
            },
            word_game: null,
            current_player_id: nextPlayer.id,
            turn_number: turnNumber + 1,
          })
          .eq("id", lobbyId);
        return;
      }
      if (isRepeat) {
        alert("That episode was already used!");
        // Player failed - end game and advance turn
        const currentPlayer = players[wordGame.currentPlayerIndex];
        const failedDrinkers = addMatesToDrinkList([currentPlayer.name]);
        
        const currentPlayerIndex = players.findIndex(
          (p) => p.id === currentLobbyPlayerId
        );
        const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
        const nextPlayer = players[nextPlayerIndex];
        
        await supabase
          .from("lobbies")
          .update({
            active_prompt: {
              type: "drink",
              card_code: "7S",
              drawn_by: currentPlayer.name,
              data: {
                players: failedDrinkers,
                message: `${currentPlayer.name} repeated an episode - Drink!`,
              },
              confirmed_players: [],
            },
            word_game: null,
            current_player_id: nextPlayer.id,
            turn_number: turnNumber + 1,
          })
          .eq("id", lobbyId);
        return;
      }
      
      // Use the matched episode name for consistency
      value = closestEpisode || value;
    }

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
    if (!wordGame || isProcessing) return;
    setIsProcessing(true);
    
    const currentPlayer = players[wordGame.currentPlayerIndex];
    const failedDrinkers = addMatesToDrinkList([currentPlayer.name]);
    
    // Advance to next turn
    const currentPlayerIndex = players.findIndex(
      (p) => p.id === currentLobbyPlayerId
    );
    const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    const nextPlayer = players[nextPlayerIndex];
    
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
        current_player_id: nextPlayer.id,
        turn_number: turnNumber + 1,
      })
      .eq("id", lobbyId);
  };

  const handleChallenge = async () => {
    if (!wordGame || wordGame.usedWords.length === 0 || isProcessing) return;
    const lastAnswer = wordGame.usedWords[wordGame.usedWords.length - 1];
    const confirm = window.confirm(
      `Challenge "${lastAnswer}"? If you're right, the player who said it drinks!`
    );
    
    if (!confirm) return;
    setIsProcessing(true);

    const previousPlayerIndex =
      (wordGame.currentPlayerIndex - 1 + players.length) % players.length;
    const challengedPlayer = players[previousPlayerIndex];
    
    // Advance to next turn
    const currentPlayerIndex = players.findIndex(
      (p) => p.id === currentLobbyPlayerId
    );
    const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    const nextPlayer = players[nextPlayerIndex];

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
        current_player_id: nextPlayer.id,
        turn_number: turnNumber + 1,
      })
      .eq("id", lobbyId);
  };

  const handleEndGame = async () => {
    if (!wordGame || isProcessing) return;
    setIsProcessing(true);
    
    // Just clear the word game without advancing turn
    // Turn should only advance when someone fails
    await supabase
      .from("lobbies")
      .update({
        word_game: null,
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
              disabled={isProcessing}
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
                disabled={isProcessing}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-all"
              >
                Submit
              </Button>
              <Button
                onClick={handleCantAnswer}
                disabled={isProcessing}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-all"
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
          disabled={isProcessing}
          className="mt-6 w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-all"
        >
          End Game
        </Button>
      </div>
    </div>
  );
}
