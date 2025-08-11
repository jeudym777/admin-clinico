import {  useState } from "react";
import { supabase } from "@/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

interface Patient {
  id: number;
  expediente: string;
  nombre: string;
  fecha_nacimiento: string | null;
  sexo: "Femenino" | "Masculino" | "Otro" | null;
  estado_civil: string | null;
  ocupacion: string | null;
  created_at: string;
}

async function fetchPatients(search: string) {
  let q = supabase.from("patients").select("*").order("created_at", { ascending: false });
  if (search.trim()) {
    q = q.or(
      `nombre.ilike.%${search}%,expediente.ilike.%${search}%`
    );
  }
  const { data, error } = await q;
  if (error) throw error;
  return data as Patient[];
}

export default function PatientsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: patients, isLoading } = useQuery({
    queryKey: ["patients", { search }],
    queryFn: () => fetchPatients(search),
  });

  const [form, setForm] = useState({
    expediente: "",
    nombre: "",
    sexo: "Femenino" as Patient["sexo"],
    fecha_nacimiento: "",
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("patients").insert({
        expediente: form.expediente.trim(),
        nombre: form.nombre.trim(),
        sexo: form.sexo,
        fecha_nacimiento: form.fecha_nacimiento || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Paciente creado");
      setForm({ expediente: "", nombre: "", sexo: "Femenino", fecha_nacimiento: "" });
      qc.invalidateQueries({ queryKey: ["patients"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Pacientes</h1>

      <div className="flex gap-2">
        <input
          placeholder="Buscar por nombre o expediente"
          className="border p-2 rounded w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="border rounded p-4 space-y-3">
        <h2 className="font-medium">Alta rápida</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input className="border p-2 rounded" placeholder="Expediente" value={form.expediente} onChange={(e) => setForm((f) => ({ ...f, expediente: e.target.value }))} />
          <input className="border p-2 rounded" placeholder="Nombre completo" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
          <select className="border p-2 rounded" value={form.sexo ?? ""} onChange={(e) => setForm((f) => ({ ...f, sexo: e.target.value as any }))}>
            <option value="Femenino">Femenino</option>
            <option value="Masculino">Masculino</option>
            <option value="Otro">Otro</option>
          </select>
          <input type="date" className="border p-2 rounded" value={form.fecha_nacimiento} onChange={(e) => setForm((f) => ({ ...f, fecha_nacimiento: e.target.value }))} />
        </div>
        <button
          onClick={() => createMutation.mutate()}
          disabled={!form.expediente || !form.nombre || createMutation.isPending}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        >
          {createMutation.isPending ? "Guardando…" : "Crear paciente"}
        </button>
      </div>

      <div className="border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Expediente</th>
              <th className="text-left p-2">Nombre</th>
              <th className="text-left p-2">Sexo</th>
              <th className="text-left p-2">F. Nac.</th>
              <th className="text-left p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td className="p-3" colSpan={5}>Cargando…</td></tr>
            )}
            {patients?.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-2">{p.expediente}</td>
                <td className="p-2">{p.nombre}</td>
                <td className="p-2">{p.sexo}</td>
                <td className="p-2">{p.fecha_nacimiento ?? "—"}</td>
                <td className="p-2">
                  <Link className="text-blue-600 underline" to={`/patients/${p.id}/records`}>Historial</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}