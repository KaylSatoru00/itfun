import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

console.log('🔑 Groq API Key exists:', !!process.env.GEMINI_API_KEY);
console.log('🤖 AI Provider:', process.env.AI_PROVIDER || 'groq');

import { RoomManager } from './rooms/room.manager.js';
import { QuizEngine } from './quiz/quiz.engine.js';
import { ScoringService } from './scoring/scoring.service.js';
import { generateQuiz } from './services/ai.service.js';
import { getLessonContent } from './services/lesson.service.js';
import { adminAuth } from './services/firebase-admin.service.js';
import { sendPasswordResetEmail } from './services/email.service.js';

const app = express();

// Fixed, known-good origins (production + local dev)
const allowedOrigins = process.env.CLIENT_URL
  ? [process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:5174']
  : ['http://localhost:5173', 'http://localhost:5174'];

// Vercel preview deployments get a random URL per build, e.g.
// https://itfun-p4ib9yon3-kaylsatoru00s-projects.vercel.app
// This regex allows ANY preview URL for this specific Vercel project,
// so we don't have to hardcode a new origin every time we deploy a preview.
const vercelPreviewRegex = /^https:\/\/itfun-[a-z0-9]+-kaylsatoru00s-projects\.vercel\.app$/;

function corsOriginCheck(origin, callback) {
  // Allow requests with no origin (e.g. curl, server-to-server, mobile apps)
  if (!origin) return callback(null, true);

  if (allowedOrigins.includes(origin) || vercelPreviewRegex.test(origin)) {
    return callback(null, true);
  }

  console.warn(`🚫 Blocked by CORS: ${origin}`);
  return callback(new Error('Not allowed by CORS'));
}

app.use(cors({
  origin: corsOriginCheck,
  methods: ['GET', 'POST'],
  credentials: true,
}));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: corsOriginCheck,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const roomManager = new RoomManager();
const scoringService = new ScoringService();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/forgot-password', async (req, res) => {
  console.log('📨 Received forgot-password request');

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    // Generate the reset link via Firebase Admin SDK. By default, this link
    // points to Firebase's own hosted UI (firebaseapp.com/__/auth/action),
    // NOT our custom reset_password.jsx page — actionCodeSettings.url only
    // becomes a "continue" link shown after Firebase's own page finishes.
    // To send users straight to OUR page, we extract the oobCode from the
    // generated link and build our own URL with it. The frontend page then
    // uses the Firebase client SDK's verifyPasswordResetCode/confirmPasswordReset
    // functions with that code.
    const actionCodeSettings = {
      url: 'https://itfun.vercel.app/reset-password',
    };

    let resetLink;
    try {
      const firebaseHostedLink = await adminAuth.generatePasswordResetLink(email, actionCodeSettings);

      // The Firebase-generated link looks like:
      //   https://<project>.firebaseapp.com/__/auth/action?mode=resetPassword&oobCode=XXXX&apiKey=...&continueUrl=...
      // We only need the oobCode — pull it out and build our own link.
      const oobCode = new URL(firebaseHostedLink).searchParams.get('oobCode');
      resetLink = `https://itfun.vercel.app/reset-password?oobCode=${encodeURIComponent(oobCode)}`;
    } catch (err) {
      // Don't reveal whether the email exists — respond with success
      // regardless, but only actually send an email if the account exists.
      if (err.code === 'auth/user-not-found') {
        console.log(`⚠️ Reset requested for non-existent email: ${email}`);
        return res.json({ success: true });
      }
      throw err;
    }

    await sendPasswordResetEmail(email, resetLink);
    console.log(`✅ Password reset email sent to ${email}`);

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Forgot-password error:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to send reset email. Please try again.',
    });
  }
});

app.post('/api/generate-quiz', async (req, res) => {
  console.log('📨 Received quiz generation request');
  console.log('📦 Request body:', req.body);

  try {
    const { moduleId, lessonId, quizType, questionCount } = req.body;

    console.log(`📚 Generating quiz for: ${moduleId} - ${lessonId}`);
    console.log(`📝 Quiz type: ${quizType}, Questions: ${questionCount || 15}`);

    const lessonContent = await getLessonContent(moduleId, lessonId);

    if (!lessonContent || lessonContent.length < 10) {
      throw new Error('Lesson content is too short or empty');
    }

    console.log(`📖 Lesson content loaded: ${lessonContent.length} characters`);

    const questions = await generateQuiz({
      lessonContent,
      quizType: quizType || 'multiple',
      questionCount: questionCount || 15,
    });

    console.log(`✅ Successfully generated ${questions.length} questions`);

    res.json({ success: true, questions });
  } catch (error) {
    console.error('❌ Quiz generation error:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate quiz',
    });
  }
});

io.on('connection', (socket) => {
  console.log(`🟢 Client connected: ${socket.id}`);

  // ── Create Room ──
  socket.on('create-room', async (data, callback) => {
    try {
      const { hostName, moduleId, lessonId, quizType, questions } = data;

      const room = await roomManager.createRoom({
        hostId: socket.id,
        hostName,
        moduleId,
        lessonId,
        quizType,
        questions,
      });

      socket.join(room.pin);
      socket.data.roomPin = room.pin;
      socket.data.playerId = socket.id;
      socket.data.playerName = hostName;
      socket.data.isHost = true;

      callback({ success: true, room });

      io.to(room.pin).emit('room-update', {
        players: roomManager.getPlayers(room.pin),
        hostName: room.hostName,
        isHost: true,
      });
    } catch (error) {
      console.error('Create room error:', error);
      callback({ success: false, error: error.message });
    }
  });

  // ── Join Room ──
  socket.on('join-room', async (data, callback) => {
    try {
      const { pin, playerName } = data;

      const room = roomManager.getRoom(pin);
      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      if (room.status === 'playing') {
        callback({ success: false, error: 'Game already in progress' });
        return;
      }

      if (room.players.length >= 10) {
        callback({ success: false, error: 'Room is full' });
        return;
      }

      const player = roomManager.addPlayer(pin, {
        id: socket.id,
        name: playerName,
        score: 0,
      });

      socket.join(pin);
      socket.data.roomPin = pin;
      socket.data.playerId = socket.id;
      socket.data.playerName = playerName;
      socket.data.isHost = false;

      callback({ success: true, room });

      io.to(pin).emit('room-update', {
        players: roomManager.getPlayers(pin),
        hostName: room.hostName,
        isHost: false,
      });

      io.to(pin).emit('player-joined', {
        player: { id: socket.id, name: playerName },
        playerCount: room.players.length,
      });
    } catch (error) {
      console.error('Join room error:', error);
      callback({ success: false, error: error.message });
    }
  });

  // ── Start Quiz ──
  socket.on('start-quiz', async (data, callback) => {
    try {
      const { pin } = data;
      const room = roomManager.getRoom(pin);

      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      if (socket.id !== room.hostId) {
        callback({ success: false, error: 'Only the host can start the quiz' });
        return;
      }

      if (room.players.length < 2) {
        callback({ success: false, error: 'Need at least 2 players to start' });
        return;
      }

      const quizEngine = new QuizEngine(room, scoringService);
      room.quizEngine = quizEngine;
      room.status = 'playing';

      callback({ success: true });

      io.to(pin).emit('quiz-started', {
        totalQuestions: room.questions.length,
        players: room.players,
      });

      setTimeout(() => {
        sendQuestion(pin);
      }, 2000);
    } catch (error) {
      console.error('Start quiz error:', error);
      callback({ success: false, error: error.message });
    }
  });

  // ── Submit Answer ──
  socket.on('submit-answer', async (data, callback) => {
    try {
      const { pin, questionIndex, answer, timeTaken } = data;
      const room = roomManager.getRoom(pin);

      if (!room || room.status !== 'playing') {
        callback({ success: false, error: 'Game not in progress' });
        return;
      }

      const result = await room.quizEngine.submitAnswer({
        playerId: socket.id,
        questionIndex,
        answer,
        timeTaken,
      });

      if (result) {
        io.to(pin).emit('answer-submitted', {
          playerId: socket.id,
          playerName: socket.data.playerName,
        });
      }

      callback({ success: true, result });

      const allAnswered = room.quizEngine.checkAllAnswered();
      if (allAnswered) {
        setTimeout(() => {
          showRoundResults(pin);
        }, 1000);
      }
    } catch (error) {
      console.error('Submit answer error:', error);
      callback({ success: false, error: error.message });
    }
  });

  // ── Next Question ──
  socket.on('next-question', async (data) => {
    const { pin } = data;
    const room = roomManager.getRoom(pin);
    if (!room || room.status !== 'playing') return;
    sendQuestion(pin);
  });

  // ── Disconnect ──
  socket.on('disconnect', () => {
    console.log(`🔴 Client disconnected: ${socket.id}`);

    const pin = socket.data.roomPin;
    if (!pin) return;

    const room = roomManager.getRoom(pin);
    if (!room) return;

    const wasHost = socket.id === room.hostId;
    roomManager.removePlayer(pin, socket.id);

    if (room.players.length === 0) {
      roomManager.deleteRoom(pin);
      io.to(pin).emit('room-closed');
      return;
    }

    if (wasHost) {
      const newHost = room.players[0];
      room.hostId = newHost.id;
      room.hostName = newHost.name;
      io.to(pin).emit('host-changed', {
        newHostId: newHost.id,
        newHostName: newHost.name,
      });
    }

    io.to(pin).emit('player-left', {
      playerId: socket.id,
      playerCount: room.players.length,
    });

    io.to(pin).emit('room-update', {
      players: room.players,
      hostName: room.hostName,
      isHost: false,
    });
  });

  // ── Helper: Send Question ──
  function sendQuestion(pin) {
    const room = roomManager.getRoom(pin);
    if (!room || room.status !== 'playing') return;

    const questionData = room.quizEngine.getCurrentQuestion();
    if (!questionData) {
      io.to(pin).emit('quiz-finished', {
        players: room.players,
        rankings: room.players
          .slice()
          .sort((a, b) => b.score - a.score)
          .map((p, i) => ({ ...p, rank: i + 1 })),
      });
      room.status = 'finished';
      return;
    }

    io.to(pin).emit('new-question', {
      questionIndex: questionData.index,
      totalQuestions: room.questions.length,
      question: questionData.question,
      timer: 30,
    });

    let timeLeft = 30;
    const timerInterval = setInterval(() => {
      timeLeft--;
      io.to(pin).emit('timer-update', { timeLeft });

      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        const unanswered = room.players.filter(
          (p) => !room.quizEngine.hasAnswered(p.id)
        );
        unanswered.forEach((p) => {
          room.quizEngine.submitAnswer({
            playerId: p.id,
            questionIndex: room.quizEngine.currentQuestionIndex,
            answer: null,
            timeTaken: 30,
          });
        });

        setTimeout(() => {
          showRoundResults(pin);
        }, 1000);
      }
    }, 1000);

    room.quizEngine.setTimer(timerInterval);
  }

  // ── Helper: Show Round Results ──
  function showRoundResults(pin) {
  const room = roomManager.getRoom(pin);
  if (!room) return;

  if (room.quizEngine.resultsShown) {
    console.log('⚠️ Already shown, skipping');
    return;
  }
  room.quizEngine.resultsShown = true;
  console.log('📊 Round results shown, Q index:', room.quizEngine.currentQuestionIndex);

  if (room.quizEngine.timer) {
    clearInterval(room.quizEngine.timer);
    room.quizEngine.timer = null;
  }

  const results = room.quizEngine.getRoundResults();
  const rankings = room.players
    .slice()
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({ ...p, rank: i + 1 }));

  io.to(pin).emit('round-results', {
    results,
    rankings,
  });

  setTimeout(() => {
    const currentRoom = roomManager.getRoom(pin);
    if (currentRoom && currentRoom.status === 'playing') {
      currentRoom.quizEngine.nextQuestion();
      console.log('➡️ Next Q index:', currentRoom.quizEngine.currentQuestionIndex);
      sendQuestion(pin);
    }
  }, 5000);
}
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api/generate-quiz`);
  console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🤖 Using AI provider: ${process.env.AI_PROVIDER || 'deepseek'}`);
});