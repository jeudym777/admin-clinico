export type Sexo = 'Femenino' | 'Masculino' | 'Otro';

export interface Patient {
  id: number;
  expediente: string;
  nombre: string;
  edad: number | null;
  sexo: Sexo | null;
  estado_civil: string | null;
  ocupacion: string | null;
  created_at: string;
}

export interface ClinicalRecord {
  id: number;
  patient_id: number;
  created_at: string;
  updated_by?: string | null;

  // 1. Motivo y Enfermedad actual
  motivo_consulta?: string;
  enfermedad_actual?: string;

  // 2. Antecedentes Personales Patológicos (AP)
  ap_diabetes: boolean;
  ap_hta: boolean;
  ap_cardiovascular: boolean;
  ap_respiratoria: boolean;
  ap_renal: boolean;
  ap_alergias?: string;
  ap_otros?: string;

  // 3. Antecedentes Personales No Patológicos (ANP)
  anp_alimentacion?: string;
  anp_actividad_fisica?: string;
  anp_alcohol?: string;
  anp_tabaco?: string;
  anp_drogas?: string;
  anp_vacunacion?: string;

  // 4. Gineco-Obstétricos (GO)
  go_menarca?: number | null;
  go_fum?: string | null;
  go_ciclo?: string | null;
  go_embarazos?: number | null;
  go_partos?: number | null;
  go_cesareas?: number | null;
  go_abortos?: number | null;

  // 5. Antecedentes Familiares (AF)
  af_diabetes: boolean;
  af_hta: boolean;
  af_cancer: boolean;
  af_hereditarias?: string;
  af_otros?: string;

  // 6. Revisión por Sistemas (RS)
  rs_general?: string;
  rs_cardiovascular?: string;
  rs_respiratorio?: string;
  rs_digestivo?: string;
  rs_genitourinario?: string;
  rs_neurologico?: string;
  rs_musculoesqueletico?: string;

  // 7. Signos Vitales (SV)
  sv_ta?: string;
  sv_fc?: string;
  sv_fr?: string;
  sv_temp?: string;
  sv_peso?: number | null;
  sv_talla?: number | null;
  sv_imc?: number | null;

  // 8. Exploración Física (EF)
  ef_cabeza_cuello?: string;
  ef_torax?: string;
  ef_abdomen?: string;
  ef_extremidades?: string;
  ef_neurologico?: string;

  // 9. Diagnósticos y Plan
  estudios?: string;
  diagnosticos?: string;
  plan?: string;
  observaciones?: string;
}
