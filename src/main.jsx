import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import './index.css'
import { UserProvider } from './user_context'
import { SocketProvider } from './socket_context'


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
import Gamified9 from './student/gamified9.jsx'

// Forgot Password
import ResetPassword from './login/reset_password.jsx'


function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Login />} />
        <Route path="/student-login" element={<StudentLogin />} />
        <Route path="/faculty-login" element={<FacultyLogin />} />
        <Route path="/faculty-modules" element={<FacultyModules />} />
        <Route path="/faculty-class" element={<FacultyClass />} />
        <Route path="/learning-modules" element={<LearningModules />} />
        <Route path="/pvp-quiz" element={<PvpQuiz />} />
        <Route path="/select-module" element={<SelectModule />} />
        <Route path="/select-type" element={<SelectType />} />
        <Route path="/waiting-lobby" element={<WaitingLobby />} />
        <Route path="/waiting-lobby-join" element={<WaitingLobbyJoin />} />
        <Route path="/quiz-arena" element={<QuizArena />} />
        <Route path="/student-chapter-1" element={<Chapter1 />} />
        <Route path="/student-chapter-2" element={<Chapter2 />} />
        <Route path="/student-chapter-3" element={<Chapter3 />} />
        <Route path="/student-chapter-4" element={<Chapter4 />} />
        <Route path="/student-chapter-5" element={<Chapter5 />} />
        <Route path="/student-chapter-6" element={<Chapter6 />} />
        <Route path="/student-chapter-7" element={<Chapter7 />} />
        <Route path="/student-chapter-8" element={<Chapter8 />} />
        <Route path="/student-chapter-9" element={<Chapter9 />} />
        <Route path="/faculty-chapter-1" element={<FacultyChapter1 />} />
        <Route path="/faculty-chapter-2" element={<FacultyChapter2 />} />
        <Route path="/faculty-chapter-3" element={<FacultyChapter3 />} />
        <Route path="/faculty-chapter-4" element={<FacultyChapter4 />} />
        <Route path="/faculty-chapter-5" element={<FacultyChapter5 />} />
        <Route path="/faculty-chapter-6" element={<FacultyChapter6 />} />
        <Route path="/faculty-chapter-7" element={<FacultyChapter7 />} />
        <Route path="/faculty-chapter-8" element={<FacultyChapter8 />} />
        <Route path="/faculty-chapter-9" element={<FacultyChapter9 />} />
        <Route path="/gamified-1" element={<Gamified1 />} />
        <Route path="/gamified-6" element={<Gamified6 />} />
        <Route path="/gamified-9" element={<Gamified9 />} />
        <Route path="/reset-password" element={<ResetPassword />} />
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