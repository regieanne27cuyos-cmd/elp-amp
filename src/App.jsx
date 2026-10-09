import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/index'
import AdminLogin from './pages/elp-amp-admin-login'
import AdminDashboard from './pages/elp-amp-admin-dashboard'
import TeacherDashboard from './pages/elp-amp-teacher-dashboard'
import StudentDashboard from "./pages/studentDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route
          path="/student/dashboard"
          element={<StudentDashboard />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App