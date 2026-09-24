import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/supabaseClient";
import { toast } from "react-toastify";
import { useSessionUser } from "@/hooks/useSessionUser";

/** Fila con etiqueta a la izquierda */
function Row({
  id,
  label,
  children,
  hint,
}: {
  id: string;
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-start sm:items-center gap-2 sm:gap-4 py-2 border-b border-slate-50 last:border-b-0">
      <label htmlFor={id} className="text-xs font-semibold text-slate-700 tracking-wide">
        {label}
      </label>
      <div>
        {children}
        {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
      </div>
    </div>
  );
}

export default function RecordForm() {
  const { id, recordId } = useParams();
  const patientId = Number(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const userId = useSessionUser();

  const isEdit = Boolean(recordId);

  const { data: patient } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patientId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(patientId),
  });

  const { data: initialData } = useQuery({
    queryKey: ["record", recordId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinical_records")
        .select("*")
        .eq("id", Number(recordId))
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: isEdit,
  });

  const [form, setForm] = useState<any>({
    motivo_consulta: "",
    enfermedad_actual: "",
    ap_diabetes: false,
    ap_hta: false,
    ap_cardiovascular: false,
    ap_respiratoria: false,
    ap_renal: false,
    ap_alergias: "",
    ap_otros: "",
    anp_alimentacion: "",
    anp_actividad_fisica: "",
    anp_alcohol: "",
    anp_tabaco: "",
    anp_drogas: "",
    anp_vacunacion: "",
    go_menarca: "",
    go_fum: "",
    go_ciclo: "",
    go_embarazos: "",
    go_partos: "",
    go_cesareas: "",
    go_abortos: "",
    af_diabetes: false,
    af_hta: false,
    af_cancer: false,
    af_hereditarias: "",
    af_otros: "",
    rs_general: "",
    rs_cardiovascular: "",
    rs_respiratorio: "",
    rs_digestivo: "",
    rs_genitourinario: "",
    rs_neurologico: "",
    rs_musculoesqueletico: "",
    sv_ta: "",
    sv_fc: "",
    sv_fr: "",
    sv_temp: "",
    sv_peso: "",
    sv_talla: "",
    sv_imc: "",
    ef_cabeza_cuello: "",
    ef_torax: "",
    ef_abdomen: "",
    ef_extremidades: "",
    ef_neurologico: "",
    estudios: "",
    diagnosticos: "",
    plan: "",
    observaciones: "",
  });

  useEffect(() => {
    if (initialData) setForm((f: any) => ({ ...f, ...initialData }));
  }, [initialData]);

  // helper para setear valores
  const set =
    (k: string) =>
    (
      e:
        | React.ChangeEvent<HTMLInputElement>
        | React.ChangeEvent<HTMLTextAreaElement>
        | React.ChangeEvent<HTMLSelectElement>
    ) => setForm((f: any) => ({ ...f, [k]: e.target.value }));

  // IMC = peso / talla^2
  useEffect(() => {
    const peso = parseFloat(form.sv_peso);
    const talla = parseFloat(form.sv_talla);
    if (!isNaN(peso) && !isNaN(talla) && talla > 0) {
      const imc = peso / (talla * talla);
      setForm((f: any) => ({ ...f, sv_imc: imc.toFixed(2) }));
    } else {
      setForm((f: any) => ({ ...f, sv_imc: "" }));
    }
  }, [form.sv_peso, form.sv_talla]);

  // normalización para guardar
  const numberFields = [
    "go_menarca",
    "go_embarazos",
    "go_partos",
    "go_cesareas",
    "go_abortos",
    "sv_peso",
    "sv_talla",
    "sv_imc",
  ] as const;
  const dateFields = ["go_fum"] as const;

  const upsert = useMutation({
    mutationFn: async () => {
      if (!patientId) throw new Error("Paciente inválido");

      const cleanForm = { ...form };
      delete cleanForm.id;
      delete cleanForm.created_at;
      const payload: any = {
        ...cleanForm,
        patient_id: patientId,
        updated_by: userId ?? null,
      };

      // números: "" o espacios -> null, texto inválido -> null, números válidos -> Number
      for (const k of numberFields) {
        const v = (form as any)[k];
        const strVal = typeof v === "string" ? v.trim() : v;
        if (strVal === "" || strVal === undefined || strVal === null) {
          payload[k] = null;
        } else {
          const num = Number(strVal);
          payload[k] = Number.isNaN(num) ? null : num;
        }
      }
      // fechas: "" -> null
      for (const k of dateFields) {
        const v = (form as any)[k];
        payload[k] = v ? v : null; // YYYY-MM-DD ok
      }

      if (isEdit) {
        const { error } = await supabase
          .from("clinical_records")
          .update(payload)
          .eq("id", Number(recordId));
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("clinical_records")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? "Consulta actualizada" : "Consulta creada");
      qc.invalidateQueries({ queryKey: ["records", patientId] });
      navigate(`/patients/${patientId}/records`);
    },
    onError: (e: any) => toast.error(e.message ?? "No se pudo guardar"),
  });

  const del = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("clinical_records")
        .delete()
        .eq("id", Number(recordId));
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Consulta eliminada");
      qc.invalidateQueries({ queryKey: ["records", patientId] });
      navigate(`/patients/${patientId}/records`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      {/* Banner con contexto del paciente */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-100 px-2.5 py-0.5 rounded-full">
            Consulta Médica
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            {patient ? patient.nombre : "Cargando paciente..."}
          </h2>
          {patient && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm text-slate-500 mt-1">
              <span><b>Expediente:</b> <span className="font-mono text-indigo-700 font-semibold">{patient.expediente}</span></span>
              <span>&bull;</span>
              <span><b>Sexo:</b> {patient.sexo ?? "No especificado"}</span>
              <span>&bull;</span>
              <span><b>Edad:</b> {patient.edad != null ? `${patient.edad} años` : "—"}</span>
              {patient.estado_civil && (
                <>
                  <span>&bull;</span>
                  <span><b>Estado civil:</b> {patient.estado_civil}</span>
                </>
              )}
            </div>
          )}
        </div>
        <Link
          to={`/patients/${patientId}/records`}
          className="text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors whitespace-nowrap shadow-xs"
        >
          &larr; Volver al Historial
        </Link>
      </div>

      {/* Barra de Acciones */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            {isEdit ? "Editar Consulta Clínica" : "Nueva Nota de Consulta"}
          </h1>
          <p className="text-xs text-slate-500">
            {isEdit ? "Modifica los campos clínicos y guarda los cambios" : "Completa las secciones del expediente clínico del paciente"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isEdit && (
            <button
              onClick={() => {
                if (confirm("¿Estás seguro de que deseas eliminar esta consulta?")) del.mutate();
              }}
              className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
            >
              Eliminar
            </button>
          )}
          <button
            onClick={() => upsert.mutate()}
            className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 shadow-md shadow-indigo-100 transition-all cursor-pointer disabled:opacity-50"
            disabled={upsert.isPending}
          >
            {upsert.isPending ? "Guardando…" : isEdit ? "Guardar Cambios" : "Crear Consulta"}
          </button>
        </div>
      </div>

      {/* Navegación rápida por secciones */}
      <div className="flex flex-wrap gap-2 text-xs">
        {[
          "1. Motivo & Enf.",
          "2. Antecedentes patológicos",
          "3. No patológicos",
          "4. Gineco-obs.",
          "5. Familiares",
          "6. Revisión sistemas",
          "7. Signos vitales & EF",
          "8. Dx & Plan",
          "9. Observaciones",
        ].map((s, i) => (
          <a
            key={i}
            href={`#s${i}`}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700 text-slate-600 font-medium rounded-xl transition-all shadow-2xs"
          >
            {s}
          </a>
        ))}
      </div>

      {/* 1 Motivo / Enfermedad actual */}
      <section id="s0" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
          1. Motivo de Consulta y Enfermedad Actual
        </h2>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Motivo de Consulta
          </label>
          <textarea
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
            rows={3}
            placeholder="Describa el motivo por el cual acude el paciente..."
            value={form.motivo_consulta}
            onChange={set("motivo_consulta")}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Enfermedad Actual
          </label>
          <textarea
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
            rows={4}
            placeholder="Evolución del cuadro clínico, síntomas asociados, tiempo de evolución..."
            value={form.enfermedad_actual}
            onChange={set("enfermedad_actual")}
          />
        </div>
      </section>

      {/* 2 Antecedentes personales patológicos */}
      <section id="s1" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
          2. Antecedentes Personales Patológicos (AP)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
          {(
            [
              ["ap_diabetes", "Diabetes"],
              ["ap_hta", "HTA"],
              ["ap_cardiovascular", "Cardiovascular"],
              ["ap_respiratoria", "Respiratoria"],
              ["ap_renal", "Renal"],
            ] as const
          ).map(([k, label]) => (
            <label key={k} className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                checked={form[k]}
                onChange={(e) =>
                  setForm((f: any) => ({ ...f, [k]: e.target.checked }))
                }
              />
              {label}
            </label>
          ))}
        </div>
        <Row id="ap_alergias" label="Alergias" hint="Medicamentos, alimentos, etc.">
          <input
            id="ap_alergias"
            className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
            placeholder="Alergias conocidas o 'Negadas'"
            value={form.ap_alergias}
            onChange={set("ap_alergias")}
          />
        </Row>
        <Row id="ap_otros" label="Otros Antecedentes">
          <input
            id="ap_otros"
            className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
            placeholder="Cirugías previas, traumatismos, transfusiones..."
            value={form.ap_otros}
            onChange={set("ap_otros")}
          />
        </Row>
      </section>

      {/* 3 No patológicos */}
      <section id="s2" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
          3. Antecedentes Personales No Patológicos (ANP)
        </h2>

        <Row id="anp_alimentacion" label="Alimentación">
          <input
            id="anp_alimentacion"
            className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
            placeholder="Adecuada / Inadecuada, frecuencia..."
            value={form.anp_alimentacion}
            onChange={set("anp_alimentacion")}
          />
        </Row>

        <Row id="anp_actividad_fisica" label="Actividad Física">
          <input
            id="anp_actividad_fisica"
            className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
            placeholder="Sedentario / Activo, frecuencia semanal..."
            value={form.anp_actividad_fisica}
            onChange={set("anp_actividad_fisica")}
          />
        </Row>

        <Row id="anp_alcohol" label="Consumo de Alcohol">
          <input
            id="anp_alcohol"
            className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
            placeholder="Ocasional, social, negado..."
            value={form.anp_alcohol}
            onChange={set("anp_alcohol")}
          />
        </Row>

        <Row id="anp_tabaco" label="Tabaquismo">
          <input
            id="anp_tabaco"
            className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
            placeholder="Cigarrillos/día o negado..."
            value={form.anp_tabaco}
            onChange={set("anp_tabaco")}
          />
        </Row>

        <Row id="anp_drogas" label="Otras Sustancias">
          <input
            id="anp_drogas"
            className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
            placeholder="Negadas o especificar..."
            value={form.anp_drogas}
            onChange={set("anp_drogas")}
          />
        </Row>

        <Row id="anp_vacunacion" label="Inmunizaciones / Vacunas">
          <input
            id="anp_vacunacion"
            className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
            placeholder="Esquema completo, COVID, Influenza..."
            value={form.anp_vacunacion}
            onChange={set("anp_vacunacion")}
          />
        </Row>
      </section>

      {/* 4 Gineco-obstétricos */}
      <section id="s3" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">
            4. Gineco-Obstétricos (GO)
          </h2>
          {patient?.sexo === "Masculino" && (
            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
              No aplica / Opcional para paciente masculino
            </span>
          )}
        </div>

        <Row id="go_menarca" label="Menarca (Edad)">
          <input
            id="go_menarca"
            type="number"
            className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
            placeholder="Años"
            value={form.go_menarca ?? ""}
            onChange={set("go_menarca")}
          />
        </Row>

        <Row id="go_fum" label="FUM (Última Regla)">
          <input
            id="go_fum"
            type="date"
            className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
            value={form.go_fum ?? ""}
            onChange={set("go_fum")}
          />
        </Row>

        <Row id="go_ciclo" label="Ciclo Menstrual">
          <input
            id="go_ciclo"
            className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
            placeholder="Regular (28x4) / Irregular..."
            value={form.go_ciclo ?? ""}
            onChange={set("go_ciclo")}
          />
        </Row>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Embarazos (G)</label>
            <input
              id="go_embarazos"
              type="number"
              min={0}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
              value={form.go_embarazos ?? ""}
              onChange={set("go_embarazos")}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Partos (P)</label>
            <input
              id="go_partos"
              type="number"
              min={0}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
              value={form.go_partos ?? ""}
              onChange={set("go_partos")}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Cesáreas (C)</label>
            <input
              id="go_cesareas"
              type="number"
              min={0}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
              value={form.go_cesareas ?? ""}
              onChange={set("go_cesareas")}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Abortos (A)</label>
            <input
              id="go_abortos"
              type="number"
              min={0}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
              value={form.go_abortos ?? ""}
              onChange={set("go_abortos")}
            />
          </div>
        </div>
      </section>

      {/* 5 Familiares */}
      <section id="s4" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
          5. Antecedentes Heredofamiliares (AF)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
          {(
            [
              ["af_diabetes", "Diabetes"],
              ["af_hta", "HTA"],
              ["af_cancer", "Cáncer"],
            ] as const
          ).map(([k, label]) => (
            <label key={k} className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                checked={form[k]}
                onChange={(e) =>
                  setForm((f: any) => ({ ...f, [k]: e.target.checked }))
                }
              />
              {label}
            </label>
          ))}
        </div>
        <Row id="af_hereditarias" label="Enf. Hereditarias">
          <input
            id="af_hereditarias"
            className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
            placeholder="Cardiopatías, nefropatías, asma..."
            value={form.af_hereditarias}
            onChange={set("af_hereditarias")}
          />
        </Row>
        <Row id="af_otros" label="Otros Familiares">
          <input
            id="af_otros"
            className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden"
            placeholder="Otros antecedentes familiares..."
            value={form.af_otros}
            onChange={set("af_otros")}
          />
        </Row>
      </section>

      {/* 6 Revisión por sistemas */}
      <section id="s5" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="pb-2 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">
            6. Revisión por Aparatos y Sistemas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Interrogatorio por aparatos y sistemas clínicos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="rs_general" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Síntomas Generales
            </label>
            <textarea
              id="rs_general"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden resize-y"
              rows={2}
              placeholder="Astenia, adinamia, cambios de peso, fiebre..."
              value={form.rs_general}
              onChange={set("rs_general")}
            />
          </div>

          <div>
            <label htmlFor="rs_cardiovascular" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Cardiovascular
            </label>
            <textarea
              id="rs_cardiovascular"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden resize-y"
              rows={2}
              placeholder="Disnea, palpitaciones, dolor precordial, edemas..."
              value={form.rs_cardiovascular}
              onChange={set("rs_cardiovascular")}
            />
          </div>

          <div>
            <label htmlFor="rs_respiratorio" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Respiratorio
            </label>
            <textarea
              id="rs_respiratorio"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden resize-y"
              rows={2}
              placeholder="Tos, expectoración, disnea, sibilancias..."
              value={form.rs_respiratorio}
              onChange={set("rs_respiratorio")}
            />
          </div>

          <div>
            <label htmlFor="rs_digestivo" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Digestivo
            </label>
            <textarea
              id="rs_digestivo"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden resize-y"
              rows={2}
              placeholder="Disfagia, pirosis, náuseas, dolor abdominal, hábito intestinal..."
              value={form.rs_digestivo}
              onChange={set("rs_digestivo")}
            />
          </div>

          <div>
            <label htmlFor="rs_genitourinario" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Genitourinario
            </label>
            <textarea
              id="rs_genitourinario"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden resize-y"
              rows={2}
              placeholder="Disuria, polaquiuria, hematuria, tenesmo..."
              value={form.rs_genitourinario}
              onChange={set("rs_genitourinario")}
            />
          </div>

          <div>
            <label htmlFor="rs_neurologico" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Neurológico
            </label>
            <textarea
              id="rs_neurologico"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden resize-y"
              rows={2}
              placeholder="Cefalea, mareos, parestesias, convulsiones, alteraciones del sueño..."
              value={form.rs_neurologico}
              onChange={set("rs_neurologico")}
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="rs_musculoesqueletico" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Músculo-Esquelético
            </label>
            <textarea
              id="rs_musculoesqueletico"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden resize-y"
              rows={2}
              placeholder="Artralgias, mialgias, rigidez articular, limitaciones funcionales..."
              value={form.rs_musculoesqueletico}
              onChange={set("rs_musculoesqueletico")}
            />
          </div>
        </div>
      </section>

      {/* 7 Signos vitales y Exploración física */}
      <section id="s6" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              7. Signos Vitales y Exploración Física
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Somatometría, constantes vitales y examen físico segmentario
            </p>
          </div>
          {form.sv_imc && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-xs font-semibold text-emerald-800">IMC:</span>
              <span className="text-sm font-bold text-emerald-700">{form.sv_imc} kg/m²</span>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Constantes Vitales y Somatometría
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
              <label htmlFor="sv_ta" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                TA (mmHg)
              </label>
              <input
                id="sv_ta"
                className="w-full px-2.5 py-1.5 text-sm font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-hidden"
                placeholder="120/80"
                value={form.sv_ta ?? ""}
                onChange={set("sv_ta")}
              />
            </div>

            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
              <label htmlFor="sv_fc" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                FC (lpm)
              </label>
              <input
                id="sv_fc"
                className="w-full px-2.5 py-1.5 text-sm font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-hidden"
                placeholder="75"
                value={form.sv_fc ?? ""}
                onChange={set("sv_fc")}
              />
            </div>

            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
              <label htmlFor="sv_fr" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                FR (rpm)
              </label>
              <input
                id="sv_fr"
                className="w-full px-2.5 py-1.5 text-sm font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-hidden"
                placeholder="16"
                value={form.sv_fr ?? ""}
                onChange={set("sv_fr")}
              />
            </div>

            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
              <label htmlFor="sv_temp" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Temp (°C)
              </label>
              <input
                id="sv_temp"
                className="w-full px-2.5 py-1.5 text-sm font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-hidden"
                placeholder="36.5"
                value={form.sv_temp ?? ""}
                onChange={set("sv_temp")}
              />
            </div>

            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
              <label htmlFor="sv_peso" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Peso (kg)
              </label>
              <input
                id="sv_peso"
                type="number"
                step="0.01"
                className="w-full px-2.5 py-1.5 text-sm font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-hidden"
                placeholder="70"
                value={form.sv_peso ?? ""}
                onChange={set("sv_peso")}
              />
            </div>

            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
              <label htmlFor="sv_talla" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Talla (m)
              </label>
              <input
                id="sv_talla"
                type="number"
                step="0.01"
                className="w-full px-2.5 py-1.5 text-sm font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-hidden"
                placeholder="1.70"
                value={form.sv_talla ?? ""}
                onChange={set("sv_talla")}
              />
            </div>

            <div className="col-span-2 sm:col-span-3 lg:col-span-1 bg-indigo-50/60 p-3 rounded-xl border border-indigo-100">
              <label htmlFor="sv_imc" className="block text-[11px] font-bold uppercase tracking-wider text-indigo-700 mb-1">
                IMC (kg/m²)
              </label>
              <input
                id="sv_imc"
                className="w-full px-2.5 py-1.5 text-sm font-bold text-indigo-900 bg-white/80 border border-indigo-200 rounded-lg outline-hidden cursor-not-allowed"
                placeholder="Auto"
                value={form.sv_imc ?? ""}
                readOnly
              />
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Examen Físico Segmentario
          </h3>

          <div className="space-y-3">
            <Row id="ef_cabeza_cuello" label="Cabeza y Cuello">
              <textarea
                id="ef_cabeza_cuello"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden resize-y"
                rows={2}
                placeholder="Normocéfalo, pupilas isocóricas reactivas, mucosa oral húmeda, cuello sin adenopatías..."
                value={form.ef_cabeza_cuello}
                onChange={set("ef_cabeza_cuello")}
              />
            </Row>

            <Row id="ef_torax" label="Tórax">
              <textarea
                id="ef_torax"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden resize-y"
                rows={2}
                placeholder="Movimientos respiratorios simétricos, ruidos respiratorios normales, ruidos cardíacos rítmicos sin soplos..."
                value={form.ef_torax}
                onChange={set("ef_torax")}
              />
            </Row>

            <Row id="ef_abdomen" label="Abdomen">
              <textarea
                id="ef_abdomen"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden resize-y"
                rows={2}
                placeholder="Blando, depresible, no doloroso a la palpación profunda, RHA normales, sin visceromegalias ni signos de irritación peritoneal..."
                value={form.ef_abdomen}
                onChange={set("ef_abdomen")}
              />
            </Row>

            <Row id="ef_extremidades" label="Extremidades">
              <textarea
                id="ef_extremidades"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden resize-y"
                rows={2}
                placeholder="Simétricas, arcos de movilidad completos, pulsos distales presentes y simétricos, sin edemas periféricos..."
                value={form.ef_extremidades}
                onChange={set("ef_extremidades")}
              />
            </Row>

            <Row id="ef_neurologico" label="Neurológico">
              <textarea
                id="ef_neurologico"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden resize-y"
                rows={2}
                placeholder="Alerta, orientado en las 3 esferas, lenguaje coherente, sensibilidad y fuerza muscular 5/5..."
                value={form.ef_neurologico}
                onChange={set("ef_neurologico")}
              />
            </Row>
          </div>
        </div>
      </section>

      {/* 8 Dx, Estudios y Plan */}
      <section id="s7" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="pb-2 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">
            8. Diagnóstico y Plan Terapéutico
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Estudios paraclínicos, juicios diagnósticos y manejo integral
          </p>
        </div>

        <div>
          <label htmlFor="estudios" className="block text-xs font-semibold text-slate-700 mb-1.5">
            Resultados de Estudios Complementarios / Laboratorio / Imagen
          </label>
          <textarea
            id="estudios"
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden resize-y"
            rows={3}
            placeholder="Biometría hemática, química sanguínea, radiografía de tórax, ecografía abdominal..."
            value={form.estudios}
            onChange={set("estudios")}
          />
        </div>

        <div>
          <label htmlFor="diagnosticos" className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
            <span>Diagnóstico(s) Presuntivo(s) o Definitivo(s)</span>
            <span className="text-[11px] font-normal text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">CIE-10 o Juicio Clínico</span>
          </label>
          <textarea
            id="diagnosticos"
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-indigo-200/80 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden resize-y"
            rows={3}
            placeholder="1. Faringoamigdalitis aguda bacteriana&#10;2. Hipertensión arterial sistémica..."
            value={form.diagnosticos}
            onChange={set("diagnosticos")}
          />
        </div>

        <div>
          <label htmlFor="plan" className="block text-xs font-semibold text-slate-700 mb-1.5">
            Plan de Manejo / Prescripción Médica / Tratamiento
          </label>
          <textarea
            id="plan"
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden resize-y font-mono text-[13px]"
            rows={4}
            placeholder="Rp:&#10;1. Amoxicilina + Ácido Clavulánico 875/125mg VO c/12h por 7 días&#10;2. Paracetamol 500mg VO c/8h por 3 días si dolor/fiebre&#10;3. Abundante hidratación y reposo relativo"
            value={form.plan}
            onChange={set("plan")}
          />
        </div>
      </section>

      {/* 9 Observaciones */}
      <section id="s8" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="pb-2 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">
            9. Observaciones y Recomendaciones
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Notas de evolución, señales de alarma informadas al paciente o cita de control
          </p>
        </div>

        <textarea
          id="observaciones"
          className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-hidden resize-y"
          rows={3}
          placeholder="Se explican signos de alarma por los que acudir a urgencias. Paciente comprende indicaciones. Cita de control programada..."
          value={form.observaciones}
          onChange={set("observaciones")}
        />

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Link
            to={`/patients/${patientId}/records`}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
          >
            Cancelar
          </Link>
          <button
            onClick={() => upsert.mutate()}
            className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 shadow-md shadow-indigo-100 transition-all cursor-pointer disabled:opacity-50"
            disabled={upsert.isPending}
          >
            {upsert.isPending ? "Guardando…" : isEdit ? "Guardar Cambios" : "Crear Consulta"}
          </button>
        </div>
      </section>
    </div>
  );
}
