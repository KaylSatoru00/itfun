import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import './index.css'
import { UserProvider } from './user_context'
import Login from './login.jsx'
import StudentLogin from './student_login.jsx'
import FacultyLogin from './faculty_login.jsx'
import FacultyModules from './faculty_modules.jsx'
import FacultyClass from './faculty_class.jsx'
import LearningModules from './student_modules.jsx'
import PvpQuiz from './pvp_quiz.jsx'
import Chapter1 from './s1.jsx'
import Chapter2 from './s2';
import Chapter3 from './s3';
import Chapter4 from './s4';
import Chapter5 from './s5';
import Chapter6 from './s6';
import Chapter7 from './s7';
import Chapter8 from './s8';
import Chapter9 from './s9';
import FacultyChapter1 from './f1.jsx'
import FacultyChapter2 from './f2.jsx'
import FacultyChapter3 from './f3.jsx'
import FacultyChapter4 from './f4.jsx'
import FacultyChapter5 from './f5.jsx'
import FacultyChapter6 from './f6.jsx'
import FacultyChapter7 from './f7.jsx'
import FacultyChapter8 from './f8.jsx'
import FacultyChapter9 from './f9.jsx'

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
        <Route path="/faculty-chapter-7" element={<FacultyChapter7 />} />\
        <Route path="/faculty-chapter-8" element={<FacultyChapter8 />} />
        <Route path="/faculty-chapter-9" element={<FacultyChapter9 />} />
      </Routes>
    </AnimatePresence>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <UserProvider>
        <AnimatedRoutes />
      </UserProvider>
    </BrowserRouter>
  </StrictMode>,
)