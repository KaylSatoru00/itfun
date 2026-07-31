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
import { adminAuth, adminDb, adminRtdb } from './services/firebase-admin.service.js';
import { ServerValue } from 'firebase-admin/database';
import { sendPasswordResetEmail, sendOtpEmail } from './services/email.service.js';

const app = express();

// Fixed, known-good origins (production + local dev). The production frontend
// is ALWAYS allowed regardless of CLIENT_URL, and every origin is normalized
// (trimmed + trailing slash stripped) so an env-var quirk like a trailing
// slash can't silently break CORS.
const normalizeOrigin = (o) => String(o || '').trim().replace(/\/+$/, '');
const allowedOrigins = [
  'https://itfun.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.CLIENT_URL,
].map(normalizeOrigin).filter(Boolean);

// Vercel preview deployments get a random URL per build, e.g.
// https://itfun-p4ib9yon3-kaylsatoru00s-projects.vercel.app
// This regex allows ANY preview URL for this specific Vercel project,
// so we don't have to hardcode a new origin every time we deploy a preview.
const vercelPreviewRegex = /^https:\/\/itfun-[a-z0-9]+-kaylsatoru00s-projects\.vercel\.app$/;

function corsOriginCheck(origin, callback) {
  // Allow requests with no origin (e.g. curl, server-to-server, mobile apps)
  if (!origin) return callback(null, true);

  const o = normalizeOrigin(origin);
  if (allowedOrigins.includes(o) || vercelPreviewRegex.test(o)) {
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

// Pag nag-disconnect ang isang socket (e.g. dahil sa page refresh) HABANG
// naka-"waiting" pa lang ang room (bago pa mag-start ang quiz), hindi natin
// agad tinatanggal yung player — bibigyan muna natin ng grace period para
// makapag-rejoin. Key: `${pin}:${playerName}` -> setTimeout handle.
const disconnectTimers = new Map();
const REJOIN_GRACE_MS = 120000;

// Kapag naka-"playing" na ang room, hindi na natin ginagamit ang grace
// period sa itaas — sa halip, agad na-"disconnected" muna ang player
// (nananatili ang score, hindi buburahin) at pwede na siyang mag-rejoin
// anumang oras habang hindi pa "finished" ang quiz. Ang timer sa ibaba ay
// isang FAILSAFE lang laban sa memory leak — kung talagang inabandona na
// ng LAHAT ng players ang room (walang connected na kahit isa) nang matagal,
// saka pa lang natin ito burahin. Hindi ito "kick timer" para sa individual
// na player.
const abandonedRoomTimers = new Map();
const ABANDONED_ROOM_CLEANUP_MS = 30 * 60 * 1000; // 30 mins, failsafe lang

// ── Signup OTP verification store ──
// In-memory lang (same pattern as disconnectTimers/abandonedRoomTimers
// above) — email -> { otp, expiresAt, attempts }. Short-lived (10 mins),
// kaya okay lang na hindi ito persistent kahit mag-restart ang server;
// worst case, hihingi lang ulit ng bagong code ang user.
const signupOtps = new Map();
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_OTP_ATTEMPTS = 5;

// Maximum players per room, INCLUDING the host (the host occupies slot 1).
const MAX_PLAYERS_PER_ROOM = 40;

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Reliable "offline" marking on tab/window close (via sendBeacon) ──
// Ang normal na RTDB write mula sa client (WebSocket-based) ay hindi
// garantisadong makakumpleto sa sandaling isinasara na ang tab — pinuputol
// na ng browser ang JS execution bago pa man matapos ang round-trip.
// Ang `navigator.sendBeacon()` sa client ay ginagarantiyahan MISMO ng
// browser na maipapadala kahit isinasara na ang tab (regular HTTP request
// ito, hindi WebSocket) — kaya dito natin ito tinatanggap, at ginagamit
// ang Admin SDK (server-side, walang dependency sa client WebSocket) para
// direktang mag-set ng "offline" sa RTDB.
//
// `sendBeacon()` ay hindi nagpapadala ng custom Authorization header, kaya
// isinasama natin ang Firebase ID token sa mismong JSON body, at dito
// natin ito vine-verify (`verifyIdToken`) para masiguradong ang may-ari
// lang mismo ng account ang makaka-set ng sarili niyang status — hindi
// basta kahit sinong uid ang pwedeng ipasa.
app.post('/api/set-offline', express.text({ type: '*/*' }), async (req, res) => {
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { uid, idToken } = body;

    if (!uid || !idToken) {
      return res.status(400).json({ success: false, error: 'uid and idToken are required' });
    }

    const decoded = await adminAuth.verifyIdToken(idToken);
    if (decoded.uid !== uid) {
      return res.status(403).json({ success: false, error: 'Token does not match uid' });
    }

    await adminRtdb.ref(`status/${uid}`).set({
      state: 'offline',
      lastChanged: ServerValue.TIMESTAMP,
    });

    console.log(`🔌 ${uid} marked offline via sendBeacon (tab/window close)`);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ set-offline error:', {
      message: error.message,
      stack: error.stack,
    });
    // sendBeacon doesn't read the response anyway, pero mag-log tayo para
    // sa debugging.
    res.status(500).json({ success: false, error: 'Failed to set offline status.' });
  }
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

app.post('/api/send-signup-otp', async (req, res) => {
  console.log('📨 Received send-signup-otp request');

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const otp = generateOtp();
    signupOtps.set(email, {
      otp,
      expiresAt: Date.now() + OTP_EXPIRY_MS,
      attempts: 0,
    });

    await sendOtpEmail(email, otp);
    console.log(`✅ Signup OTP sent to ${email}`);

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Send-signup-otp error:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to send verification code. Please try again.',
    });
  }
});

app.post('/api/verify-signup-otp', async (req, res) => {
  console.log('📨 Received verify-signup-otp request');

  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Email and code are required' });
    }

    const entry = signupOtps.get(email);

    if (!entry) {
      return res.status(400).json({
        success: false,
        error: 'No pending verification found for this email. Please request a new code.',
      });
    }

    if (Date.now() > entry.expiresAt) {
      signupOtps.delete(email);
      return res.status(400).json({
        success: false,
        error: 'This code has expired. Please request a new one.',
      });
    }

    entry.attempts += 1;
    if (entry.attempts > MAX_OTP_ATTEMPTS) {
      signupOtps.delete(email);
      return res.status(400).json({
        success: false,
        error: 'Too many incorrect attempts. Please request a new code.',
      });
    }

    if (entry.otp !== otp) {
      return res.status(400).json({ success: false, error: 'Incorrect code. Please try again.' });
    }

    // Code is correct — mark the account as verified in actual Firebase
    // Auth (not just our own tracking), so the existing login check
    // (userCredential.user.emailVerified) keeps working unchanged.
    const userRecord = await adminAuth.getUserByEmail(email);
    await adminAuth.updateUser(userRecord.uid, { emailVerified: true });

    signupOtps.delete(email);
    console.log(`✅ Signup OTP verified for ${email}`);

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Verify-signup-otp error:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to verify code. Please try again.',
    });
  }
});

// ── Helper: check kung unlocked na ba ang isang module para sa isang user ──
// Ginagamit ng DALAWA — ng /api/generate-quiz route (host side, bago
// makapag-generate) at ng join-room socket handler (joining player side) —
// kaya nasa module scope ito (hindi nested sa loob ng io.on('connection')),
// para parehong nakaka-access. Server-side talaga ito (hindi lang
// frontend/UI alert) para hindi ito ma-bypass.
async function isModuleUnlockedForUser(uid, moduleId) {
  if (!uid || !moduleId) return false;

  // Module 1 ay laging unlocked para sa lahat, kahit walang progress
  // document pa (bagong student).
  if (moduleId === 'module1') return true;

  const snap = await adminDb.collection('studentProgress').doc(uid).get();
  if (!snap.exists) return false;

  const data = snap.data();
  const moduleEntry = data.modules?.[moduleId];
  return moduleEntry?.unlocked === true;
}

// ── Shared validation para sa parehong check-join-eligibility (pre-check)
// at join-room (totoong pag-join) — iisang pinagmumulan ng truth para
// hindi mag-diverge yung dalawang checks sa paglipas ng panahon.
async function validateRoomJoin(pin, uid) {
  const room = roomManager.getRoom(pin);
  if (!room) return { ok: false, error: 'Room not found' };

  // ── KRITIKAL: i-check muna kung existing player na pala 'to (parehong
  // uid) bago i-apply ang mga check sa ibaba — 'yung mga check na 'yon
  // (playing/full) ay para lang sa TUNAY na bagong tao na sasali. Kung
  // legit na kasapi na siya ng room (hal. galing sa "Join Room" modal gamit
  // ang PIN sa halip na sa auto-rejoin flow), rejoin ang tamang landas para
  // sa kanya — hindi dapat siya harangan ng "Game already in progress".
  const existingPlayer = uid ? roomManager.findPlayerByUid(pin, uid) : null;

  // Mid-quiz: rejoin is allowed ONLY for players who were present in the
  // lobby when the game actually started (see `room.startedParticipants`,
  // set in the start-quiz handler). This blocks two cases that both look
  // like an "existing" uid otherwise: a brand-new player, and — the bug this
  // guards — someone who joined the lobby but LEFT before the game began
  // (their disconnected slot can still linger in room.players).
  if (room.status === 'playing') {
    if (existingPlayer && room.startedParticipants && room.startedParticipants.has(uid)) {
      return { ok: true, room, isRejoin: true };
    }
    return { ok: false, error: 'Game already in progress' };
  }

  // Not playing (waiting lobby, or a finished room): an existing member
  // simply returns as a rejoin.
  if (existingPlayer) {
    return { ok: true, room, isRejoin: true };
  }

  if (room.players.length >= MAX_PLAYERS_PER_ROOM) {
    return { ok: false, error: 'Room is full' };
  }

  if (!uid) {
    return { ok: false, error: 'Missing uid — please log in again.' };
  }

  const unlocked = await isModuleUnlockedForUser(uid, room.moduleId);
  if (!unlocked) {
    return {
      ok: false,
      error: 'You need to unlock this module first before joining this quiz.',
    };
  }

  return { ok: true, room, isRejoin: false };
}

// ── Shared rejoin logic — ginagamit ng DALAWA — ng totoong `rejoin-room`
// socket event (auto-rejoin sa quiz_arena.jsx / waiting_lobby_*.jsx) AT ng
// `join-room` handler kapag na-detect na existing player pala (parehong
// uid) ang tumatawag gamit ang "Join Room" modal/PIN sa halip na sa
// auto-rejoin flow — iisang pinagmumulan ng truth para hindi mag-diverge
// ang dalawang paraan ng pagbalik sa room.
async function performRejoin(socket, data, callback) {
  try {
    const { pin, playerName, uid } = data;

    const room = roomManager.getRoom(pin);
    if (!room) {
      callback({ success: false, error: 'Room not found' });
      return;
    }

    // ── KRITIKAL: identity ang batayan dito, hindi playerName ──
    // Dating basta `findPlayerByName(pin, playerName)` lang — ibig
    // sabihin kahit sinong socket, basta may tumugmang display-name
    // string, ay nakakapasok sa slot na 'yon (kahit ibang account/
    // ibang tao talaga). Kaya dito, `uid` (mula sa authenticated
    // Firebase account) ang TANGING pagbabatayan — hindi na
    // sapat ang tumugmang pangalan lang.
    if (!uid) {
      callback({ success: false, error: 'Missing uid — please log in again.' });
      return;
    }

    const existingPlayer = roomManager.findPlayerByUid(pin, uid);
    if (!existingPlayer) {
      // Sadyang generic ang error message — hindi natin gustong ibunyag
      // kung "may player nga pala dito pero ibang uid" (info leak) vs
      // "walang player talaga" — pareho lang dapat itong itsura sa
      // kabilang panig.
      callback({ success: false, error: 'Player not found in room' });
      return;
    }

    // Same rule as validateRoomJoin: once the quiz is underway, only players
    // who were present when it STARTED may rejoin. Someone who left the lobby
    // before start still has a slot here, but is not on the start roster —
    // block them so they can't sneak back in via the reconnect path.
    if (
      room.status === 'playing' &&
      !(room.startedParticipants && room.startedParticipants.has(uid))
    ) {
      callback({ success: false, error: 'Game already in progress' });
      return;
    }

    // Kung may naka-schedule pang pagtanggal galing sa disconnect handler
    // (waiting-room grace period), kanselahin na — nag-rejoin naman pala
    // siya sa oras. Naka-uid din ang key na 'to ngayon (dating playerName)
    // para consistent sa bagong identity model.
    const timerKey = `${pin}:${uid}`;
    const pendingTimer = disconnectTimers.get(timerKey);
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      disconnectTimers.delete(timerKey);
    }

    // Kung naka-schedule ang room para sa abandoned-room cleanup (dahil
    // dati'y wala nang connected na player), kanselahin na rin — buhay na
    // ulit ang room.
    const pendingAbandonTimer = abandonedRoomTimers.get(pin);
    if (pendingAbandonTimer) {
      clearTimeout(pendingAbandonTimer);
      abandonedRoomTimers.delete(pin);
    }

    const wasHost = existingPlayer.id === room.hostId;
    const oldSocketId = existingPlayer.id;
    // Gamitin ang SERVER-SIDE na naka-record na pangalan ng player
    // (`existingPlayer.name`), hindi na yung `playerName` galing sa
    // client payload — para hindi ito magamit bilang "display name
    // spoofing" channel sa mga tumitingin (leaderboard, room-update,
    // atbp.) sa panahon ng rejoin.
    const verifiedPlayerName = existingPlayer.name;
    roomManager.reassignPlayerSocket(pin, uid, socket.id);
    // Lumitaw ulit siya sa leaderboard ng ibang players.
    roomManager.markPlayerConnected(pin, uid);

    // Kung may ongoing quiz, dalhin din yung "nakasagot na ba siya" status
    // papunta sa bagong socket.id — kung hindi, makakasagot siya ulit sa
    // parehong tanong pagkatapos ng refresh.
    if (room.quizEngine) {
      room.quizEngine.reassignPlayerId(oldSocketId, socket.id);
    }

    socket.join(pin);
    socket.data.roomPin = pin;
    socket.data.playerId = socket.id;
    socket.data.playerName = verifiedPlayerName;
    socket.data.uid = uid;
    socket.data.isHost = wasHost;

    let state;
    if (room.status === 'playing' && room.quizEngine) {
      state = room.quizEngine.getState(socket.id);
    } else if (room.status === 'finished') {
      state = {
        finished: true,
        players: room.players
          .slice()
          .sort((a, b) => b.score - a.score)
          .map((p, i) => ({ ...p, rank: i + 1 })),
      };
    } else {
      // Room pa lang naka-'waiting' — hindi pa nagsisimula yung quiz
      state = {
        finished: false,
        resultsShown: false,
        question: null,
        questionIndex: 0,
        totalQuestions: room.questions.length,
        timeLeft: 30,
        maxTime: 30,
        players: room.players,
      };
    }

    console.log(`🔁 ${verifiedPlayerName} (uid ${uid}) rejoined room ${pin} as ${socket.id}`);

    // Huwag ipasa yung buong `room` object — may room.quizEngine na
    // circular reference pabalik sa room mismo (quizEngine.room === room),
    // kaya kapag sinubukan ng socket.io i-serialize 'yon, mag-i-infinite
    // loop ito sa hasBinary() check at mag-crash ng "Maximum call stack
    // size exceeded". Gumawa na lang ng safe/flat na summary.
    const roomSummary = {
      pin: room.pin,
      hostId: room.hostId,
      hostName: room.hostName,
      moduleId: room.moduleId,
      lessonId: room.lessonId,
      quizType: room.quizType,
      status: room.status,
      players: room.players,
    };

    callback({ success: true, state, isHost: wasHost, room: roomSummary });

    io.to(pin).emit('player-reconnected', {
      playerId: socket.id,
      playerName: verifiedPlayerName,
    });

    io.to(pin).emit('room-update', {
      players: roomManager.getVisiblePlayers(pin),
      hostName: room.hostName,
      isHost: wasHost,
    });
  } catch (error) {
    console.error('Rejoin room error:', error);
    callback({ success: false, error: error.message });
  }
}

// ── Daily quiz-generation quota (per-user, Firestore-backed) ──
// Sadyang naka-Firestore ito (hindi lang sa memory) para hindi mawala ang
// bilang kapag nag-restart ang Railway server — daily quota talaga siya
// kaya kailangan siyang manatili. Yung mga sumasali lang (join-room socket
// event) ay HINDI dumadaan dito, kaya hindi sila counted — tama lang, dahil
// ang route na ito ay tinatawag lang ng HOST kapag mag-ge-generate ng quiz.
const DAILY_GENERATE_LIMIT = 3;

// "Araw" boundary natin ay Asia/Manila time, hindi UTC — kaya kahit anong
// oras mag-restart o saan man naka-deploy ang Railway server, palaging
// 12am Philippine time ang reset, gaya ng inaasahan ng user.
function getManilaDateString() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
}

// Ginagamit ang Firestore transaction dito para maging atomic ang
// "check tapos increment" — kung walang transaction, dalawang sabay-sabay
// na request (hal. double-click sa Generate button) ay pwedeng makalusot
// nang parehong pumasa sa check bago pa man ma-increment ang isa.
async function checkAndIncrementQuota(uid) {
  const today = getManilaDateString();
  const ref = adminDb.collection('quizGenerationQuota').doc(uid);

  return adminDb.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const data = snap.exists ? snap.data() : null;

    // Kung ibang araw na (o wala pang record), parang bagong-bago ulit —
    // 0 ang panimulang count ngayong araw na 'to.
    const currentCount = data && data.date === today ? data.count : 0;

    if (currentCount >= DAILY_GENERATE_LIMIT) {
      return { allowed: false, remaining: 0 };
    }

    const newCount = currentCount + 1;
    transaction.set(ref, { date: today, count: newCount });
    return { allowed: true, remaining: DAILY_GENERATE_LIMIT - newCount };
  });
}

// Kapag na-reserve na yung 1 generate (via checkAndIncrementQuota) pero
// nag-fail pala yung actual AI generation (hal. AI provider timeout/error),
// ibinabalik natin yung count — hindi patas na mabawasan ang quota ng user
// dahil lang sa failed attempt na wala naman siyang kasalanan.
async function refundQuota(uid) {
  const today = getManilaDateString();
  const ref = adminDb.collection('quizGenerationQuota').doc(uid);

  await adminDb.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists) return;

    const data = snap.data();
    if (data.date !== today) return; // ibang araw na, wala nang ibabalik dito

    const newCount = Math.max(0, (data.count || 0) - 1);
    transaction.update(ref, { count: newCount });
  });
}

// Read-only version ng quota check — ginagamit ito para IPAKITA lang sa UI
// kung ilan nalang natitirang generates ng user (hal. pagdating niya sa
// select-type page, bago pa siya mag-click ng Generate). Hindi ito
// nag-i-increment, kaya safe siyang tawagin nang paulit-ulit.
async function getQuotaStatus(uid) {
  const today = getManilaDateString();
  const ref = adminDb.collection('quizGenerationQuota').doc(uid);
  const snap = await ref.get();
  const data = snap.exists ? snap.data() : null;

  const currentCount = data && data.date === today ? data.count : 0;
  return {
    remaining: Math.max(0, DAILY_GENERATE_LIMIT - currentCount),
    limit: DAILY_GENERATE_LIMIT,
  };
}

app.get('/api/generate-quiz/quota/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    if (!uid) {
      return res.status(400).json({ success: false, error: 'Missing uid' });
    }

    const quota = await getQuotaStatus(uid);
    res.json({ success: true, ...quota });
  } catch (error) {
    console.error('❌ Quota status error:', { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, error: 'Failed to check quota' });
  }
});

app.post('/api/generate-quiz', async (req, res) => {
  console.log('📨 Received quiz generation request');
  console.log('📦 Request body:', req.body);

  const { moduleId, lessonId, quizType, questionCount, uid } = req.body;

  if (!uid) {
    return res.status(400).json({
      success: false,
      error: 'Missing uid — please log in again.',
    });
  }

  // Server-side check: kailangan muna unlocked ang module para sa host
  // bago siya makapag-generate/host ng quiz dito — hindi pwedeng UI-level
  // alert lang (parang sa select_module.jsx), dahil pwede itong ma-bypass
  // ng direktang POST request papunta sa endpoint na 'to.
  const moduleUnlocked = await isModuleUnlockedForUser(uid, moduleId);
  if (!moduleUnlocked) {
    console.log(`🚫 uid ${uid} tried to generate a quiz for locked module: ${moduleId}`);
    return res.status(403).json({
      success: false,
      error: 'You need to unlock this module first before generating a quiz from it.',
    });
  }

  let quota;
  try {
    quota = await checkAndIncrementQuota(uid);
  } catch (error) {
    console.error('❌ Quota check error:', { message: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      error: 'Failed to check daily generate limit. Please try again.',
    });
  }

  if (!quota.allowed) {
    console.log(`🚫 Daily generate limit reached for uid: ${uid}`);
    return res.status(429).json({
      success: false,
      limitReached: true,
      error: 'Naabot mo na ang 3 generates mo ngayong araw. Bumalik ka bukas para makapag-generate ulit.',
    });
  }

  try {
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

    res.json({ success: true, questions, remainingGenerates: quota.remaining });
  } catch (error) {
    console.error('❌ Quiz generation error:', {
      message: error.message,
      stack: error.stack,
    });

    // Nag-fail ang generation — ibalik yung 1 count na na-reserve kanina,
    // para hindi masayang ang isang generate ng user dahil sa server/AI error.
    try {
      await refundQuota(uid);
    } catch (refundError) {
      console.error('❌ Failed to refund quota after generation error:', refundError.message);
    }

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
      const { hostName, moduleId, lessonId, quizType, questions, uid } = data;

      // Kailangan ng `uid` dito mismo sa paglikha ng room — ito ang magiging
      // permanenteng identity ng host slot. Kung wala nito, walang paraan
      // ang `rejoin-room` sa ibaba para ma-verify kung legit na host nga
      // ang bumabalik (babalik lang tayo sa lumang playerName-only na
      // bug na kagagawa lang natin).
      if (!uid) {
        callback({ success: false, error: 'Missing uid — please log in again.' });
        return;
      }

      const room = await roomManager.createRoom({
        hostId: socket.id,
        hostUid: uid,
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
      socket.data.uid = uid;
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

  // ── Check Join Eligibility (pre-check, hindi pa nagjo-join) ──
  // Tinatawag ito ng pvp_quiz.jsx BAGO pa mag-navigate papunta sa
  // waiting-lobby-join page — para kung mag-fail (locked module, room
  // full/not-found, atbp.), doon-doon lang mananatili ang error message sa
  // Join modal mismo, walang flash na navigate-then-bounce-back.
  socket.on('check-join-eligibility', async (data, callback) => {
    try {
      const { pin, uid } = data;
      const result = await validateRoomJoin(pin, uid);
      callback(result.ok ? { success: true } : { success: false, error: result.error });
    } catch (error) {
      console.error('Check join eligibility error:', error);
      callback({ success: false, error: error.message });
    }
  });

  // ── Join Room ──
  socket.on('join-room', async (data, callback) => {
    try {
      const { pin, playerName, uid } = data;

      const result = await validateRoomJoin(pin, uid);
      if (!result.ok) {
        if (result.error === 'You need to unlock this module first before joining this quiz.') {
          console.log(`🚫 ${playerName} (${uid}) tried to join room ${pin} but the module is not yet unlocked`);
        }
        callback({ success: false, error: result.error });
        return;
      }

      // Kung nalaman ng validateRoomJoin na existing player na pala 'to
      // (may kasalukuyang record na sa room na tumutugma ang uid) —
      // hal. legit na player na bumalik gamit ang "Join Room" modal/PIN
      // sa halip na sa auto-rejoin flow — huwag na siyang ituring na
      // BAGONG pagsali. I-reroute papunta sa parehong reassignment logic
      // ng rejoin-room, para hindi gumawa ng duplicate na player slot at
      // para hindi rin siya harangan ng "Game already in progress" kahit
      // ongoing na ang quiz.
      if (result.isRejoin) {
        return performRejoin(socket, { pin, playerName, uid }, callback);
      }

      const room = result.room;

      const player = roomManager.addPlayer(pin, {
        id: socket.id,
        uid,
        name: playerName,
        score: 0,
      });

      socket.join(pin);
      socket.data.roomPin = pin;
      socket.data.playerId = socket.id;
      socket.data.playerName = playerName;
      socket.data.uid = uid;
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

  // ── Rejoin Room (e.g. after page refresh) ──
  socket.on('rejoin-room', async (data, callback) => {
    await performRejoin(socket, data, callback);
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

      // Snapshot exactly who is present in the lobby at the moment the game
      // starts. ONLY these uids may rejoin once the quiz is underway (e.g.
      // after a disconnect or an accidental leave). Anyone who joined the
      // lobby but LEFT before start — whose stale slot may still linger in
      // room.players — is deliberately excluded, so they can't rejoin a game
      // they weren't part of when it began.
      //
      // Ground truth = who actually has a LIVE socket in the room right now
      // (Socket.IO room membership), not the `disconnected` flag. Someone who
      // left via the Leave button (socket.leave) OR closed their tab (socket
      // dropped) is no longer in this set — which also closes the pre-start
      // grace-period race where a leaver's flag is briefly still `false`.
      const liveSocketIds = io.sockets.adapter.rooms.get(pin) || new Set();
      room.startedParticipants = new Set(
        room.players
          .filter((p) => !p.disconnected && liveSocketIds.has(p.id) && p.uid)
          .map((p) => p.uid)
      );
      console.log(`🎬 Quiz ${pin} started with participants:`, [...room.startedParticipants]);

      callback({ success: true });

      // `serverTime` dito ay ang TANGING reference na gagamitin ng lahat ng
      // clients para i-sync ang bgm loop position (tingnan quiz_arena.jsx).
      // Iisang server clock lang ito, kaya kahit magkaiba ang oras ng mga
      // device ng players, iisa pa ring "ground truth" ang gagamitin nila.
      io.to(pin).emit('quiz-started', {
        totalQuestions: room.questions.length,
        players: roomManager.getVisiblePlayers(pin),
        serverTime: Date.now(),
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
      // Sadyang hindi na natin dinedestructure/ginagamit ang `timeTaken` na
      // ipinapadala ng client — ang server.timeLeft (via quizEngine) na ang
      // authoritative source, para hindi na maaabuso kahit sa reload o sa
      // direktang pag-edit ng socket payload sa client side.
      const { pin, questionIndex, answer } = data;
      const room = roomManager.getRoom(pin);

      if (!room || room.status !== 'playing') {
        callback({ success: false, error: 'Game not in progress' });
        return;
      }

      const result = await room.quizEngine.submitAnswer({
        playerId: socket.id,
        questionIndex,
        answer,
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

  // ── Answer Draft (habang nagtype, bago pa ma-click ang Submit) ──
  // Hindi pa "final" ang sagot dito, wala ring scoring na nangyayari —
  // isang snapshot lang ng current typed value ng player, para may
  // magamit bilang huling sagot niya kung maubusan ng oras bago siya
  // mag-click ng Submit Answer (tingnan ang `timeLeft <= 0` block sa
  // `sendQuestion()`).
  socket.on('answer-draft', (data) => {
    const { pin, questionIndex, answer } = data;
    const room = roomManager.getRoom(pin);
    if (!room || room.status !== 'playing' || !room.quizEngine) return;
    room.quizEngine.setDraftAnswer(socket.id, questionIndex, answer);
  });

  // ── Next Question ──
  socket.on('next-question', async (data) => {
    const { pin } = data;
    const room = roomManager.getRoom(pin);
    if (!room || room.status !== 'playing') return;
    sendQuestion(pin);
  });

  // ── Explicit Leave (from the "Leave Room" button / browser Back) ──
  // Unlike a socket disconnect (which keeps the shared socket alive when the
  // user merely navigates away), this fires when the user intentionally
  // leaves the lobby. We hide them from everyone's lobby IMMEDIATELY (real-
  // time presence) but keep their slot so they — and only they, by uid — can
  // rejoin by entering the PIN again. Rejoining re-marks them connected and
  // re-broadcasts, so other players see them reappear.
  socket.on('leave-room', (data, callback) => {
    try {
      const pin = (data && data.pin) || socket.data.roomPin;
      if (!pin) { if (callback) callback({ success: true }); return; }

      const room = roomManager.getRoom(pin);
      if (!room) { if (callback) callback({ success: true }); return; }

      const uid = (data && data.uid) || socket.data.uid;

      // Cancel any pending disconnect grace timer for this player.
      const timerKey = `${pin}:${uid}`;
      const pending = disconnectTimers.get(timerKey);
      if (pending) { clearTimeout(pending); disconnectTimers.delete(timerKey); }

      const wasHost = socket.id === room.hostId;

      // Hide from the visible player list, keep the slot for rejoin.
      roomManager.markPlayerDisconnected(pin, socket.id);
      socket.leave(pin);
      socket.data.roomPin = null;

      // Host migration (Valorant / CODM style): if the host left and a
      // connected player remains, promote the earliest-joined still-connected
      // player to host. If the original host rejoins later, they come back as
      // a regular player — someone else already holds the role.
      if (wasHost) {
        const newHost = room.players.find((p) => !p.disconnected);
        if (newHost) {
          room.hostId = newHost.id;
          room.hostName = newHost.name;
          room.hostUid = newHost.uid;
          io.to(pin).emit('host-changed', { newHostId: newHost.id, newHostName: newHost.name });
        }
      }

      io.to(pin).emit('player-left', {
        playerId: socket.id,
        playerCount: roomManager.getVisiblePlayers(pin).length,
      });
      io.to(pin).emit('room-update', {
        players: roomManager.getVisiblePlayers(pin),
        hostName: room.hostName,
        isHost: false,
      });

      // If nobody connected is left, schedule the room for cleanup.
      scheduleAbandonedRoomCleanup(pin);

      if (callback) callback({ success: true });
    } catch (err) {
      console.error('leave-room error:', err.message);
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // ── Disconnect ──
  socket.on('disconnect', () => {
    const pin = socket.data.roomPin;
    const playerName = socket.data.playerName;
    const uid = socket.data.uid;
    if (!pin || !playerName) return;

    const room = roomManager.getRoom(pin);
    if (!room) return;

    if (room.status === 'playing') {
      // Habang ongoing ang quiz: huwag agad tanggalin ang player. I-mark
      // lang siyang "disconnected" — mananatili ang score at record niya,
      // pero agad siyang mawawala sa leaderboard ng ibang players. Pwede pa
      // siyang mag-rejoin anumang oras habang hindi pa "finished" ang quiz
      // (walang time limit dito, hindi tulad ng waiting-room grace period).
      const player = roomManager.markPlayerDisconnected(pin, socket.id);
      if (!player) return;

      console.log(`🔴 ${playerName} disconnected mid-quiz — hidden sa leaderboard, pwede pa mag-rejoin anytime`);

      io.to(pin).emit('player-disconnected', {
        playerId: socket.id,
        playerName,
      });

      io.to(pin).emit('room-update', {
        players: roomManager.getVisiblePlayers(pin),
        hostName: room.hostName,
        isHost: false,
      });

      // Failsafe lang: kung wala nang kahit isang connected na player sa
      // buong room, i-schedule ang cleanup pagkalipas ng mahabang panahon.
      scheduleAbandonedRoomCleanup(pin);
      return;
    }

    // Room pa lang naka-"waiting" (hindi pa nagsisimula ang quiz) — hindi pa
    // sila committed na kasapi, kaya pwede pa rin gamitin ang dating
    // grace-period + totoong pagtanggal.
    console.log(`🔴 Client disconnected: ${socket.id} (${playerName}) — ${REJOIN_GRACE_MS / 1000}s grace period bago tanggalin`);

    // Naka-uid ang key na 'to (dating playerName) — consistent sa bagong
    // identity model, at iniiwasan ang collision kung magkatulad ang
    // display name ng dalawang magkaibang account.
    const timerKey = `${pin}:${uid}`;

    // Kung may naunang timer na (edge case), i-clear muna
    const existingTimer = disconnectTimers.get(timerKey);
    if (existingTimer) clearTimeout(existingTimer);

    const timer = setTimeout(() => {
      disconnectTimers.delete(timerKey);
      finalizePlayerRemoval(pin, socket.id, uid, playerName);
    }, REJOIN_GRACE_MS);

    disconnectTimers.set(timerKey, timer);
  });

  // ── Helper: failsafe cleanup para sa mga room na naka-"playing" pero
  // wala nang kahit isang connected na player (tuluyan nang inabandona) ──
  function scheduleAbandonedRoomCleanup(pin) {
    const room = roomManager.getRoom(pin);
    if (!room) return;

    const stillHasConnected = room.players.some((p) => !p.disconnected);
    if (stillHasConnected) return; // may buhay pa, walang dapat gawin

    const existing = abandonedRoomTimers.get(pin);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      abandonedRoomTimers.delete(pin);
      const r = roomManager.getRoom(pin);
      if (!r) return;

      const nowConnected = r.players.some((p) => !p.disconnected);
      if (!nowConnected) {
        roomManager.deleteRoom(pin);
        console.log(`🗑️ Room ${pin} deleted — walang bumalik na player sa loob ng ${ABANDONED_ROOM_CLEANUP_MS / 60000} mins`);
      }
    }, ABANDONED_ROOM_CLEANUP_MS);

    abandonedRoomTimers.set(pin, timer);
  }

  // ── Helper: Finalize player removal after grace period expires ──
  function finalizePlayerRemoval(pin, socketId, uid, playerName) {
    const room = roomManager.getRoom(pin);
    if (!room) return;

    // Kung nag-rejoin na yung player gamit ang ibang bagong socket.id,
    // huwag na siyang tanggalin — yung dating socket.id lang ang "patay".
    // Naka-uid ang matching (dating playerName) — parehong dahilan sa
    // ibang lugar: unique/permanent ito, hindi tulad ng display name.
    const currentPlayer = room.players.find((p) => p.uid === uid);
    if (currentPlayer && currentPlayer.id !== socketId) {
      console.log(`↩️ ${playerName} already rejoined with a new socket — skipping removal`);
      return;
    }

    const wasHost = socketId === room.hostId;
    roomManager.removePlayer(pin, socketId);

    if (room.players.length === 0) {
      roomManager.deleteRoom(pin);
      io.to(pin).emit('room-closed');
      return;
    }

    if (wasHost) {
      // Promote the earliest-joined still-connected player (Valorant / CODM
      // style host migration), falling back to the first slot if needed.
      const newHost = room.players.find((p) => !p.disconnected) || room.players[0];
      if (newHost) {
        room.hostId = newHost.id;
        room.hostName = newHost.name;
        room.hostUid = newHost.uid;
        io.to(pin).emit('host-changed', {
          newHostId: newHost.id,
          newHostName: newHost.name,
        });
      }
    }

    io.to(pin).emit('player-left', {
      playerId: socketId,
      playerCount: room.players.length,
    });

    io.to(pin).emit('room-update', {
      players: room.players,
      hostName: room.hostName,
      isHost: false,
    });
  }

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
    room.quizEngine.setTimeLeft(timeLeft);

    const timerInterval = setInterval(() => {
      timeLeft--;
      room.quizEngine.setTimeLeft(timeLeft);
      io.to(pin).emit('timer-update', { timeLeft });

      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        const unanswered = room.players.filter(
          (p) => !room.quizEngine.hasAnswered(p.id)
        );
        unanswered.forEach((p) => {
          // Kung may na-type na siya kahit hindi na-click ang Submit Answer
          // button, gamitin 'yon bilang huling sagot niya — huwag agad
          // ituring na "walang sagot". Dadaan pa rin ito sa parehong
          // submitAnswer() validation/scoring logic (kasama na ang
          // singular/plural tolerance).
          const lastTyped = room.quizEngine.getDraftAnswer(p.id);
          room.quizEngine.submitAnswer({
            playerId: p.id,
            questionIndex: room.quizEngine.currentQuestionIndex,
            answer: lastTyped, // null kung wala talagang na-type
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
  // Hindi kasama ang mga disconnected na players — dito nakikita ang
  // pinaka-"live" na leaderboard, kaya dapat wala silang makikitang pangalan
  // hanggang sa mag-rejoin sila.
  const rankings = roomManager.getVisiblePlayers(pin)
    .slice()
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({ ...p, rank: i + 1 }));

  // Ngayon lang natin ipinapadala ang totoong correctAnswer papunta sa
  // client — dito na dahil sarado na ang pagsagot para dito (natapos na ang
  // oras o nakasagot na lahat), kaya safe nang i-reveal.
  const correctAnswer = room.quizEngine.getCurrentCorrectAnswer();

  io.to(pin).emit('round-results', {
    results,
    rankings,
    correctAnswer,
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