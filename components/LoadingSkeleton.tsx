"use client";

interface LoadingSkeletonProps {
  type?: "card" | "player" | "list" | "full-page";
  count?: number;
}

export function LoadingSkeleton({ type = "full-page", count = 1 }: LoadingSkeletonProps) {
  if (type === "card") {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton h-28 w-20 rounded-lg" />
        ))}
      </div>
    );
  }

  if (type === "player") {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-lg bg-white/5"
          >
            <div className="skeleton h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-24" />
              <div className="skeleton h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "list") {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  // Full page loading
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-900 via-blue-900 to-black">
      <div className="text-center space-y-6 p-8">
        <div className="relative">
          <div className="skeleton h-32 w-32 mx-auto rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl animate-bounce">🃏</div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="skeleton h-6 w-48 mx-auto" />
          <div className="skeleton h-4 w-64 mx-auto" />
        </div>
        <div className="flex justify-center gap-2">
          <div className="skeleton h-3 w-3 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
          <div className="skeleton h-3 w-3 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
          <div className="skeleton h-3 w-3 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
        </div>
      </div>
    </div>
  );
}
