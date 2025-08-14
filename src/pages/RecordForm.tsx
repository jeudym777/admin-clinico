import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
    <div className="grid grid-cols-[180px_1fr] items-center gap-3">
      <label htmlFor={id} className="text-sm text-gray-700">
        {label}
      </label>
      <div>
        {children}
        {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
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

      const payload: any = {
        ...form,
        patient_id: patientId,
        updated_by: userId ?? null,
      };

      // números: "" -> null, "12" -> 12
      for (const k of numberFields) {
        const v = (form as any)[k];
        payload[k] = v === "" || v === undefined ? null : Number(v);
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
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {isEdit ? "Editar consulta" : "Nueva consulta"}
        </h1>
        <div className="flex gap-2">
          {isEdit && (
            <button
              onClick={() => {
                if (confirm("¿Eliminar esta consulta?")) del.mutate();
              }}
              className="px-4 py-2 rounded border border-red-600 text-red-600"
            >
              Eliminar
            </button>
          )}
          <button
            onClick={() => upsert.mutate()}
            className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
            disabled={upsert.isPending}
          >
            {upsert.isPending ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>

      {/* Navegación simple por secciones */}
      <div className="flex flex-wrap gap-2 text-sm">
        {[
          "Motivo & Enfermedad",
          "Antecedentes pers.",
          "No patológicos",
          "Gineco-obs.",
          "Familiares",
          "Revisión sistemas",
          "Exploración física",
          "Dx & Plan",
          "Observaciones",
        ].map((s, i) => (
          <a key={i} href={`#s${i}`} className="px-2 py-1 border rounded">
            {s}
          </a>
        ))}
      </div>

      {/* 1 Motivo / Enfermedad actual */}
      <section id="s0" className="border rounded p-4 space-y-3">
        <h2 className="font-medium">1. Motivo de consulta</h2>
        <textarea
          className="border p-2 rounded w-full"
          rows={3}
          value={form.motivo_consulta}
          onChange={set("motivo_consulta")}
        />
        <h2 className="font-medium">2. Enfermedad actual</h2>
        <textarea
          className="border p-2 rounded w-full"
          rows={5}
          value={form.enfermedad_actual}
          onChange={set("enfermedad_actual")}
        />
      </section>

      {/* 3 Antecedentes personales patológicos */}
      <section id="s1" className="border rounded p-4 space-y-3">
        <h2 className="font-medium">3. Antecedentes personales patológicos</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {(
            [
              ["ap_diabetes", "Diabetes"],
              ["ap_hta", "HTA"],
              ["ap_cardiovascular", "Cardiovascular"],
              ["ap_respiratoria", "Respiratoria"],
              ["ap_renal", "Renal"],
            ] as const
          ).map(([k, label]) => (
            <label key={k} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form[k]}
                onChange={(e) =>
                  setForm((f: any) => ({ ...f, [k]: e.target.checked }))
                }
              />{" "}
              {label}
            </label>
          ))}
        </div>
        <Row id="ap_alergias" label="Alergias">
          <input
            id="ap_alergias"
            className="border p-2 rounded w-full"
            value={form.ap_alergias}
            onChange={set("ap_alergias")}
          />
        </Row>
        <Row id="ap_otros" label="Otros">
          <input
            id="ap_otros"
            className="border p-2 rounded w-full"
            value={form.ap_otros}
            onChange={set("ap_otros")}
          />
        </Row>
      </section>

      {/* 4 No patológicos */}
      <section id="s2" className="border rounded p-4 space-y-3">
        <h2 className="font-medium">4. Antecedentes personales no patológicos</h2>

        <Row id="anp_alimentacion" label="Alimentación">
          <input
            id="anp_alimentacion"
            className="border p-2 rounded w-full"
            value={form.anp_alimentacion}
            onChange={set("anp_alimentacion")}
          />
        </Row>

        <Row id="anp_actividad_fisica" label="Actividad física">
          <input
            id="anp_actividad_fisica"
            className="border p-2 rounded w-full"
            value={form.anp_actividad_fisica}
            onChange={set("anp_actividad_fisica")}
          />
        </Row>

        <Row id="anp_alcohol" label="Alcohol">
          <input
            id="anp_alcohol"
            className="border p-2 rounded w-full"
            value={form.anp_alcohol}
            onChange={set("anp_alcohol")}
          />
        </Row>

        <Row id="anp_tabaco" label="Tabaco">
          <input
            id="anp_tabaco"
            className="border p-2 rounded w-full"
            value={form.anp_tabaco}
            onChange={set("anp_tabaco")}
          />
        </Row>

        <Row id="anp_drogas" label="Drogas">
          <input
            id="anp_drogas"
            className="border p-2 rounded w-full"
            value={form.anp_drogas}
            onChange={set("anp_drogas")}
          />
        </Row>

        <Row id="anp_vacunacion" label="Vacunación">
          <input
            id="anp_vacunacion"
            className="border p-2 rounded w-full"
            value={form.anp_vacunacion}
            onChange={set("anp_vacunacion")}
          />
        </Row>
      </section>

      {/* 5 Gineco-obstétricos */}
      <section id="s3" className="border rounded p-4 space-y-3">
        <h2 className="font-medium">5. Gineco-obstétricos</h2>

        <Row id="go_menarca" label="Menarca (años)">
          <input
            id="go_menarca"
            type="number"
            className="border p-2 rounded w-full"
            value={form.go_menarca ?? ""}
            onChange={set("go_menarca")}
          />
        </Row>

        <Row id="go_fum" label="FUM">
          <input
            id="go_fum"
            type="date"
            className="border p-2 rounded w-full"
            value={form.go_fum ?? ""}
            onChange={set("go_fum")}
          />
        </Row>

        <Row id="go_ciclo" label="Ciclo">
          <input
            id="go_ciclo"
            className="border p-2 rounded w-full"
            placeholder="Regular / Irregular"
            value={form.go_ciclo ?? ""}
            onChange={set("go_ciclo")}
          />
        </Row>

        <Row id="go_embarazos" label="Embarazos">
          <input
            id="go_embarazos"
            type="number"
            className="border p-2 rounded w-full"
            value={form.go_embarazos ?? ""}
            onChange={set("go_embarazos")}
          />
        </Row>

        <Row id="go_partos" label="Partos">
          <input
            id="go_partos"
            type="number"
            className="border p-2 rounded w-full"
            value={form.go_partos ?? ""}
            onChange={set("go_partos")}
          />
        </Row>

        <Row id="go_cesareas" label="Cesáreas">
          <input
            id="go_cesareas"
            type="number"
            className="border p-2 rounded w-full"
            value={form.go_cesareas ?? ""}
            onChange={set("go_cesareas")}
          />
        </Row>

        <Row id="go_abortos" label="Abortos">
          <input
            id="go_abortos"
            type="number"
            className="border p-2 rounded w-full"
            value={form.go_abortos ?? ""}
            onChange={set("go_abortos")}
          />
        </Row>
      </section>

      {/* 6 Familiares */}
      <section id="s4" className="border rounded p-4 space-y-3">
        <h2 className="font-medium">6. Antecedentes familiares</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {(
            [
              ["af_diabetes", "Diabetes"],
              ["af_hta", "HTA"],
              ["af_cancer", "Cáncer"],
            ] as const
          ).map(([k, label]) => (
            <label key={k} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form[k]}
                onChange={(e) =>
                  setForm((f: any) => ({ ...f, [k]: e.target.checked }))
                }
              />{" "}
              {label}
            </label>
          ))}
        </div>
        <Row id="af_hereditarias" label="Hereditarias">
          <input
            id="af_hereditarias"
            className="border p-2 rounded w-full"
            value={form.af_hereditarias}
            onChange={set("af_hereditarias")}
          />
        </Row>
        <Row id="af_otros" label="Otros">
          <input
            id="af_otros"
            className="border p-2 rounded w-full"
            value={form.af_otros}
            onChange={set("af_otros")}
          />
        </Row>
      </section>

      {/* 7 Revisión por sistemas */}
      <section id="s5" className="border rounded p-4 space-y-3">
        <h2 className="font-medium">7. Revisión por aparatos y sistemas</h2>

        <Row id="rs_general" label="General">
          <textarea
            id="rs_general"
            className="border p-2 rounded w-full"
            rows={2}
            value={form.rs_general}
            onChange={set("rs_general")}
          />
        </Row>

        <Row id="rs_cardiovascular" label="Cardiovascular">
          <textarea
            id="rs_cardiovascular"
            className="border p-2 rounded w-full"
            rows={2}
            value={form.rs_cardiovascular}
            onChange={set("rs_cardiovascular")}
          />
        </Row>

        <Row id="rs_respiratorio" label="Respiratorio">
          <textarea
            id="rs_respiratorio"
            className="border p-2 rounded w-full"
            rows={2}
            value={form.rs_respiratorio}
            onChange={set("rs_respiratorio")}
          />
        </Row>

        <Row id="rs_digestivo" label="Digestivo">
          <textarea
            id="rs_digestivo"
            className="border p-2 rounded w-full"
            rows={2}
            value={form.rs_digestivo}
            onChange={set("rs_digestivo")}
          />
        </Row>

        <Row id="rs_genitourinario" label="Genitourinario">
          <textarea
            id="rs_genitourinario"
            className="border p-2 rounded w-full"
            rows={2}
            value={form.rs_genitourinario}
            onChange={set("rs_genitourinario")}
          />
        </Row>

        <Row id="rs_neurologico" label="Neurológico">
          <textarea
            id="rs_neurologico"
            className="border p-2 rounded w-full"
            rows={2}
            value={form.rs_neurologico}
            onChange={set("rs_neurologico")}
          />
        </Row>

        <Row id="rs_musculoesqueletico" label="Músculo-esquelético">
          <textarea
            id="rs_musculoesqueletico"
            className="border p-2 rounded w-full"
            rows={2}
            value={form.rs_musculoesqueletico}
            onChange={set("rs_musculoesqueletico")}
          />
        </Row>
      </section>

      {/* 8 Exploración física */}
      <section id="s6" className="border rounded p-4 space-y-3">
        <h2 className="font-medium">8. Exploración física</h2>

        <Row id="sv_ta" label="TA (mmHg)">
          <input
            id="sv_ta"
            className="border p-2 rounded w-full"
            value={form.sv_ta ?? ""}
            onChange={set("sv_ta")}
          />
        </Row>

        <Row id="sv_fc" label="FC (lpm)">
          <input
            id="sv_fc"
            className="border p-2 rounded w-full"
            value={form.sv_fc ?? ""}
            onChange={set("sv_fc")}
          />
        </Row>

        <Row id="sv_fr" label="FR (rpm)">
          <input
            id="sv_fr"
            className="border p-2 rounded w-full"
            value={form.sv_fr ?? ""}
            onChange={set("sv_fr")}
          />
        </Row>

        <Row id="sv_temp" label="Temp (°C)">
          <input
            id="sv_temp"
            className="border p-2 rounded w-full"
            value={form.sv_temp ?? ""}
            onChange={set("sv_temp")}
          />
        </Row>

        <Row id="sv_peso" label="Peso (kg)">
          <input
            id="sv_peso"
            type="number"
            step="0.01"
            className="border p-2 rounded w-full"
            value={form.sv_peso ?? ""}
            onChange={set("sv_peso")}
          />
        </Row>

        <Row id="sv_talla" label="Talla (m)">
          <input
            id="sv_talla"
            type="number"
            step="0.01"
            className="border p-2 rounded w-full"
            value={form.sv_talla ?? ""}
            onChange={set("sv_talla")}
          />
        </Row>

        <Row id="sv_imc" label="IMC (kg/m²)" hint="Se calcula automáticamente">
          <input
            id="sv_imc"
            className="border p-2 rounded w-full"
            value={form.sv_imc ?? ""}
            onChange={set("sv_imc")}
            readOnly
          />
        </Row>

        <Row id="ef_cabeza_cuello" label="Cabeza y cuello">
          <textarea
            id="ef_cabeza_cuello"
            className="border p-2 rounded w-full"
            rows={2}
            value={form.ef_cabeza_cuello}
            onChange={set("ef_cabeza_cuello")}
          />
        </Row>

        <Row id="ef_torax" label="Tórax">
          <textarea
            id="ef_torax"
            className="border p-2 rounded w-full"
            rows={2}
            value={form.ef_torax}
            onChange={set("ef_torax")}
          />
        </Row>

        <Row id="ef_abdomen" label="Abdomen">
          <textarea
            id="ef_abdomen"
            className="border p-2 rounded w-full"
            rows={2}
            value={form.ef_abdomen}
            onChange={set("ef_abdomen")}
          />
        </Row>

        <Row id="ef_extremidades" label="Extremidades">
          <textarea
            id="ef_extremidades"
            className="border p-2 rounded w-full"
            rows={2}
            value={form.ef_extremidades}
            onChange={set("ef_extremidades")}
          />
        </Row>

        <Row id="ef_neurologico" label="Neurológico">
          <textarea
            id="ef_neurologico"
            className="border p-2 rounded w-full"
            rows={2}
            value={form.ef_neurologico}
            onChange={set("ef_neurologico")}
          />
        </Row>
      </section>

      {/* 9-12 Dx, plan, observaciones */}
      <section id="s7" className="border rounded p-4 space-y-3">
        <h2 className="font-medium">9. Resultados de estudios complementarios</h2>
        <textarea
          className="border p-2 rounded w-full"
          rows={3}
          value={form.estudios}
          onChange={set("estudios")}
        />

        <h2 className="font-medium">
          10. Diagnóstico(s) presuntivo(s) o definitivo(s)
        </h2>
        <textarea
          className="border p-2 rounded w-full"
          rows={3}
          value={form.diagnosticos}
          onChange={set("diagnosticos")}
        />

        <h2 className="font-medium">11. Plan / Tratamiento</h2>
        <textarea
          className="border p-2 rounded w-full"
          rows={3}
          value={form.plan}
          onChange={set("plan")}
        />
      </section>

      <section id="s8" className="border rounded p-4">
        <h2 className="font-medium">12. Observaciones</h2>
        <textarea
          className="border p-2 rounded w-full"
          rows={3}
          value={form.observaciones}
          onChange={set("observaciones")}
        />
      </section>
    </div>
  );
}
