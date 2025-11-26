"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-linear-to-br from-yellow-400 via-orange-500 to-red-600 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-8 shadow-2xl max-w-md w-full text-center">
            <h1 className="text-3xl font-bold text-red-600 mb-4">
              Oops! Something went wrong
            </h1>
            <p className="text-gray-700 mb-6">
              The game encountered an error. Don&apos;t worry, your progress might still be saved.
            </p>
            {this.state.error && (
              <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-left">
                <p className="text-sm text-red-800 font-mono wrap-break-word">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <Button
                onClick={() => window.location.reload()}
                className="flex-1 bg-black hover:bg-gray-800 text-white"
              >
                Reload Game
              </Button>
              <Button
                onClick={() => (window.location.href = "/")}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
              >
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
