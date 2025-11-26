
export interface Card {
  code: string;
  drawn: boolean;
  drawnBy: string | null;
  position: number;
}

export interface DrawnCard {
  code: string;
  drawnBy: string;
  rank: string;
  playerIndex: number;
}

export type Gender = "male" | "female" | "non-binary" | null;

export type PlayerRole = 
  | "golden-god"  
  | "mac"         
  | "frank"       
  | "charlie"    
  | "barbara"     
  | "bruce"       
  | "gino"        
  | "gail"         
  | "uncle-jack"  
  | "cricket"     
  | null;
export interface Player {
  id: string;
  name: string;
  is_host: boolean;
  role: PlayerRole;
  gender?: Gender;
}

export type PromptType =
  | "mate"              
  | "golden_god"        
  | "uncle_jack"        
  | "mac"               
  | "frank"             
  | "frank-perform"     
  | "frank-judge"       
  | "dayman"            
  | "barbara"           
  | "gino"              
  | "cricket"           
  | "word_game"         
  | "rps"               
  | "choose_player"     
  | "choose-player"     
  | "drink"             
  | "word-game";        

export interface PromptData {
  action?: string;
  message?: string;
  players?: string | string[];
  target?: string;
  nightman?: string;
  performanceType?: string;
  [key: string]: unknown;
}
export interface ActivePrompt {
  type: PromptType;
  card_code: string;
  drawnBy: string;
  data?: PromptData;
  confirmed_players?: string[];
}

export type WordGameType = "categories" | "rhymes" | "episodes";
export interface WordGame {
  type: WordGameType;
  current_word: string;
  used_words: string[];
  current_player_index: number;
  starting_player: string;
}

export type RPSChoice = "rock" | "paper" | "scissors";

export interface RPSGame {
  player1: string;
  player2: string;
  player1_choice?: RPSChoice;
  player2_choice?: RPSChoice;
  player1_score: number;
  player2_score: number;
  round: number;
  confirmed_players?: string[];
}

export interface Mate {
  player1: string;
  player2: string;
}

export interface DaymanNightman {
  nightman: string;
  rounds_remaining: number;
}

export interface RoleUsageCounters {
  golden_god_redirects?: Record<string, number>;
  uncle_jack_uses?: Record<string, number>;
  mac_action_uses?: Record<string, number>;
  mac_last_action_turn?: Record<string, number>;
  frank_performances?: Record<string, number>;
  gino_swaps_used?: Record<string, number>;
  cricket_denials?: Record<string, number>;
  non_binary_passes?: Record<string, number>;
  gino_swap_voting?: {
    swapper: string;
    target: string;
    excuse: string;
    votes: Record<string, boolean>;
  } | null;
}


export interface PlayerStats {
  name: string;
  drinks: number;
  faceCards?: number;
  faceCardsDrawn?: number;
  cardsDrawn: number;
  actionsUsed: number;
}

export interface GameStats {
  [playerName: string]: PlayerStats;
}


export type LobbyStatus = "waiting" | "playing" | "finished";

export interface Lobby extends RoleUsageCounters {
  id: string;
  code: string;
  status: LobbyStatus;
  deck: Card[];
  current_player_id: string | null;
  turn_number: number;
  active_prompt?: ActivePrompt | null;
  word_game?: WordGame | null;
  rps_game?: RPSGame | null;
  mate?: Mate | null;
  dayman_nightman?: DaymanNightman | null;
  snail_player?: string | null;
  game_stats?: GameStats | null;
  bruce_voting?: {
    bruce: string;
    target: string;
    reason: string;
    votes: Record<string, boolean>;
  } | null;
}


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

export interface GameEventData {
  type: GameEventType;
  player_name: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  lobby_id: string;
  player_name: string;
  message: string;
  created_at: string;
}


export interface GameChatProps {
  lobbyId: string;
  playerName: string;
  isOpen: boolean;
  onClose: () => void;
}

export interface GameHistoryProps {
  lobbyId: string;
  isOpen: boolean;
  onClose: () => void;
}

export interface GameStatsProps {
  lobbyId: string;
  players: { name: string }[];
  show: boolean;
  onClose: () => void;
}

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onDismiss: (id: string) => void;
}

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}


export interface LobbyRealtimePayload {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: Lobby;
  old: Lobby;
}

export interface PlayerRealtimePayload {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: Player;
  old: Player;
}

export interface CardPosition {
  x: number;
  y: number;
  rotation: number;
}

export type SoundEffect = "card-draw" | "card-flip" | "role-assigned" | "notification";

export interface UseSoundEffectsReturn {
  playSound: (soundName: SoundEffect) => void;
}
