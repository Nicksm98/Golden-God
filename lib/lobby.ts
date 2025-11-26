import { createClient } from "./supabase/client";

// Generate a random 6-character alphanumeric code
export function generateLobbyCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Initialize a fresh deck of 52 cards
export function initializeDeck() {
  const suits = ["S", "H", "C", "D"]; // Spades, Hearts, Clubs, Diamonds
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "0", "J", "Q", "K"];
  const deck = [];

  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ code: rank + suit, drawn: false });
    }
  }

  // Shuffle the deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

// Create a new lobby
export async function createLobby() {
  const supabase = createClient();
  const code = generateLobbyCode();
  const deck = initializeDeck();

  try {
    const { data, error } = await supabase
      .from("lobbies")
      .insert({
        code,
        deck,
        status: "waiting",
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error creating lobby:", error);
    return { data: null, error };
  }
}

// Check if a lobby exists
export async function checkLobbyExists(code: string) {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("lobbies")
      .select("id, code, status")
      .eq("code", code.toUpperCase())
      .single();

    if (error) throw error;
    return { exists: !!data, lobby: data };
  } catch {
    return { exists: false, lobby: null };
  }
}
