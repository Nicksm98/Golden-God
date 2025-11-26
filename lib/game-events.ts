import { createClient } from "@/lib/supabase/client";
import type { GameStats, PlayerStats } from "@/lib/types";

export type EventType =
  | "card_drawn"
  | "drink"
  | "role_assigned"
  | "special_action"
  | "mate_assigned"
  | "mate_broken";

export interface GameEventDetails {
  card_code?: string;
  role?: string;
  action?: string;
  target?: string;
  message?: string;
  [key: string]: unknown;
}

export async function logGameEvent(
  lobbyId: string,
  eventType: EventType,
  playerName: string,
  details: GameEventDetails = {}
) {
  const supabase = createClient();
  
  try {
    await supabase.from("game_events").insert({
      lobby_id: lobbyId,
      event_type: eventType,
      player_name: playerName,
      details,
    });
  } catch (error) {
    console.error("Error logging game event:", error);
  }
}

// Re-export types from centralized types file
export type { GameStats, PlayerStats };

export function initializePlayerStats(playerName: string, stats: GameStats): GameStats {
  if (!stats[playerName]) {
    stats[playerName] = {
      name: playerName,
      drinks: 0,
      faceCardsDrawn: 0,
      faceCards: 0,
      cardsDrawn: 0,
      actionsUsed: 0,
    };
  }
  return stats;
}

export function updatePlayerStats(
  stats: GameStats,
  playerName: string,
  type: "drink" | "faceCard" | "action",
  amount: number = 1
): GameStats {
  const newStats = { ...stats };
  initializePlayerStats(playerName, newStats);
  
  const playerStats = newStats[playerName];
  if (playerStats) {
    switch (type) {
      case "drink":
        playerStats.drinks += amount;
        break;
      case "faceCard":
        if (playerStats.faceCardsDrawn !== undefined) {
          playerStats.faceCardsDrawn += amount;
        }
        if (playerStats.faceCards !== undefined) {
          playerStats.faceCards += amount;
        }
        break;
      case "action":
        playerStats.actionsUsed += amount;
        break;
    }
  }
  
  return newStats;
}

export function getTopPlayers(stats: GameStats) {
  const players = Object.entries(stats);
  
  const mostDrinks = players.sort((a, b) => b[1].drinks - a[1].drinks)[0];
  const mostFaceCards = players.sort((a, b) => (b[1].faceCardsDrawn || 0) - (a[1].faceCardsDrawn || 0))[0];
  const mostActions = players.sort((a, b) => b[1].actionsUsed - a[1].actionsUsed)[0];
  
  return {
    mostDrinks: mostDrinks ? { name: mostDrinks[0], count: mostDrinks[1].drinks } : null,
    mostFaceCards: mostFaceCards ? { name: mostFaceCards[0], count: mostFaceCards[1].faceCardsDrawn || 0 } : null,
    mostActions: mostActions ? { name: mostActions[0], count: mostActions[1].actionsUsed } : null,
  };
}
