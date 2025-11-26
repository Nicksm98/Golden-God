
"use client";
import type { SupabaseClient } from "@supabase/supabase-js";


// Single subscription manager per lobby
function createLobbySubscriber(
  supabase: SupabaseClient,
  lobbyId: string,
  applyLobbyUpdate: (data: unknown) => void,
  setPlayersCallback?: (players: Player[]) => void
) {
  const topic = `room:${lobbyId}`;
  let channel: ReturnType<SupabaseClient['channel']> | null = null;
  let attempts = 0;
  let backoffTimer: ReturnType<typeof setTimeout> | null = null;
  let isUnsubscribing = false;
  let reloadTimer: ReturnType<typeof setTimeout> | null = null;

  const subscribe = () => {
    if (channel && (channel as unknown as { state?: string }).state === 'SUBSCRIBED') return;
    if (channel && ((channel as unknown as { state?: string }).state === 'SUBSCRIBING' || (channel as unknown as { state?: string }).state === 'PENDING')) return;

    channel = supabase.channel(topic, { config: { private: true } });
    channel.on('broadcast', { event: '*' }, async ({ event, payload }: { event: string; payload: unknown }) => {
      console.debug('RECEIVED broadcast', { event, payload, time: new Date().toISOString() });
      
      // Extract the actual lobby data from broadcast payload
      const payloadObj = payload as Record<string, unknown>;
      const record = payloadObj?.record ?? payloadObj?.new ?? payloadObj?.NEW ?? payload;
      console.debug('RESOLVED DATA', record);
      
      // Debounce rapid reloads (multiple updates in quick succession)
      if (reloadTimer) {
        clearTimeout(reloadTimer);
      }
      
      reloadTimer = setTimeout(async () => {
        // Always reload fresh data from database to ensure sync
        if (record && typeof (record as { id?: string }).id === 'string') {
          try {
            const recordLobbyId = (record as { id: string }).id;
            console.debug('[BROADCAST] Reloading lobby from database:', recordLobbyId);
            
            // Reload lobby
            const { data: freshLobby } = await supabase
              .from("lobbies")
              .select("*")
              .eq("id", recordLobbyId)
              .single();
            
            if (freshLobby) {
              console.debug('[BROADCAST] Fresh lobby loaded:', freshLobby);
              applyLobbyUpdate(freshLobby);
            }
            
            // Reload players
            if (setPlayersCallback) {
              const { data: playersData } = await supabase
                .from("players")
                .select("*")
                .eq("lobby_id", recordLobbyId)
                .order("joined_at", { ascending: true });
              if (playersData) {
                console.debug('[BROADCAST] Fresh players loaded:', playersData.length);
                setPlayersCallback(playersData as Player[]);
              }
            }
          } catch (err) {
            console.error('Failed to reload after broadcast', err);
          }
        }
        reloadTimer = null;
      }, 300); // 300ms debounce to batch rapid updates
    });
    channel.subscribe((status: string) => {
      console.debug('[SUBSCRIPTION]', topic, 'Status:', status);
      if (status === 'SUBSCRIBED') {
        attempts = 0;
        if (backoffTimer) { clearTimeout(backoffTimer); backoffTimer = null; }
      }
      if (status === 'CLOSED' || status === 'TIMED_OUT' || status === 'ERROR') {
        if (isUnsubscribing) return;
        attempts += 1;
        const delay = Math.min(30000, 500 * Math.pow(2, attempts));
        console.warn(`[SUBSCRIPTION] ${topic} ${status}. Reconnecting in ${delay}ms`);
        if (backoffTimer) clearTimeout(backoffTimer);
        backoffTimer = setTimeout(() => {
          try {
            isUnsubscribing = true;
            supabase.removeChannel(channel!);
          } catch (e) {
            console.warn('removeChannel error', e);
          } finally {
            isUnsubscribing = false;
            subscribe();
          }
        }, delay);
      }
    });
  };

  const unsubscribe = async () => {
    if (!channel) return;
    isUnsubscribing = true;
    try {
      await supabase.removeChannel(channel);
    } catch (e) {
      console.warn('removeChannel error', e);
    } finally {
      channel = null;
      isUnsubscribing = false;
      if (backoffTimer) { clearTimeout(backoffTimer); backoffTimer = null; }
    }
  };

  subscribe();

  return { unsubscribe, subscribe };
}

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

const Card = ({ code }: { code: string }) => {
  const cardImageMap: { [key: string]: string } = {
    KS: "golden-god",
    KH: "mac",
    KC: "frank",
    KD: "charlie",
    QS: "dee",
    QH: "carmen",
    QC: "maureen",
    QD: "waitress",
    JS: "uncle-jack",
    JH: "cricket",
    JC: "z",
    JD: "liam",
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
    AS: "barbara",
    AH: "bruce",
    AC: "gino",
    AD: "gail",
  };

  const imageName = cardImageMap[code] || "default";
  const imageUrl = `/${imageName}.jpg`;

  const rank = code.slice(0, -1); 
  const suitCode = code.slice(-1);

  const suitMap: { [key: string]: string } = {
    S: "♠",
    H: "♥",
    C: "♣",
    D: "♦",
  };

  const suit = suitMap[suitCode] || "";
  const displayRank = rank === "0" ? "10" : rank; 

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

  const addMatesToDrinkList = useCallback((playerNames: string[]): string[] => {
    if (!lobby?.mate) return playerNames;
    
    const { player1, player2 } = lobby.mate;
    const expandedList = [...playerNames];
    
    if (playerNames.includes(player1) && !playerNames.includes(player2)) {
      expandedList.push(player2);
    }
    if (playerNames.includes(player2) && !playerNames.includes(player1)) {
      expandedList.push(player1);
    }
    
    return expandedList;
  }, [lobby?.mate]);

  useEffect(() => {
    if (!lobby) return;

    console.log('[LOBBY SYNC] Lobby updated, syncing UI state', {
      has_active_prompt: !!lobby.active_prompt,
      has_word_game: !!lobby.word_game,
      has_rps_game: !!lobby.rps_game,
      current_player_id: lobby.current_player_id,
      turn_number: lobby.turn_number
    });

    if (lobby.active_prompt) {
      const prompt = lobby.active_prompt as unknown as Record<string, unknown>;
      const promptDrawer = (prompt.drawn_by || prompt.drawnBy) as string;
      const currentPlayerName = players.find(p => p.id === currentPlayerId)?.name;
      
      // Only set active prompt if we're not the drawer with an open drawn card modal
      // This prevents duplicate modals for the player who drew the card
      const isDrawerWithModal = currentPlayerName === promptDrawer && drawnCard !== null;
      
      if (!isDrawerWithModal) {
        setActivePrompt({
          type: prompt.type,
          card_code: prompt.card_code,
          drawnBy: promptDrawer,
          data: prompt.data,
          confirmed_players: prompt.confirmed_players,
        } as ActivePrompt);
      }
    } else {
      setActivePrompt(null);
    }

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

    if (lobby.rps_game) {
      setRpsGame(lobby.rps_game);
    } else {
      setRpsGame(null);
    }

    if (lobby.mate) {
      setMate({
        player1: lobby.mate.player1,
        player2: lobby.mate.player2,
      });
    }
  }, [lobby, currentPlayerId, drawnCard, players]);

  useEffect(() => {
    if (lobby?.current_player_id === currentPlayerId && currentPlayerId) {
      playSound("turn-chime");
    }
  }, [lobby?.current_player_id, currentPlayerId, playSound]);

  useEffect(() => {
    const isNightmanPrompt = (activePrompt?.type as string) === "nightman-response";
    
    if (isNightmanPrompt) {
      setNightmanTimer(10);
      
      const interval = setInterval(() => {
        setNightmanTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            
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
                    playSound("card-flip");
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
  }, [activePrompt, lobby, addMatesToDrinkList, playSound, supabase]);

  useEffect(() => {
    const attemptReconnect = async () => {
      const playerId =
        sessionStorage.getItem(`player-${code}`) ||
        localStorage.getItem(`player-${code}`);
      
      if (playerId) {
        const { data: player, error } = await supabase
          .from("players")
          .select("*")
          .eq("id", playerId)
          .single();
        
        if (player && !error) {
          setCurrentPlayerId(playerId);
          console.log("Reconnected as player:", player.name);
        } else {
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

  useEffect(() => {
    if (lobby?.id) {
      loadPlayers();
    }
  }, [lobby?.id, loadPlayers]);

  useEffect(() => {
    if (!lobby?.id) return;

    const lobbyId = lobby.id;
    console.log("[SUBSCRIPTION] Setting up broadcast subscription for lobby:", lobbyId);

    const subscriber = createLobbySubscriber(
      supabase,
      lobbyId,
      (data) => {
        if (typeof data === "object" && data) {
          setLobby(data as Lobby);
        }
      },
      setPlayers
    );

    return () => {
      console.log("[SUBSCRIPTION] Cleaning up broadcast subscription for lobby:", lobbyId);
      subscriber.unsubscribe();
    };
  }, [lobby?.id, supabase]);

  async function handleCardAction(
    rank: string,
    cardCode: string,
    drawnBy: string,
    playerIndex: number
  ): Promise<boolean> {
    if (!lobby) return false;

    switch (rank) {
      case "2":
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
        return false; 
      case "3": 
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
        return false;
      case "4": 
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
        return false;
      case "5":
        const malePlayerNames = players
          .filter((p) => p.gender === "male")
          .map((p) => p.name);
        
        const nonBinaryPlayers = players
          .filter((p) => p.gender === "non-binary")
          .map((p) => p.name);
        
        malePlayerNames.push(...nonBinaryPlayers);
        
        const maleWithMates = addMatesToDrinkList(malePlayerNames);
        
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
        return false; 
      case "6":
        const femalePlayerNames = players
          .filter((p) => p.gender === "female")
          .map((p) => p.name);
        
        const nonBinaryPlayersChicks = players
          .filter((p) => p.gender === "non-binary")
          .map((p) => p.name);
        
        femalePlayerNames.push(...nonBinaryPlayersChicks);
        
        const femaleWithMates = addMatesToDrinkList(femalePlayerNames);
        
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
        return false; 
      case "7": 
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
        return false; 
      case "8": 
        return true; 
      case "9": 
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
        return false; 
      case "0": 
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
        return false; 
      case "K":
        return true; 
      case "Q": 
        return true;
      case "J": 
        return true; 
      case "A": 
        return true; 
      default:
        
        console.log(`No specific action for rank: ${rank}`);
        return true; 
    }
  }

  
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

    if (isDrawingCard) {
      console.log("Already drawing a card, please wait");
      return;
    }

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

    if (wordGame) {
      alert("Complete the current word game before drawing another card!");
      return;
    }

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

    const updatedDeck = [...lobby.deck];
    updatedDeck[cardIndex] = {
      ...card,
      drawn: true,
      drawnBy: currentPlayer.name,
    };

    const currentPlayerIndex = players.findIndex(
      (p) => p.id === currentPlayerId
    );

    try {
      setIsDrawingCard(true);
      setTimeout(() => setIsDrawingCard(false), 600);
      
      let updatedDaymanNightman = lobby.dayman_nightman;
      if (updatedDaymanNightman && updatedDaymanNightman.rounds_remaining > 0) {
        updatedDaymanNightman = {
          ...updatedDaymanNightman,
          rounds_remaining: updatedDaymanNightman.rounds_remaining - 1,
        };
      }

      const rank = card.code.slice(0, -1);
      const isFaceCard = ["K", "Q", "J", "A"].includes(rank);
      const currentStats: GameStats = lobby.game_stats || {};
      const newStats = isFaceCard 
        ? updatePlayerStats(currentStats, currentPlayer.name, "faceCard", 1)
        : currentStats;

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

      playSound("card-flip");
      
      logGameEvent(lobby.id, "card_drawn", currentPlayer.name, {
        card_code: card.code,
        message: `drew ${card.code}`
      });

      setDrawnCard({
        code: card.code,
        drawnBy: currentPlayer.name,
        rank: rank,
        playerIndex: currentPlayerIndex,
      });

      if (rank === "8") {
        if (lobby.mate) {
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

      if (cardAssignsRole(card.code)) {
        const role = getCardRole(card.code);
        if (role) {
          if (role === "gail") {
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
            await supabase
              .from("players")
              .update({ role })
              .eq("id", currentPlayerId);
          }
        }
      }
        // Always trigger card action after drawing
        await handleCardAction(rank, card.code, currentPlayer.name, currentPlayerIndex);
    } catch (err) {
      console.error("Error drawing card:", err);
      showToast("Failed to draw card. Please try again.", "error");
    }
  }

  async function handleMateSelection(selectedPlayerName: string): Promise<void> {
    if (!lobby || !activePrompt || activePrompt.type !== "mate") return;
    
    try {
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
      
      await Promise.all([
        supabase
          .from("lobbies")
          .update({ 
            mate: newMate,
            active_prompt: null,
          })
          .eq("id", lobby.id),
        logGameEvent(lobby.id, "mate_assigned", drawerName, {
          target: selectedPlayerName,
          message: `${drawerName} and ${selectedPlayerName} are now mates!`
        }),
        logGameEvent(lobby.id, "mate_assigned", selectedPlayerName, {
          target: drawerName,
          message: `${selectedPlayerName} and ${drawerName} are now mates!`
        })
      ]);
      
      playSound("role-assigned");
      
      showToast(`${drawerName} and ${selectedPlayerName} are now mates! 💕`, "success");
    } catch (err) {
      console.error("Error selecting mate:", err);
      showToast("Failed to select mate. Please try again.", "error");
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function applyMateLogic(drinkingPlayers: string[]): string[] {
    return drinkingPlayers;
  }

  async function leaveGame(): Promise<void> {
    if (!lobby || !currentPlayerId) return;
    
    try {
      const player = players.find(p => p.id === currentPlayerId);
      
      if (player) {
        await logGameEvent(lobby.id, "special_action", player.name, {
          action: "left the game",
          message: `${player.name} has left the game`
        });
        
        await supabase.from("players").delete().eq("id", currentPlayerId);
        
        sessionStorage.removeItem(`player-${code}`);
        localStorage.removeItem(`player-${code}`);
      }
      
      router.push("/");
    } catch (err) {
      console.error("Error leaving game:", err);
      showToast("Failed to leave game. Please try again.", "error");
    }
  }


  async function resetGame(): Promise<void> {
    if (!lobby) return;

    const currentPlayer = players.find((p) => p.id === currentPlayerId);
    if (!currentPlayer?.is_host) {
      alert("Only the host can reset the game");
      return;
    }

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

    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }

    const randomPlayer = players[Math.floor(Math.random() * players.length)];

    try {
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

      await Promise.all(
        players.map(player =>
          supabase
            .from("players")
            .update({ role: null })
            .eq("id", player.id)
        )
      );
      
      await logGameEvent(lobby.id, "special_action", currentPlayer.name, {
        action: "reset the game",
        message: `${currentPlayer.name} reset the game - all cards, roles, and counters cleared`
      });
      
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
  const allCardsDrawn = Array.isArray(lobby?.deck) ? lobby.deck.every((card) => card.drawn) : false;

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: "url('/green-felt.jpg')" }}
    >
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
      
      <Button
        onClick={() => setShowChat(!showChat)}
        className="absolute top-4 left-4 z-10 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-all"
      >
        💬 Chat {showChat && "✓"}
      </Button>

      {players.find((p) => p.id === currentPlayerId)?.role === "mac" && (
        <Button
          onClick={() => setShowMacActions(true)}
          className="absolute bottom-4 right-4 z-10 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all"
        >
          💪 Actions
        </Button>
      )}

      {(() => {
        const cricketPlayer = players.find((p) => p.id === currentPlayerId && p.role === "cricket");
        if (!cricketPlayer) return null;
        
        const denials = (lobby?.cricket_denials || {})[cricketPlayer.name] || 0;
        const canDeny = denials < 3;
        
        return (
          <Button
            onClick={() => {
              if (canDeny) {
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

              {player.id === currentPlayerId && player.role === "frank" && (
                <button
                  onClick={() => setShowFrankPerform(true)}
                  className="mt-2 w-full bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold py-2 px-3 rounded transition-all"
                >
                  🎭 Call Out Performance
                </button>
              )}

              {player.id === currentPlayerId && player.role === "charlie" && (
                <button
                  onClick={() => setShowDaymanActions(true)}
                  className="mt-2 w-full bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold py-2 px-3 rounded transition-all"
                >
                  ☀️ Dayman Actions
                </button>
              )}

              {player.id === currentPlayerId && player.role === "cricket" && (
                <div className="mt-2 bg-blue-900 text-white text-xs font-bold py-1 px-2 rounded text-center">
                  ⛪ GOD SAYS NO: {3 - ((lobby?.cricket_denials || {})[player.name] || 0)}/3 left
                </div>
              )}

              {player.id === currentPlayerId && player.role === "uncle-jack" && (
                <div className="mt-2 bg-orange-600 text-white text-xs font-bold py-1 px-2 rounded text-center">
                  🤏 TINY HANDS: {((lobby?.uncle_jack_uses || {})[player.name] || 0)}/3 safe
                  {((lobby?.uncle_jack_uses || {})[player.name] || 0) >= 3 && " (risky!)"}
                </div>
              )}

              {player.id === currentPlayerId && player.gender === "non-binary" && (
                <div className="mt-2 bg-purple-600 text-white text-xs font-bold py-1 px-2 rounded text-center">
                  ⚧️ GENDER PASSES: {4 - ((lobby?.non_binary_passes || {})[player.name] || 0)}/4 left
                </div>
              )}

              {lobby?.dayman_nightman?.nightman === player.name && 
               lobby?.dayman_nightman?.rounds_remaining > 0 && (
                <div className="mt-2 bg-gray-900 text-yellow-300 text-xs font-bold py-1 px-2 rounded text-center">
                  🌙 NIGHTMAN ({lobby.dayman_nightman.rounds_remaining}{" "}
                  rounds left)
                </div>
              )}

              {lobby?.snail_player === player.name && (
                <div className="mt-2 bg-green-600 text-white text-xs font-bold py-1 px-2 rounded text-center">
                  🐌 THE SNAIL (Gail)
                </div>
              )}

              {lobby?.mate && (lobby.mate.player1 === player.name || lobby.mate.player2 === player.name) && (
                <div className="mt-2 bg-pink-600 text-white text-xs font-bold py-1 px-2 rounded text-center">
                  💕 MATES with {lobby.mate.player1 === player.name ? lobby.mate.player2 : lobby.mate.player1}
                </div>
              )}

              {player.id !== currentPlayerId &&
                lobby?.snail_player === player.name && (
                  <button
                    onClick={() => setShowSaltSnail(true)}
                    className="mt-2 w-full bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-2 px-3 rounded transition-all"
                  >
                    🧂 SALT THE SNAIL
                  </button>
                )}

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

                if (
                  !drinkPlayers.includes(player.name) ||
                  confirmedPlayers.includes(player.name)
                )
                  return null;

                return (
                  <button
                    onClick={async () => {
                      const newUses = {
                        ...macUses,
                        [currentPlayerData.name]: usedActions + 1,
                      };
                      await supabase
                        .from("lobbies")
                        .update({ mac_action_uses: newUses })
                        .eq("id", lobby?.id);

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

      <div className="flex items-center justify-center min-h-screen py-4">
        <div className={`relative w-[600px] h-[600px] rounded-xl transition-all duration-300 ${
          lobby.current_player_id === currentPlayerId 
            ? 'ring-8 ring-yellow-400 ring-opacity-75 shadow-2xl shadow-yellow-400/50 animate-pulse' 
            : ''
        }`}>
          {Array.isArray(lobby.deck) && lobby.deck.length > 0
            ? lobby.deck.map((card, index) => {
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
              })
            : null}
        </div>
      </div>

      {activePrompt?.type === "mate" && (
        <MateSelectionModal
          activePrompt={activePrompt}
          players={players}
          currentPlayerId={currentPlayerId}
          onMateSelection={handleMateSelection}
        />
      )}

      {lobby.mate && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 bg-pink-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-full shadow-lg border-2 border-white/50 bounce-in">
          <span className="font-bold">
            💕 {lobby.mate.player1} & {lobby.mate.player2} are Mates
          </span>
        </div>
      )}

      {allCardsDrawn && (
        <GameOverModal
          players={players}
          currentPlayerId={currentPlayerId}
          onReset={resetGame}
          onBackToLobby={() => router.push(`/lobby/${code}`)}
        />
      )}

      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />

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
            console.log("[TURN] onAdvanceTurn called", { lobby, drawnCard });
            if (lobby && drawnCard) {
              console.log("[TURN] Current players array:", players.map(p => ({ id: p.id, name: p.name })));
              console.log("[TURN] Looking for player with name:", drawnCard.drawnBy);
              
              let drawerPlayer = players.find((p) => p.name === drawnCard.drawnBy);
              
              // If player not found, reload players from database
              if (!drawerPlayer) {
                console.warn("[TURN] Player not found in local state, reloading from database...");
                const { data: freshPlayers } = await supabase
                  .from("players")
                  .select("*")
                  .eq("lobby_id", lobby.id)
                  .order("joined_at", { ascending: true });
                
                if (freshPlayers && freshPlayers.length > 0) {
                  setPlayers(freshPlayers);
                  drawerPlayer = freshPlayers.find((p) => p.name === drawnCard.drawnBy);
                  console.log("[TURN] Reloaded players, found:", drawerPlayer ? "YES" : "NO");
                }
              }
              
              if (!drawerPlayer) {
                console.error("[TURN] Could not find player who drew card:", drawnCard.drawnBy);
                console.error("[TURN] Available players:", players.map(p => p.name));
                return;
              }

              const drawerIndex = players.findIndex((p) => p.id === drawerPlayer.id);
              const nextPlayerIndex = (drawerIndex + 1) % players.length;
              const nextPlayer = players[nextPlayerIndex];

              const isFirstTurn = !lobby.current_player_id;
              const nextTurnNumber = isFirstTurn ? 1 : lobby.turn_number + 1;

              console.log("[TURN] Advancing turn", {
                drawer: drawnCard.drawnBy,
                drawerIndex,
                nextPlayer: nextPlayer.name,
                nextPlayerIndex,
                isFirstTurn,
                nextTurnNumber,
              });

              const { error, data } = await supabase
                .from("lobbies")
                .update({
                  current_player_id: nextPlayer.id,
                  turn_number: nextTurnNumber,
                })
                .eq("id", lobby.id);

              if (error) {
                console.error("[TURN] Supabase update error:", error);
              } else {
                console.log("[TURN] Supabase update success:", data);
              }
            } else {
              console.warn("[TURN] onAdvanceTurn called but lobby or drawnCard missing", { lobby, drawnCard });
            }
          }}
        />
      )}

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

      {showFrankPerform && lobby && (
        <FrankPerformModal
          players={players}
          currentPlayerId={currentPlayerId}
          lobbyId={lobby.id}
          onClose={() => setShowFrankPerform(false)}
        />
      )}

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

      {daymanSelectingNightman && lobby && (
        <DaymanSelectNightmanModal
          players={players}
          currentPlayerId={currentPlayerId}
          lobbyId={lobby.id}
          onClose={() => setDaymanSelectingNightman(false)}
        />
      )}

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

      {ginoSwapVoting && !lobby?.gino_swap_voting && lobby && (
        <GinoSwapTargetModal
          ginoSwapVoting={ginoSwapVoting}
          players={players}
          currentPlayerId={currentPlayerId}
          lobbyId={lobby.id}
          onClose={() => setGinoSwapVoting(null)}
        />
      )}


      {showSaltSnail && lobby?.snail_player && (
        <SaltSnailModal
          snailPlayerName={lobby.snail_player}
          lobbyId={lobby.id}
          onClose={() => setShowSaltSnail(false)}
        />
      )}

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

      {cricketConfession && 
        players.find((p) => p.id === currentPlayerId && p.role === "cricket") && lobby && (
        <CricketConfessionModal 
          cricketPlayerName={players.find((p) => p.id === currentPlayerId && p.role === "cricket")!.name}
          lobbyId={lobby.id}
          onClose={() => setCricketConfession(false)} 
        />
      )}

      {activePrompt?.type === "mate" && lobby && (
        <MateSelectionModal
          activePrompt={activePrompt}
          players={players}
          currentPlayerId={currentPlayerId}
          onMateSelection={async (playerName: string) => {
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
            
            playSound("role-assigned");
            showToast(`${activePrompt.drawnBy} and ${playerName} are now mates! 💕`, "success");
            
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
            
          }}
        />
      )}

      <GameHistory 
        lobbyId={lobby.id} 
        isOpen={showGameHistory} 
        onClose={() => setShowGameHistory(false)} 
      />

      {showChat && (
        <GameChat
          lobbyId={lobby.id}
          playerName={players.find(p => p.id === currentPlayerId)?.name || "Player"}
          isOpen={showChat}
          onClose={() => setShowChat(false)}
        />
      )}

      <GameStatsModal
        lobbyId={lobby.id}
        players={players}
        show={showGameStats}
        onClose={() => setShowGameStats(false)}
      />

      <ToastContainer />
    </div>
  );
}

export default function GamePageWrapper() {
  return (
    <ErrorBoundary>
      <GamePage />
    </ErrorBoundary>
  );
}
