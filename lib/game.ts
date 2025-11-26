// Generate shamrock pattern positions for 52 cards
// Returns array of {x, y} positions in a shamrock/clover shape
export function generateShamrockPositions(): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  
  // Shamrock has 3 leaves (circles) and a stem
  // Each leaf is a circle with cards arranged around it
  const cardsPerLeaf = 15; // Cards in each circular leaf
  const stemCards = 7; // Cards in the stem
  
  const centerX = 300; // Center of the board
  const centerY = 220;
  const leafRadius = 80; // Radius of each leaf circle
  const leafDistance = 110; // Distance from center to leaf centers
  
  // Top leaf (center top)
  const topLeafX = centerX;
  const topLeafY = centerY - leafDistance;
  for (let i = 0; i < cardsPerLeaf; i++) {
    const angle = (i / cardsPerLeaf) * Math.PI * 2;
    positions.push({
      x: topLeafX + Math.cos(angle) * leafRadius,
      y: topLeafY + Math.sin(angle) * leafRadius,
    });
  }
  
  // Bottom left leaf
  const leftLeafX = centerX - leafDistance * 0.866; // cos(30°)
  const leftLeafY = centerY + leafDistance * 0.5; // sin(30°)
  for (let i = 0; i < cardsPerLeaf; i++) {
    const angle = (i / cardsPerLeaf) * Math.PI * 2;
    positions.push({
      x: leftLeafX + Math.cos(angle) * leafRadius,
      y: leftLeafY + Math.sin(angle) * leafRadius,
    });
  }
  
  // Bottom right leaf
  const rightLeafX = centerX + leafDistance * 0.866;
  const rightLeafY = centerY + leafDistance * 0.5;
  for (let i = 0; i < cardsPerLeaf; i++) {
    const angle = (i / cardsPerLeaf) * Math.PI * 2;
    positions.push({
      x: rightLeafX + Math.cos(angle) * leafRadius,
      y: rightLeafY + Math.sin(angle) * leafRadius,
    });
  }
  
  // Stem (vertical line of cards below)
  for (let i = 0; i < stemCards; i++) {
    positions.push({
      x: centerX,
      y: centerY + leafDistance + 30 + i * 30,
    });
  }
  
  return positions;
}

// Get role character name from card code
export function getCardRole(code: string): string | null {
  const roleMap: { [key: string]: string } = {
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
    // 10s
    "0S": "jewish-lawyer",
    "0H": "jewish-lawyer",
    "0C": "jewish-lawyer",
    "0D": "jewish-lawyer",
    // 9s
    "9S": "artemis",
    "9H": "artemis",
    "9C": "artemis",
    "9D": "artemis",
    // Aces
    AS: "barbara",
    AH: "bruce",
    AC: "gino",
    AD: "gail",
  };
  
  return roleMap[code] || null;
}

// Check if card assigns a role
export function cardAssignsRole(code: string): boolean {
  const rank = code[0];
  return ["K", "J", "A"].includes(rank);
}
