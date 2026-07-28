class ScoringService {
  // Stepped speed scoring: full marks for answering within the first bucket,
  // then −10% of maxScore for every bucket of time used. With the defaults
  // (maxTime 30s, maxScore 100) this is 3-second buckets:
  //   0–3s → 100, 4–6s → 90, 7–9s → 80, … 25–27s → 20, 28–29s → 10.
  // A wrong answer / no answer never reaches this (score stays 0 upstream),
  // so a correct answer is worth 100 down to 10, and 0 is the miss/timeout.
  // Using maxTime/10 and maxScore/10 keeps the 10 even steps if a question
  // ever runs on a non-30s timer.
  calculateScore({ timeTaken, maxTime = 30, maxScore = 100 }) {
    if (timeTaken === null || timeTaken === undefined) return 0;

    const t = Math.min(Math.max(timeTaken, 0), maxTime);
    const stepSec = maxTime / 10;
    const stepPts = maxScore / 10;
    const score = maxScore - stepPts * Math.max(0, Math.ceil((t - stepSec) / stepSec));
    return Math.max(0, Math.min(maxScore, score));
  }

  calculateRankings(players) {
    return players
      .slice()
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({
        ...p,
        rank: i + 1,
        isWinner: i === 0,
      }));
  }
}

export { ScoringService };