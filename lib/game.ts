// Generate shamrock pattern positions for 52 cards
export function generateShamrockPositions(): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  
  const cardsPerLeaf = 15;
  const stemCards = 7; 
  
  const centerX = 300; 
  const centerY = 220;
  const leafRadius = 80; 
  const leafDistance = 110; 
  
  const topLeafX = centerX;
  const topLeafY = centerY - leafDistance;
  for (let i = 0; i < cardsPerLeaf; i++) {
    const angle = (i / cardsPerLeaf) * Math.PI * 2;
    positions.push({
      x: topLeafX + Math.cos(angle) * leafRadius,
      y: topLeafY + Math.sin(angle) * leafRadius,
    });
  }
  
  const leftLeafX = centerX - leafDistance * 0.866; 
  const leftLeafY = centerY + leafDistance * 0.5; 
  for (let i = 0; i < cardsPerLeaf; i++) {
    const angle = (i / cardsPerLeaf) * Math.PI * 2;
    positions.push({
      x: leftLeafX + Math.cos(angle) * leafRadius,
      y: leftLeafY + Math.sin(angle) * leafRadius,
    });
  }
  
  const rightLeafX = centerX + leafDistance * 0.866;
  const rightLeafY = centerY + leafDistance * 0.5;
  for (let i = 0; i < cardsPerLeaf; i++) {
    const angle = (i / cardsPerLeaf) * Math.PI * 2;
    positions.push({
      x: rightLeafX + Math.cos(angle) * leafRadius,
      y: rightLeafY + Math.sin(angle) * leafRadius,
    });
  }
  
  for (let i = 0; i < stemCards; i++) {
    positions.push({
      x: centerX,
      y: centerY + leafDistance + 30 + i * 30,
    });
  }
  
  return positions;
}

export function getCardRole(code: string): string | null {
  const roleMap: { [key: string]: string } = {
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
    AS: "barbara",
    AH: "bruce",
    AC: "gino",
    AD: "gail",
  };
  
  return roleMap[code] || null;
}

export function cardAssignsRole(code: string): boolean {
  const rank = code[0];
  return ["K", "J", "A"].includes(rank);
}
