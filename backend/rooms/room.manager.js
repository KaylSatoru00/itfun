class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  generatePin() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  async createRoom({ hostId, hostUid, hostName, moduleId, lessonId, quizType, questions }) {
    const pin = this.generatePin();
    const room = {
      pin,
      hostId,
      hostName,
      moduleId,
      lessonId,
      quizType,
      questions: questions || [],
      players: [{ id: hostId, uid: hostUid, name: hostName, score: 0, disconnected: false }],
      status: 'waiting',
      createdAt: new Date(),
      quizEngine: null,
    };

    this.rooms.set(pin, room);
    return room;
  }

  getRoom(pin) {
    return this.rooms.get(pin) || null;
  }

  getPlayers(pin) {
    const room = this.rooms.get(pin);
    return room ? room.players : [];
  }

  addPlayer(pin, player) {
    const room = this.rooms.get(pin);
    if (!room) throw new Error('Room not found');

    const existing = room.players.find((p) => p.id === player.id);
    if (existing) return existing;

    const newPlayer = { disconnected: false, ...player };
    room.players.push(newPlayer);
    return newPlayer;
  }

  removePlayer(pin, playerId) {
    const room = this.rooms.get(pin);
    if (!room) return;
    room.players = room.players.filter((p) => p.id !== playerId);
  }

  deleteRoom(pin) {
    this.rooms.delete(pin);
  }

  findPlayerByName(pin, playerName) {
    const room = this.rooms.get(pin);
    if (!room) return null;
    return room.players.find((p) => p.name === playerName) || null;
  }

  // ── Ang TUNAY na identity lookup para sa reconnection ──
  // Hindi tulad ng `findPlayerByName` (display name lang, hindi unique/
  // permanent), ang `uid` ay direktang galing sa authenticated Firebase
  // account ng player — kaya ito ang dapat gamitin para i-verify kung
  // "siya nga ba talaga" ang bumabalik, hindi lang basta may tumugmang
  // pangalan.
  findPlayerByUid(pin, uid) {
    if (!uid) return null;
    const room = this.rooms.get(pin);
    if (!room) return null;
    return room.players.find((p) => p.uid === uid) || null;
  }

  // Naka-uid ang matching dito (hindi na `playerName`) — sinisigurado
  // nitong ang socket na papalitan lang ang naaayon sa TAMANG player,
  // kahit magkatulad ang display name ng dalawang magkaibang account.
  reassignPlayerSocket(pin, uid, newSocketId) {
    const room = this.rooms.get(pin);
    if (!room) return null;

    const player = room.players.find((p) => p.uid === uid);
    if (!player) return null;

    const oldId = player.id;
    player.id = newSocketId;

    // Keep hostId in sync kung yung player na nag-rejoin ay siya ring host
    if (room.hostId === oldId) {
      room.hostId = newSocketId;
    }

    return player;
  }

  updatePlayerScore(pin, playerId, score) {
    const room = this.rooms.get(pin);
    if (!room) return;
    const player = room.players.find((p) => p.id === playerId);
    if (player) {
      player.score = score;
    }
  }

  // Hindi tinatanggal sa `players` array — score at record ay nananatili
  // para pwede pa ring mag-rejoin ang player anumang oras habang naka-
  // "playing" ang room. Ginagamit ng disconnect handler mid-quiz.
  markPlayerDisconnected(pin, socketId) {
    const room = this.rooms.get(pin);
    if (!room) return null;
    const player = room.players.find((p) => p.id === socketId);
    if (player) player.disconnected = true;
    return player;
  }

  // Ginagamit ng rejoin-room handler pagkatapos i-reassign yung socket id
  // ng bumalik na player, para lumitaw ulit siya sa leaderboard ng lahat.
  // Naka-uid ang matching (dating playerName) — parehong dahilan sa
  // reassignPlayerSocket sa itaas.
  markPlayerConnected(pin, uid) {
    const room = this.rooms.get(pin);
    if (!room) return null;
    const player = room.players.find((p) => p.uid === uid);
    if (player) player.disconnected = false;
    return player;
  }

  // Yung mga "disconnected" na players ay hindi na ipinapakita sa leaderboard
  // ng ibang players, pero nananatili pa rin sila sa `room.players` mismo.
  getVisiblePlayers(pin) {
    const room = this.rooms.get(pin);
    if (!room) return [];
    return room.players.filter((p) => !p.disconnected);
  }
}

export { RoomManager };