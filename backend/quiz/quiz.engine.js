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
      // Hindi kasama ang mga naka-"disconnected" na players — hindi sila
      // dapat makita sa leaderboard hangga't hindi pa sila nag-re-rejoin.
      players: this.room.players
        .filter((p) => !p.disconnected)
        .map((p) => ({ id: p.id, name: p.name, score: p.score })),
      finished: this.currentQuestionIndex >= this.room.questions.length,
    };
  }

  // Sadyang "sanitized" ang ibinabalik dito — TINATANGGAL ang correctAnswer
  // bago ito umalis papunta sa client. Dati, kasama pa yung correctAnswer sa
  // buong `question` object na pinapadala sa `new-question`/`getState`, kaya
  // kahit hindi pa sumasagot ang isang player, makikita na niya agad ang
  // tamang sagot sa DevTools (Network/Console tab) — mas malaking cheating
  // vector pa ito kaysa sa client-supplied timeTaken na inayos na natin.
  // Ang totoong `correctAnswer` ay ipinapadala na lang sa `getRoundResults()`,
  // matapos sumagot ang lahat o matapos ang timer.
  sanitizeQuestion(question) {
    if (!question) return null;

    const { correctAnswer, ...safeQuestion } = question;
    return safeQuestion;
  }

  getCurrentQuestion() {
    if (this.currentQuestionIndex >= this.room.questions.length) {
      return null;
    }
    return {
      index: this.currentQuestionIndex,
      question: this.sanitizeQuestion(this.room.questions[this.currentQuestionIndex]),
    };
  }

  submitAnswer({ playerId, questionIndex, answer }) {
    if (this.answeredPlayers.has(playerId)) return null;
    if (questionIndex !== this.currentQuestionIndex) return null;

    const question = this.room.questions[this.currentQuestionIndex];

    // Para sa Identification at Fill-in-the-Blank, ini-uppercase ng client
    // ang typed na sagot ng player (UX decision — hindi na kailangan i-
    // Capslock). Kung naka-mixed-case naman ang naka-store na correctAnswer
    // (hal. "Motherboard"), mag-fa-fail palagi ang exact match ("MOTHERBOARD"
    // !== "Motherboard") — kaya dito, case-insensitive at trimmed ang paghahambing
    // para sa dalawang typing-based na types na ito. Hindi apektado ang
    // multiple-choice/true-false, kung saan exact match pa rin dapat (galing
    // sa pinipiling button, hindi sa free text).
    const isTypedAnswer = question.type === 'identification' || question.type === 'fill-in-blank';
    const isCorrect = isTypedAnswer
      ? typeof answer === 'string' &&
        answer.trim().toUpperCase() === String(question.correctAnswer).trim().toUpperCase()
      : answer === question.correctAnswer;

    // Ang timeTaken ay kino-compute dito, base sa server's own timeLeft
    // counter — HINDI kinukuha mula sa client. Kung nagtiwala tayo sa
    // client-supplied na timeTaken, kahit gaano pa katagal talaga ang
    // sumagot ang isang player, pwede lang niyang ipadala ang 0 (hal. sa
    // pag-reload, o sa pag-edit mismo ng request) para laging perfect score
    // — 'yan mismo ang naging cheating vector dati.
    const timeTaken = Math.min(Math.max(this.maxTime - this.timeLeft, 0), this.maxTime);

    let score = 0;
    if (isCorrect) {
      score = this.scoringService.calculateScore({
        timeTaken,
        maxTime: this.maxTime,
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

  // Ang tanging beses na ipinapasa ang totoong `correctAnswer` sa labas ng
  // engine na 'to — dahil dito, tapos na ang pagsagot para sa round na 'to
  // (natapos na ang oras o nakasagot na lahat), kaya safe nang i-reveal.
  getCurrentCorrectAnswer() {
    const question = this.room.questions[this.currentQuestionIndex];
    return question ? question.correctAnswer : null;
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
    // Yung mga naka-disconnect ay hindi dapat pinaghihintay — kung sila na
    // lang ang natitira, mag-i-stuck ang round habang wala silang balik.
    const activePlayers = this.room.players.filter((p) => !p.disconnected);
    return this.answeredPlayers.size >= activePlayers.length;
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