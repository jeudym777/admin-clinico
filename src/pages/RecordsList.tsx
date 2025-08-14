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
      alert("No se pudo obtener el expediente completo");
      return;
    }
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
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
      headStyles: { fillColor: [0, 0, 0] },
    });
    // Info clínica principal del expediente
    autoTable(doc, {
      startY: 110, // más espacio entre tablas
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
      alert("No se pudo obtener el historial completo");
      return;
    }
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
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
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Historial clínico</h1>
          {patient && <p className="text-sm text-gray-600">Paciente: <b>{patient.nombre}</b> · Expediente: {patient.expediente}</p>}
        </div>
        <Link to={`/patients/${patientId}/records/new`} className="px-4 py-2 rounded bg-black text-white">Nueva consulta</Link>
      </div>
      <div className="my-4 flex gap-2">
        <button
          className="px-4 py-2 rounded bg-green-700 text-white"
          onClick={exportAllRecordsPDF}
        >
          Descargar historial completo
        </button>
        <Link
          to="/patients"
          className="px-4 py-2 rounded bg-gray-700 text-white"
        >
          Volver a pacientes
        </Link>
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
                  <button
                    className="text-green-600 underline ml-2"
                    onClick={() => exportRecordPDF(r)}
                  >
                    Descargar PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}