import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/supabaseClient";

interface RecordRow {
  id: number;
  created_at: string;
  diagnosticos: string | null;
}

async function fetchPatient(patientId: number) {
  const { data, error } = await supabase.from("patients").select("*").eq("id", patientId).single();
  if (error) throw error;
  return data;
}

async function fetchRecords(patientId: number) {
  const { data, error } = await supabase
    .from("clinical_records")
    .select("id, created_at, diagnosticos")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as RecordRow[];
}

export default function RecordsList() {
  const { id } = useParams();
  const patientId = Number(id);

  const { data: patient } = useQuery({ queryKey: ["patient", patientId], queryFn: () => fetchPatient(patientId), enabled: !!patientId });
  const { data: records, isLoading } = useQuery({ queryKey: ["records", patientId], queryFn: () => fetchRecords(patientId), enabled: !!patientId });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Historial clínico</h1>
          {patient && <p className="text-sm text-gray-600">Paciente: <b>{patient.nombre}</b> · Expediente: {patient.expediente}</p>}
        </div>
        <Link to={`/patients/${patientId}/records/new`} className="px-4 py-2 rounded bg-black text-white">Nueva consulta</Link>
      </div>

      <div className="border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Fecha</th>
              <th className="text-left p-2">Diagnósticos</th>
              <th className="text-left p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td className="p-3" colSpan={3}>Cargando…</td></tr>}
            {records?.map(r => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{new Date(r.created_at).toLocaleString()}</td>
                <td className="p-2">{r.diagnosticos?.slice(0, 120) ?? "—"}</td>
                <td className="p-2">
                  <Link className="text-blue-600 underline" to={`/patients/${patientId}/records/${r.id}`}>Ver/Editar</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}