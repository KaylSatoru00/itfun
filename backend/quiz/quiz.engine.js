// ── Helpers: normalize + singular/plural-tolerant comparison ──
// Ginagamit lang para sa Identification/Fill-in-Blank — hindi apektado ang
// Multiple Choice/True-False (galing sa button click, dapat exact match).
function normalizeForCompare(str) {
  return String(str).trim().toUpperCase().replace(/\s+/g, ' ');
}

function singularize(word) {
  // BUG (nahanap 2026-07-23): dating "if (/ES$/.test(word) ...)" ay
  // sumasakop sa LAHAT ng salitang nagtatapos sa "ES" — kasama pati yung
  // mga salitang ang singular form mismo ay nagtatapos na sa "E" (hal.
  // "BYTE" -> "BYTES", "DEVICE" -> "DEVICES", "PHASE" -> "PHASES"), kung
  // saan iisang "S" lang talaga ang idinagdag, hindi "ES".
  // Dating resulta: singularize("DEVICES") -> slice(0,-2) -> "DEVIC" (mali,
  // dapat "DEVICE"). singularize("BYTES") -> "BYT" (mali, dapat "BYTE").
  // Kaya kapag ang lesson content ay "Device" pero ang sagot ng player ay
  // "Devices" (o vice versa), hindi sila nagta-tugma sa answersMatch() kahit
  // dapat parehong tama — ito yung "valid pero minarkang mali" na kaso.
  //
  // FIX: paghiwalayin ang totoong "-es" plurals (base word ay nagtatapos sa
  // sibilant na kailangan ng "-es" para bumuo ng plural — S/X/Z/CH/SH, hal.
  // "BOX" -> "BOXES", "PROCESS" -> "PROCESSES", "CLASS" -> "CLASSES") laban
  // sa mga salitang ang singular ay nagtatapos na sa "E" at "-s" lang talaga
  // ang idinagdag. Chineck muna ang sibilant+ES pattern; kung hindi tugma,
  // babagsak na lang sa plain "-s" stripping.
  // NOTE: pinalitan pa ito ng isang beses — yung unang fix ay sumakop pa
  // rin sa mga salitang tulad ng "PHASE" -> "PHASES" at "CACHE" -> "CACHES",
  // dahil parehong "single-S-before-ES" ang shape nila kagaya ng totoong
  // -es plurals na gaya ng "BUS" -> "BUSES". Walang purong regex na
  // makaka-distinguish nito nang 100% (kailangan ng dictionary/lexicon), so
  // dito, dinisenyo ang rule para bias tayo papunta sa mas madalas na term
  // sa IT-fundamentals lessons niyo (PHASE, CASE, DEVICE, BYTE, CACHE,
  // MOUSE) — sila ang mas malamang lumabas sa mga tanong kumpara sa mga
  // tunay na sibilant plurals gaya ng "BUS"/"VIRUS" (bihira namang itanong
  // sa plural form). Kaya dito, double-strip lang ang "-es" kung talagang
  // dobleng consonant o X/Z ang bago sa "ES" (di na kasama ang single-S o
  // CH/SH, dahil doon nangyayari yung collision):
  // "BOXES" -> "BOX", "PROCESSES"/"CLASSES"/"ACCESSES" -> singular nila
  if (/(?:SS|[XZ])ES$/.test(word) && word.length > 4) return word.slice(0, -2);
  // "DEVICES" -> "DEVICE", "BYTES" -> "BYTE", "COMPUTERS" -> "COMPUTER" —
  // pero hindi masyadong maiksing words at hindi mga word na nagtatapos
  // talaga sa double-S (hal. "ACCESS", "BUS" ay hindi dapat mag-strip
  // papuntang "ACCES"/"BU")
  if (/S$/.test(word) && word.length > 3 && !/SS$/.test(word)) return word.slice(0, -1);
  return word;
}

function answersMatch(a, b) {
  const na = normalizeForCompare(a);
  const nb = normalizeForCompare(b);
  if (na === nb) return true;
  return singularize(na) === singularize(nb);
}

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
    // playerId -> latest typed (pero hindi pa na-click/na-submit) na sagot.
    // Ginagamit lang para sa Identification/Fill-in-Blank, para may
    // magamit na huling sagot kung maubusan ng oras bago pa ma-click ang
    // Submit Answer button.
    this.draftAnswers = new Map();
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
    // Para sa Identification, may exemption tayo sa prompt generation: kung
    // may parehong acronym AT common full form ang isang term, pwedeng
    // naka-store ang correctAnswer bilang "CPU / Central Processing Unit"
    // (dalawang forms, pinaghiwalay ng "/"). Dito, hinahati natin ito sa
    // "/" at tinatanggap ang sagot ng player kung tumugma ito sa ALINMAN
    // sa mga forms — hindi kailangang match yung buong "CPU / Central
    // Processing Unit" string. Kung isang term/form lang naman ang naka-
    // store (walang "/"), normal na single-value comparison pa rin ito.
    // Dinagdagan ng singular/plural tolerance dito (via answersMatch) — hal.
    // "Computer" at "Computers" ay dapat parehong tanggapin bilang tama.
    // Tugma pa rin sa acronym/full-form "/" exemption: kada part, chinicheck
    // gamit ang answersMatch, kaya kahit "CPUs" o "Central Processing Units"
    // (plural) ay tatanggapin din.
    const isTypedAnswer = question.type === 'identification' || question.type === 'fill-in-blank';
    const isCorrect = isTypedAnswer
      ? typeof answer === 'string' &&
        String(question.correctAnswer)
          .split('/')
          .map((part) => part.trim())
          .filter(Boolean)
          .some((part) => answersMatch(answer, part))
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

  // Tinatawag habang nagtype pa lang ang player sa Identification/Fill-in-
  // Blank, HINDI pa niya na-click ang Submit Answer button. Hindi pa "final"
  // ito — pero kung maubusan ng oras bago siya mag-click, ito na ang
  // gagamitin bilang huling sagot niya, sa halip na agad ituring na blangko.
  setDraftAnswer(playerId, questionIndex, answer) {
    if (questionIndex !== this.currentQuestionIndex) return;
    if (this.answeredPlayers.has(playerId)) return;
    if (typeof answer !== 'string') return;
    this.draftAnswers.set(playerId, answer);
  }

  getDraftAnswer(playerId) {
    return this.draftAnswers.get(playerId) ?? null;
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
    this.draftAnswers = new Map();
  }
}

export { QuizEngine };