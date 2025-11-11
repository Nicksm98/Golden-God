"use client";

import { useState } from "react";
import Image from "next/image";

// Card component to display a playing card with custom character images
const Card = ({ code }: { code: string }) => {
  // Map card codes to character image filenames
  const cardImageMap: { [key: string]: string } = {
    // Kings
    KS: "golden-god",
    KH: "mac",
    KC: "frank",
    KD: "charlie",
    // Queens
    QS: "dee",
    QH: "carmen",
    QC: "maureen",
    QD: "waitress",
    // Jacks
    JS: "uncle-jack",
    JH: "cricket",
    JC: "z",
    JD: "liam",
    // Number cards
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
    "4S": "bonnie",
    "4H": "bonnie",
    "4C": "bonnie",
    "4D": "bonnie",
    "3S": "old-black-man",
    "3H": "old-black-man",
    "3C": "old-black-man",
    "3D": "old-black-man",
    "2S": "margaret",
    "2H": "margaret",
    "2C": "margaret",
    "2D": "margaret",
    // Aces
    AS: "barbara",
    AH: "bruce",
    AC: "gino",
    AD: "gail",
  };

  const imageName = cardImageMap[code] || "default";
  const imageUrl = `/${imageName}.jpg`; // Assuming images are .jpg, adjust extension if needed

  // Special styling for mcpoyle-twins to show both faces
  const isMcPoyles = imageName === "liam";
  const objectFitClass = isMcPoyles ? "object-contain" : "object-cover";

  // Extract rank and suit from code
  const rank = code.slice(0, -1); // Everything except last character
  const suitCode = code.slice(-1); // Last character

  // Map suit codes to symbols
  const suitMap: { [key: string]: string } = {
    S: "♠",
    H: "♥",
    C: "♣",
    D: "♦",
  };

  const suit = suitMap[suitCode] || "";
  const displayRank = rank === "0" ? "10" : rank; // Convert 0 to 10

  // Determine if suit is red or black
  const isRed = suitCode === "H" || suitCode === "D";
  const suitColor = isRed ? "text-red-600" : "text-black";

  return (
    <div className="relative w-20 h-28">
      <Image
        src={imageUrl}
        alt={`${imageName} card`}
        width={80}
        height={112}
        className={`w-20 h-28 rounded-lg shadow-lg ${objectFitClass} border-2 border-gray-300 bg-white`}
        unoptimized
      />
      {/* Top-left corner indicator */}
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
      {/* Bottom-right corner indicator (rotated) */}
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

const Home = () => {
  const [showRules, setShowRules] = useState(false);

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center"
      style={{ backgroundImage: "url('/always-sunny-bg.jpg')" }}
    >
      {/* Semi-transparent modal window */}
      <div
        className={`bg-black/40 backdrop-blur-sm rounded-lg p-8 shadow-2xl border border-white/20 max-w-md w-full transition-all ${
          showRules ? "blur-sm" : ""
        }`}
      >
        <h1 className="text-white text-2xl font-bold mb-6 text-center">
          Welcome to the Home Page
        </h1>

        {/* Example buttons */}
        <div className="space-y-4">
          <button className="w-full bg-white/90 hover:bg-white text-black font-semibold py-3 px-6 rounded-lg transition-all">
            Create Lobby
          </button>
          <button
            onClick={() => setShowRules(true)}
            className="w-full bg-white/90 hover:bg-white text-black font-semibold py-3 px-6 rounded-lg transition-all"
          >
            View Rules
          </button>
        </div>
      </div>

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg p-8 shadow-2xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900">Game Rules</h2>
              <button
                onClick={() => setShowRules(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 text-gray-700">
              <p className="text-lg font-semibold mb-4">Card Deck Rules</p>
              <div className="grid grid-cols-1 gap-4">
                {/* 1. King of Spades */}
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all">
                  <div className="flex-shrink-0">
                    <Card code="KS" />
                  </div>
                  <div className="text-sm text-gray-600">TBD</div>
                </div>

                {/* 2. King of Hearts */}
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all">
                  <div className="flex-shrink-0">
                    <Card code="KH" />
                  </div>
                  <div className="text-sm text-gray-600">TBD</div>
                </div>

                {/* 3. King of Clubs */}
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all">
                  <div className="flex-shrink-0">
                    <Card code="KC" />
                  </div>
                  <div className="text-sm text-gray-600">TBD</div>
                </div>

                {/* 4. King of Diamonds */}
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all">
                  <div className="flex-shrink-0">
                    <Card code="KD" />
                  </div>
                  <div className="text-sm text-gray-600">TBD</div>
                </div>

                {/* 5. All Queens */}
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all">
                  <div className="flex-shrink-0">
                    <Card code="QS" />
                  </div>
                  <div className="text-sm text-gray-600">
                    Question Masters - You may ask anyone a question and if they
                    answer you, they drink. You are the question master until
                    another Queen is drawn
                  </div>
                </div>

                {/* 6. Jack of Spades */}
                <div className="grid grid-cols-[auto_1fr] gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all items-center">
                  <div className="shrink-0">
                    <Card code="JS" />
                  </div>
                  <div className="text-sm text-gray-600">
                    Being made fun of all the time because of your small hands,
                    you are now a target and people may ask you to drink
                    whenever they want. However, being a lawyer, you may negate
                    this if you can recall the last character they pulled and
                    name a crime that character committed in the show. Now
                    instead of you drinking, they must
                  </div>
                </div>

                {/* 7. Jack of Hearts */}
                <div className="grid grid-cols-[auto_1fr] gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all items-center">
                  <div className="shrink-0">
                    <Card code="JH" />
                  </div>
                  <div className="text-sm text-gray-600">
                    Being a man of faith you may choose to not drink during any
                    card in the game up to three times. Each time you resist the
                    temptations, it becomes harder to resist the next time until
                    you break. If you use all three &apos;get out of jail free
                    cards&apos; you must finish your drink in an attempt to
                    satisfy your hunger. Once you've fallen into the depths of
                    addiction, the game will randomly hand out drinks to you
                    throughout the game.
                  </div>
                </div>

                {/* 8. Jack of Clubs */}
                <div className="grid grid-cols-[auto_1fr] gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all items-center">
                  <div className="shrink-0">
                    <Card code="JC" />
                  </div>
                  <div className="text-sm text-gray-600">
                    Once this card is pulled and until the end of the game, any
                    time someone says the words "Oh shit" the gang (everyone)
                    drinks
                  </div>
                </div>

                {/* 9. Jack of Diamonds */}
                <div className="grid grid-cols-[auto_1fr] gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all items-center">
                  <div className="shrink-0">
                    <Card code="JD" />
                  </div>
                  <div className="text-sm text-gray-600">
                    Having such hatred and a terrible relationship with the
                    gang. You always feel a need to get under their skin and
                    take on a new role titled "The Ragebaiter" You may now
                    attempt to ragebait another player and if successful, they
                    drink. If you fail, you drink.
                  </div>
                </div>

                {/* 10. 10s */}
                <div className="grid grid-cols-[auto_1fr] gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all items-center">
                  <div className="shrink-0">
                    <Card code="0S" />
                  </div>
                  <div className="text-sm text-gray-600">
                    Categories - The player that pulled this card must select a
                    category and say a word associated with that category. Going
                    around the room, each player must say a different word
                    associated with that category. The first person to fail to
                    come up with a word must drink.
                  </div>
                </div>

                {/* 11. 9s */}
                <div className="grid grid-cols-[auto_1fr] gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all items-center">
                  <div>
                    <Card code="9S" />
                  </div>
                  <div className="text-sm text-gray-600">
                    Rhymes - Go around the room and the first person to fail to
                    rhyme must drink.
                  </div>
                </div>

                {/* 12. 8s */}
                <div className="grid grid-cols-[auto_1fr] gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all items-center">
                  <div>
                    <Card code="8S" />
                  </div>
                  <div className="text-sm text-gray-600">
                    Mates - Pick a player to drink with you for the rest of the
                    game or until another 8 is drawn.
                  </div>
                </div>

                {/* 13. 7s */}
                <div className="grid grid-cols-[auto_1fr] gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all items-center">
                  <div>
                    <Card code="7S" />
                  </div>
                  <div className="text-sm text-gray-600">
                    Starting with the player who drew the card, give a name of
                    any Always Sunny Episode (ex: The Gang Goes to Ireland). The
                    first person to fail, drinks
                  </div>
                </div>

                {/* 14. 6s */}
                <div className="grid grid-cols-[auto_1fr] gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all items-center">
                  <div>
                    <Card code="6S" />
                  </div>
                  <div className="text-sm text-gray-600">
                    Chicks - All girls drink.
                  </div>
                </div>

                {/* 15. 5s */}
                <div className="grid grid-cols-[auto_1fr] gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all items-center">
                  <div>
                    <Card code="5S" />
                  </div>
                  <div className="text-sm text-gray-600">
                    Guys - All guys drink.
                  </div>
                </div>

                {/* 16. 4s */}
                <div className="grid grid-cols-[auto_1fr] gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all items-center">
                  <div>
                    <Card code="4S" />
                  </div>
                  <div className="text-sm text-gray-600">
                    Choose a player to play Rock Paper scissors with - The game
                    will prompt both players to make a choice, once both have
                    chosen, the game decides who wins based off of the choices.
                    (if the same both players make the same choice we reset the
                    minigame) The players will play best 2 out of 3
                  </div>
                </div>

                {/* 17. 3s */}
                <div className="grid grid-cols-[auto_1fr] gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all items-center">
                  <div>
                    <Card code="3S" />
                  </div>
                  <div className="text-sm text-gray-600">
                    Me - If you pull a 3 you drink.
                  </div>
                </div>

                {/* 18. 2s */}
                <div className="grid grid-cols-[auto_1fr] gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all items-center">
                  <div>
                    <Card code="2S" />
                  </div>
                  <div className="text-sm text-gray-600">
                    You - Choose a player to drink.
                  </div>
                </div>

                {/* 19. Ace of Spades */}
                <div className="grid grid-cols-[auto_1fr] gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all items-center">
                  <Card code="AS" />
                  <div className="text-sm text-gray-600">
                    You now take on the role of Barbara Reynolds and anytime
                    Barbara's holder is supposed to drink (from any card's
                    action), the app rolls a virtual dice. On a roll of 4, 5, or
                    6, they "escaped by manipulating someone else"—the drink
                    goes to another random player chosen by the app. On a roll
                    of 1, 2, or 3, Barbara herself drinks.
                  </div>
                </div>

                {/* 20. Ace of Hearts */}
                <div className="grid grid-cols-[auto_1fr] gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all items-center">
                  <Card code="AH" />
                  <div className="text-sm text-gray-600">
                    Dennis and Dee's real father is an overwhelmingly generous
                    guy. With taking on his persona, whenever you are assigned a
                    drink you must "donate" an additional drink to another
                    player. However, each time you assign a drink you must
                    declare the reason (i.e.: "This one is for the children!" or
                    "For homelessness!"). if you forget to declare your
                    donation, you instead have to drink twice
                  </div>
                </div>

                {/* 21. Ace of Clubs */}
                <div className="grid grid-cols-[auto_1fr] gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all items-center">
                  <Card code="AC" />
                  <div className="text-sm text-gray-600">
                    You take on the role of Gino Reynolds and until the end of
                    the game you get one chance per round (until your next turn)
                    to swap your drink responsibility with another player by
                    making a convincing, ridiculous excuse (the app prompts you
                    to type your excuse). The group votes—if your lie gets
                    majority approval, the other player drinks. If you fail, you
                    drink.
                  </div>
                </div>

                {/* 22. Ace of Diamonds */}
                <div className="grid grid-cols-[auto_1fr] gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all items-center">
                  <Card code="AD" />
                  <div className="text-sm text-gray-600">
                    You're now the "Snail." Everyone must hiss at you
                    ("EEEEhhhhh!") whenever you speak. If someone forgets to
                    hiss, they drink. If you annoy everyone too much and someone
                    says "salt the snail," you must finish your drink.
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowRules(false)}
              className="mt-6 w-full bg-black hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
