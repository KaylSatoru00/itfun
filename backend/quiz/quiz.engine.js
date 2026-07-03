class QuizEngine {
  constructor(room, scoringService) {
    this.room = room;
    this.scoringService = scoringService;
    this.currentQuestionIndex = 0;
    this.answeredPlayers = new Set();
    this.roundResults = [];
    this.timer = null;
    this.resultsShown = false;
    this.timeLeft = 30;
    this.maxTime = 30;
  }

  setTimeLeft(seconds) {
    this.timeLeft = seconds;
  }

  getTimeLeft() {
    return this.timeLeft;
  }

  // Ginagamit ng rejoin-room handler para i-resync yung reconnecting client
  // sa current state ng laro (question, timer, scores) nang hindi nag-bo-broadcast
  // sa buong room.
  getState(playerId) {
    const current = this.getCurrentQuestion();
    return {
      question: current ? current.question : null,
      questionIndex: this.currentQuestionIndex,
      totalQuestions: this.room.questions.length,
      timeLeft: this.timeLeft,
      maxTime: this.maxTime,
      resultsShown: this.resultsShown,
      hasAnswered: playerId ? this.answeredPlayers.has(playerId) : false,
      players: this.room.players.map((p) => ({ id: p.id, name: p.name, score: p.score })),
      finished: this.currentQuestionIndex >= this.room.questions.length,
    };
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

  // Tinatawag kapag nag-rejoin ang isang player gamit ang bagong socket.id
  // (hal. pagkatapos ng refresh). Dapat sumama yung "nakasagot na ba siya sa
  // kasalukuyang tanong" papunta sa bagong id, para hindi siya makapag-sagot
  // ulit at hindi rin ma-mismatch yung roundResults.
  reassignPlayerId(oldId, newId) {
    if (this.answeredPlayers.has(oldId)) {
      this.answeredPlayers.delete(oldId);
      this.answeredPlayers.add(newId);
    }
    this.roundResults.forEach((r) => {
      if (r.playerId === oldId) r.playerId = newId;
    });
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