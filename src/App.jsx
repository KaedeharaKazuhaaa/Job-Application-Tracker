
import {Routes, Route, BrowserRouter, Navigate} from "react-router-dom";
import Signup from "./features/auth/signup";
import Login from "./features/auth/login";
import AppLayout from "./components/layout/app-layout";
import { ToastProvider } from "./components/ui/toast";
import ApplicationsBoard from "./features/applications/applications-board";
import Dashboard from "./features/dashboard/overview";

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/applications" element={<ApplicationsBoard />} />
          </Route>
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App;
