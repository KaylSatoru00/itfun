class ScoringService {
  calculateScore({ timeTaken, maxTime = 30, maxScore = 100 }) {
    if (timeTaken === null || timeTaken === undefined) return 0;

    const ratio = Math.max(0, Math.min(1, timeTaken / maxTime));
    const score = Math.round(maxScore * (1 - ratio * 0.8));
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