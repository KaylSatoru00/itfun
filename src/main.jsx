import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import './index.css'
import { UserProvider } from './user_context'
import { SocketProvider } from './socket_context'
import ProtectedRoute from './protected_route.jsx'
import useBlockBackNavigation from './use_block_back_navigation.js'

// Login
import Login from './login/login.jsx'
import StudentLogin from './login/student_login.jsx'
import FacultyLogin from './login/faculty_login.jsx'

// Student
import LearningModules from './student/student_modules.jsx'
import PvpQuiz from './student/pvp_quiz.jsx'
import SelectModule from './student/select_module.jsx'
import SelectType from './student/select_type.jsx'
import WaitingLobby from './student/waiting_lobby_host.jsx'
import WaitingLobbyJoin from './student/waiting_lobby_join.jsx'
import QuizArena from './student/quiz_arena.jsx'
import Chapter1 from './student/s1.jsx'
import Chapter2 from './student/s2.jsx'
import Chapter3 from './student/s3.jsx'
import Chapter4 from './student/s4.jsx'
import Chapter5 from './student/s5.jsx'
import Chapter6 from './student/s6.jsx'
import Chapter7 from './student/s7.jsx'
import Chapter8 from './student/s8.jsx'
import Chapter9 from './student/s9.jsx'

// Faculty
import FacultyModules from './faculty/faculty_modules.jsx'
import FacultyClass from './faculty/faculty_class.jsx'
import FacultyChapter1 from './faculty/f1.jsx'
import FacultyChapter2 from './faculty/f2.jsx'
import FacultyChapter3 from './faculty/f3.jsx'
import FacultyChapter4 from './faculty/f4.jsx'
import FacultyChapter5 from './faculty/f5.jsx'
import FacultyChapter6 from './faculty/f6.jsx'
import FacultyChapter7 from './faculty/f7.jsx'
import FacultyChapter8 from './faculty/f8.jsx'
import FacultyChapter9 from './faculty/f9.jsx'

// Gamified Quiz
import Gamified1 from './student/gamified1.jsx'
import Gamified6 from './student/gamified6.jsx';
import Gamified8 from './student/gamified8.jsx'
import Gamified9 from './student/gamified9.jsx'

// Forgot Password
import ResetPassword from './login/reset_password.jsx'


function AnimatedRoutes() {
  const location = useLocation();
  useBlockBackNavigation(); // global back-button trap, isang beses lang naka-mount

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* ── Public routes ── */}
        <Route path="/" element={<Login />} />
        <Route path="/student-login" element={<StudentLogin />} />
        <Route path="/faculty-login" element={<FacultyLogin />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ── Student routes ── */}
        <Route path="/learning-modules" element={
          <ProtectedRoute allowedRole="student"><LearningModules /></ProtectedRoute>
        } />
        <Route path="/pvp-quiz" element={
          <ProtectedRoute allowedRole="student"><PvpQuiz /></ProtectedRoute>
        } />
        <Route path="/select-module" element={
          <ProtectedRoute allowedRole="student"><SelectModule /></ProtectedRoute>
        } />
        <Route path="/select-type" element={
          <ProtectedRoute allowedRole="student"><SelectType /></ProtectedRoute>
        } />
        <Route path="/waiting-lobby" element={
          <ProtectedRoute allowedRole="student"><WaitingLobby /></ProtectedRoute>
        } />
        <Route path="/waiting-lobby-join" element={
          <ProtectedRoute allowedRole="student"><WaitingLobbyJoin /></ProtectedRoute>
        } />
        <Route path="/quiz-arena" element={
          <ProtectedRoute allowedRole="student"><QuizArena /></ProtectedRoute>
        } />
        <Route path="/student-chapter-1" element={
          <ProtectedRoute allowedRole="student"><Chapter1 /></ProtectedRoute>
        } />
        <Route path="/student-chapter-2" element={
          <ProtectedRoute allowedRole="student"><Chapter2 /></ProtectedRoute>
        } />
        <Route path="/student-chapter-3" element={
          <ProtectedRoute allowedRole="student"><Chapter3 /></ProtectedRoute>
        } />
        <Route path="/student-chapter-4" element={
          <ProtectedRoute allowedRole="student"><Chapter4 /></ProtectedRoute>
        } />
        <Route path="/student-chapter-5" element={
          <ProtectedRoute allowedRole="student"><Chapter5 /></ProtectedRoute>
        } />
        <Route path="/student-chapter-6" element={
          <ProtectedRoute allowedRole="student"><Chapter6 /></ProtectedRoute>
        } />
        <Route path="/student-chapter-7" element={
          <ProtectedRoute allowedRole="student"><Chapter7 /></ProtectedRoute>
        } />
        <Route path="/student-chapter-8" element={
          <ProtectedRoute allowedRole="student"><Chapter8 /></ProtectedRoute>
        } />
        <Route path="/student-chapter-9" element={
          <ProtectedRoute allowedRole="student"><Chapter9 /></ProtectedRoute>
        } />
        <Route path="/gamified-1" element={
          <ProtectedRoute allowedRole="student"><Gamified1 /></ProtectedRoute>
        } />
        <Route path="/gamified-6" element={
          <ProtectedRoute allowedRole="student"><Gamified6 /></ProtectedRoute>
        } />
        <Route path="/gamified-8" element={
          <ProtectedRoute allowedRole="student"><Gamified8 /></ProtectedRoute>
        } />
        <Route path="/gamified-9" element={
          <ProtectedRoute allowedRole="student"><Gamified9 /></ProtectedRoute>
        } />

        {/* ── Faculty routes ── */}
        <Route path="/faculty-modules" element={
          <ProtectedRoute allowedRole="faculty"><FacultyModules /></ProtectedRoute>
        } />
        <Route path="/faculty-class" element={
          <ProtectedRoute allowedRole="faculty"><FacultyClass /></ProtectedRoute>
        } />
        <Route path="/faculty-chapter-1" element={
          <ProtectedRoute allowedRole="faculty"><FacultyChapter1 /></ProtectedRoute>
        } />
        <Route path="/faculty-chapter-2" element={
          <ProtectedRoute allowedRole="faculty"><FacultyChapter2 /></ProtectedRoute>
        } />
        <Route path="/faculty-chapter-3" element={
          <ProtectedRoute allowedRole="faculty"><FacultyChapter3 /></ProtectedRoute>
        } />
        <Route path="/faculty-chapter-4" element={
          <ProtectedRoute allowedRole="faculty"><FacultyChapter4 /></ProtectedRoute>
        } />
        <Route path="/faculty-chapter-5" element={
          <ProtectedRoute allowedRole="faculty"><FacultyChapter5 /></ProtectedRoute>
        } />
        <Route path="/faculty-chapter-6" element={
          <ProtectedRoute allowedRole="faculty"><FacultyChapter6 /></ProtectedRoute>
        } />
        <Route path="/faculty-chapter-7" element={
          <ProtectedRoute allowedRole="faculty"><FacultyChapter7 /></ProtectedRoute>
        } />
        <Route path="/faculty-chapter-8" element={
          <ProtectedRoute allowedRole="faculty"><FacultyChapter8 /></ProtectedRoute>
        } />
        <Route path="/faculty-chapter-9" element={
          <ProtectedRoute allowedRole="faculty"><FacultyChapter9 /></ProtectedRoute>
        } />
      </Routes>
    </AnimatePresence>
  )
}

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <UserProvider>
      <SocketProvider>
        <AnimatedRoutes />
      </SocketProvider>
    </UserProvider>
  </BrowserRouter>,
)