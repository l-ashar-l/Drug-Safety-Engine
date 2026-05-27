import { getSupabaseClient } from './supabase';
import type { AllergyCrossReactivity, Drug, DrugInteraction, Patient, SafetyFinding, SafetyResults } from './types';
import { computeCha2ds2Vasc, computeEgfr } from './calculators';

const normalizeText = (value: string) => value.trim().toLowerCase();

const iconForSeverity = (severity: string): string => {
  if (severity === 'SEVERE' || severity === 'CONTRAINDICATED') return '⛔';
  if (severity === 'MODERATE') return '⚠️';
  return 'ℹ️';
};

const importanceForSeverity = (severity: string): number => {
  if (severity === 'CONTRAINDICATED') return 10;
  if (severity === 'SEVERE') return 9;
  if (severity === 'MODERATE') return 6;
  return 3;
};

const normalizeDrugName = (name: string) => name.trim().toLowerCase();

export async function fetchDrugsByNames(names: string[]): Promise<Drug[]> {
  const supabase = getSupabaseClient();
  const normalized = names.map(normalizeDrugName);
  const { data, error } = await supabase
    .from('drugs')
    .select('*')
    .in('generic_name_normalized', normalized) as { data: Drug[] | null; error: any };

  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function fetchDrugByName(name: string): Promise<Drug | null> {
  const supabase = getSupabaseClient();
  const normalized = normalizeDrugName(name);
  const { data, error } = (await supabase
    .from('drugs')
    .select('*')
    .eq('generic_name_normalized', normalized)
    .limit(1)
    .maybeSingle()) as { data: Drug | null; error: any };

  if (error) {
    throw new Error(error.message);
  }
  return data ?? null;
}

export async function fetchCrossReactivity(): Promise<AllergyCrossReactivity[]> {
  const supabase = getSupabaseClient();
  const { data, error } = (await supabase.from('allergy_cross_reactivity').select('*')) as { data: AllergyCrossReactivity[] | null; error: any };
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function fetchInteractionsForDrugPair(drugAId: string, drugBId: string): Promise<DrugInteraction[]> {
  const supabase = getSupabaseClient();
  const { data, error } = (await supabase
    .from('drug_interactions')
    .select('*')
    .or(`and(drug_a_id.eq.${drugAId},drug_b_id.eq.${drugBId}),and(drug_a_id.eq.${drugBId},drug_b_id.eq.${drugAId}))`)) as { data: DrugInteraction[] | null; error: any };

  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

export function computeSafetyFromInteractions(
  allInteractions: DrugInteraction[],
  drugMap: Record<string, Drug>,
): SafetyFinding[] {
  return allInteractions.map((interaction) => {
    const drugA = drugMap[interaction.drug_a_id];
    const drugB = drugMap[interaction.drug_b_id];
    const title = `${drugA?.generic_name || 'Drug A'} + ${drugB?.generic_name || 'Drug B'}`;
    const icon = iconForSeverity(interaction.severity);
    const importance = importanceForSeverity(interaction.severity);
    const type = interaction.severity === 'CONTRAINDICATED'
      ? 'HARD_BLOCK'
      : interaction.severity === 'SEVERE'
      ? 'WARNING'
      : 'INFO';
    return {
      type,
      title,
      detail: `${icon} ${interaction.severity}: ${interaction.mechanism} → ${interaction.clinical_effect}. ${interaction.management}`,
      severity: interaction.severity,
      source: 'interaction',
      importance,
    };
  });
}

export function computeSafetyFromRenal(drug: Drug | null, egfr: number): SafetyFinding[] {
  if (!drug) return [];
  const findings: SafetyFinding[] = [];
  for (const rule of drug.renal_dosing.rules) {
    const minOk = rule.minEGR === undefined || egfr >= rule.minEGR;
    const maxOk = rule.maxEGR === undefined || egfr < rule.maxEGR;
    if (minOk && maxOk) {
      const severity = rule.action === 'avoid' || rule.action === 'contraindicated' ? 'SEVERE' : 'MINOR';
      const icon = iconForSeverity(severity);
      findings.push({
        type: rule.action === 'avoid' || rule.action === 'contraindicated' ? 'HARD_BLOCK' : 'WARNING',
        title: `${drug.generic_name} renal dosing`,
        detail: `${icon} ${rule.message}`,
        severity,
        source: 'renal',
        importance: rule.action === 'avoid' ? 10 : 5,
      });
    }
  }
  return findings;
}

export function computeSafetyFromAllergies(
  drug: Drug | null,
  allergies: string[],
  crossReactivity: AllergyCrossReactivity[],
): SafetyFinding[] {
  if (!drug) return [];
  const findings: SafetyFinding[] = [];
  const drugNameNorm = normalizeDrugName(drug.generic_name);
  const drugClassNorm = normalizeDrugName(drug.drug_class);

  for (const allergy of allergies) {
    const allergyNorm = normalizeDrugName(allergy);
    if (allergyNorm === drugNameNorm || allergyNorm === drugClassNorm) {
      findings.push({
        type: 'HARD_BLOCK',
        title: `${drug.generic_name} allergy conflict`,
        detail: `⛔ HARD BLOCK: documented allergy to ${allergy}. Do not prescribe ${drug.generic_name}.`,
        severity: 'CONTRAINDICATED',
        source: 'allergy',
        importance: 10,
      });
      continue;
    }

    const matches = crossReactivity.filter((entry) => normalizeText(entry.drug_class_a) === allergyNorm);
    for (const match of matches) {
      if (
        normalizeText(match.drug_class_b) === drugClassNorm ||
        normalizeText(match.drug_class_b) === drugNameNorm ||
        drugNameNorm.includes(normalizeText(match.drug_class_b))
      ) {
        const pctValue = Number(String(match.cross_reactivity_pct).replace('%', ''));
        const isHighRisk = !Number.isNaN(pctValue) && pctValue >= 100;
        const pctLabel = typeof match.cross_reactivity_pct === 'number'
          ? `${match.cross_reactivity_pct}%`
          : match.cross_reactivity_pct.endsWith('%')
          ? match.cross_reactivity_pct
          : `${match.cross_reactivity_pct}%`;
        findings.push({
          type: isHighRisk ? 'HARD_BLOCK' : 'WARNING',
          title: `${drug.generic_name} cross-reactivity`,
          detail: `${isHighRisk ? '⛔' : '⚠️'} ${pctLabel} cross-reactivity with ${allergy}. ${match.clinical_guidance}`,
          severity: isHighRisk ? 'SEVERE' : 'MODERATE',
          source: 'allergy',
          importance: isHighRisk ? 9 : 6,
        });
      }
    }
  }

  return findings;
}

export function buildConstraintText(results: SafetyResults): string {
  const hardBlocks = results.findings.filter((finding) => finding.type === 'HARD_BLOCK');
  const warnings = results.findings.filter((finding) => finding.type !== 'HARD_BLOCK');
  const lines = ['Safety constraints for this patient:'];

  if (hardBlocks.length > 0) {
    lines.push('HARD BLOCKS (mandatory):');
    lines.push(...hardBlocks.map((finding) => `- ${finding.detail}`));
  }

  if (warnings.length > 0) {
    lines.push('WARNINGS:');
    lines.push(...warnings.map((finding) => `- ${finding.detail}`));
  }

  lines.push(`Computed eGFR: ${results.egfr} mL/min/1.73m²`);
  lines.push(`Computed CHA₂DS₂-VASc: ${results.cha2ds2vasc}`);
  lines.push('Do not violate any HARD BLOCKS. Treat HARD BLOCKS as required clinical rules.');
  lines.push('If a proposed therapy conflicts with a HARD BLOCK, explicitly refuse and recommend a safer alternative if available.');
  return lines.join('\n');
}

function buildDrugPairs(drugs: Drug[]): Array<[Drug, Drug]> {
  const pairs: Array<[Drug, Drug]> = [];
  for (let i = 0; i < drugs.length; i += 1) {
    for (let j = i + 1; j < drugs.length; j += 1) {
      pairs.push([drugs[i], drugs[j]]);
    }
  }
  return pairs;
}

export async function runSafetyCheck(input: {
  proposedDrug: string;
  currentMeds: string[];
  allergies: string[];
  patient: Patient;
}): Promise<SafetyResults> {
  const { proposedDrug, currentMeds, allergies, patient } = input;
  const egfr = computeEgfr(patient.age, patient.sex, Number(patient.labs.creatinine ?? 0));
  const cha2ds2vasc = computeCha2ds2Vasc({ age: patient.age, sex: patient.sex, conditions: patient.conditions });
  const allDrugNames = [...new Set([proposedDrug, ...currentMeds].map((name) => normalizeDrugName(name)))];
  const drugs = await fetchDrugsByNames(allDrugNames);
  const drugMapByName = Object.fromEntries(drugs.map((drug) => [drug.generic_name_normalized, drug]));
  const drugMapById = Object.fromEntries(drugs.map((drug) => [drug.id, drug]));
  const missing = allDrugNames.filter((name) => !drugMapByName[name]);
  const findings: SafetyFinding[] = [];

  if (missing.length > 0) {
    findings.push({
      type: 'INFO',
      title: 'Unknown drug',
      detail: `ℹ️ Could not find ${missing.join(', ')} in the drug database. Review manually.`,
      severity: 'MINOR',
      source: 'interaction',
      importance: 2,
    });
  }

  const proposed = drugMapByName[normalizeDrugName(proposedDrug)] || null;
  const currentDrugEntries = currentMeds
    .map((name) => drugMapByName[normalizeDrugName(name)])
    .filter(Boolean) as Drug[];

  const crossReactivity = await fetchCrossReactivity();

  if (proposed) {
    findings.push(...computeSafetyFromRenal(proposed, egfr));
    findings.push(...computeSafetyFromAllergies(proposed, allergies, crossReactivity));
  }

  const interactionPairs: Array<[Drug, Drug]> = [];
  if (proposed) {
    for (const drug of currentDrugEntries) {
      interactionPairs.push([proposed, drug]);
    }
  }
  interactionPairs.push(...buildDrugPairs(currentDrugEntries));

  const interactionResults = (
    await Promise.all(
      interactionPairs.map(([drugA, drugB]) => fetchInteractionsForDrugPair(drugA.id, drugB.id)),
    )
  ).flat();

  const uniqueInteractions = Array.from(new Map(interactionResults.map((interaction) => [interaction.id, interaction])).values());
  findings.push(...computeSafetyFromInteractions(uniqueInteractions, drugMapById));

  const alertText = buildConstraintText({ findings, egfr, cha2ds2vasc, alertText: '' });
  return { findings, egfr, cha2ds2vasc, alertText };
}
