class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  generatePin() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  async createRoom({ hostId, hostName, moduleId, lessonId, quizType, questions }) {
    const pin = this.generatePin();
    const room = {
      pin,
      hostId,
      hostName,
      moduleId,
      lessonId,
      quizType,
      questions: questions || [],
      players: [{ id: hostId, name: hostName, score: 0 }],
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

    room.players.push(player);
    return player;
  }

  removePlayer(pin, playerId) {
    const room = this.rooms.get(pin);
    if (!room) return;
    room.players = room.players.filter((p) => p.id !== playerId);
  }

  deleteRoom(pin) {
    this.rooms.delete(pin);
  }

  updatePlayerScore(pin, playerId, score) {
    const room = this.rooms.get(pin);
    if (!room) return;
    const player = room.players.find((p) => p.id === playerId);
    if (player) {
      player.score = score;
    }
  }
}

export { RoomManager };