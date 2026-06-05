import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import VerifyOTP from './pages/VerifyOTP';
import ResetPassword from './pages/ResetPassword';
import StudentDashboard from './pages/StudentDashboard';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import CheckIn from './pages/CheckIn';
import CheckInForm from './pages/CheckInForm';
import LogbookCases from './pages/LogbookCases';
import LogbookCaseForm from './pages/LogbookCaseForm';
import LogbookCaseDetail from './pages/LogbookCaseDetail';
import PreceptorDashboard from './pages/PreceptorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import StudentProgress from './pages/StudentProgress';
import AdminStudentDetail from './pages/AdminStudentDetail';
import ProcedureManagement from './pages/ProcedureManagement';
import AddProcedure from './pages/AddProcedure';
import EditProcedure from './pages/EditProcedure';
import LocationManagement from './pages/LocationManagement';
import AddLocation from './pages/AddLocation';
import EditLocation from './pages/EditLocation';
import CourseManagement from './pages/CourseManagement';
import AddCourse from './pages/AddCourse';
import EditCourse from './pages/EditCourse';
import AccountsManagement from './pages/AccountsManagement';
import AddUser from './pages/AddUser';
import EditUser from './pages/EditUser';
import EvaluateProcedures from './pages/EvaluateProcedures';
import VerifyShifts from './pages/VerifyShifts';

import MainLayout from './components/MainLayout';
import { ToastProvider } from './components/ToastContext';
import { ModalProvider } from './components/ModalContext';

function App() {
  return (
    <ModalProvider>
      <ToastProvider>
        <Router>
          <MainLayout>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/verify-code" element={<VerifyOTP />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/dashboard" element={<StudentDashboard />} />
              <Route path="/preceptor/dashboard" element={<PreceptorDashboard />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/progress" element={<StudentProgress />} />
              <Route path="/admin/students/:id" element={<AdminStudentDetail />} />
              <Route path="/admin/procedures" element={<ProcedureManagement />} />
              <Route path="/admin/procedures/new" element={<AddProcedure />} />
              <Route path="/admin/procedures/:id/edit" element={<EditProcedure />} />
              <Route path="/admin/locations" element={<LocationManagement />} />
              <Route path="/admin/locations/new" element={<AddLocation />} />
              <Route path="/admin/locations/:id/edit" element={<EditLocation />} />
              <Route path="/admin/courses" element={<CourseManagement />} />
              <Route path="/admin/courses/new" element={<AddCourse />} />
              <Route path="/admin/courses/:id/edit" element={<EditCourse />} />
              <Route path="/admin/accounts" element={<AccountsManagement />} />
              <Route path="/admin/accounts/new" element={<AddUser />} />
              <Route path="/admin/accounts/:id/edit" element={<EditUser />} />
              <Route path="/evaluate-procedures" element={<EvaluateProcedures />} />

              <Route path="/verify-shifts" element={<VerifyShifts />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/check-in" element={<CheckIn />} />
              <Route path="/check-in/new" element={<CheckInForm />} />
              <Route path="/logbook-cases" element={<LogbookCases />} />
              <Route path="/logbook-cases/new" element={<LogbookCaseForm />} />
              <Route path="/logbook-cases/:id" element={<LogbookCaseDetail />} />
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
          </MainLayout>
        </Router>
      </ToastProvider>
    </ModalProvider>
  );
}

export default App;
