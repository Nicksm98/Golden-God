"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { PlayerStats, GameStatsProps } from "@/lib/types";

export function GameStats({ lobbyId, players, show, onClose }: GameStatsProps) {
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!show) return;

    const fetchStats = async () => {
      setLoading(true);
      const { data: lobby } = await supabase
        .from("lobbies")
        .select("game_stats")
        .eq("id", lobbyId)
        .single();

      if (lobby?.game_stats) {
        const gameStats = lobby.game_stats as {
          [playerName: string]: {
            drinks?: number;
            faceCardsDrawn?: number;
            actionsUsed?: number;
          };
        };

        const playerStats: PlayerStats[] = players.map((player: { name: string }) => ({
          name: player.name,
          drinks: gameStats[player.name]?.drinks || 0,
          faceCardsDrawn: gameStats[player.name]?.faceCardsDrawn || 0,
          faceCards: gameStats[player.name]?.faceCardsDrawn || 0,
          cardsDrawn: 0,
          actionsUsed: gameStats[player.name]?.actionsUsed || 0,
        }));

        setStats(playerStats);
      }
      setLoading(false);
    };

    fetchStats();
  }, [show, lobbyId, players, supabase]);

  if (!show) return null;

  const topDrinker = stats.reduce(
    (max, p) => (p.drinks > max.drinks ? p : max),
    stats[0] || { name: "", drinks: 0 }
  );

  const topCardDrawer = stats.reduce(
    (max, p) => ((p.faceCardsDrawn || 0) > (max.faceCardsDrawn || 0) ? p : max),
    stats[0] || { name: "", faceCardsDrawn: 0, drinks: 0, actionsUsed: 0, cardsDrawn: 0 }
  );

  const mostActive = stats.reduce(
    (max, p) => (p.actionsUsed > max.actionsUsed ? p : max),
    stats[0] || { name: "", actionsUsed: 0 }
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-linear-to-br from-yellow-400 via-orange-500 to-red-600 rounded-lg p-8 shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto bounce-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-white drop-shadow-lg">
            🏆 Game Statistics
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-3xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-20 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Awards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center slide-in-bottom">
                <div className="text-4xl mb-2">🍺</div>
                <h3 className="text-white font-bold text-lg mb-1">
                  Most Drinks
                </h3>
                <p className="text-white text-2xl font-bold">
                  {topDrinker.name}
                </p>
                <p className="text-white/80 text-sm">{topDrinker.drinks} drinks</p>
              </div>

              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center slide-in-bottom" style={{ animationDelay: "0.1s" }}>
                <div className="text-4xl mb-2">🃏</div>
                <h3 className="text-white font-bold text-lg mb-1">
                  Face Card King
                </h3>
                <p className="text-white text-2xl font-bold">
                  {topCardDrawer.name}
                </p>
                <p className="text-white/80 text-sm">
                  {topCardDrawer.faceCardsDrawn} face cards
                </p>
              </div>

              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center slide-in-bottom" style={{ animationDelay: "0.2s" }}>
                <div className="text-4xl mb-2">⚡</div>
                <h3 className="text-white font-bold text-lg mb-1">
                  Most Active
                </h3>
                <p className="text-white text-2xl font-bold">
                  {mostActive.name}
                </p>
                <p className="text-white/80 text-sm">
                  {mostActive.actionsUsed} actions
                </p>
              </div>
            </div>

            {/* All Players Stats */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <h3 className="text-white font-bold text-xl mb-4">
                All Players
              </h3>
              <div className="space-y-3">
                {stats
                  .sort((a, b) => b.drinks - a.drinks)
                  .map((player, index) => (
                    <div
                      key={player.name}
                      className="bg-white/10 rounded-lg p-3 flex justify-between items-center fade-in-scale"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-white font-bold text-lg">
                          {index + 1}.
                        </span>
                        <span className="text-white font-semibold">
                          {player.name}
                        </span>
                      </div>
                      <div className="flex gap-4 text-sm text-white/90">
                        <span>🍺 {player.drinks}</span>
                        <span>🃏 {player.faceCardsDrawn}</span>
                        <span>⚡ {player.actionsUsed}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <Button
              onClick={onClose}
              className="w-full bg-white text-orange-600 hover:bg-gray-100 font-bold py-3 text-lg"
            >
              Close Stats
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
