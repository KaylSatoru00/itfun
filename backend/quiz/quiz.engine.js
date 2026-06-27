class QuizEngine {
  constructor(room, scoringService) {
    this.room = room;
    this.scoringService = scoringService;
    this.currentQuestionIndex = 0;
    this.answeredPlayers = new Set();
    this.roundResults = [];
    this.timer = null;
    this.resultsShown = false;
  }

  getCurrentQuestion() {
    if (this.currentQuestionIndex >= this.room.questions.length) {
      return null;
    }
    return {
      index: this.currentQuestionIndex,
      question: this.room.questions[this.currentQuestionIndex],
    };
  }

  submitAnswer({ playerId, questionIndex, answer, timeTaken }) {
    if (this.answeredPlayers.has(playerId)) return null;
    if (questionIndex !== this.currentQuestionIndex) return null;

    const question = this.room.questions[this.currentQuestionIndex];
    const isCorrect = answer === question.correctAnswer;

    let score = 0;
    if (isCorrect) {
      score = this.scoringService.calculateScore({
        timeTaken,
        maxTime: 30,
        maxScore: 100,
      });
    }

    const player = this.room.players.find((p) => p.id === playerId);
    if (player) player.score += score;

    this.answeredPlayers.add(playerId);

    const result = { playerId, isCorrect, score, timeTaken };
    this.roundResults.push(result);
    return result;
  }

  hasAnswered(playerId) {
    return this.answeredPlayers.has(playerId);
  }

  checkAllAnswered() {
    return this.answeredPlayers.size >= this.room.players.length;
  }

  getRoundResults() {
    const results = [...this.roundResults];
    this.roundResults = [];
    return results;
  }

  setTimer(timer) {
    this.timer = timer;
  }

  nextQuestion() {
    this.currentQuestionIndex++;
    this.answeredPlayers = new Set();
    this.roundResults = [];
    this.resultsShown = false;
  }
}

export { QuizEngine };