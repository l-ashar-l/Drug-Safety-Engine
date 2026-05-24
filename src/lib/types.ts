export type RenalRule = {
  minEGR?: number;
  maxEGR?: number;
  action: string;
  message: string;
};

export type Drug = {
  id: string;
  generic_name: string;
  generic_name_normalized: string;
  drug_class: string;
  renal_dosing: { rules: RenalRule[] };
};

export type DrugInteraction = {
  id: string;
  drug_a_id: string;
  drug_b_id: string;
  severity: 'SEVERE' | 'MODERATE' | 'MINOR' | 'CONTRAINDICATED';
  mechanism: string;
  clinical_effect: string;
  management: string;
};

export type AllergyCrossReactivity = {
  id: string;
  drug_class_a: string;
  drug_class_b: string;
  cross_reactivity_pct: number | string;
  clinical_guidance: string;
};

export type Patient = {
  id: number;
  name: string;
  age: number;
  sex: 'male' | 'female';
  weightKg?: number;
  conditions: string[];
  allergies: string[];
  medications: string[];
  labs: Record<string, string | number>;
  summary: string;
};

export type SafetyFinding = {
  type: 'HARD_BLOCK' | 'WARNING' | 'INFO';
  title: string;
  detail: string;
  severity: string;
  source: 'interaction' | 'allergy' | 'renal' | 'calculator';
  importance: number;
};

export type SafetyResults = {
  findings: SafetyFinding[];
  egfr: number;
  cha2ds2vasc: number;
  alertText: string;
};
