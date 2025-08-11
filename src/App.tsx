import { Routes, Route, Navigate } from 'react-router-dom';
import PatientsPage from '@/pages/PatientsPage';
import RecordsList from '@/pages/RecordsList';
import RecordForm from '@/pages/RecordForm';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/patients" />} />
      <Route path="/patients" element={<PatientsPage />} />
      <Route path="/patients/:id/records" element={<RecordsList />} />
      <Route path="/patients/:id/records/new" element={<RecordForm />} />
      <Route path="/patients/:id/records/:recordId" element={<RecordForm />} />
    </Routes>
  );
}
