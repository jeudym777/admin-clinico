import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/supabaseClient";
import { toast } from "react-toastify";
import { useSessionUser } from "@/hooks/useSessionUser";

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

  // IMC = peso / talla^2
  useEffect(() => {
    const peso = parseFloat(form.sv_peso);
    const talla = parseFloat(form.sv_talla);
    if (!isNaN(peso) && !isNaN(talla) && talla > 0) {
      const imc = peso / (talla * talla);
      setForm((f: any) => ({ ...f, sv_imc: imc.toFixed(2) }));
    }
  }, [form.sv_peso, form.sv_talla]);

  const upsert = useMutation({
    mutationFn: async () => {
      if (!patientId) throw new Error("Paciente inválido");
      const payload = {
        ...form,
        sv_peso: form.sv_peso ? Number(form.sv_peso) : null,
        sv_talla: form.sv_talla ? Number(form.sv_talla) : null,
        sv_imc: form.sv_imc ? Number(form.sv_imc) : null,
        patient_id: patientId,
        updated_by: userId ?? null,
      };
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
    onError: (e: any) => toast.error(e.message),
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
        <h1 className="text-2xl font-semibold">{isEdit ? "Editar consulta" : "Nueva consulta"}</h1>
        <div className="flex gap-2">
          {isEdit && (
            <button onClick={() => del.mutate()} className="px-4 py-2 rounded border border-red-600 text-red-600">Eliminar</button>
          )}
          <button onClick={() => upsert.mutate()} className="px-4 py-2 rounded bg-black text-white">
            {upsert.isPending ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>

      {/* Navegación simple por secciones */}
      <div className="flex flex-wrap gap-2 text-sm">
        {[
          "Motivo & Enfermedad", "Antecedentes pers.", "No patológicos", "Gineco-obs.",
          "Familiares", "Revisión sistemas", "Exploración física", "Dx & Plan", "Observaciones"
        ].map((s, i) => (
          <a key={i} href={`#s${i}`} className="px-2 py-1 border rounded">{s}</a>
        ))}
      </div>

      {/* 1 Motivo / Enfermedad actual */}
      <section id="s0" className="border rounded p-4 space-y-3">
        <h2 className="font-medium">1. Motivo de consulta</h2>
        <textarea className="border p-2 rounded w-full" rows={3} value={form.motivo_consulta} onChange={e=>setForm((f:any)=>({...f, motivo_consulta:e.target.value}))} />
        <h2 className="font-medium">2. Enfermedad actual</h2>
        <textarea className="border p-2 rounded w-full" rows={5} value={form.enfermedad_actual} onChange={e=>setForm((f:any)=>({...f, enfermedad_actual:e.target.value}))} />
      </section>

      {/* 3 Antecedentes personales patológicos */}
      <section id="s1" className="border rounded p-4 space-y-3">
        <h2 className="font-medium">3. Antecedentes personales patológicos</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {([
            ["ap_diabetes","Diabetes"], ["ap_hta","HTA"], ["ap_cardiovascular","Cardiovascular"],
            ["ap_respiratoria","Respiratoria"], ["ap_renal","Renal"]
          ] as const).map(([k,label]) => (
            <label key={k} className="flex items-center gap-2">
              <input type="checkbox" checked={form[k]} onChange={e=>setForm((f:any)=>({...f,[k]:e.target.checked}))} /> {label}
            </label>
          ))}
        </div>
        <input className="border p-2 rounded w-full" placeholder="Alergias" value={form.ap_alergias} onChange={e=>setForm((f:any)=>({...f, ap_alergias:e.target.value}))} />
        <input className="border p-2 rounded w-full" placeholder="Otros" value={form.ap_otros} onChange={e=>setForm((f:any)=>({...f, ap_otros:e.target.value}))} />
      </section>

      {/* 4 No patológicos */}
      <section id="s2" className="border rounded p-4 grid gap-3">
        <h2 className="font-medium">4. Antecedentes personales no patológicos</h2>
        {([
          ["anp_alimentacion","Alimentación"], ["anp_actividad_fisica","Actividad física"],
          ["anp_alcohol","Alcohol"], ["anp_tabaco","Tabaco"], ["anp_drogas","Drogas"], ["anp_vacunacion","Vacunación"]
        ] as const).map(([k, label]) => (
          <input key={k} className="border p-2 rounded w-full" placeholder={label} value={form[k]} onChange={e=>setForm((f:any)=>({...f, [k]:e.target.value}))} />
        ))}
      </section>

      {/* 5 Gineco-obstétricos */}
      <section id="s3" className="border rounded p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <h2 className="font-medium col-span-full">5. Gineco-obstétricos</h2>
        {([
          ["go_menarca","Menarca (años)", "number"], ["go_fum","FUM", "date"], ["go_ciclo","Ciclo (Regular/Irregular)", "text"],
          ["go_embarazos","Embarazos","number"], ["go_partos","Partos","number"], ["go_cesareas","Cesáreas","number"], ["go_abortos","Abortos","number"],
        ] as const).map(([k, label, type]) => (
          <input key={k} className="border p-2 rounded" placeholder={label} type={type} value={form[k] ?? ""} onChange={e=>setForm((f:any)=>({...f, [k]:e.target.value}))} />
        ))}
      </section>

      {/* 6 Familiares */}
      <section id="s4" className="border rounded p-4 space-y-3">
        <h2 className="font-medium">6. Antecedentes familiares</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {([
            ["af_diabetes","Diabetes"], ["af_hta","HTA"], ["af_cancer","Cáncer"]
          ] as const).map(([k,label]) => (
            <label key={k} className="flex items-center gap-2">
              <input type="checkbox" checked={form[k]} onChange={e=>setForm((f:any)=>({...f,[k]:e.target.checked}))} /> {label}
            </label>
          ))}
        </div>
        <input className="border p-2 rounded w-full" placeholder="Hereditarias" value={form.af_hereditarias} onChange={e=>setForm((f:any)=>({...f, af_hereditarias:e.target.value}))} />
        <input className="border p-2 rounded w-full" placeholder="Otros" value={form.af_otros} onChange={e=>setForm((f:any)=>({...f, af_otros:e.target.value}))} />
      </section>

      {/* 7 Revisión por sistemas */}
      <section id="s5" className="border rounded p-4 grid gap-3">
        <h2 className="font-medium">7. Revisión por aparatos y sistemas</h2>
        {([
          ["rs_general","General"], ["rs_cardiovascular","Cardiovascular"], ["rs_respiratorio","Respiratorio"],
          ["rs_digestivo","Digestivo"], ["rs_genitourinario","Genitourinario"], ["rs_neurologico","Neurológico"], ["rs_musculoesqueletico","Músculo-esquelético"],
        ] as const).map(([k, label]) => (
          <textarea key={k} className="border p-2 rounded w-full" rows={2} placeholder={label} value={form[k]} onChange={e=>setForm((f:any)=>({...f, [k]:e.target.value}))} />
        ))}
      </section>

      {/* 8 Exploración física */}
      <section id="s6" className="border rounded p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <h2 className="font-medium col-span-full">8. Exploración física</h2>
        {([
          ["sv_ta","TA (mmHg)"], ["sv_fc","FC (lpm)"], ["sv_fr","FR (rpm)"], ["sv_temp","Temp (°C)"],
          ["sv_peso","Peso (kg)"], ["sv_talla","Talla (m)"], ["sv_imc","IMC (kg/m²)"]
        ] as const).map(([k, label]) => (
          <input key={k} className="border p-2 rounded" placeholder={label} value={form[k] ?? ""} onChange={e=>setForm((f:any)=>({...f, [k]:e.target.value}))} />
        ))}
        <textarea className="border p-2 rounded col-span-full" rows={2} placeholder="Cabeza y cuello" value={form.ef_cabeza_cuello} onChange={e=>setForm((f:any)=>({...f, ef_cabeza_cuello:e.target.value}))} />
        <textarea className="border p-2 rounded col-span-full" rows={2} placeholder="Tórax" value={form.ef_torax} onChange={e=>setForm((f:any)=>({...f, ef_torax:e.target.value}))} />
        <textarea className="border p-2 rounded col-span-full" rows={2} placeholder="Abdomen" value={form.ef_abdomen} onChange={e=>setForm((f:any)=>({...f, ef_abdomen:e.target.value}))} />
        <textarea className="border p-2 rounded col-span-full" rows={2} placeholder="Extremidades" value={form.ef_extremidades} onChange={e=>setForm((f:any)=>({...f, ef_extremidades:e.target.value}))} />
        <textarea className="border p-2 rounded col-span-full" rows={2} placeholder="Neurológico" value={form.ef_neurologico} onChange={e=>setForm((f:any)=>({...f, ef_neurologico:e.target.value}))} />
      </section>



      
      {/* 9-12 Dx, plan, observaciones */}
      <section id="s7" className="border rounded p-4 grid gap-3">
       <h2 className="font-medium">9. Resultados de estudios complementarios </h2>
        <textarea className="border p-2 rounded w-full" rows={3} value={form.estudios} onChange={e=>setForm((f:any)=>({...f, estudios:e.target.value}))} />
        
        
        <h2 className="font-medium">10. Diagnóstico(s) presuntivo(s) o definitivo(s) </h2>
        <textarea className="border p-2 rounded w-full" rows={3} value={form.diagnosticos} onChange={e=>setForm((f:any)=>({...f, diagnosticos:e.target.value}))} />
        
        <h2 className="font-medium">11. Plan / Tratamiento</h2>
        <textarea className="border p-2 rounded w-full" rows={3} value={form.plan} onChange={e=>setForm((f:any)=>({...f, plan:e.target.value}))} />
      </section>

      <section id="s8" className="border rounded p-4">
        <h2 className="font-medium">12. Observaciones</h2>
        <textarea className="border p-2 rounded w-full" rows={3} value={form.observaciones} onChange={e=>setForm((f:any)=>({...f, observaciones:e.target.value}))} />
      </section>
    </div>
  );
}