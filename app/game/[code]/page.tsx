"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  generateShamrockPositions,
  getCardRole,
  cardAssignsRole,
} from "@/lib/game";
import { GameHistory } from "@/components/GameHistory";
import { GameChat } from "@/components/GameChat";
import { useSoundEffects } from "@/hooks/use-sound-effects";
import { logGameEvent, updatePlayerStats, GameStats } from "@/lib/game-events";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GameStats as GameStatsModal } from "@/components/GameStats";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ToastContainer, showToast } from "@/components/Toast";
import { DrinkPromptModal } from "@/components/game/modals/DrinkPromptModal";
import { NightmanResponseModal } from "@/components/game/modals/NightmanResponseModal";
import { MateSelectionModal } from "@/components/game/modals/MateSelectionModal";
import { DrawnCardModal } from "@/components/game/modals/DrawnCardModal";
import { GameOverModal } from "@/components/game/modals/GameOverModal";
import { RulesModal } from "@/components/game/modals/RulesModal";
import { BarbaraDiceRollModal } from "@/components/game/modals/BarbaraDiceRollModal";
import { FrankPerformModal } from "@/components/game/modals/FrankPerformModal";
import { DaymanActionsModal } from "@/components/game/modals/DaymanActionsModal";
import { DaymanSelectNightmanModal } from "@/components/game/modals/DaymanSelectNightmanModal";
import { BruceDonationModal } from "@/components/game/modals/BruceDonationModal";
import { BruceVotingModal } from "@/components/game/modals/BruceVotingModal";
import { GinoSwapTargetModal } from "@/components/game/modals/GinoSwapTargetModal";
import { GinoSwapVotingModal } from "@/components/game/modals/GinoSwapVotingModal";
import { SaltSnailModal } from "@/components/game/modals/SaltSnailModal";
import { CricketConfessionModal } from "@/components/game/modals/CricketConfessionModal";
import { RPSGameModal } from "@/components/game/modals/RPSGameModal";
import { WordGameModal } from "@/components/game/modals/WordGameModal";
import { MacActionsModal } from "@/components/game/modals/MacActionsModal";
import { MacPlayerSelectionModal } from "@/components/game/modals/MacPlayerSelectionModal";
import { MacActionPromptModal } from "@/components/game/modals/MacActionPromptModal";
import { ChoosePlayerModal } from "@/components/game/modals/ChoosePlayerModal";
import { FrankPerformancePromptModal } from "@/components/game/modals/FrankPerformancePromptModal";
import type {
  Card,
  Player,
  Lobby,
  ActivePrompt,
  RPSGame,
  DrawnCard,
  Mate,
} from "@/lib/types";

// Card component to display a playing card with custom character images
const Card = ({ code }: { code: string }) => {
  // Map card codes to character image filenames
  const cardImageMap: { [key: string]: string } = {
    // Kings
    KS: "golden-god",
    KH: "mac",
    KC: "frank",
    KD: "charlie",
    // Queens
    QS: "dee",
    QH: "carmen",
    QC: "maureen",
    QD: "waitress",
    // Jacks
    JS: "uncle-jack",
    JH: "cricket",
    JC: "z",
    JD: "liam",
    // Number cards
    "0S": "jewish-lawyer",
    "0H": "jewish-lawyer",
    "0C": "jewish-lawyer",
    "0D": "jewish-lawyer",
    "9S": "artemis",
    "9H": "artemis",
    "9C": "artemis",
    "9D": "artemis",
    "8S": "maniac",
    "8H": "maniac",
    "8C": "maniac",
    "8D": "maniac",
    "7S": "country-mac",
    "7H": "country-mac",
    "7C": "country-mac",
    "7D": "country-mac",
    "6S": "mrs-mac",
    "6H": "mrs-mac",
    "6C": "mrs-mac",
    "6D": "mrs-mac",
    "5S": "luther",
    "5H": "luther",
    "5C": "luther",
    "5D": "luther",
    "4S": "Bonnie",
    "4H": "Bonnie",
    "4C": "Bonnie",
    "4D": "Bonnie",
    "3S": "old-black-man",
    "3H": "old-black-man",
    "3C": "old-black-man",
    "3D": "old-black-man",
    "2S": "margaret",
    "2H": "margaret",
    "2C": "margaret",
    "2D": "margaret",
    // Aces
    AS: "barbara",
    AH: "bruce",
    AC: "gino",
    AD: "gail",
  };

  const imageName = cardImageMap[code] || "default";
  const imageUrl = `/${imageName}.jpg`; // Assuming images are .jpg, adjust extension if needed

  // Extract rank and suit from code
  const rank = code.slice(0, -1); // Everything except last character
  const suitCode = code.slice(-1); // Last character

  // Map suit codes to symbols
  const suitMap: { [key: string]: string } = {
    S: "♠",
    H: "♥",
    C: "♣",
    D: "♦",
  };

  const suit = suitMap[suitCode] || "";
  const displayRank = rank === "0" ? "10" : rank; // Convert 0 to 10

  // Determine if suit is red or black
  const isRed = suitCode === "H" || suitCode === "D";
  const suitColor = isRed ? "text-red-600" : "text-black";

  return (
    <div className="relative w-20 h-28">
      <Image
        src={imageUrl}
        alt={`${imageName} card`}
        width={80}
        height={112}
        className={`w-20 h-28 rounded-lg shadow-lg border-2 border-gray-300 bg-white`}
        unoptimized
      />
      {/* Top-left corner indicator */}
      <div
        className={`absolute top-1 left-1 flex flex-col items-center leading-none bg-transparent px-1 ${suitColor} font-bold text-xs`}
      >
        <span className="drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
          {displayRank}
        </span>
        <span className="text-base drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
          {suit}
        </span>
      </div>
      <div
        className={`absolute bottom-1 right-1 flex flex-col items-center leading-none bg-transparent px-1 ${suitColor} font-bold text-xs rotate-180`}
      >
        <span className="drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
          {displayRank}
        </span>
        <span className="text-base drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
          {suit}
        </span>
      </div>
    </div>
  );
};

/**
 * Main game page component
 * Handles all game logic, real-time updates, and player interactions
 */
function GamePage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const supabase = createClient();

  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [showRules, setShowRules] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [drawnCard, setDrawnCard] = useState<DrawnCard | null>(null);

  // Mini-game and prompt states
  const [activePrompt, setActivePrompt] = useState<ActivePrompt | null>(null);
  const [rpsGame, setRpsGame] = useState<RPSGame | null>(null);
  const [wordGame, setWordGame] = useState<{
    type: "7-episodes" | "9-rhyme" | "10-category";
    currentWord: string;
    usedWords: string[];
    currentPlayerIndex: number;
    startingPlayer: string;
  } | null>(null);
  const [, setMate] = useState<Mate | null>(null);
  const [barbaraDiceRoll, setBarbaraDiceRoll] = useState<{
    rolling: boolean;
    result: number | null;
    playerName: string;
  } | null>(null);
  const [showMacActions, setShowMacActions] = useState<boolean>(false);
  const [macSelectingPlayer, setMacSelectingPlayer] = useState<"karate" | "confession" | "challenge" | "protein" | null>(null);
  const [showFrankPerform, setShowFrankPerform] = useState<boolean>(false);
  const [showDaymanActions, setShowDaymanActions] = useState<boolean>(false);
  const [daymanSelectingNightman, setDaymanSelectingNightman] = useState<boolean>(false);
  const [bruceSelectingDonation, setBruceSelectingDonation] = useState<boolean>(false);
  const [ginoSwapVoting, setGinoSwapVoting] = useState<{
    swapper: string;
    target: string;
    excuse: string;
    votes: Record<string, boolean>;
  } | null>(null);
  const [showSaltSnail, setShowSaltSnail] = useState<boolean>(false);
  const [cricketConfession, setCricketConfession] = useState<boolean>(false);
  const [showGameHistory, setShowGameHistory] = useState<boolean>(false);
  const [showChat, setShowChat] = useState<boolean>(false);
  const [showGameStats, setShowGameStats] = useState<boolean>(false);
  const [isDrawingCard, setIsDrawingCard] = useState<boolean>(false);
  const [nightmanTimer, setNightmanTimer] = useState<number>(10);

  const { playSound } = useSoundEffects();
  const shamrockPositions = generateShamrockPositions();

  // Helper function to add mates to drink list
  const addMatesToDrinkList = useCallback((playerNames: string[]): string[] => {
    if (!lobby?.mate) return playerNames;
    
    const { player1, player2 } = lobby.mate;
    const expandedList = [...playerNames];
    
    // If either mate is in the list, add their partner
    if (playerNames.includes(player1) && !playerNames.includes(player2)) {
      expandedList.push(player2);
    }
    if (playerNames.includes(player2) && !playerNames.includes(player1)) {
      expandedList.push(player1);
    }
    
    return expandedList;
  }, [lobby?.mate]);

  // Sync lobby state to local state
  useEffect(() => {
    if (!lobby) return;

    // Sync active prompt - convert snake_case from DB to camelCase for TypeScript
    if (lobby.active_prompt) {
      const prompt = lobby.active_prompt as unknown as Record<string, unknown>;
      setActivePrompt({
        type: prompt.type,
        card_code: prompt.card_code,
        drawnBy: (prompt.drawn_by || prompt.drawnBy),
        data: prompt.data,
        confirmed_players: prompt.confirmed_players,
      } as ActivePrompt);
    } else {
      setActivePrompt(null);
    }

    // Sync word game
    if (lobby.word_game) {
      setWordGame({
        type: lobby.word_game.type as "7-episodes" | "9-rhyme" | "10-category",
        currentWord: lobby.word_game.current_word,
        usedWords: lobby.word_game.used_words,
        currentPlayerIndex: lobby.word_game.current_player_index,
        startingPlayer: lobby.word_game.starting_player,
      });
    } else {
      setWordGame(null);
    }

    // Sync RPS game
    if (lobby.rps_game) {
      setRpsGame(lobby.rps_game);
    } else {
      setRpsGame(null);
    }

    // Sync mate
    if (lobby.mate) {
      setMate({
        player1: lobby.mate.player1,
        player2: lobby.mate.player2,
      });
    }
  }, [lobby]);

  // Play sound when it's your turn
  useEffect(() => {
    if (lobby?.current_player_id === currentPlayerId && currentPlayerId) {
      playSound("turn-chime");
    }
  }, [lobby?.current_player_id, currentPlayerId, playSound]);

  // Nightman response timer
  useEffect(() => {
    const isNightmanPrompt = (activePrompt?.type as string) === "nightman-response";
    
    if (isNightmanPrompt) {
      // Reset timer when prompt appears
      setNightmanTimer(10);
      
      const interval = setInterval(() => {
        setNightmanTimer((prev) => {
          if (prev <= 1) {
            // Time's up - Nightman failed to respond
            clearInterval(interval);
            
            // Auto-fail the Nightman
            if (lobby && activePrompt && activePrompt.data?.nightman) {
              console.log("[NIGHTMAN] Timer expired, creating drink prompt for:", activePrompt.data.nightman);
              const nightmanDrinkers = addMatesToDrinkList([activePrompt.data.nightman]);
              
              supabase
                .from("lobbies")
                .update({
                  active_prompt: {
                    type: "drink",
                    card_code: "KD",
                    drawn_by: activePrompt.drawnBy,
                    data: {
                      players: nightmanDrinkers,
                      message: `${activePrompt.data.nightman} failed to respond to the Dayman in time!`,
                    },
                    confirmed_players: [],
                  },
                })
                .eq("id", lobby.id)
                .then(({ error }) => {
                  if (error) {
                    console.error("[NIGHTMAN] Failed to create drink prompt:", error);
                  } else {
                    console.log("[NIGHTMAN] Drink prompt created successfully");
                    playSound("error");
                  }
                });
            }
            
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePrompt?.type, lobby?.id]);

  // Get player ID from sessionStorage with reconnection logic
  useEffect(() => {
    const attemptReconnect = async () => {
      const playerId =
        sessionStorage.getItem(`player-${code}`) ||
        localStorage.getItem(`player-${code}`);
      
      if (playerId) {
        // Verify player still exists in database
        const { data: player, error } = await supabase
          .from("players")
          .select("*")
          .eq("id", playerId)
          .single();
        
        if (player && !error) {
          setCurrentPlayerId(playerId);
          console.log("Reconnected as player:", player.name);
        } else {
          // Player no longer exists, clear storage
          sessionStorage.removeItem(`player-${code}`);
          localStorage.removeItem(`player-${code}`);
          console.warn("Player no longer exists, cleared storage");
        }
      } else {
        console.warn("No player ID found in storage");
      }
    };
    
    attemptReconnect();
  }, [code, supabase]);

  const loadLobby = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("lobbies")
        .select("*")
        .eq("code", code.toUpperCase())
        .single();

      if (error) throw error;
      if (!data) {
        router.push("/");
        return;
      }

      console.log("Lobby loaded:", {
        code: data.code,
        current_player_id: data.current_player_id,
        turn_number: data.turn_number,
        status: data.status,
      });

      setLobby(data);
      setLoading(false);
    } catch (err) {
      console.error("Error loading lobby:", err);
      router.push("/");
    }
  }, [code, supabase, router]);

  const loadPlayers = useCallback(async () => {
    if (!lobby) return;

    try {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("lobby_id", lobby.id)
        .order("joined_at", { ascending: true });

      if (error) throw error;
      setPlayers(data || []);
    } catch (err) {
      console.error("Error loading players:", err);
    }
  }, [lobby, supabase]);

  useEffect(() => {
    loadLobby();
  }, [loadLobby]);

  // Load players when lobby is available
  useEffect(() => {
    if (lobby?.id) {
      loadPlayers();
    }
  }, [lobby?.id, loadPlayers]);

  // Set up real-time subscriptions (stable, doesn't recreate on every lobby change)
  useEffect(() => {
    if (!lobby?.id) return;

    const lobbyId = lobby.id;
    console.log("[SUBSCRIPTION] Setting up real-time subscription for lobby:", lobbyId);

    const channel = supabase
      .channel(`game-${lobbyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `lobby_id=eq.${lobbyId}`,
        },
        async (payload) => {
          console.log("[REAL-TIME] Players change detected:", payload.eventType);
          
          // OPTIMIZATION: Handle host migration when host leaves
          if (payload.eventType === "DELETE" && payload.old.is_host) {
            const { data: remainingPlayers } = await supabase
              .from("players")
              .select("*")
              .eq("lobby_id", lobbyId)
              .order("joined_at", { ascending: true });
            
            if (remainingPlayers && remainingPlayers.length > 0) {
              // Batch host update and event log
              await Promise.all([
                supabase
                  .from("players")
                  .update({ is_host: true })
                  .eq("id", remainingPlayers[0].id),
                logGameEvent(lobbyId, "special_action", remainingPlayers[0].name, {
                  action: "became the new host",
                  message: `${remainingPlayers[0].name} is now the host`
                })
              ]);
            }
          }
          
          // Reload players for all clients
          const { data: updatedPlayers } = await supabase
            .from("players")
            .select("*")
            .eq("lobby_id", lobbyId)
            .order("joined_at", { ascending: true });
          
          if (updatedPlayers) {
            setPlayers(updatedPlayers);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "lobbies",
          filter: `id=eq.${lobbyId}`,
        },
        (payload) => {
          console.log("[REAL-TIME] Lobby change detected");
          if (payload.new) {
            // Convert snake_case from DB to camelCase for TypeScript
            const lobbyData = payload.new as unknown as Record<string, unknown>;
            
            console.log("[REAL-TIME UPDATE]", {
              deck_updated: !!lobbyData.deck,
              current_player_id: lobbyData.current_player_id,
              turn_number: lobbyData.turn_number,
            });
            
            // Convert active_prompt if it exists
            let activePrompt = lobbyData.active_prompt as unknown as Record<string, unknown> | null;
            if (activePrompt) {
              activePrompt = {
                type: activePrompt.type,
                card_code: activePrompt.card_code,
                drawnBy: activePrompt.drawn_by || activePrompt.drawnBy,
                data: activePrompt.data,
                confirmed_players: activePrompt.confirmed_players,
              };
            }
            
            // Update lobby state with all fields including deck
            setLobby({
              ...lobbyData,
              active_prompt: activePrompt,
            } as Lobby);
          }
        }
      )
      .subscribe((status) => {
        console.log("[SUBSCRIPTION] Status:", status);
      });

    return () => {
      console.log("[SUBSCRIPTION] Cleaning up subscription for lobby:", lobbyId);
      supabase.removeChannel(channel);
    };
  }, [lobby?.id, supabase]);

  // Handle card-specific actions
  // Returns true if turn should advance, false if a prompt/game will handle it
  async function handleCardAction(
    rank: string,
    cardCode: string,
    drawnBy: string,
    playerIndex: number
  ): Promise<boolean> {
    if (!lobby) return false;

    switch (rank) {
      case "2": // You - Choose a player to drink
        await supabase
          .from("lobbies")
          .update({
            active_prompt: {
              type: "choose-player",
              card_code: cardCode,
              drawn_by: drawnBy,
              data: { action: "drink", message: "Choose a player to drink" },
            },
          })
          .eq("id", lobby.id);
        return false; // Prompt will handle turn advancement
      case "3": // Me - You drink
        const drinkPlayers = addMatesToDrinkList([drawnBy]);
        await supabase
          .from("lobbies")
          .update({
            active_prompt: {
              type: "drink",
              card_code: cardCode,
              drawn_by: drawnBy,
              data: { players: drinkPlayers },
              confirmed_players: [],
            },
          })
          .eq("id", lobby.id);
        return false; // Prompt will handle turn advancement
      case "4": // Rock Paper Scissors
        await supabase
          .from("lobbies")
          .update({
            active_prompt: {
              type: "choose-player",
              card_code: cardCode,
              drawn_by: drawnBy,
              data: {
                action: "rps",
                message: "Choose an opponent for Rock Paper Scissors",
              },
            },
          })
          .eq("id", lobby.id);
        return false; // Prompt will handle turn advancement
      case "5": // Guys drink (male + non-binary)
        const malePlayerNames = players
          .filter((p) => p.gender === "male")
          .map((p) => p.name);
        
        // Always add non-binary players - they can choose to pass or drink
        const nonBinaryPlayers = players
          .filter((p) => p.gender === "non-binary")
          .map((p) => p.name);
        
        malePlayerNames.push(...nonBinaryPlayers);
        
        const maleWithMates = addMatesToDrinkList(malePlayerNames);
        
        // Always create prompt, even if no one drinks
        await supabase
          .from("lobbies")
          .update({
            active_prompt: {
              type: "drink",
              card_code: cardCode,
              drawn_by: drawnBy,
              data: { 
                players: maleWithMates.length > 0 ? maleWithMates : [], 
                message: maleWithMates.length > 0 
                  ? "5 is Guys - Drink!" 
                  : "5 is Guys - No guys in the game!",
                gender_card: "guys",
              },
              confirmed_players: maleWithMates.length > 0 ? [] : ["_skip"],
            },
          })
          .eq("id", lobby.id);
        return false; // Prompt will handle turn advancement
      case "6": // Chicks drink (female + non-binary)
        const femalePlayerNames = players
          .filter((p) => p.gender === "female")
          .map((p) => p.name);
        
        // Always add non-binary players - they can choose to pass or drink
        const nonBinaryPlayersChicks = players
          .filter((p) => p.gender === "non-binary")
          .map((p) => p.name);
        
        femalePlayerNames.push(...nonBinaryPlayersChicks);
        
        const femaleWithMates = addMatesToDrinkList(femalePlayerNames);
        
        // Always create prompt, even if no one drinks
        await supabase
          .from("lobbies")
          .update({
            active_prompt: {
              type: "drink",
              card_code: cardCode,
              drawn_by: drawnBy,
              data: { 
                players: femaleWithMates.length > 0 ? femaleWithMates : [], 
                message: femaleWithMates.length > 0 
                  ? "6 is Chicks - Drink!" 
                  : "6 is Chicks - No chicks in the game!",
                gender_card: "chicks",
              },
              confirmed_players: femaleWithMates.length > 0 ? [] : ["_skip"],
            },
          })
          .eq("id", lobby.id);
        return false; // Prompt will handle turn advancement
      case "7": // Episode names
        await supabase
          .from("lobbies")
          .update({
            word_game: {
              type: "7-episodes",
              current_word: "",
              used_words: [],
              current_player_index: playerIndex,
              starting_player: drawnBy,
            },
          })
          .eq("id", lobby.id);
        return false; // Word game will handle turn advancement
      case "8": // Mates
        // Mate selection prompt is already set in drawCard() function
        // Mate selection doesn't need to control turn - just show modal, player selects, turn advances normally
        return true; // Advance turn normally - mate selection is just a side effect, not turn-blocking
      case "9": // Rhyme
        await supabase
          .from("lobbies")
          .update({
            word_game: {
              type: "9-rhyme",
              current_word: "",
              used_words: [],
              current_player_index: playerIndex,
              starting_player: drawnBy,
            },
          })
          .eq("id", lobby.id);
        return false; // Word game will handle turn advancement
      case "0": // Categories (10)
        await supabase
          .from("lobbies")
          .update({
            word_game: {
              type: "10-category",
              current_word: "",
              used_words: [],
              current_player_index: playerIndex,
              starting_player: drawnBy,
            },
          })
          .eq("id", lobby.id);
        return false; // Word game will handle turn advancement
      case "K": // Kings - role cards with special actions
        // Kings just assign roles, no immediate action needed
        // Special handling (like Dayman selecting Nightman) happens after card modal is closed
        return true; // Advance turn immediately
      case "Q": // Queens - Question Master
        // Queens just assign role, no immediate action needed
        return true; // Advance turn immediately
      case "J": // Jacks - Various special abilities
        // Jacks just assign roles, no immediate action needed
        return true; // Advance turn immediately
      case "A": // Aces - Barbara, Bruce, Gino, Gail
        // Aces just assign roles, no immediate action needed
        return true; // Advance turn immediately
      default:
        // Any unhandled cards just advance the turn
        console.log(`No specific action for rank: ${rank}`);
        return true; // Advance turn immediately
    }
  }

  /**
   * Handles drawing a card from the deck
   * @param cardIndex - Index of the card in the deck array
   * 
   * Process:
   * 1. Validates player turn and lobby state
   * 2. Marks card as drawn and updates deck
   * 3. Determines next player
   * 4. Handles rank-specific logic (8s = mate selection, roles, etc.)
   * 5. Logs card draw event and updates stats
   */
  async function drawCard(cardIndex: number): Promise<void> {
    if (!lobby || !currentPlayerId) {
      console.log("Cannot draw card:", { lobby: !!lobby, currentPlayerId });
      return;
    }

    const card = lobby.deck[cardIndex];
    if (card.drawn) {
      console.log("Card already drawn");
      return;
    }

    // Prevent double-clicks while drawing animation is active
    if (isDrawingCard) {
      console.log("Already drawing a card, please wait");
      return;
    }

    // Check if there's ANY active prompt - block drawing until prompt is resolved
    if (activePrompt) {
      const promptMessages: Record<string, string> = {
        mate: `Waiting for ${activePrompt.drawnBy} to choose their drinking mate!`,
        drink: "Complete the current drinking action before drawing another card!",
        "choose-player": "Complete the current player selection before drawing another card!",
        "mac-action": "Complete Mac's action before drawing another card!",
        rps: "Complete the Rock Paper Scissors game before drawing another card!",
      };
      
      const message = promptMessages[activePrompt.type as string] || 
        "Complete the current action before drawing another card!";
      
      alert(message);
      return;
    }

    // Check if there's an active word game - block drawing until game is complete
    if (wordGame) {
      alert("Complete the current word game before drawing another card!");
      return;
    }

    console.log("Draw card attempt:", {
      yourPlayerId: currentPlayerId,
      currentTurnPlayerId: lobby.current_player_id,
      isYourTurn: lobby.current_player_id === currentPlayerId,
      players: players.map((p) => ({ id: p.id, name: p.name })),
    });

    // Check if it's the current player's turn (allow anyone to draw if no current player set - first turn)
    if (lobby.current_player_id && lobby.current_player_id !== currentPlayerId) {
      const currentTurnPlayer = players.find(
        (p) => p.id === lobby.current_player_id
      );
      const yourPlayer = players.find((p) => p.id === currentPlayerId);
      alert(
        `It's not your turn! It's ${
          currentTurnPlayer?.name || "someone else"
        }'s turn. You are: ${yourPlayer?.name || "unknown"}`
      );
      return;
    }

    const currentPlayer = players.find((p) => p.id === currentPlayerId);
    if (!currentPlayer) return;

    // Mark card as drawn
    const updatedDeck = [...lobby.deck];
    updatedDeck[cardIndex] = {
      ...card,
      drawn: true,
      drawnBy: currentPlayer.name,
    };

    // Get current player index for passing to card action handler
    const currentPlayerIndex = players.findIndex(
      (p) => p.id === currentPlayerId
    );

    try {
      console.log("Starting card draw process for card:", card.code);
      
      // Set drawing animation state
      setIsDrawingCard(true);
      setTimeout(() => setIsDrawingCard(false), 600);
      
      // Decrement Dayman's Nightman rounds if active
      let updatedDaymanNightman = lobby.dayman_nightman;
      if (updatedDaymanNightman && updatedDaymanNightman.rounds_remaining > 0) {
        updatedDaymanNightman = {
          ...updatedDaymanNightman,
          rounds_remaining: updatedDaymanNightman.rounds_remaining - 1,
        };
      }

      // Prepare stats update for face cards
      const rank = card.code.slice(0, -1);
      const isFaceCard = ["K", "Q", "J", "A"].includes(rank);
      const currentStats: GameStats = lobby.game_stats || {};
      const newStats = isFaceCard 
        ? updatePlayerStats(currentStats, currentPlayer.name, "faceCard", 1)
        : currentStats;

      console.log("Updating lobby deck and turn info...");
      
      // OPTIMIZATION: Batch lobby updates into single query
      // NOTE: Don't set current_player_id here - let DrawnCardModal's onAdvanceTurn handle it
      const updatePayload: Record<string, unknown> = {
        deck: updatedDeck,
        dayman_nightman: updatedDaymanNightman,
      };
      
      if (isFaceCard) {
        updatePayload.game_stats = newStats;
      }
      
      const { error: updateError } = await supabase
        .from("lobbies")
        .update(updatePayload)
        .eq("id", lobby.id);

      if (updateError) {
        console.error("Failed to update lobby:", updateError);
        throw updateError;
      }

      console.log("Lobby updated successfully, showing drawn card...");
      
      // Play card flip sound
      playSound("card-flip");
      
      // Log card drawn event (non-blocking)
      logGameEvent(lobby.id, "card_drawn", currentPlayer.name, {
        card_code: card.code,
        message: `drew ${card.code}`
      });

      // Show the drawn card to all players
      setDrawnCard({
        code: card.code,
        drawnBy: currentPlayer.name,
        rank: rank,
        playerIndex: currentPlayerIndex,
      });

      // If rank is 8, trigger mate selection
      if (rank === "8") {
        // OPTIMIZATION: Batch mate broken logs and prompt update
        if (lobby.mate) {
          // Batch prompt update with mate broken logs
          await Promise.all([
            supabase
              .from("lobbies")
              .update({
                active_prompt: {
                  type: "mate",
                  card_code: card.code,
                  drawn_by: currentPlayer.name,
                  data: {
                    message: "Choose a mate to drink with for the rest of the game!"
                  }
                }
              })
              .eq("id", lobby.id),
            logGameEvent(lobby.id, "mate_broken", lobby.mate.player1, {
              message: `Mate bond with ${lobby.mate.player2} has ended`,
              target: lobby.mate.player2
            }),
            logGameEvent(lobby.id, "mate_broken", lobby.mate.player2, {
              message: `Mate bond with ${lobby.mate.player1} has ended`,
              target: lobby.mate.player1
            })
          ]);
        } else {
          // No existing mate, just set prompt
          await supabase
            .from("lobbies")
            .update({
              active_prompt: {
                type: "mate",
                card_code: card.code,
                drawn_by: currentPlayer.name,
                data: {
                  message: "Choose a mate to drink with for the rest of the game!"
                }
              }
            })
            .eq("id", lobby.id);
        }
      }

      // If card assigns a role, update player
      if (cardAssignsRole(card.code)) {
        const role = getCardRole(card.code);
        if (role) {
          // OPTIMIZATION: Batch player and lobby updates using Promise.all
          if (role === "gail") {
            // If Gail (Snail) card, update both player role and lobby snail_player
            await Promise.all([
              supabase
                .from("players")
                .update({ role })
                .eq("id", currentPlayerId),
              supabase
                .from("lobbies")
                .update({ snail_player: currentPlayer.name })
                .eq("id", lobby.id)
            ]);
          } else {
            // Just update player role
            await supabase
              .from("players")
              .update({ role })
              .eq("id", currentPlayerId);
          }
        }
      }
    } catch (err) {
      console.error("Error drawing card:", err);
      showToast("Failed to draw card. Please try again.", "error");
    }
  }

  /**
   * Handles mate selection when a player draws an 8 card
   * @param selectedPlayerName - Name of the player chosen as mate
   * 
   * Process:
   * 1. Creates mate object with both player names
   * 2. Updates lobby with new mate pair
   * 3. Logs mate_assigned events for both players
   * 4. Plays sound and shows success notification
   */
  async function handleMateSelection(selectedPlayerName: string): Promise<void> {
    if (!lobby || !activePrompt || activePrompt.type !== "mate") return;
    
    try {
      // Handle both snake_case (from DB) and camelCase (from type)
      const promptData = activePrompt as unknown as Record<string, unknown>;
      const drawerName = (promptData.drawn_by || promptData.drawnBy) as string;
      
      const newMate = {
        player1: drawerName,
        player2: selectedPlayerName
      };
      
      console.log("Mate selected:", {
        drawer: drawerName,
        mate: selectedPlayerName,
      });
      
      // OPTIMIZATION: Batch lobby update and event logs using Promise.all
      // NOTE: Don't advance turn here - DrawnCardModal's onAdvanceTurn will handle it
      await Promise.all([
        supabase
          .from("lobbies")
          .update({ 
            mate: newMate,
            active_prompt: null,
          })
          .eq("id", lobby.id),
        // Log mate assigned events for both players (non-blocking)
        logGameEvent(lobby.id, "mate_assigned", drawerName, {
          target: selectedPlayerName,
          message: `${drawerName} and ${selectedPlayerName} are now mates!`
        }),
        logGameEvent(lobby.id, "mate_assigned", selectedPlayerName, {
          target: drawerName,
          message: `${selectedPlayerName} and ${drawerName} are now mates!`
        })
      ]);
      
      // Play sound
      playSound("role-assigned");
      
      showToast(`${drawerName} and ${selectedPlayerName} are now mates! 💕`, "success");
    } catch (err) {
      console.error("Error selecting mate:", err);
      showToast("Failed to select mate. Please try again.", "error");
    }
  }

  /**
   * Apply mate drinking logic to a list of players who need to drink.
   * If one mate is in the list, automatically add their mate.
   * 
   * @param drinkingPlayers - Array of player names who are drinking
   * @returns Array with mate's partner added if applicable
   * 
   * @example
   * // If Alice and Bob are mates, and Alice drinks:
   * applyMateLogic(["Alice"]) // Returns ["Alice", "Bob"]
   * 
   * // If both already in list, no change:
   * applyMateLogic(["Alice", "Bob"]) // Returns ["Alice", "Bob"]
   */
  // Note: Currently unused but ready for future automated drink tracking features
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function applyMateLogic(drinkingPlayers: string[]): string[] {
    // Both or neither are drinking, no change needed
    return drinkingPlayers;
  }

  /**
   * Handles leaving the game and cleaning up player state
   */
  async function leaveGame(): Promise<void> {
    if (!lobby || !currentPlayerId) return;
    
    try {
      const player = players.find(p => p.id === currentPlayerId);
      
      if (player) {
        // Log event before leaving
        await logGameEvent(lobby.id, "special_action", player.name, {
          action: "left the game",
          message: `${player.name} has left the game`
        });
        
        // Remove player from database
        await supabase.from("players").delete().eq("id", currentPlayerId);
        
        // Clear local storage
        sessionStorage.removeItem(`player-${code}`);
        localStorage.removeItem(`player-${code}`);
      }
      
      // Redirect to home
      router.push("/");
    } catch (err) {
      console.error("Error leaving game:", err);
      showToast("Failed to leave game. Please try again.", "error");
    }
  }

  /**
   * Resets the game to initial state (host only)
   * 
   * Process:
   * 1. Verifies host permissions
   * 2. Creates new shuffled deck
   * 3. Resets all game state (prompts, mini-games, roles)
   * 4. Sets first player as current turn
   */
  async function resetGame(): Promise<void> {
    if (!lobby) return;

    const currentPlayer = players.find((p) => p.id === currentPlayerId);
    if (!currentPlayer?.is_host) {
      alert("Only the host can reset the game");
      return;
    }

    // Re-initialize deck
    const suits = ["S", "H", "C", "D"];
    const ranks = [
      "A",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "0",
      "J",
      "Q",
      "K",
    ];
    const newDeck: Card[] = [];

    for (const suit of suits) {
      for (const rank of ranks) {
        newDeck.push({
          code: rank + suit,
          drawn: false,
          drawnBy: null,
          position: newDeck.length,
        });
      }
    }

    // Shuffle
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }

    // Pick random starting player
    const randomPlayer = players[Math.floor(Math.random() * players.length)];

    try {
      // Reset lobby with all game state cleared
      await supabase
        .from("lobbies")
        .update({
          deck: newDeck,
          current_player_id: randomPlayer.id,
          turn_number: 0,
          active_prompt: null,
          word_game: null,
          rps_game: null,
          mate: null,
          golden_god_redirects: null,
          uncle_jack_uses: null,
          mac_action_uses: null,
          mac_last_action_turn: null,
          frank_performances: null,
          dayman_nightman: null,
          gino_swaps_used: null,
          snail_player: null,
          cricket_denials: null,
          bruce_voting: null,
          game_stats: null,
          non_binary_passes: null,
        })
        .eq("id", lobby.id);

      // OPTIMIZATION: Clear all player roles in parallel using Promise.all
      await Promise.all(
        players.map(player =>
          supabase
            .from("players")
            .update({ role: null })
            .eq("id", player.id)
        )
      );
      
      // Log game reset event
      await logGameEvent(lobby.id, "special_action", currentPlayer.name, {
        action: "reset the game",
        message: `${currentPlayer.name} reset the game - all cards, roles, and counters cleared`
      });
      
      // Show success message
      showToast("Game reset! New deck shuffled and all counters cleared.", "success");
      playSound("role-assigned");
    } catch (err) {
      console.error("Error resetting game:", err);
      showToast("Failed to reset game. Please try again.", "error");
    }
  }

  if (loading || !lobby) {
    return <LoadingSkeleton type="full-page" />;
  }

  const currentPlayer = players.find((p) => p.id === lobby.current_player_id);
  const allCardsDrawn = lobby.deck.every((card) => card.drawn);

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: "url('/green-felt.jpg')" }}
    >
      {/* Top Right Button Group */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          onClick={() => setShowGameHistory(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-all hover-lift"
        >
          📜 History
        </Button>
        <Button
          onClick={() => setShowGameStats(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-all hover-lift"
        >
          📊 Stats
        </Button>
        <Button
          onClick={() => setShowRules(true)}
          className="bg-white/90 hover:bg-white text-black font-bold py-2 px-4 rounded-lg shadow-lg transition-all hover-lift"
        >
          📖 Rules
        </Button>
        <Button
          onClick={leaveGame}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-all hover-lift"
        >
          🚪 Leave
        </Button>
      </div>
      
      {/* Chat Toggle Button - Top Left */}
      <Button
        onClick={() => setShowChat(!showChat)}
        className="absolute top-4 left-4 z-10 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-all"
      >
        💬 Chat {showChat && "✓"}
      </Button>

      {/* Mac Actions Button - Bottom Right */}
      {players.find((p) => p.id === currentPlayerId)?.role === "mac" && (
        <Button
          onClick={() => setShowMacActions(true)}
          className="absolute bottom-4 right-4 z-10 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all"
        >
          💪 Actions
        </Button>
      )}

      {/* Cricket Denial Button - Bottom Left */}
      {(() => {
        const cricketPlayer = players.find((p) => p.id === currentPlayerId && p.role === "cricket");
        if (!cricketPlayer) return null;
        
        const denials = (lobby?.cricket_denials || {})[cricketPlayer.name] || 0;
        const canDeny = denials < 3;
        
        return (
          <Button
            onClick={() => {
              if (canDeny) {
                // Use denial
                const confirm = window.confirm('Use "God says no!" to deny a drink?');
                if (confirm) {
                  supabase
                    .from("lobbies")
                    .update({
                      cricket_denials: {
                        ...(lobby?.cricket_denials || {}),
                        [cricketPlayer.name]: denials + 1,
                      },
                    })
                    .eq("id", lobby?.id);
                }
              } else {
                // Must confess
                setCricketConfession(true);
              }
            }}
            className={`absolute bottom-4 left-4 z-10 ${
              canDeny
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-red-600 hover:bg-red-700"
            } text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all`}
          >
            {canDeny ? `⛪ GOD SAYS NO! (${3 - denials}/3)` : "📖 Make Confession"}
          </Button>
        );
      })()}

      {/* Player List - Left Side */}
      <div className="absolute left-4 top-4 bg-black/60 backdrop-blur-sm rounded-lg p-4 max-w-xs">
        <h2 className="text-white font-bold mb-3 text-lg">
          Players{" "}
          {currentPlayer && (
            <span className="text-yellow-300 text-sm">
              -{" "}
              {currentPlayer.id === currentPlayerId
                ? "Your"
                : currentPlayer.name + "'s"}{" "}
              turn
            </span>
          )}
        </h2>
        <div className="space-y-2">
          {players.map((player) => (
            <div
              key={player.id}
              className={`bg-white/20 rounded px-3 py-2 ${
                player.id === lobby.current_player_id
                  ? "ring-2 ring-yellow-300 bg-yellow-300/20"
                  : ""
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-white font-semibold text-sm">
                  {player.name}
                </span>
                {player.id === currentPlayerId && (
                  <span className="text-green-300 text-xs font-bold">YOU</span>
                )}
              </div>
              {/* Role Token */}
              {player.role && (
                <div className="mt-2 flex items-center gap-2">
                  <Image
                    src={`/${player.role}.jpg`}
                    alt={player.role}
                    width={32}
                    height={32}
                    className="rounded-full border-2 border-yellow-400"
                    unoptimized
                  />
                  <span className="text-yellow-300 text-xs capitalize">
                    {player.role.replace(/-/g, " ")}
                  </span>
                </div>
              )}

              {/* Frank (KC) Action Button */}
              {player.id === currentPlayerId && player.role === "frank" && (
                <button
                  onClick={() => setShowFrankPerform(true)}
                  className="mt-2 w-full bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold py-2 px-3 rounded transition-all"
                >
                  🎭 Call Out Performance
                </button>
              )}

              {/* Dayman (KD) Action Button */}
              {player.id === currentPlayerId && player.role === "charlie" && (
                <button
                  onClick={() => setShowDaymanActions(true)}
                  className="mt-2 w-full bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold py-2 px-3 rounded transition-all"
                >
                  ☀️ Dayman Actions
                </button>
              )}

              {/* Cricket (JH) Denial/Confession Status */}
              {player.id === currentPlayerId && player.role === "cricket" && (
                <div className="mt-2 bg-blue-900 text-white text-xs font-bold py-1 px-2 rounded text-center">
                  ⛪ GOD SAYS NO: {3 - ((lobby?.cricket_denials || {})[player.name] || 0)}/3 left
                </div>
              )}

              {/* Uncle Jack (JS) Tiny Hands Status - Only visible to the player who has it */}
              {player.id === currentPlayerId && player.role === "uncle-jack" && (
                <div className="mt-2 bg-orange-600 text-white text-xs font-bold py-1 px-2 rounded text-center">
                  🤏 TINY HANDS: {((lobby?.uncle_jack_uses || {})[player.name] || 0)}/3 safe
                  {((lobby?.uncle_jack_uses || {})[player.name] || 0) >= 3 && " (risky!)"}
                </div>
              )}

              {/* Non-Binary Pass Status - Only visible to the player who has it */}
              {player.id === currentPlayerId && player.gender === "non-binary" && (
                <div className="mt-2 bg-purple-600 text-white text-xs font-bold py-1 px-2 rounded text-center">
                  ⚧️ GENDER PASSES: {4 - ((lobby?.non_binary_passes || {})[player.name] || 0)}/4 left
                </div>
              )}

              {/* Nightman Indicator */}
              {lobby?.dayman_nightman?.nightman === player.name && 
               lobby?.dayman_nightman?.rounds_remaining > 0 && (
                <div className="mt-2 bg-gray-900 text-yellow-300 text-xs font-bold py-1 px-2 rounded text-center">
                  🌙 NIGHTMAN ({lobby.dayman_nightman.rounds_remaining}{" "}
                  rounds left)
                </div>
              )}

              {/* Snail Indicator */}
              {lobby?.snail_player === player.name && (
                <div className="mt-2 bg-green-600 text-white text-xs font-bold py-1 px-2 rounded text-center">
                  🐌 THE SNAIL (Gail)
                </div>
              )}

              {/* Mate Indicator */}
              {lobby?.mate && (lobby.mate.player1 === player.name || lobby.mate.player2 === player.name) && (
                <div className="mt-2 bg-pink-600 text-white text-xs font-bold py-1 px-2 rounded text-center">
                  💕 MATES with {lobby.mate.player1 === player.name ? lobby.mate.player2 : lobby.mate.player1}
                </div>
              )}

              {/* Salt the Snail Button */}
              {player.id !== currentPlayerId &&
                lobby?.snail_player === player.name && (
                  <button
                    onClick={() => setShowSaltSnail(true)}
                    className="mt-2 w-full bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-2 px-3 rounded transition-all"
                  >
                    🧂 SALT THE SNAIL
                  </button>
                )}

              {/* Mac Bodyguard Shield */}
              {(() => {
                const currentPlayerData = players.find(
                  (p) => p.id === currentPlayerId
                );
                if (currentPlayerData?.role !== "mac") return null;

                const macUses = lobby?.mac_action_uses || {};
                const usedActions = macUses[currentPlayerData.name] || 0;
                if (usedActions >= 5) return null;

                if (!activePrompt || activePrompt.type !== "drink") return null;

                const drinkPlayers = Array.isArray(activePrompt.data?.players)
                  ? (activePrompt.data.players as string[])
                  : activePrompt.data?.players === "all"
                  ? players.map((p) => p.name)
                  : [activePrompt.drawnBy];

                const confirmedPlayers = activePrompt.confirmed_players || [];

                // Only show shield if this player needs to drink and hasn't confirmed
                if (
                  !drinkPlayers.includes(player.name) ||
                  confirmedPlayers.includes(player.name)
                )
                  return null;

                return (
                  <button
                    onClick={async () => {
                      // Use Bodyguard action
                      const newUses = {
                        ...macUses,
                        [currentPlayerData.name]: usedActions + 1,
                      };
                      await supabase
                        .from("lobbies")
                        .update({ mac_action_uses: newUses })
                        .eq("id", lobby?.id);

                      // Remove player from drink list and mark as confirmed
                      const newDrinkPlayers = drinkPlayers.filter(
                        (name) => name !== player.name
                      );
                      const newConfirmedPlayers = [
                        ...confirmedPlayers,
                        player.name,
                      ];

                      const allDone =
                        newDrinkPlayers.length === 0 ||
                        newDrinkPlayers.every((name) =>
                          newConfirmedPlayers.includes(name)
                        );

                      if (allDone) {
                        await supabase
                          .from("lobbies")
                          .update({ active_prompt: null })
                          .eq("id", lobby?.id);
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
                                message: `${player.name} was shielded by Mac! ${
                                  activePrompt.data?.message || ""
                                }`,
                              },
                              confirmed_players: newConfirmedPlayers,
                            },
                          })
                          .eq("id", lobby?.id);
                      }
                    }}
                    className="mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-1 px-2 rounded transition-all"
                  >
                    🛡️ Shield
                  </button>
                );
              })()}
            </div>
          ))}
        </div>
      </div>

      {/* Card Board - Center */}
      <div className="flex items-center justify-center min-h-screen py-4">
        <div className={`relative w-[600px] h-[600px] rounded-xl transition-all duration-300 ${
          lobby.current_player_id === currentPlayerId 
            ? 'ring-8 ring-yellow-400 ring-opacity-75 shadow-2xl shadow-yellow-400/50 animate-pulse' 
            : ''
        }`}>
          {lobby.deck.map((card, index) => {
            const pos = shamrockPositions[index];
            if (!pos) return null;

            return (
              <div
                key={index}
                className={`absolute transition-all duration-200 ease-out cursor-pointer hover-lift ${isDrawingCard ? 'card-flip' : ''}`}
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  transform:
                    hoveredCard === index && !card.drawn
                      ? "translate(-50%, -60%) scale(1.2)"
                      : "translate(-50%, -50%)",
                  zIndex: hoveredCard === index ? 10 : card.drawn ? 0 : 1,
                  opacity: card.drawn ? 0 : 1,
                  pointerEvents: card.drawn ? "none" : "auto",
                }}
                onMouseEnter={() => !card.drawn && setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => drawCard(index)}
              >
                <div className="w-12 h-16 bg-linear-to-br from-green-700 to-green-900 rounded-lg shadow-lg border-2 border-yellow-600 flex items-center justify-center">
                  <span className="text-2xl">🍀</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mate Selection Modal */}
      {activePrompt?.type === "mate" && (
        <MateSelectionModal
          activePrompt={activePrompt}
          players={players}
          currentPlayerId={currentPlayerId}
          onMateSelection={handleMateSelection}
        />
      )}

      {/* Mate Status Display */}
      {lobby.mate && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 bg-pink-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-full shadow-lg border-2 border-white/50 bounce-in">
          <span className="font-bold">
            💕 {lobby.mate.player1} & {lobby.mate.player2} are Mates
          </span>
        </div>
      )}

      {/* Game Over / Reset */}
      {allCardsDrawn && (
        <GameOverModal
          players={players}
          currentPlayerId={currentPlayerId}
          onReset={resetGame}
          onBackToLobby={() => router.push(`/lobby/${code}`)}
        />
      )}

      {/* Rules Modal */}
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />

      {/* Drawn Card Modal */}
      {drawnCard && lobby && (
        <DrawnCardModal
          drawnCard={drawnCard}
          lobby={lobby}
          players={players}
          currentPlayerId={currentPlayerId}
          activePrompt={activePrompt}
          rpsGame={rpsGame}
          wordGame={wordGame}
          onClose={() => setDrawnCard(null)}
          onCardAction={handleCardAction}
          onDaymanSelection={() => setDaymanSelectingNightman(true)}
          onAdvanceTurn={async () => {
            if (lobby && drawnCard) {
              // Find the player who DREW the card (not necessarily the current logged-in user)
              const drawerPlayer = players.find((p) => p.name === drawnCard.drawnBy);
              if (!drawerPlayer) {
                console.error("Could not find player who drew card:", drawnCard.drawnBy);
                return;
              }
              
              const drawerIndex = players.findIndex((p) => p.id === drawerPlayer.id);
              const nextPlayerIndex = (drawerIndex + 1) % players.length;
              const nextPlayer = players[nextPlayerIndex];
              
              // If this is the first turn (no current_player_id), start at turn 1
              const isFirstTurn = !lobby.current_player_id;
              const nextTurnNumber = isFirstTurn ? 1 : lobby.turn_number + 1;
              
              console.log("Advancing turn:", {
                drawer: drawnCard.drawnBy,
                drawerIndex,
                nextPlayer: nextPlayer.name,
                nextPlayerIndex,
                isFirstTurn,
                nextTurnNumber,
              });
              
              await supabase
                .from("lobbies")
                .update({
                  current_player_id: nextPlayer.id,
                  turn_number: nextTurnNumber,
                })
                .eq("id", lobby.id);
            }
          }}
        />
      )}

      {/* Drink Animation/Prompt */}
      {activePrompt?.type === "drink" && (
        <DrinkPromptModal
          activePrompt={activePrompt}
          lobby={lobby}
          players={players}
          currentPlayerId={currentPlayerId}
          onBarbaraDiceRoll={(rolling, result, playerName) =>
            setBarbaraDiceRoll({ rolling, result, playerName })
          }
          onMacProteinShare={() => setMacSelectingPlayer("protein")}
          onBruceDonation={() => setBruceSelectingDonation(true)}
          onGinoSwap={(excuse) =>
            setGinoSwapVoting({
              swapper:
                players.find((p) => p.id === currentPlayerId)?.name || "",
              target: "",
              excuse: excuse,
              votes: {},
            })
          }
        />
      )}

      {/* Barbara Dice Roll Modal */}
      {barbaraDiceRoll && lobby && activePrompt && (
        <BarbaraDiceRollModal
          barbaraDiceRoll={barbaraDiceRoll}
          lobby={lobby}
          players={players}
          currentPlayerId={currentPlayerId}
          activePrompt={activePrompt}
          onClose={() => setBarbaraDiceRoll(null)}
          addMatesToDrinkList={addMatesToDrinkList}
        />
      )}

      {/* Frank Performance Selection Modal */}
      {showFrankPerform && lobby && (
        <FrankPerformModal
          players={players}
          currentPlayerId={currentPlayerId}
          lobbyId={lobby.id}
          onClose={() => setShowFrankPerform(false)}
        />
      )}

      {/* Frank Performance Prompt Modal (target choosing to perform/refuse and Frank judging) */}
      {activePrompt && (activePrompt.type === "frank-perform" || activePrompt.type === "frank-judge") && lobby && (
        <FrankPerformancePromptModal
          activePrompt={activePrompt}
          players={players}
          currentPlayerId={currentPlayerId}
          lobbyId={lobby.id}
          frankPerformances={lobby.frank_performances || {}}
          addMatesToDrinkList={addMatesToDrinkList}
        />
      )}

      {/* Dayman Actions Modal */}
      {showDaymanActions && lobby && (
        <DaymanActionsModal
          players={players}
          currentPlayerId={currentPlayerId}
          lobby={lobby}
          onClose={() => setShowDaymanActions(false)}
          onSelectNightman={() => {
            setShowDaymanActions(false);
            setDaymanSelectingNightman(true);
          }}
        />
      )}

      {/* Dayman Select Nightman Modal */}
      {daymanSelectingNightman && lobby && (
        <DaymanSelectNightmanModal
          players={players}
          currentPlayerId={currentPlayerId}
          lobbyId={lobby.id}
          onClose={() => setDaymanSelectingNightman(false)}
        />
      )}

      {/* Bruce Donation Selection Modal */}
      {bruceSelectingDonation && lobby && (
        <BruceDonationModal
          players={players}
          currentPlayerId={currentPlayerId}
          lobbyId={lobby.id}
          currentPlayerName={players.find((p) => p.id === currentPlayerId)?.name || ""}
          onClose={() => setBruceSelectingDonation(false)}
          onStartVoting={() => {
            setBruceSelectingDonation(false);
          }}
        />
      )}

      {/* Bruce Voting Modal */}
      {lobby?.bruce_voting && lobby.bruce_voting.target && lobby && (
        <BruceVotingModal
          bruceVoting={lobby.bruce_voting}
          players={players}
          currentPlayerId={currentPlayerId}
          lobbyId={lobby.id}
          onClose={() => {}}
          addMatesToDrinkList={addMatesToDrinkList}
        />
      )}

      {/* Gino Swap Voting Modal */}
      {lobby?.gino_swap_voting && lobby.gino_swap_voting.target && lobby && (
        <GinoSwapVotingModal
          ginoSwapVoting={lobby.gino_swap_voting}
          players={players}
          currentPlayerId={currentPlayerId}
          lobbyId={lobby.id}
          onClose={() => setGinoSwapVoting(null)}
          addMatesToDrinkList={addMatesToDrinkList}
        />
      )}

      {/* Gino Target Selection Modal */}
      {ginoSwapVoting && !lobby?.gino_swap_voting && lobby && (
        <GinoSwapTargetModal
          ginoSwapVoting={ginoSwapVoting}
          players={players}
          currentPlayerId={currentPlayerId}
          lobbyId={lobby.id}
          onClose={() => setGinoSwapVoting(null)}
        />
      )}


      {/* Salt the Snail Confirmation Modal */}
      {showSaltSnail && lobby?.snail_player && (
        <SaltSnailModal
          snailPlayerName={lobby.snail_player}
          lobbyId={lobby.id}
          onClose={() => setShowSaltSnail(false)}
        />
      )}

      {/* Mac Actions Modal */}
      {showMacActions && (() => {
        const currentPlayer = players.find((p) => p.id === currentPlayerId);
        if (!currentPlayer || currentPlayer.role !== "mac") return null;

        const macUses = lobby?.mac_action_uses || {};
        const usedActions = macUses[currentPlayer.name] || 0;
        const actionsRemaining = 5 - usedActions;

        console.log("[MAC MODAL RENDER]", {
          playerName: currentPlayer.name,
          macUses,
          usedActions,
          actionsRemaining,
          lobbyMacActionUses: lobby?.mac_action_uses,
        });

        return (
          <MacActionsModal
            actionsRemaining={actionsRemaining}
            onSelectAction={(action) => setMacSelectingPlayer(action)}
            onClose={() => setShowMacActions(false)}
          />
        );
      })()}

      {/* Mac Action Player Selection */}
      {macSelectingPlayer && (() => {
        const macPlayer = players.find((p) => p.role === "mac");
        if (!macPlayer) return null;
        
        const macUses = lobby?.mac_action_uses || {};
        const usedActions = macUses[macPlayer.name] || 0;

        return (
          <MacPlayerSelectionModal
            macAction={macSelectingPlayer}
            players={players}
            macPlayer={macPlayer}
            lobbyId={lobby?.id || ""}
            lobby={lobby}
            turnNumber={lobby?.turn_number || 0}
            macUses={macUses}
            usedActions={usedActions}
            activePrompt={activePrompt}
            addMatesToDrinkList={addMatesToDrinkList}
            onClose={() => setMacSelectingPlayer(null)}
            onActionComplete={() => {
              setMacSelectingPlayer(null);
              setShowMacActions(false);
            }}
          />
        );
      })()}

      {/* Choose Player Prompt */}
      {activePrompt?.type === "choose-player" && (
        <ChoosePlayerModal
          activePrompt={activePrompt}
          players={players}
          currentPlayerId={currentPlayerId}
          lobbyId={lobby?.id || ""}
          currentLobbyPlayerId={lobby?.current_player_id || ""}
          turnNumber={lobby?.turn_number || 0}
          addMatesToDrinkList={addMatesToDrinkList}
        />
      )}

      {/* Mac Action Prompt (Karate/Confession) */}
      {(activePrompt?.type as string) === "mac-action" && activePrompt && (() => {
        const currentPlayerName = players.find((p) => p.id === currentPlayerId)?.name;
        return (
          <MacActionPromptModal
            activePrompt={activePrompt}
            currentPlayerName={currentPlayerName || ""}
            lobbyId={lobby?.id || ""}
            addMatesToDrinkList={addMatesToDrinkList}
          />
        );
      })()}

      {/* Rock Paper Scissors Game */}
      {rpsGame && lobby && (
        <RPSGameModal
          rpsGame={rpsGame}
          players={players}
          currentPlayerId={currentPlayerId}
          lobbyId={lobby.id}
          activePrompt={activePrompt}
          addMatesToDrinkList={addMatesToDrinkList}
        />
      )}

      {/* Word Game (Episodes / Rhyme / Category) */}
      {wordGame && lobby && lobby.current_player_id && (
        <WordGameModal
          wordGame={wordGame}
          players={players}
          currentPlayerId={currentPlayerId}
          lobbyId={lobby.id}
          currentLobbyPlayerId={lobby.current_player_id}
          turnNumber={lobby.turn_number}
          addMatesToDrinkList={addMatesToDrinkList}
        />
      )}

      {/* Frank Performance Prompt */}
      {(activePrompt?.type as string) === "frank-perform" && activePrompt && lobby && (
        <FrankPerformancePromptModal
          activePrompt={activePrompt}
          players={players}
          currentPlayerId={currentPlayerId}
          lobbyId={lobby.id}
          frankPerformances={lobby.frank_performances || {}}
          addMatesToDrinkList={addMatesToDrinkList}
        />
      )}

      {/* Nightman Response Prompt */}
      {(activePrompt?.type as string) === "nightman-response" && activePrompt && (
        <NightmanResponseModal
          activePrompt={activePrompt}
          lobby={lobby}
          players={players}
          currentPlayerId={currentPlayerId}
          nightmanTimer={nightmanTimer}
          addMatesToDrinkList={addMatesToDrinkList}
        />
      )}

      {/* Cricket Confession Modal */}
      {cricketConfession && 
        players.find((p) => p.id === currentPlayerId && p.role === "cricket") && lobby && (
        <CricketConfessionModal 
          cricketPlayerName={players.find((p) => p.id === currentPlayerId && p.role === "cricket")!.name}
          lobbyId={lobby.id}
          onClose={() => setCricketConfession(false)} 
        />
      )}

      {/* Mate Selection */}
      {activePrompt?.type === "mate" && lobby && (
        <MateSelectionModal
          activePrompt={activePrompt}
          players={players}
          currentPlayerId={currentPlayerId}
          onMateSelection={async (playerName: string) => {
            // Update mate assignment and clear prompt
            await supabase
              .from("lobbies")
              .update({
                mate: {
                  player1: activePrompt.drawnBy,
                  player2: playerName,
                },
                active_prompt: null,
              })
              .eq("id", lobby.id);
            
            // Play role assigned sound and show toast
            playSound("role-assigned");
            showToast(`${activePrompt.drawnBy} and ${playerName} are now mates! 💕`, "success");
            
            // Log mate assigned events for both players
            await Promise.all([
              logGameEvent(lobby.id, "mate_assigned", activePrompt.drawnBy, {
                target: playerName,
                message: `${activePrompt.drawnBy} and ${playerName} are now mates!`
              }),
              logGameEvent(lobby.id, "mate_assigned", playerName, {
                target: activePrompt.drawnBy,
                message: `${activePrompt.drawnBy} and ${playerName} are now mates!`
              })
            ]);
            
            // DO NOT advance turn here - let the DrawnCardModal handle it
          }}
        />
      )}

      {/* Game History Modal */}
      <GameHistory 
        lobbyId={lobby.id} 
        isOpen={showGameHistory} 
        onClose={() => setShowGameHistory(false)} 
      />

      {/* Chat Component */}
      {showChat && (
        <GameChat
          lobbyId={lobby.id}
          playerName={players.find(p => p.id === currentPlayerId)?.name || "Player"}
          isOpen={showChat}
          onClose={() => setShowChat(false)}
        />
      )}

      {/* Game Stats Modal */}
      <GameStatsModal
        lobbyId={lobby.id}
        players={players}
        show={showGameStats}
        onClose={() => setShowGameStats(false)}
      />

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
}

// Wrap with Error Boundary and export
export default function GamePageWrapper() {
  return (
    <ErrorBoundary>
      <GamePage />
    </ErrorBoundary>
  );
}
