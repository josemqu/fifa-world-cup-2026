export function calculatePoints(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number
): number {
  if (predictedHome === actualHome && predictedAway === actualAway) return 3;
  const predictedOutcome = Math.sign(predictedHome - predictedAway);
  const actualOutcome = Math.sign(actualHome - actualAway);
  if (predictedOutcome === actualOutcome) return 1;
  return 0;
}

export function hasMatchStarted(utcDateStr: string): boolean {
  return new Date() >= new Date(utcDateStr);
}

export function generateGroupCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
