import { useState } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { supabase } from "@/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { useSignOut } from "@/hooks/useSignOut";

interface Patient {
  id: number;
  expediente: string;
  nombre: string;
  edad: number | null;
  sexo: "Femenino" | "Masculino" | "Otro" | null;
  estado_civil: string | null;
  ocupacion: string | null;
  created_at: string;
}

async function fetchPatients(search: string) {
  let q = supabase.from("patients").select("*").order("created_at", { ascending: false });
  if (search.trim()) {
    q = q.or(`nombre.ilike.%${search}%,expediente.ilike.%${search}%`);
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

  // ----- Crear -----
  const [form, setForm] = useState({
    expediente: "",
    nombre: "",
    sexo: "Femenino" as Patient["sexo"],
    edad: "",
    estado_civil: "",
    ocupacion: "",
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const expediente = form.expediente.trim();

      // Evitar duplicados por expediente
      const { data: dup, error: qErr } = await supabase
        .from("patients")
        .select("id")
        .eq("expediente", expediente)
        .maybeSingle();
      if (qErr) throw qErr;
      if (dup) throw new Error("Ese expediente ya existe.");

      const { error } = await supabase.from("patients").insert({
        expediente,
        nombre: form.nombre.trim(),
        sexo: form.sexo,
        edad: form.edad === "" ? null : Number(form.edad),
        estado_civil: form.estado_civil || null,
        ocupacion: form.ocupacion || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Paciente creado");
      setForm({
        expediente: "",
        nombre: "",
        sexo: "Femenino",
        edad: "",
        estado_civil: "",
        ocupacion: "",
      });
      qc.invalidateQueries({ queryKey: ["patients"] });
      setShowAddForm(false);
    },
    onError: (e: any) => toast.error(e.message || "No se pudo crear el paciente"),
  });

  // ----- Editar -----
  const [edit, setEdit] = useState<Patient | null>(null);
  const [editForm, setEditForm] = useState({
    expediente: "",
    nombre: "",
    sexo: "Femenino" as Patient["sexo"],
    edad: "",
    estado_civil: "",
    ocupacion: "",
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!edit) return;

      const expediente = editForm.expediente.trim();

      // Si cambió el expediente, validar que no exista
      if (expediente !== edit.expediente) {
        const { data: dup, error: qErr } = await supabase
          .from("patients")
          .select("id")
          .eq("expediente", expediente)
          .maybeSingle();
        if (qErr) throw qErr;
        if (dup) throw new Error("Ese expediente ya existe.");
      }

      const { error } = await supabase
        .from("patients")
        .update({
          expediente,
          nombre: editForm.nombre.trim(),
          sexo: editForm.sexo,
          edad: editForm.edad === "" ? null : Number(editForm.edad),
          estado_civil: editForm.estado_civil || null,
          ocupacion: editForm.ocupacion || null,
        })
        .eq("id", edit.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Paciente actualizado");
      setEdit(null);
      qc.invalidateQueries({ queryKey: ["patients"] });
    },
    onError: (e: any) => toast.error(e.message || "No se pudo actualizar"),
  });

  // ----- Eliminar -----
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("patients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Paciente eliminado");
      if (edit) setEdit(null);
      qc.invalidateQueries({ queryKey: ["patients"] });
    },
    onError: (e: any) => {
      // 23503 = violación de FK (tiene historiales)
      const msg =
        e?.code === "23503"
          ? "No se puede eliminar: el paciente tiene historial clínico."
          : e?.message || "No se pudo eliminar";
      toast.error(msg);
    },
  });


  const fmtDT = (iso?: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return new Intl.DateTimeFormat("es-MX", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit"
    }).format(d);
  };

  // ===================== EXPORT (CSV / PDF) =====================

  // CSV helpers
  const csvEscape = (val: any) => {
    if (val === null || val === undefined) return "";
    const s = String(val).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const toCSV = (rows: any[], headers: Record<string, string>) => {
    const cols = Object.keys(headers);
    const head = Object.values(headers).join(",");
    const body = rows.map(r => cols.map(c => csvEscape((r as any)[c])).join(",")).join("\n");
    return head + "\n" + body;
  };
  const downloadText = (filename: string, text: string, mime = "text/csv;charset=utf-8;") => {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  // Exportar TODOS los pacientes a CSV (sin historial)
  const exportAllPatientsCSV = async () => {
    const { data, error } = await supabase
      .from("patients")
      .select("expediente,nombre,sexo,edad,estado_civil,ocupacion,created_at")
      .order("created_at", { ascending: false });

    if (error) return toast.error(error.message);

    const headers = {
      expediente: "Expediente",
      nombre: "Nombre",
      sexo: "Sexo",
      edad: "Edad",
      estado_civil: "Estado civil",
      ocupacion: "Ocupación",
      created_at: "Creado",
    };
    const csv = toCSV(data ?? [], headers);
    downloadText(`pacientes_${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  // Exportar TODOS los pacientes a PDF (sin historial)
  const exportAllPatientsPDF = async () => {
    const { data, error } = await supabase
      .from("patients")
      .select("expediente,nombre,sexo,edad,estado_civil,ocupacion,created_at")
      .order("created_at", { ascending: false });
    if (error) return toast.error(error.message);

  const pdfDoc1 = new jsPDF();
  const autoTable1 = (window as any).jspdf?.autotable || (pdfDoc1 as any).autoTable;

    const doc = new jsPDF();
    doc.text("Listado de pacientes", 14, 14);

    const rows = (data ?? []).map(r => [
      r.expediente,
      r.nombre,
      r.sexo ?? "",
      r.edad ?? "",
      r.estado_civil ?? "",
      r.ocupacion ?? "",
      fmtDT(r.created_at), // ← aquí el formato bonito
    ]);

  autoTable1(pdfDoc1, {
      startY: 20,
      head: [["Expediente", "Nombre", "Sexo", "Edad", "Estado civil", "Ocupación", "Creado"]],
      body: rows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [0, 0, 0] },
    });

    doc.save(`pacientes_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // Exportar PDF de un paciente individual
  const exportPatientPDF = async (patient: Patient) => {
  const pdfDoc2 = new jsPDF();
  const autoTable2 = (window as any).jspdf?.autotable || (pdfDoc2 as any).autoTable;
    const doc = new jsPDF();
    doc.text("Ficha de paciente", 14, 14);
    const headers = ["Campo", "Valor"];
    const fields = [
      ["Expediente", patient.expediente],
      ["Nombre", patient.nombre],
      ["Sexo", patient.sexo ?? ""],
      ["Edad", patient.edad ?? ""],
      ["Estado civil", patient.estado_civil ?? ""],
      ["Ocupación", patient.ocupacion ?? ""],
      ["Creado", fmtDT(patient.created_at)],
    ];
  autoTable2(pdfDoc2, {
      startY: 20,
      head: [headers],
      body: fields,
      styles: { fontSize: 11 },
      headStyles: { fillColor: [0, 0, 0] },
    });
    doc.save(`paciente_${patient.expediente}.pdf`);
  };
  // =============================================================

  const [showAddForm, setShowAddForm] = useState(false);
  const signOut = useSignOut();

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Pacientes</h1>
        <button
          className="px-4 py-2 rounded bg-red-600 text-white"
          onClick={() => {
            signOut.mutate();
          }}
        >
          Cerrar sesión
        </button>
      </div>

      {/* Buscar */}
      <div className="flex gap-2">
        <input
          placeholder="Buscar por nombre o expediente"
          className="border p-2 rounded w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Botones de exportación */}
      <div className="flex gap-2">
        <button
          onClick={exportAllPatientsCSV}
          className="px-3 py-2 rounded border hover:bg-gray-50"
        >
          Descargar CSV (todos)
        </button>
        <button
          onClick={exportAllPatientsPDF}
          className="px-3 py-2 rounded border hover:bg-gray-50"
        >
          Descargar PDF (todos)
        </button>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="px-3 py-2 rounded border bg-blue-700 text-white"
        >
          Agregar paciente
        </button>
      </div>

      {/* Alta rápida (solo visible si showAddForm) */}
      {showAddForm && (
        <div className="border rounded p-4 space-y-3 mt-2">
          <h2 className="font-medium">Nuevo Paciente</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              className="border p-2 rounded"
              placeholder="Expediente"
              value={form.expediente}
              onChange={(e) => setForm((f) => ({ ...f, expediente: e.target.value }))}
            />
            <input
              className="border p-2 rounded"
              placeholder="Nombre completo"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            />
            <select
              className="border p-2 rounded"
              value={form.sexo ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, sexo: e.target.value as any }))}
            >
              <option value="Femenino">Femenino</option>
              <option value="Masculino">Masculino</option>
              <option value="Otro">Otro</option>
            </select>
            <input
              type="number"
              min={0}
              className="border p-2 rounded"
              placeholder="Edad (años)"
              value={form.edad}
              onChange={(e) => setForm((f) => ({ ...f, edad: e.target.value }))}
            />
            <input
              className="border p-2 rounded"
              placeholder="Estado civil"
              value={form.estado_civil}
              onChange={(e) => setForm((f) => ({ ...f, estado_civil: e.target.value }))}
            />
            <input
              className="border p-2 rounded"
              placeholder="Ocupación"
              value={form.ocupacion}
              onChange={(e) => setForm((f) => ({ ...f, ocupacion: e.target.value }))}
            />
          </div>
          <button
            onClick={() => createMutation.mutate()}
            disabled={!form.expediente || !form.nombre || createMutation.isPending}
            className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
          >
            {createMutation.isPending ? "Guardando…" : "Crear paciente"}
          </button>
        </div>
      )}

      {/* Tabla */}
      <div className="border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Expediente</th>
              <th className="text-left p-2">Nombre</th>
              <th className="text-left p-2">Sexo</th>
              <th className="text-left p-2">Edad</th>
              <th className="text-left p-2 hidden lg:table-cell">Estado civil</th>
              <th className="text-left p-2 hidden lg:table-cell">Ocupación</th>
              <th className="text-left p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="p-3" colSpan={7}>
                  Cargando…
                </td>
              </tr>
            )}
            {patients?.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-2">{p.expediente}</td>
                <td className="p-2">{p.nombre}</td>
                <td className="p-2">{p.sexo}</td>
                <td className="p-2">{p.edad ?? "—"}</td>
                <td className="p-2 hidden lg:table-cell">{p.estado_civil ?? "—"}</td>
                <td className="p-2 hidden lg:table-cell">{p.ocupacion ?? "—"}</td>
                <td className="p-2 space-x-3">
                  <button
                    className="text-blue-600 underline"
                    onClick={() => {
                      setEdit(p);
                      setEditForm({
                        expediente: p.expediente ?? "",
                        nombre: p.nombre ?? "",
                        sexo: (p.sexo as any) ?? "Femenino",
                        edad: p.edad?.toString() ?? "",
                        estado_civil: p.estado_civil ?? "",
                        ocupacion: p.ocupacion ?? "",
                      });
                    }}
                  >
                    Editar
                  </button>

                  <Link className="text-blue-600 underline" to={`/patients/${p.id}/records`}>
                    Historial
                  </Link>

                  <button
                    className="text-red-600 underline"
                    onClick={() => {
                      if (confirm("¿Eliminar este paciente?")) deleteMutation.mutate(p.id);
                    }}
                  >
                    Eliminar
                  </button>

                  <button
                    className="text-green-600 underline"
                    onClick={() => exportPatientPDF(p)}
                  >
                    Descargar PDF
                  </button>
                </td>
              </tr>
            ))}
            {!isLoading && (!patients || patients.length === 0) && (
              <tr>
                <td className="p-3 text-gray-500" colSpan={7}>
                  Sin resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal editar */}
      {edit && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-lg bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Editar paciente</h3>
              <button onClick={() => setEdit(null)} className="text-sm text-gray-500">
                Cerrar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                className="border p-2 rounded"
                placeholder="Expediente"
                value={editForm.expediente}
                onChange={(e) => setEditForm((f) => ({ ...f, expediente: e.target.value }))}
              />
              <input
                className="border p-2 rounded"
                placeholder="Nombre completo"
                value={editForm.nombre}
                onChange={(e) => setEditForm((f) => ({ ...f, nombre: e.target.value }))}
              />
              <select
                className="border p-2 rounded"
                value={editForm.sexo ?? ""}
                onChange={(e) => setEditForm((f) => ({ ...f, sexo: e.target.value as any }))}
              >
                <option value="Femenino">Femenino</option>
                <option value="Masculino">Masculino</option>
                <option value="Otro">Otro</option>
              </select>
              <input
                type="number"
                min={0}
                className="border p-2 rounded"
                placeholder="Edad (años)"
                value={editForm.edad}
                onChange={(e) => setEditForm((f) => ({ ...f, edad: e.target.value }))}
              />
              <input
                className="border p-2 rounded"
                placeholder="Estado civil"
                value={editForm.estado_civil}
                onChange={(e) => setEditForm((f) => ({ ...f, estado_civil: e.target.value }))}
              />
              <input
                className="border p-2 rounded"
                placeholder="Ocupación"
                value={editForm.ocupacion}
                onChange={(e) => setEditForm((f) => ({ ...f, ocupacion: e.target.value }))}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={() => setEdit(null)} className="px-4 py-2 rounded border">
                Cancelar
              </button>
              <button
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
                className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
              >
                {updateMutation.isPending ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
