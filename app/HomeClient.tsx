"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { createLobby, checkLobbyExists } from "@/lib/lobby";

const Card = ({ code }: { code: string }) => {
  const cardImageMap: { [key: string]: string } = {
    KS: "golden-god",
    KH: "mac",
    KC: "frank",
    KD: "charlie",
    QS: "dee",
    QH: "carmen",
    QC: "maureen",
    QD: "waitress",
    JS: "uncle-jack",
    JH: "cricket",
    JC: "z",
    JD: "liam",
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
    AS: "barbara",
    AH: "bruce",
    AC: "gino",
    AD: "gail",
  };

  const imageName = cardImageMap[code] || "default";
  const imageUrl = `/${imageName}.jpg`; // Assuming images are .jpg, adjust extension if needed

  const rank = code.slice(0, -1); // Everything except last character
  const suitCode = code.slice(-1); // Last character

  const suitMap: { [key: string]: string } = {
    S: "♠",
    H: "♥",
    C: "♣",
    D: "♦",
  };

  const suit = suitMap[suitCode] || "";
  const displayRank = rank === "0" ? "10" : rank; // Convert 0 to 10

  const isRed = suitCode === "H" || suitCode === "D";
  const suitColor = isRed ? "text-red-600" : "text-black";

  return (
    <div className="relative w-20 h-28">
      <Image
        src={imageUrl}
        alt={`${imageName} card`}
        width={80}
        height={112}
        className={`w-20 h-28 rounded-lg shadow-lg border-2 border-gray-300 bg-white`}
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
  const router = useRouter();
  const [showRules, setShowRules] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreateLobby() {
    setLoading(true);
    setError("");

    const { data, error: createError } = await createLobby();

    if (createError || !data) {
      setError("Failed to create lobby. Please try again.");
      setLoading(false);
      return;
    }

    router.push(`/lobby/${data.code}`);
  }

  async function handleJoinLobby() {
    if (!inviteCode.trim()) {
      setError("Please enter an invite code");
      return;
    }

    setLoading(true);
    setError("");

    const { exists, lobby } = await checkLobbyExists(inviteCode);

    if (!exists || !lobby) {
      setError("Lobby not found. Check the code and try again.");
      setLoading(false);
      return;
    }

    router.push(`/lobby/${lobby.code}`);
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center"
      style={{ backgroundImage: "url('/always-sunny-bg.jpg')" }}
    >
      <div
        className={`bg-black/40 backdrop-blur-sm rounded-lg p-8 shadow-2xl border border-white/20 max-w-md w-full transition-all ${
          showRules ? "blur-sm" : ""
        }`}
      >
        <h1 className="text-white text-2xl font-bold mb-6 text-center">
          Welcome to the Home Page
        </h1>

        <div className="space-y-4">
          {error && (
            <div className="bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="w-full flex gap-2" suppressHydrationWarning>
            <Button
              onClick={handleCreateLobby}
              disabled={loading}
              className="flex-1 bg-white/90 hover:bg-white text-black font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              suppressHydrationWarning
            >
              {loading ? "Creating..." : "Create Lobby"}
            </Button>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleJoinLobby()}
              placeholder="Code"
              className="w-[100px] min-w-0 bg-white/90 text-black font-semibold rounded-lg placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white px-3 text-center"
              maxLength={6}
              suppressHydrationWarning
            />
            <Button
              onClick={handleJoinLobby}
              disabled={loading}
              className="bg-white/90 hover:bg-white text-black font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              suppressHydrationWarning
            >
              Join
            </Button>
          </div>
          <Button
            onClick={() => setShowRules(true)}
            className="w-full bg-white/90 hover:bg-white text-black font-semibold py-3 px-6 rounded-lg transition-all"
            suppressHydrationWarning
          >
            View Rules
          </Button>
        </div>
      </div>

      {showRules && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg p-8 shadow-2xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900">Game Rules</h2>
              <Button
                onClick={() => setShowRules(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </Button>
            </div>

            <div className="space-y-4 text-gray-700">
              <p className="text-lg font-semibold mb-4">Card Deck Rules</p>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all">
                  <div className="shrink-0">
                    <Card code="KS" />
                  </div>
                  <div className="text-sm text-gray-600">
                    As the golden god, you may now redirect any drink penalty
                    given to you by another player up to three times (once per
                    round). Each time this priviledge is used, you must declare,
                    &quot;Because I am the Golden God!&quot; If you forget to
                    say that, you drink. Additionally if you use all three
                    redirects, people stop paying attention to you and your
                    self-esteem takes a swan dive into an empty pool. The game
                    will now randomly prompt you to drink throughout the game.
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all">
                  <div className="shrink-0">
                    <Card code="KH" />
                  </div>
                  <div className="text-sm text-gray-600">
                    Convinced you&apos;re the toughest person in the room you
                    are given 5 actions to choose from throughout the game that
                    can be used at any point during the game. Once all 5 are
                    used, you lose your toughness and for the rest of the game
                    you must drink double to try to regain it. Any action can be
                    used up to 5 times but no more than 5 actions total can be
                    used. The actions you may choose from are:
                    <ul>
                      <li>
                        1. Bodyguard - Shield another player from a drink; skip
                        their penalty
                      </li>
                      <li>
                        2. Karate Demonstration - Force another player to type
                        or act out a karate move. If refused, they drink.
                      </li>
                      <li>
                        3. Confession Time - Pick any player to
                        &quot;confess&quot; a secret, embarrassing story, or
                        make a silly statement (app prompt). If declined, they
                        drink.
                      </li>
                      <li>
                        4. Protein Share - Assign half your drink to another
                        player and share your gains.
                      </li>
                      <li>
                        5. Challenge of Toughness - Challenge any player: you
                        both roll virtual dice. Loser drinks double.
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all">
                  <div className="shrink-0">
                    <Card code="KC" />
                  </div>
                  <div className="text-sm text-gray-600">
                    You are now the world famous art critic Ongo Gablogian.
                    Starting now you are a critique of performance art and once
                    per round you may call out another Player to
                    &quot;perform.&quot; They may choose to tell a joke, sing a
                    song, do a dance(on cam), etc. If the player refuses, they
                    drink. However, if they follow through with the request, you
                    must drink for being &quot;moved by the art.&quot;
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all">
                  <div className="shrink-0">
                    <Card code="KD" />
                  </div>
                  <div className="text-sm text-gray-600">
                    You&apos;ve become the Dayman! You may now tag someone as
                    the &quot;Nightman&quot; for 3 rounds. The player then must
                    respond &quot;Dayman!&quot; every time the Charlie player
                    says &quot;Nightman.&quot; A failure to respond results in
                    the Nightman drinking. After 3 rounds, you may choose a new
                    Nightman.
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all">
                  <div className="shrink-0">
                    <Card code="QS" />
                  </div>
                  <div className="text-sm text-gray-600">
                    Question Masters - You may ask anyone a question and if they
                    answer you, they drink. You are the question master until
                    another Queen is drawn
                  </div>
                </div>

                <div className="grid grid-cols-[auto_1fr] gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all items-center">
                  <div className="shrink-0">
                    <Card code="JS" />
                  </div>
                  <div className="text-sm text-gray-600">
                    <span>
                      Because of your tiny hands, you may opt in to take a
                      smaller drink when you&apos;re given one. You may use this
                      action 3 times during the game and must admit &quot;My
                      hands are too tiny for a big boy cup&quot;. You may
                      continue to try using thie tactic but if anyone kept count
                      and calls you out, drink double.
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-[auto_1fr] gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all items-center">
                  <div className="shrink-0">
                    <Card code="JH" />
                  </div>
                  <div className="text-sm text-gray-600">
                    Being a man of faith you&apos;re given the right to deny up
                    to three drinks during the game and must declare &quot;God
                    says no!&quot; Once you deny three drinks, the devil starts
                    knocking on your door; to prevent him from taking control of
                    you, you must make a confession before every drink.
                  </div>
                </div>

                <div className="grid grid-cols-[auto_1fr] gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all items-center">
                  <div className="shrink-0">
                    <Card code="JC" />
                  </div>
                  <div className="text-sm text-gray-600">
                    Once this card is pulled and until the end of the game, any
                    time someone says the words &quot;Oh shit&quot; the gang
                    (everyone) drinks
                  </div>
                </div>

                <div className="grid grid-cols-[auto_1fr] gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all items-center">
                  <div className="shrink-0">
                    <Card code="JD" />
                  </div>
                  <div className="text-sm text-gray-600">
                    Having such hatred and a terrible relationship with the
                    gang. You always feel a need to get under their skin and
                    take on a new role titled &quot;The Ragebaiter&quot; You may
                    now attempt to ragebait another player and if successful,
                    they drink. If you fail, you drink.
                  </div>
                </div>

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

                <div className="grid grid-cols-[auto_1fr] gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all items-center">
                  <div>
                    <Card code="9S" />
                  </div>
                  <div className="text-sm text-gray-600">
                    Rhymes - Go around the room and the first person to fail to
                    rhyme must drink.
                  </div>
                </div>

                <div className="grid grid-cols-[auto_1fr] gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all items-center">
                  <div>
                    <Card code="8S" />
                  </div>
                  <div className="text-sm text-gray-600">
                    Mates - Pick a player to drink with you for the rest of the
                    game or until another 8 is drawn.
                  </div>
                </div>

                <div className="grid grid-cols-[auto_1fr] gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all items-center">
                  <div>
                    <Card code="7S" />
                  </div>
                  <div className="text-sm text-gray-600">
                    Starting with the player who drew the card, give a name of
                    any Always Sunny Episode. The first person to fail, drinks.
                  </div>
                </div>

                <div className="grid grid-cols-[auto_1fr] gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all items-center">
                  <div>
                    <Card code="6S" />
                  </div>
                  <div className="text-sm text-gray-600">
                    Chicks - All girls drink.
                  </div>
                </div>

                <div className="grid grid-cols-[auto_1fr] gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all items-center">
                  <div>
                    <Card code="5S" />
                  </div>
                  <div className="text-sm text-gray-600">
                    Guys - All guys drink.
                  </div>
                </div>

                <div className="grid grid-cols-[auto_1fr] gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all items-center">
                  <div>
                    <Card code="4S" />
                  </div>
                  <div className="text-sm text-gray-600">
                    Choose a player to play Rock Paper scissors with - The game
                    will prompt both players to make a choice, once both have
                    chosen, the game decides who wins based off of the choices.
                    (if the same both players make the same choice we reset the
                    minigame) The players will play best 2 out of 3.
                  </div>
                </div>

                <div className="grid grid-cols-[auto_1fr] gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all items-center">
                  <div>
                    <Card code="3S" />
                  </div>
                  <div className="text-sm text-gray-600">
                    Me - If you pull a 3 you drink.
                  </div>
                </div>

                <div className="grid grid-cols-[auto_1fr] gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all items-center">
                  <div>
                    <Card code="2S" />
                  </div>
                  <div className="text-sm text-gray-600">
                    You - Choose a player to drink.
                  </div>
                </div>

                <div className="grid grid-cols-[auto_1fr] gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all items-center">
                  <Card code="AS" />
                  <div className="text-sm text-gray-600">
                    You now take on the role of Barbara Reynolds and anytime
                    Barbara&apos;s holder is supposed to drink (from any
                    card&apos;s action), the app rolls a virtual dice. On a roll
                    of 1, 3, or 5, they &quot;escaped by manipulating someone
                    else&quot;—the drink goes to another random player chosen by
                    the app. On a roll of 2, 4, or 6, Barbara herself drinks.
                  </div>
                </div>

                <div className="grid grid-cols-[auto_1fr] gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all items-center">
                  <Card code="AH" />
                  <div className="text-sm text-gray-600">
                    Dennis and Dee&apos;s real father is an overwhelmingly
                    generous guy. With taking on his persona, whenever you are
                    assigned a drink you must &quot;donate&quot; an additional
                    drink to another player. However, each time you assign a
                    drink you must declare the reason (i.e.: &quot;This one is
                    for the children!&quot; or &quot;For homelessness!&quot;).
                    if you forget to declare your donation, you instead have to
                    drink twice.
                  </div>
                </div>

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

                <div className="grid grid-cols-[auto_1fr] gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all items-center">
                  <Card code="AD" />
                  <div className="text-sm text-gray-600">
                    You&apos;re now the &quot;Snail.&quot; Everyone must hiss at
                    you (&quot;EEEEhhhhh!&quot;) whenever you speak. If someone
                    forgets to hiss, they drink. If you annoy everyone too much
                    and someone says &quot;salt the snail,&quot; you must finish
                    your drink.
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setShowRules(false)}
              className="mt-6 w-full bg-black hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg transition-all"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
