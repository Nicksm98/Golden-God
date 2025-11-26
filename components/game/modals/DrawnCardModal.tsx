"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import type { DrawnCard, Lobby, Player, ActivePrompt, RPSGame } from "@/lib/types";
import React from "react";

const getCardRules = (code: string): React.ReactNode => {
  const rules: { [key: string]: React.ReactNode } = {
    KS: <>You are now the Golden God. Redirect any drink given to you up to three times. Must declare: &quot;Because I am the Golden God!&quot; After 3 redirects, the game will randomly prompt you to drink.</>,
    KH: <>You have 5 actions to use. After all 5, you must drink double. Actions: Bodyguard, Karate Demo, Confession Time, Protein Share, Challenge of Toughness.</>,
    KC: 'You are Ongo Gablogian. Once per round, make a player perform. If refused, they drink. If they perform, you drink.',
    KD: 'You are the Dayman! Tag someone as Nightman for 3 rounds. They must respond "Dayman!" or drink.',
    QS: "Question Master - Ask anyone a question. If they answer, they drink. Lasts until another Queen is drawn.",
    QH: "Question Master - Ask anyone a question. If they answer, they drink. Lasts until another Queen is drawn.",
    QC: "Question Master - Ask anyone a question. If they answer, they drink. Lasts until another Queen is drawn.",
    QD: "Question Master - Ask anyone a question. If they answer, they drink. Lasts until another Queen is drawn.",
    JS: "Tiny hands! Take smaller drinks 3 times by saying 'My hands are too tiny'. After 3, if caught, drink double.",
    JH: "Deny 3 drinks by saying 'God says no!' After 3 denials, must confess before every drink.",
    JC: 'If anyone says "Oh shit", everyone drinks for the rest of the game.',
    JD: 'You are The Ragebaiter. Successfully ragebait a player to make them drink. If failed, you drink.',
    "0S": "Categories - Pick a category. Players name words from it. First to fail drinks.",
    "0H": "Categories - Pick a category. Players name words from it. First to fail drinks.",
    "0C": "Categories - Pick a category. Players name words from it. First to fail drinks.",
    "0D": "Categories - Pick a category. Players name words from it. First to fail drinks.",
    "9S": "Rhyme time! First person who can't rhyme drinks.",
    "9H": "Rhyme time! First person who can't rhyme drinks.",
    "9C": "Rhyme time! First person who can't rhyme drinks.",
    "9D": "Rhyme time! First person who can't rhyme drinks.",
    "8S": "Mates - Pick a drinking mate for the rest of the game or until another 8 is drawn.",
    "8H": "Mates - Pick a drinking mate for the rest of the game or until another 8 is drawn.",
    "8C": "Mates - Pick a drinking mate for the rest of the game or until another 8 is drawn.",
    "8D": "Mates - Pick a drinking mate for the rest of the game or until another 8 is drawn.",
    "7S": "Name It's Always Sunny episodes. First to fail drinks.",
    "7H": "Name It's Always Sunny episodes. First to fail drinks.",
    "7C": "Name It's Always Sunny episodes. First to fail drinks.",
    "7D": "Name It's Always Sunny episodes. First to fail drinks.",
    "6S": "Chicks drink!",
    "6H": "Chicks drink!",
    "6C": "Chicks drink!",
    "6D": "Chicks drink!",
    "5S": "Guys drink!",
    "5H": "Guys drink!",
    "5C": "Guys drink!",
    "5D": "Guys drink!",
    "4S": "Rock Paper Scissors - Best 2 out of 3. Loser drinks.",
    "4H": "Rock Paper Scissors - Best 2 out of 3. Loser drinks.",
    "4C": "Rock Paper Scissors - Best 2 out of 3. Loser drinks.",
    "4D": "Rock Paper Scissors - Best 2 out of 3. Loser drinks.",
    "3S": "Me - You drink!",
    "3H": "Me - You drink!",
    "3C": "Me - You drink!",
    "3D": "Me - You drink!",
    "2S": "You - Choose someone to drink.",
    "2H": "You - Choose someone to drink.",
    "2C": "You - Choose someone to drink.",
    "2D": "You - Choose someone to drink.",
    AS: 'Barbara Reynolds! Roll dice when you drink. 1/3/5: Pick someone else to drink. 2/4/6: You drink.',
    AH: "Bruce Mathis! Give extra drinks and declare the cause. Forget to declare? Drink twice.",
    AC: "Gino Reynolds! Once per round, swap your drink with a ridiculous excuse. Group votes.",
    AD: 'The Snail! Everyone must hiss at you. Forget to hiss? They drink. "Salt the snail"? Finish your drink.',
  };
  return rules[code] || "No special rules for this card.";
};

const Card = ({ code }: { code: string }) => {
  const cardImageMap: { [key: string]: string } = {
    KS: "golden-god", KH: "mac", KC: "frank", KD: "charlie",
    QS: "dee", QH: "carmen", QC: "maureen", QD: "waitress",
    JS: "uncle-jack", JH: "cricket", JC: "z", JD: "liam",
    "0S": "jewish-lawyer", "0H": "jewish-lawyer", "0C": "jewish-lawyer", "0D": "jewish-lawyer",
    "9S": "artemis", "9H": "artemis", "9C": "artemis", "9D": "artemis",
    "8S": "maniac", "8H": "maniac", "8C": "maniac", "8D": "maniac",
    "7S": "country-mac", "7H": "country-mac", "7C": "country-mac", "7D": "country-mac",
    "6S": "mrs-mac", "6H": "mrs-mac", "6C": "mrs-mac", "6D": "mrs-mac",
    "5S": "luther", "5H": "luther", "5C": "luther", "5D": "luther",
    "4S": "Bonnie", "4H": "Bonnie", "4C": "Bonnie", "4D": "Bonnie",
    "3S": "old-black-man", "3H": "old-black-man", "3C": "old-black-man", "3D": "old-black-man",
    "2S": "margaret", "2H": "margaret", "2C": "margaret", "2D": "margaret",
    AS: "barbara", AH: "bruce", AC: "gino", AD: "gail",
  };

  const rank = code.slice(0, -1);
  const suit = code.slice(-1);
  const imageName = cardImageMap[code];
  
  const suitSymbol = suit === "S" ? "♠" : suit === "H" ? "♥" : suit === "C" ? "♣" : "♦";
  const suitColor = suit === "H" || suit === "D" ? "text-red-600" : "text-black";
  const displayRank = rank === "0" ? "10" : rank;

  return (
    <div className="w-20 h-28 bg-white rounded-lg shadow-xl border-2 border-gray-300 flex items-center justify-center relative overflow-hidden">
      {imageName ? (
        <>
          <Image
            src={`/${imageName}.jpg`}
            alt={code}
            width={80}
            height={112}
            className="w-full h-full object-cover"
            unoptimized
          />
          <div className={`absolute top-0.5 left-0.5 text-lg font-bold px-0.5 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] ${suitColor}`}>
            {displayRank}
            {suitSymbol}
          </div>
          <div className={`absolute bottom-0.5 right-0.5 text-lg font-bold px-0.5 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] rotate-180 ${suitColor}`}>
            {displayRank}
            {suitSymbol}
          </div>
        </>
      ) : (
        <>
          <div className={`absolute top-0.5 left-0.5 text-xl font-bold ${suitColor}`}>
            {displayRank}
            {suitSymbol}
          </div>
          <div className={`absolute bottom-0.5 right-0.5 text-xl font-bold rotate-180 ${suitColor}`}>
            {displayRank}
            {suitSymbol}
          </div>
          <div className={`text-5xl ${suitColor}`}>
            {suitSymbol}
          </div>
        </>
      )}
    </div>
  );
};

interface DrawnCardModalProps {
  drawnCard: DrawnCard;
  lobby: Lobby;
  players: Player[];
  currentPlayerId: string | null;
  activePrompt: ActivePrompt | null;
  rpsGame: RPSGame | null;
  wordGame: { type: string } | null;
  onClose: () => void;
  onCardAction: (rank: string, code: string, drawnBy: string, playerIndex: number) => Promise<boolean>;
  onDaymanSelection: () => void;
  onAdvanceTurn: () => Promise<void>;
}

export function DrawnCardModal({
  drawnCard,
  players,
  currentPlayerId,
  onClose,
  onCardAction,
  onDaymanSelection,
  onAdvanceTurn,
}: DrawnCardModalProps) {
  async function handleClose() {
    const shouldAdvanceTurn = await onCardAction(
      drawnCard.rank,
      drawnCard.code,
      drawnCard.drawnBy,
      drawnCard.playerIndex
    );

    if (drawnCard.code === "KD") {
      const currentPlayer = players.find((p) => p.id === currentPlayerId);
      if (currentPlayer?.role === "charlie") {
        onDaymanSelection();
      }
    }

    onClose();

    if (shouldAdvanceTurn) {
      await onAdvanceTurn();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg p-8 shadow-2xl max-w-2xl w-full mx-4">
        <div className="flex flex-col items-center gap-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {drawnCard.drawnBy} drew a card!
          </h2>

          <div className="transform scale-150">
            <Card code={drawnCard.code} />
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-gray-800">
              Card Rules:
            </h3>
            <div className="text-sm text-gray-600 leading-relaxed max-w-xl">
              {getCardRules(drawnCard.code)}
            </div>
          </div>

          <Button
            onClick={handleClose}
            className="bg-black hover:bg-gray-800 text-white font-semibold py-3 px-8 rounded-lg transition-all"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
