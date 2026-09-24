import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/supabaseClient";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "react-toastify";
import { FaFilePdf, FaNotesMedical, FaCalendarCheck, FaArrowLeft } from "react-icons/fa6";
import { HiPlus, HiClock } from "react-icons/hi2";

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

  // Función para exportar PDF de un expediente individual
  const exportRecordPDF = async (record: RecordRow) => {
    if (!patient) return;
    // Obtener todos los datos del registro
    const { data: fullRecord, error } = await supabase
      .from("clinical_records")
      .select("*")
      .eq("id", record.id)
      .single();
    if (error || !fullRecord) {
      toast.error("No se pudo obtener el expediente completo");
      return;
    }
    const doc = new jsPDF();
    doc.text("Expediente clínico", 14, 14);
    // Info del paciente
    autoTable(doc, {
      startY: 20,
      head: [["Campo", "Valor"]],
      body: [
        ["Expediente", patient.expediente],
        ["Nombre", patient.nombre],
        ["Sexo", patient.sexo ?? ""],
        ["Edad", patient.edad ?? ""],
        ["Estado civil", patient.estado_civil ?? ""],
        ["Ocupación", patient.ocupacion ?? ""],
        ["Creado", new Date(patient.created_at).toLocaleString()],
      ],
      styles: { fontSize: 11 },
      headStyles: { fillColor: [79, 70, 229] },
    });
    // Info clínica principal del expediente
    autoTable(doc, {
      startY: (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : 90,
      head: [["Sección", "Contenido"]],
      body: [
        ["Fecha creación consulta", new Date(fullRecord.created_at).toLocaleString()],
        ["Motivo de consulta", fullRecord.motivo_consulta ?? ""],
        ["Enfermedad actual", fullRecord.enfermedad_actual ?? ""],
        ["Antecedentes personales patológicos", [
          fullRecord.ap_diabetes ? "Diabetes" : "",
          fullRecord.ap_hta ? "HTA" : "",
          fullRecord.ap_cardiovascular ? "Cardiovascular" : "",
          fullRecord.ap_respiratoria ? "Respiratoria" : "",
          fullRecord.ap_renal ? "Renal" : "",
          fullRecord.ap_alergias ? `Alergias: ${fullRecord.ap_alergias}` : "",
          fullRecord.ap_otros ? `Otros: ${fullRecord.ap_otros}` : ""
        ].filter(Boolean).join(", ")],
        ["Antecedentes personales no patológicos", [
          fullRecord.anp_alimentacion ? `Alimentación: ${fullRecord.anp_alimentacion}` : "",
          fullRecord.anp_actividad_fisica ? `Actividad física: ${fullRecord.anp_actividad_fisica}` : "",
          fullRecord.anp_alcohol ? `Alcohol: ${fullRecord.anp_alcohol}` : "",
          fullRecord.anp_tabaco ? `Tabaco: ${fullRecord.anp_tabaco}` : "",
          fullRecord.anp_drogas ? `Drogas: ${fullRecord.anp_drogas}` : "",
          fullRecord.anp_vacunacion ? `Vacunación: ${fullRecord.anp_vacunacion}` : ""
        ].filter(Boolean).join(", ")],
        ["Gineco-obstétricos", [
          fullRecord.go_menarca ? `Menarca: ${fullRecord.go_menarca}` : "",
          fullRecord.go_fum ? `FUM: ${fullRecord.go_fum}` : "",
          fullRecord.go_ciclo ? `Ciclo: ${fullRecord.go_ciclo}` : "",
          fullRecord.go_embarazos ? `Embarazos: ${fullRecord.go_embarazos}` : "",
          fullRecord.go_partos ? `Partos: ${fullRecord.go_partos}` : "",
          fullRecord.go_cesareas ? `Cesáreas: ${fullRecord.go_cesareas}` : "",
          fullRecord.go_abortos ? `Abortos: ${fullRecord.go_abortos}` : ""
        ].filter(Boolean).join(", ")],
        ["Antecedentes familiares", [
          fullRecord.af_diabetes ? "Diabetes" : "",
          fullRecord.af_hta ? "HTA" : "",
          fullRecord.af_cancer ? "Cáncer" : "",
          fullRecord.af_hereditarias ? `Hereditarias: ${fullRecord.af_hereditarias}` : "",
          fullRecord.af_otros ? `Otros: ${fullRecord.af_otros}` : ""
        ].filter(Boolean).join(", ")],
        ["Revisión por sistemas", [
          fullRecord.rs_general ? `General: ${fullRecord.rs_general}` : "",
          fullRecord.rs_cardiovascular ? `Cardiovascular: ${fullRecord.rs_cardiovascular}` : "",
          fullRecord.rs_respiratorio ? `Respiratorio: ${fullRecord.rs_respiratorio}` : "",
          fullRecord.rs_digestivo ? `Digestivo: ${fullRecord.rs_digestivo}` : "",
          fullRecord.rs_genitourinario ? `Genitourinario: ${fullRecord.rs_genitourinario}` : "",
          fullRecord.rs_neurologico ? `Neurológico: ${fullRecord.rs_neurologico}` : "",
          fullRecord.rs_musculoesqueletico ? `Músculo-esquelético: ${fullRecord.rs_musculoesqueletico}` : ""
        ].filter(Boolean).join(", ")],
        ["Exploración física", [
          fullRecord.sv_ta ? `TA: ${fullRecord.sv_ta}` : "",
          fullRecord.sv_fc ? `FC: ${fullRecord.sv_fc}` : "",
          fullRecord.sv_fr ? `FR: ${fullRecord.sv_fr}` : "",
          fullRecord.sv_temp ? `Temp: ${fullRecord.sv_temp}` : "",
          fullRecord.sv_peso ? `Peso: ${fullRecord.sv_peso}` : "",
          fullRecord.sv_talla ? `Talla: ${fullRecord.sv_talla}` : "",
          fullRecord.sv_imc ? `IMC: ${fullRecord.sv_imc}` : "",
          fullRecord.ef_cabeza_cuello ? `Cabeza y cuello: ${fullRecord.ef_cabeza_cuello}` : "",
          fullRecord.ef_torax ? `Tórax: ${fullRecord.ef_torax}` : "",
          fullRecord.ef_abdomen ? `Abdomen: ${fullRecord.ef_abdomen}` : "",
          fullRecord.ef_extremidades ? `Extremidades: ${fullRecord.ef_extremidades}` : "",
          fullRecord.ef_neurologico ? `Neurológico: ${fullRecord.ef_neurologico}` : ""
        ].filter(Boolean).join(", ")],
        ["Resultados de estudios complementarios", fullRecord.estudios ?? ""],
        ["Diagnóstico(s)", fullRecord.diagnosticos ?? ""],
        ["Plan / Tratamiento", fullRecord.plan ?? ""],
        ["Observaciones", fullRecord.observaciones ?? ""],
      ],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [0, 0, 0] },
    });
    doc.save(`expediente_${patient.expediente}_${record.id}.pdf`);
  };

  // Descargar historial completo en PDF (una página por consulta)
  const exportAllRecordsPDF = async () => {
    if (!patient) return;
    const { data: allRecords, error } = await supabase
      .from("clinical_records")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });
    if (error || !allRecords || allRecords.length === 0) {
      toast.error("No hay consultas registradas para este paciente.");
      return;
    }
    const doc = new jsPDF();
    // Portada con info del paciente
    doc.text("Historial clínico completo", 14, 14);
    autoTable(doc, {
      startY: 20,
      head: [["Campo", "Valor"]],
      body: [
        ["Expediente", patient.expediente],
        ["Nombre", patient.nombre],
        ["Sexo", patient.sexo ?? ""],
        ["Edad", patient.edad ?? ""],
        ["Estado civil", patient.estado_civil ?? ""],
        ["Ocupación", patient.ocupacion ?? ""],
        ["Creado", new Date(patient.created_at).toLocaleString()],
      ],
      styles: { fontSize: 11 },
      headStyles: { fillColor: [0, 0, 0] },
    });
    // Cada consulta en una página nueva
    allRecords.forEach((fullRecord, idx) => {
      doc.addPage();
      doc.text(`Consulta #${allRecords.length - idx}`, 14, 14);
      autoTable(doc, {
        startY: 20,
        head: [["Sección", "Contenido"]],
        body: [
          ["Fecha creación consulta", new Date(fullRecord.created_at).toLocaleString()],
          ["Motivo de consulta", fullRecord.motivo_consulta ?? ""],
          ["Enfermedad actual", fullRecord.enfermedad_actual ?? ""],
          ["Antecedentes personales patológicos", [
            fullRecord.ap_diabetes ? "Diabetes" : "",
            fullRecord.ap_hta ? "HTA" : "",
            fullRecord.ap_cardiovascular ? "Cardiovascular" : "",
            fullRecord.ap_respiratoria ? "Respiratoria" : "",
            fullRecord.ap_renal ? "Renal" : "",
            fullRecord.ap_alergias ? `Alergias: ${fullRecord.ap_alergias}` : "",
            fullRecord.ap_otros ? `Otros: ${fullRecord.ap_otros}` : ""
          ].filter(Boolean).join(", ")],
          ["Antecedentes personales no patológicos", [
            fullRecord.anp_alimentacion ? `Alimentación: ${fullRecord.anp_alimentacion}` : "",
            fullRecord.anp_actividad_fisica ? `Actividad física: ${fullRecord.anp_actividad_fisica}` : "",
            fullRecord.anp_alcohol ? `Alcohol: ${fullRecord.anp_alcohol}` : "",
            fullRecord.anp_tabaco ? `Tabaco: ${fullRecord.anp_tabaco}` : "",
            fullRecord.anp_drogas ? `Drogas: ${fullRecord.anp_drogas}` : "",
            fullRecord.anp_vacunacion ? `Vacunación: ${fullRecord.anp_vacunacion}` : ""
          ].filter(Boolean).join(", ")],
          ["Gineco-obstétricos", [
            fullRecord.go_menarca ? `Menarca: ${fullRecord.go_menarca}` : "",
            fullRecord.go_fum ? `FUM: ${fullRecord.go_fum}` : "",
            fullRecord.go_ciclo ? `Ciclo: ${fullRecord.go_ciclo}` : "",
            fullRecord.go_embarazos ? `Embarazos: ${fullRecord.go_embarazos}` : "",
            fullRecord.go_partos ? `Partos: ${fullRecord.go_partos}` : "",
            fullRecord.go_cesareas ? `Cesáreas: ${fullRecord.go_cesareas}` : "",
            fullRecord.go_abortos ? `Abortos: ${fullRecord.go_abortos}` : ""
          ].filter(Boolean).join(", ")],
          ["Antecedentes familiares", [
            fullRecord.af_diabetes ? "Diabetes" : "",
            fullRecord.af_hta ? "HTA" : "",
            fullRecord.af_cancer ? "Cáncer" : "",
            fullRecord.af_hereditarias ? `Hereditarias: ${fullRecord.af_hereditarias}` : "",
            fullRecord.af_otros ? `Otros: ${fullRecord.af_otros}` : ""
          ].filter(Boolean).join(", ")],
          ["Revisión por sistemas", [
            fullRecord.rs_general ? `General: ${fullRecord.rs_general}` : "",
            fullRecord.rs_cardiovascular ? `Cardiovascular: ${fullRecord.rs_cardiovascular}` : "",
            fullRecord.rs_respiratorio ? `Respiratorio: ${fullRecord.rs_respiratorio}` : "",
            fullRecord.rs_digestivo ? `Digestivo: ${fullRecord.rs_digestivo}` : "",
            fullRecord.rs_genitourinario ? `Genitourinario: ${fullRecord.rs_genitourinario}` : "",
            fullRecord.rs_neurologico ? `Neurológico: ${fullRecord.rs_neurologico}` : "",
            fullRecord.rs_musculoesqueletico ? `Músculo-esquelético: ${fullRecord.rs_musculoesqueletico}` : ""
          ].filter(Boolean).join(", ")],
          ["Exploración física", [
            fullRecord.sv_ta ? `TA: ${fullRecord.sv_ta}` : "",
            fullRecord.sv_fc ? `FC: ${fullRecord.sv_fc}` : "",
            fullRecord.sv_fr ? `FR: ${fullRecord.sv_fr}` : "",
            fullRecord.sv_temp ? `Temp: ${fullRecord.sv_temp}` : "",
            fullRecord.sv_peso ? `Peso: ${fullRecord.sv_peso}` : "",
            fullRecord.sv_talla ? `Talla: ${fullRecord.sv_talla}` : "",
            fullRecord.sv_imc ? `IMC: ${fullRecord.sv_imc}` : "",
            fullRecord.ef_cabeza_cuello ? `Cabeza y cuello: ${fullRecord.ef_cabeza_cuello}` : "",
            fullRecord.ef_torax ? `Tórax: ${fullRecord.ef_torax}` : "",
            fullRecord.ef_abdomen ? `Abdomen: ${fullRecord.ef_abdomen}` : "",
            fullRecord.ef_extremidades ? `Extremidades: ${fullRecord.ef_extremidades}` : "",
            fullRecord.ef_neurologico ? `Neurológico: ${fullRecord.ef_neurologico}` : ""
          ].filter(Boolean).join(", ")],
          ["Resultados de estudios complementarios", fullRecord.estudios ?? ""],
          ["Diagnóstico(s)", fullRecord.diagnosticos ?? ""],
          ["Plan / Tratamiento", fullRecord.plan ?? ""],
          ["Observaciones", fullRecord.observaciones ?? ""],
        ],
        styles: { fontSize: 10 },
        headStyles: { fillColor: [0, 0, 0] },
      });
    });
    doc.save(`historial_${patient.expediente}.pdf`);
    toast.success("Historial médico completo descargado en PDF");
  };

  const patientInitials =
    patient?.nombre
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w: string) => w[0])
      .join("")
      .toUpperCase() || "P";

  return (
    <div className="space-y-6">
      {/* Botón Volver */}
      <div>
        <Link
          to="/patients"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <FaArrowLeft className="text-xs" />
          <span>Volver al directorio de pacientes</span>
        </Link>
      </div>

      {/* Ficha Principal del Paciente */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-600 to-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-md shadow-indigo-100 shrink-0">
            {patientInitials}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {patient ? patient.nombre : "Cargando paciente..."}
              </h1>
              {patient && (
                <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {patient.expediente}
                </span>
              )}
            </div>

            {patient && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-slate-500 mt-1">
                <span><b>Sexo:</b> {patient.sexo ?? "No especificado"}</span>
                <span>&bull;</span>
                <span><b>Edad:</b> {patient.edad != null ? `${patient.edad} años` : "—"}</span>
                {patient.estado_civil && (
                  <>
                    <span>&bull;</span>
                    <span><b>Estado civil:</b> {patient.estado_civil}</span>
                  </>
                )}
                {patient.ocupacion && (
                  <>
                    <span>&bull;</span>
                    <span><b>Ocupación:</b> {patient.ocupacion}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Acciones del Paciente */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={exportAllRecordsPDF}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Descargar historial clínico completo en PDF"
          >
            <FaFilePdf className="text-rose-600 text-sm" />
            <span>Descargar Historial</span>
          </button>

          <Link
            to={`/patients/${patientId}/records/new`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 shadow-md shadow-indigo-100 transition-all cursor-pointer active:scale-95"
          >
            <HiPlus className="text-base" />
            <span>Nueva Consulta</span>
          </Link>
        </div>
      </div>

      {/* Listado de Consultas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaNotesMedical className="text-indigo-600 text-lg" />
            <h2 className="text-lg font-bold text-slate-900">
              Consultas Registradas ({records?.length ?? 0})
            </h2>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Fecha y Hora</th>
                  <th className="py-3.5 px-4">Diagnóstico(s) Registrado(s)</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading && (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-slate-400">
                      <div className="inline-flex items-center gap-2 text-sm">
                        <span className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                        Cargando historial clínico...
                      </div>
                    </td>
                  </tr>
                )}

                {!isLoading && records && records.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-slate-400">
                      <div className="max-w-sm mx-auto space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto text-xl">
                          <FaCalendarCheck />
                        </div>
                        <p className="font-semibold text-slate-700 text-base">
                          Sin consultas previas
                        </p>
                        <p className="text-xs text-slate-400">
                          Este paciente aún no tiene ninguna consulta clínica registrada.
                        </p>
                        <div className="pt-2">
                          <Link
                            to={`/patients/${patientId}/records/new`}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-colors"
                          >
                            <HiPlus className="text-sm" />
                            <span>Crear Primera Consulta</span>
                          </Link>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}

                {records?.map((r, idx) => {
                  const dateFormatted = new Date(r.created_at).toLocaleString("es-MX", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-slate-900 font-medium">
                          <HiClock className="text-slate-400 text-base" />
                          <span>{dateFormatted}</span>
                          <span className="text-xs text-slate-400 font-mono">
                            (#{records.length - idx})
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {r.diagnosticos ? (
                          <div className="max-w-xl text-slate-700 text-sm line-clamp-2">
                            {r.diagnosticos}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            Sin diagnóstico documentado
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                        <Link
                          to={`/patients/${patientId}/records/${r.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 transition-colors"
                        >
                          <FaNotesMedical className="text-xs" />
                          <span>Ver / Editar</span>
                        </Link>

                        <button
                          onClick={() => exportRecordPDF(r)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 transition-colors cursor-pointer"
                          title="Descargar esta consulta en PDF"
                        >
                          <FaFilePdf className="text-xs" />
                          <span>PDF</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}