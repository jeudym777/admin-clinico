import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import type { Patient, Sexo } from "@/types/clinical";
import {
  HiMagnifyingGlass,
  HiUserPlus,
  HiXMark,
  HiPencilSquare,
  HiTrash,
} from "react-icons/hi2";
import {
  FaNotesMedical,
  FaFilePdf,
  FaFileCsv,
  FaHospitalUser,
  FaVenus,
  FaMars,
} from "react-icons/fa6";

async function fetchPatients(search: string) {
  let q = supabase.from("patients").select("*").order("created_at", { ascending: false });
  const sanitized = search.replace(/,/g, " ").trim();
  if (sanitized) {
    q = q.or(`nombre.ilike.%${sanitized}%,expediente.ilike.%${sanitized}%`);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Patient[];
}

export default function PatientsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: patients, isLoading } = useQuery({
    queryKey: ["patients", { search }],
    queryFn: () => fetchPatients(search),
  });

  // KPI calculations
  const totalPatients = patients?.length ?? 0;
  const femalePatients = patients?.filter((p) => p.sexo === "Femenino").length ?? 0;
  const malePatients = patients?.filter((p) => p.sexo === "Masculino").length ?? 0;

  // ----- Crear -----
  const [form, setForm] = useState({
    expediente: "",
    nombre: "",
    sexo: "Femenino" as Sexo,
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
    sexo: "Femenino" as Sexo,
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
    const doc = new jsPDF();
    doc.text("Listado de pacientes", 14, 14);

    const rows = (data ?? []).map((r) => [
      r.expediente,
      r.nombre,
      r.sexo ?? "",
      r.edad ?? "",
      r.estado_civil ?? "",
      r.ocupacion ?? "",
      fmtDT(r.created_at),
    ]);

    autoTable(doc, {
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
    autoTable(doc, {
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

  return (
    <div className="space-y-6">
      {/* Encabezado y Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Directorio de Pacientes
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Gestiona los expedientes clínicos y consultas de tu consultorio.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 shadow-md shadow-indigo-100 transition-all cursor-pointer active:scale-95"
        >
          <HiUserPlus className="text-lg" />
          <span>{showAddForm ? "Cerrar Formulario" : "Nuevo Paciente"}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-xl">
            <FaHospitalUser />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Pacientes</p>
            <p className="text-2xl font-bold text-slate-900">{totalPatients}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-pink-50 border border-pink-100 text-pink-600 flex items-center justify-center text-xl">
            <FaVenus />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Mujeres</p>
            <p className="text-2xl font-bold text-slate-900">{femalePatients}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center text-xl">
            <FaMars />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Hombres</p>
            <p className="text-2xl font-bold text-slate-900">{malePatients}</p>
          </div>
        </div>
      </div>

      {/* Formulario de Alta Rápida */}
      {showAddForm && (
        <div className="bg-white rounded-2xl border border-indigo-100 shadow-lg p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <HiUserPlus className="text-lg" />
              </div>
              <h2 className="font-bold text-slate-900 text-base">Registrar Nuevo Paciente</h2>
            </div>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <HiXMark className="text-xl" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Número de Expediente *
              </label>
              <input
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
                placeholder="Ej. EXP-001"
                value={form.expediente}
                onChange={(e) => setForm((f) => ({ ...f, expediente: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nombre Completo *
              </label>
              <input
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
                placeholder="Nombre y apellidos"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Sexo Biológico
              </label>
              <select
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
                value={form.sexo ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, sexo: e.target.value as any }))}
              >
                <option value="Femenino">Femenino</option>
                <option value="Masculino">Masculino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Edad (Años)
              </label>
              <input
                type="number"
                min={0}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
                placeholder="Ej. 34"
                value={form.edad}
                onChange={(e) => setForm((f) => ({ ...f, edad: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Estado Civil
              </label>
              <input
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
                placeholder="Soltero/a, Casado/a..."
                value={form.estado_civil}
                onChange={(e) => setForm((f) => ({ ...f, estado_civil: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Ocupación
              </label>
              <input
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
                placeholder="Profesión o labor"
                value={form.ocupacion}
                onChange={(e) => setForm((f) => ({ ...f, ocupacion: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={() => createMutation.mutate()}
              disabled={!form.expediente || !form.nombre || createMutation.isPending}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all disabled:opacity-50 cursor-pointer"
            >
              {createMutation.isPending ? "Guardando…" : "Guardar Paciente"}
            </button>
          </div>
        </div>
      )}

      {/* Barra de Búsqueda y Exportación */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <HiMagnifyingGlass className="text-lg" />
          </div>
          <input
            placeholder="Buscar por nombre o expediente..."
            className="w-full pl-10 pr-9 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <HiXMark className="text-lg" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={exportAllPatientsCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <FaFileCsv className="text-emerald-600 text-sm" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={exportAllPatientsPDF}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <FaFilePdf className="text-rose-600 text-sm" />
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* Tabla de Pacientes */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500 tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Expediente</th>
                <th className="py-3.5 px-4">Paciente</th>
                <th className="py-3.5 px-4">Sexo</th>
                <th className="py-3.5 px-4">Edad</th>
                <th className="py-3.5 px-4 hidden lg:table-cell">Estado Civil</th>
                <th className="py-3.5 px-4 hidden lg:table-cell">Ocupación</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2 text-sm">
                      <span className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                      Cargando pacientes...
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && patients && patients.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <p className="font-medium text-slate-600 text-base">No se encontraron pacientes</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search ? "Intenta con otro término de búsqueda" : "Comienza registrando tu primer paciente"}
                    </p>
                  </td>
                </tr>
              )}

              {patients?.map((p) => {
                const initials =
                  p.nombre
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase() || "P";

                const isFemale = p.sexo === "Femenino";
                const isMale = p.sexo === "Masculino";

                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-indigo-700">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100">
                        {p.expediente}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-200 to-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                          {initials}
                        </div>
                        <span className="font-semibold text-slate-900">{p.nombre}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isFemale
                            ? "bg-pink-50 text-pink-700 border border-pink-100"
                            : isMale
                            ? "bg-sky-50 text-sky-700 border border-sky-100"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {p.sexo ?? "No especificado"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {p.edad != null ? `${p.edad} años` : <span className="text-slate-400">—</span>}
                    </td>

                    <td className="py-3.5 px-4 hidden lg:table-cell text-slate-500">
                      {p.estado_civil ?? <span className="text-slate-400">—</span>}
                    </td>

                    <td className="py-3.5 px-4 hidden lg:table-cell text-slate-500">
                      {p.ocupacion ?? <span className="text-slate-400">—</span>}
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {/* Historial */}
                      <Link
                        to={`/patients/${p.id}/records`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 transition-colors"
                        title="Ver historial y consultas del paciente"
                      >
                        <FaNotesMedical className="text-xs" />
                        <span>Historial</span>
                      </Link>

                      {/* Ficha PDF */}
                      <button
                        onClick={() => exportPatientPDF(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 transition-colors cursor-pointer"
                        title="Descargar Ficha en PDF"
                      >
                        <FaFilePdf className="text-xs" />
                        <span className="hidden sm:inline">Ficha</span>
                      </button>

                      {/* Editar */}
                      <button
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
                        className="inline-flex items-center p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Editar paciente"
                      >
                        <HiPencilSquare className="text-base" />
                      </button>

                      {/* Eliminar */}
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar al paciente ${p.nombre}? Esta acción no se puede deshacer.`)) {
                            deleteMutation.mutate(p.id);
                          }
                        }}
                        className="inline-flex items-center p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Eliminar paciente"
                      >
                        <HiTrash className="text-base" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Editar Paciente */}
      {edit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Editar Ficha del Paciente</h3>
              <button
                onClick={() => setEdit(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <HiXMark className="text-xl" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Número de Expediente *
                </label>
                <input
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
                  value={editForm.expediente}
                  onChange={(e) => setEditForm((f) => ({ ...f, expediente: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
                  value={editForm.nombre}
                  onChange={(e) => setEditForm((f) => ({ ...f, nombre: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Sexo Biológico
                </label>
                <select
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
                  value={editForm.sexo ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, sexo: e.target.value as any }))}
                >
                  <option value="Femenino">Femenino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Edad (Años)
                </label>
                <input
                  type="number"
                  min={0}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
                  value={editForm.edad}
                  onChange={(e) => setEditForm((f) => ({ ...f, edad: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Estado Civil
                </label>
                <input
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
                  value={editForm.estado_civil}
                  onChange={(e) => setEditForm((f) => ({ ...f, estado_civil: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Ocupación
                </label>
                <input
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
                  value={editForm.ocupacion}
                  onChange={(e) => setEditForm((f) => ({ ...f, ocupacion: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEdit(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all disabled:opacity-50 cursor-pointer"
              >
                {updateMutation.isPending ? "Guardando…" : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
