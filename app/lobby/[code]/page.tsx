"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface Player {
  id: string;
  name: string;
  is_host: boolean;
  joined_at: string;
  gender?: "male" | "female" | "non-binary" | null;
}

interface Lobby {
  id: string;
  code: string;
  status: string;
  created_at: string;
}

export default function LobbyPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const supabase = createClient();

  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [playersLoaded, setPlayersLoaded] = useState(false);
  const hasAttemptedJoin = useRef(false);

  const loadLobby = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("lobbies")
        .select("*")
        .eq("code", code.toUpperCase())
        .single();

      if (error) throw error;
      if (!data) {
        setError("Lobby not found");
        setLoading(false);
        return;
      }

      setLobby(data);
      setLoading(false);
    } catch (err) {
      console.error("Error loading lobby:", err);
      setError("Failed to load lobby");
      setLoading(false);
    }
  }, [code, supabase]);

  const loadPlayers = useCallback(async () => {
    if (!lobby) return;

    try {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("lobby_id", lobby.id)
        .order("joined_at", { ascending: true });

      if (error) throw error;
      console.log("Loaded players:", data);
      setPlayers(data || []);
      setPlayersLoaded(true);
    } catch (err) {
      console.error("Error loading players:", err);
      setPlayersLoaded(true);
    }
  }, [lobby, supabase]);

  const autoJoinLobby = useCallback(async () => {
    console.log("autoJoinLobby called", { 
      lobby: !!lobby, 
      hasAttempted: hasAttemptedJoin.current,
      playersCount: players.length,
      currentPlayerId 
    });

    if (!lobby || hasAttemptedJoin.current) {
      console.log("Skipping join - lobby or already attempted");
      return;
    }

    const existingPlayerId = sessionStorage.getItem(`player-${code}`);
    console.log("Checking sessionStorage:", existingPlayerId);
    
    if (existingPlayerId) {
      try {
        const { data: playerCheck } = await supabase
          .from("players")
          .select("id, lobby_id")
          .eq("id", existingPlayerId)
          .eq("lobby_id", lobby.id)
          .single();
        
        if (playerCheck) {
          console.log("Found existing player in database, setting ID");
          setCurrentPlayerId(existingPlayerId);
          hasAttemptedJoin.current = true;
          return;
        }
        console.log("Player in sessionStorage but not in this lobby, clearing");
        sessionStorage.removeItem(`player-${code}`);
      } catch {
        console.log("Error checking existing player, clearing sessionStorage");
        sessionStorage.removeItem(`player-${code}`);
      }
    }

    if (players.length >= 10) {
      setError("Lobby is full (max 10 players)");
      setLoading(false);
      return;
    }

    hasAttemptedJoin.current = true;

    try {
      const isHost = players.length === 0;
      const autoName = isHost ? "Host" : `Player ${players.length + 1}`;
      
      console.log("Attempting to join as:", autoName, "Current players:", players.length);

      const { data, error } = await supabase
        .from("players")
        .insert({
          lobby_id: lobby.id,
          name: autoName,
          is_host: isHost,
        })
        .select()
        .single();

      if (error) {
        console.error("Insert error:", error);
        throw error;
      }

      console.log("Successfully joined:", data);
      setCurrentPlayerId(data.id);
      setError("");
      
      sessionStorage.setItem(`player-${code}`, data.id);
      localStorage.setItem(`player-${code}`, data.id);
      
      setPlayers((prev) => [...prev, data]);
    } catch (err) {
      console.error("Error joining lobby:", err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to join lobby: ${errorMessage}`);
      hasAttemptedJoin.current = false;
    }
  }, [lobby, code, players, supabase, currentPlayerId]);

  useEffect(() => {
    loadLobby();
  }, [loadLobby]);

  useEffect(() => {
    if (lobby && playersLoaded && !currentPlayerId) {
      autoJoinLobby();
    }
  }, [lobby, playersLoaded, currentPlayerId, autoJoinLobby]);

  useEffect(() => {
    if (!lobby) return;

    loadPlayers();

    const channel = supabase
      .channel(`lobby-${lobby.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `lobby_id=eq.${lobby.id}`,
        },
        (payload) => {
          console.log("Players update received:", payload);
          loadPlayers();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "lobbies",
          filter: `id=eq.${lobby.id}`,
        },
        (payload) => {
          console.log("Lobby update received:", payload);
          if (payload.new && payload.new.status === "playing") {
            router.push(`/game/${code}`);
          }
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
        if (status === "SUBSCRIBED") {
          console.log("Successfully subscribed to lobby changes");
        }
      });

    const pollInterval = setInterval(() => {
      loadPlayers();
    }, 2000);

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [lobby, loadPlayers, supabase, router, code]);

  async function updatePlayerName() {
    if (!currentPlayerId || !newName.trim()) return;

    try {
      await supabase
        .from("players")
        .update({ name: newName.trim() })
        .eq("id", currentPlayerId);

      setEditingName(false);
      setNewName("");
    } catch (err) {
      console.error("Error updating name:", err);
      setError("Failed to update name");
    }
  }

  async function leaveLobby() {
    if (!currentPlayerId) return;

    try {
      await supabase.from("players").delete().eq("id", currentPlayerId);
      router.push("/");
    } catch (err) {
      console.error("Error leaving lobby:", err);
    }
  }

  async function copyInviteCode() {
    try {
      const inviteLink = `${window.location.origin}/lobby/${code}`;
      await navigator.clipboard.writeText(inviteLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Error copying link:", err);
      setError("Failed to copy invite link");
    }
  }

  async function startGame() {
    if (!lobby) return;

    const currentPlayer = players.find((p) => p.id === currentPlayerId);
    if (!currentPlayer?.is_host) return;

    const randomPlayer = players[Math.floor(Math.random() * players.length)];

    try {
      await supabase
        .from("lobbies")
        .update({ 
          status: "playing",
          current_player_id: randomPlayer.id,
          turn_number: 0
        })
        .eq("id", lobby.id);

      router.push(`/game/${code}`);
    } catch (err) {
      console.error("Error starting game:", err);
    }
  }

  if (loading) {
    return (
      <div
        className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center"
        style={{ backgroundImage: "url('/bar.jpg')" }}
      >
        <div className="bg-black/40 backdrop-blur-sm rounded-lg p-8 shadow-2xl border border-white/20">
          <p className="text-white text-xl">Loading lobby...</p>
        </div>
      </div>
    );
  }

  if (error && !lobby) {
    return (
      <div
        className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center"
        style={{ backgroundImage: "url('/bar.jpg')" }}
      >
        <div className="bg-black/40 backdrop-blur-sm rounded-lg p-8 shadow-2xl border border-white/20">
          <h1 className="text-white text-2xl font-bold mb-4">Error</h1>
          <p className="text-white mb-4">{error}</p>
          <Button
            onClick={() => router.push("/")}
            className="w-full bg-white/90 hover:bg-white text-black"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4"
      style={{ backgroundImage: "url('/bar.jpg')" }}
    >
      <div className="bg-black/40 backdrop-blur-sm rounded-lg p-8 shadow-2xl border border-white/20 max-w-2xl w-full">
        <div className="mb-6">
          <h1 className="text-white text-3xl font-bold text-center mb-2">
            Game Lobby
          </h1>
          <div className="flex items-center justify-center gap-3">
            <p className="text-white/80 text-lg">
              Code: <span className="font-mono font-bold">{code}</span>
            </p>
            <Button
              onClick={copyInviteCode}
              className="bg-blue-500/90 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-all text-sm"
            >
              {copySuccess ? "✓ Link Copied!" : "Copy Invite Link"}
            </Button>
          </div>
        </div>

        {error && <p className="text-red-300 text-sm mb-4">{error}</p>}

        <div className="space-y-6">
          <div className="bg-white/10 rounded-lg p-4">
            <h2 className="text-white font-bold mb-3 text-lg">
              Players ({players.length}/10)
            </h2>
            <div className="space-y-2">
              {players.map((player) => (
                <div key={player.id} className="space-y-2">
                  <div className="bg-white/20 rounded px-4 py-2 flex justify-between items-center">
                    {player.id === currentPlayerId && editingName ? (
                      <div className="flex gap-2 flex-1">
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && updatePlayerName()}
                          placeholder={player.name}
                          maxLength={50}
                          className="flex-1 bg-white/90 text-black font-semibold py-1 px-3 rounded placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
                          autoFocus
                        />
                        <button
                          onClick={updatePlayerName}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm font-bold"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => {
                            setEditingName(false);
                            setNewName("");
                          }}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-semibold">
                            {player.name}
                          </span>
                          {player.id === currentPlayerId && (
                            <button
                              onClick={() => {
                                setEditingName(true);
                                setNewName(player.name);
                              }}
                              className="text-white/60 hover:text-white text-xs"
                            >
                              ✏️
                            </button>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {player.is_host && (
                            <span className="text-yellow-300 text-sm font-bold">
                              HOST
                            </span>
                          )}
                          {player.id === currentPlayerId && (
                            <span className="text-green-300 text-sm font-bold">
                              YOU
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  {player.id === currentPlayerId && (
                    <div className="mt-2">
                      <p className="text-white/70 text-xs mb-1">Gender (for 5s/6s):</p>
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            await supabase
                              .from("players")
                              .update({ gender: "male" })
                              .eq("id", player.id);
                          }}
                          className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                            player.gender === "male"
                              ? "bg-blue-500 text-white"
                              : "bg-white/20 text-white/60 hover:bg-white/30"
                          }`}
                        >
                          ♂️ Male
                        </button>
                        <button
                          onClick={async () => {
                            await supabase
                              .from("players")
                              .update({ gender: "female" })
                              .eq("id", player.id);
                          }}
                          className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                            player.gender === "female"
                              ? "bg-pink-500 text-white"
                              : "bg-white/20 text-white/60 hover:bg-white/30"
                          }`}
                        >
                          ♀️ Female
                        </button>
                        <button
                          onClick={async () => {
                            await supabase
                              .from("players")
                              .update({ gender: "non-binary" })
                              .eq("id", player.id);
                          }}
                          className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                            player.gender === "non-binary"
                              ? "bg-purple-500 text-white"
                              : "bg-white/20 text-white/60 hover:bg-white/30"
                          }`}
                        >
                          ⚧️ Non-Binary
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

            <div className="space-y-2">
              {players.find((p) => p.id === currentPlayerId)?.is_host && (
                <Button
                  onClick={startGame}
                  disabled={players.length < 2}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start Game {players.length < 2 && "(Need 2+ players)"}
                </Button>
              )}
              <Button
                onClick={leaveLobby}
                className="w-full bg-red-500/90 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-all"
              >
                Leave Lobby
              </Button>
            </div>

          <p className="text-white/60 text-sm text-center">
            Waiting for host to start the game...
          </p>
        </div>
      </div>
    </div>
  );
}
