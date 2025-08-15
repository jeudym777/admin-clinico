import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";

import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import PatientsPage from "@/pages/PatientsPage";
import RecordsList from "@/pages/RecordsList";
import RecordForm from "@/pages/RecordForm";

export default function App() {
  return (
    <Routes>

  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to="/patients" replace />} />
        <Route path="/patients" element={<PatientsPage />} />
        <Route path="/patients/:id/records" element={<RecordsList />} />
        <Route path="/patients/:id/records/new" element={<RecordForm />} />
        <Route path="/patients/:id/records/:recordId" element={<RecordForm />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
