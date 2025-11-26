/**
 * Type definitions for Golden God game application
 * Centralized type definitions for improved type safety and code maintainability
 */

// ============================================================================
// CARD TYPES
// ============================================================================

/**
 * Represents a playing card in the deck
 */
export interface Card {
  /** Card code (e.g., "KS" for King of Spades, "8H" for 8 of Hearts) */
  code: string;
  /** Whether the card has been drawn from the deck */
  drawn: boolean;
  /** Name of the player who drew this card, or null if not drawn */
  drawnBy: string | null;
  /** Position in the circular card layout (for UI rendering) */
  position: number;
}

/**
 * Information about a card that was just drawn
 */
export interface DrawnCard {
  /** Card code */
  code: string;
  /** Player who drew the card */
  drawnBy: string;
  /** Card rank (K, Q, J, 0-9, A) */
  rank: string;
  /** Index of the player in the players array */
  playerIndex: number;
}

// ============================================================================
// PLAYER TYPES
// ============================================================================

/**
 * Player gender options
 */
export type Gender = "male" | "female" | "non-binary" | null;

/**
 * Player roles that can be assigned from specific cards
 */
export type PlayerRole = 
  | "golden-god"  // King of Spades
  | "mac"         // King of Hearts
  | "frank"       // King of Clubs
  | "charlie"     // King of Diamonds
  | "barbara"     // Ace of Spades
  | "bruce"       // Ace of Hearts
  | "gino"        // Ace of Clubs
  | "gail"        // Ace of Diamonds (Snail)
  | "uncle-jack"  // Jack of Spades
  | "cricket"     // Jack of Hearts
  | null;

/**
 * Represents a player in the game
 */
export interface Player {
  /** Unique player ID from Supabase */
  id: string;
  /** Player's display name */
  name: string;
  /** Whether this player is the lobby host */
  is_host: boolean;
  /** Special role assigned to this player, if any */
  role: PlayerRole;
  /** Player's gender (affects certain card rules like 6s and 5s) */
  gender?: Gender;
}

// ============================================================================
// GAME PROMPT TYPES
// ============================================================================

/**
 * Types of prompts that can be active in the game
 */
export type PromptType =
  | "mate"              // Choose a drinking mate (8 cards)
  | "golden_god"        // Redirect drink (King of Spades)
  | "uncle_jack"        // Challenge player (Jack of Spades)
  | "mac"               // Rock Paper Scissors (King of Hearts)
  | "frank"             // Performance challenge (King of Clubs)
  | "frank-perform"     // Target choosing to perform or refuse
  | "frank-judge"       // Frank judging if moved by the art
  | "dayman"            // Choose Nightman (King of Diamonds)
  | "barbara"           // Dice roll for drink manipulation (Ace of Spades)
  | "gino"              // Swap drinks (Ace of Clubs)
  | "cricket"           // Deny drinks (Jack of Hearts)
  | "word_game"         // Categories or Rhymes (10s, 9s, 7s)
  | "rps"               // Rock Paper Scissors (4s)
  | "choose_player"     // General player selection (2s)
  | "choose-player"     // Alternative spelling for compatibility
  | "drink"             // Legacy drink prompt
  | "word-game";        // Alternative spelling for compatibility

/**
 * Additional data for active prompts
 */
export interface PromptData {
  /** Action to be performed */
  action?: string;
  /** Message to display to players */
  message?: string;
  /** Target player(s) for the action */
  players?: string | string[];
  /** Target player name */
  target?: string;
  /** Nightman player name (for Dayman mechanic) */
  nightman?: string;
  /** Performance type chosen by target (for Frank performance) */
  performanceType?: string;
  /** Any other dynamic properties */
  [key: string]: unknown;
}

/**
 * Active prompt displayed to players requiring action/response
 */
export interface ActivePrompt {
  /** Type of prompt */
  type: PromptType;
  /** Card code that triggered this prompt */
  card_code: string;
  /** Player who drew the card and initiated the prompt */
  drawnBy: string;
  /** Additional prompt data */
  data?: PromptData;
  /** Players who have confirmed/responded to this prompt */
  confirmed_players?: string[];
}

// ============================================================================
// MINI-GAME TYPES
// ============================================================================

/**
 * Word game types (Categories, Rhymes, Episode Naming)
 */
export type WordGameType = "categories" | "rhymes" | "episodes";

/**
 * State for active word-based mini-games
 */
export interface WordGame {
  /** Type of word game being played */
  type: WordGameType;
  /** Current word in play */
  current_word: string;
  /** Words that have been used (to prevent repeats) */
  used_words: string[];
  /** Index of the current player in the turn order */
  current_player_index: number;
  /** Name of the player who started the game */
  starting_player: string;
}

/**
 * Rock Paper Scissors choice
 */
export type RPSChoice = "rock" | "paper" | "scissors";

/**
 * State for active Rock Paper Scissors game
 */
export interface RPSGame {
  /** First player name */
  player1: string;
  /** Second player name */
  player2: string;
  /** Player 1's choice */
  player1_choice?: RPSChoice;
  /** Player 2's choice */
  player2_choice?: RPSChoice;
  /** Player 1's current score */
  player1_score: number;
  /** Player 2's current score */
  player2_score: number;
  /** Current round number (best of 3) */
  round: number;
  /** Players who have made their choice this round */
  confirmed_players?: string[];
}

// ============================================================================
// ROLE-SPECIFIC TYPES
// ============================================================================

/**
 * Mate pair (8 cards)
 */
export interface Mate {
  /** First player in the mate pair */
  player1: string;
  /** Second player in the mate pair */
  player2: string;
}

/**
 * Dayman/Nightman mechanic state (King of Diamonds)
 */
export interface DaymanNightman {
  /** Current Nightman player name */
  nightman: string;
  /** Number of rounds remaining for this Nightman */
  rounds_remaining: number;
}

/**
 * Usage counters for role-specific abilities
 */
export interface RoleUsageCounters {
  /** Golden God redirect uses per player */
  golden_god_redirects?: Record<string, number>;
  /** Uncle Jack challenge uses per player */
  uncle_jack_uses?: Record<string, number>;
  /** Mac action uses per player */
  mac_action_uses?: Record<string, number>;
  /** Mac last action turn per player (to prevent multiple actions per turn) */
  mac_last_action_turn?: Record<string, number>;
  /** Frank performance counts per player */
  frank_performances?: Record<string, number>;
  /** Gino drink swap uses per player */
  gino_swaps_used?: Record<string, number>;
  /** Cricket denial counts per player */
  cricket_denials?: Record<string, number>;
  /** Non-binary gender pass uses per player (max 4) */
  non_binary_passes?: Record<string, number>;
  /** Gino swap voting state */
  gino_swap_voting?: {
    swapper: string;
    target: string;
    excuse: string;
    votes: Record<string, boolean>;
  } | null;
}

// ============================================================================
// STATISTICS TYPES
// ============================================================================

/**
 * Individual player statistics
 */
export interface PlayerStats {
  /** Player name */
  name: string;
  /** Total drinks assigned to this player */
  drinks: number;
  /** Number of face cards drawn */
  faceCards?: number;
  /** Number of face cards drawn (alternative name for compatibility) */
  faceCardsDrawn?: number;
  /** Total cards drawn */
  cardsDrawn: number;
  /** Special actions used (role abilities) */
  actionsUsed: number;
}

/**
 * Game-wide statistics
 */
export interface GameStats {
  /** Statistics for each player, keyed by player name */
  [playerName: string]: PlayerStats;
}

// ============================================================================
// LOBBY TYPES
// ============================================================================

/**
 * Lobby/Game status
 */
export type LobbyStatus = "waiting" | "playing" | "finished";

/**
 * Complete lobby state containing all game information
 */
export interface Lobby extends RoleUsageCounters {
  /** Unique lobby ID */
  id: string;
  /** 4-character lobby code for joining */
  code: string;
  /** Current lobby status */
  status: LobbyStatus;
  /** Complete deck of cards */
  deck: Card[];
  /** ID of the player whose turn it is */
  current_player_id: string | null;
  /** Current turn number */
  turn_number: number;
  /** Active prompt requiring player action */
  active_prompt?: ActivePrompt | null;
  /** Active word game state */
  word_game?: WordGame | null;
  /** Active Rock Paper Scissors game */
  rps_game?: RPSGame | null;
  /** Current mate pair */
  mate?: Mate | null;
  /** Dayman/Nightman mechanic state */
  dayman_nightman?: DaymanNightman | null;
  /** Current Snail player name */
  snail_player?: string | null;
  /** Game statistics for all players */
  game_stats?: GameStats | null;
  /** Bruce voting state */
  bruce_voting?: {
    bruce: string;
    target: string;
    reason: string;
    votes: Record<string, boolean>;
  } | null;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

/**
 * Types of game events that can be logged
 */
export type GameEventType =
  | "card_drawn"
  | "role_assigned"
  | "drink_assigned"
  | "mate_assigned"
  | "mate_broken"
  | "special_action"
  | "mini_game_started"
  | "mini_game_ended"
  | "player_joined"
  | "player_left"
  | "host_migrated"
  | "game_started"
  | "game_ended";

/**
 * Game event data structure
 */
export interface GameEventData {
  /** Type of event */
  type: GameEventType;
  /** Player who triggered the event */
  player_name: string;
  /** Event timestamp */
  timestamp: string;
  /** Additional event-specific data */
  data?: Record<string, unknown>;
}

/**
 * Chat message structure
 */
export interface ChatMessage {
  /** Unique message ID */
  id: string;
  /** Lobby ID this message belongs to */
  lobby_id: string;
  /** Name of player who sent the message */
  player_name: string;
  /** Message content */
  message: string;
  /** Timestamp when message was sent */
  created_at: string;
}

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

/**
 * Props for GameChat component
 */
export interface GameChatProps {
  /** Lobby ID for chat messages */
  lobbyId: string;
  /** Current player's name */
  playerName: string;
  /** Whether chat is open */
  isOpen: boolean;
  /** Callback when chat is closed */
  onClose: () => void;
}

/**
 * Props for GameHistory component
 */
export interface GameHistoryProps {
  /** Lobby ID to fetch history for */
  lobbyId: string;
  /** Whether history modal is open */
  isOpen: boolean;
  /** Callback when history is closed */
  onClose: () => void;
}

/**
 * Props for GameStats component
 */
export interface GameStatsProps {
  /** Lobby ID to fetch stats for */
  lobbyId: string;
  /** Array of players to display stats for */
  players: { name: string }[];
  /** Whether stats modal is open */
  show: boolean;
  /** Callback when stats are closed */
  onClose: () => void;
}

/**
 * Props for Toast notification
 */
export interface ToastProps {
  /** Unique toast ID */
  id: string;
  /** Toast message text */
  message: string;
  /** Toast type (determines color and icon) */
  type: ToastType;
  /** Callback when toast is dismissed */
  onDismiss: (id: string) => void;
}

/**
 * Toast notification types
 */
export type ToastType = "success" | "error" | "warning" | "info";

/**
 * Individual toast data
 */
export interface Toast {
  /** Unique toast ID */
  id: string;
  /** Toast message */
  message: string;
  /** Toast type */
  type: ToastType;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Supabase real-time payload for lobby updates
 */
export interface LobbyRealtimePayload {
  /** Event type */
  eventType: "INSERT" | "UPDATE" | "DELETE";
  /** New lobby data */
  new: Lobby;
  /** Old lobby data */
  old: Lobby;
}

/**
 * Supabase real-time payload for player updates
 */
export interface PlayerRealtimePayload {
  /** Event type */
  eventType: "INSERT" | "UPDATE" | "DELETE";
  /** New player data */
  new: Player;
  /** Old player data */
  old: Player;
}

/**
 * Card positioning for UI layout
 */
export interface CardPosition {
  /** X position in pixels or percentage */
  x: number;
  /** Y position in pixels or percentage */
  y: number;
  /** Rotation angle in degrees */
  rotation: number;
}

/**
 * Sound effect types
 */
export type SoundEffect = "card-draw" | "card-flip" | "role-assigned" | "notification";

/**
 * Hook return type for sound effects
 */
export interface UseSoundEffectsReturn {
  /** Function to play a sound effect */
  playSound: (soundName: SoundEffect) => void;
}
