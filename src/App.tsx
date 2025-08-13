import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import PatientsPage from "@/pages/PatientsPage";
import RecordsList from "@/pages/RecordsList";
import RecordForm from "@/pages/RecordForm";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />

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
