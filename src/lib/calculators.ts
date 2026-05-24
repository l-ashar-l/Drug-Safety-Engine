export function computeEgfr(age: number, sex: 'male' | 'female', scr: number): number {
  const kappa = sex === 'female' ? 0.7 : 0.9;
  const alpha = sex === 'female' ? -0.241 : -0.302;
  const multiplier = sex === 'female' ? 1.012 : 1.0;
  const scrK = scr / kappa;
  const minPart = Math.min(scrK, 1);
  const maxPart = Math.max(scrK, 1);
  const egfr =
    142 * Math.pow(minPart, alpha) * Math.pow(maxPart, -1.2) * Math.pow(0.9938, age) * multiplier;
  return Math.round(egfr * 10) / 10;
}

export function computeCha2ds2Vasc(data: {
  age: number;
  sex: 'male' | 'female';
  conditions: string[];
}): number {
  const { age, sex, conditions } = data;
  let score = 0;
  if (conditions.includes('hf')) score += 1;
  if (conditions.includes('htn')) score += 1;
  if (age >= 75) score += 2;
  else if (age >= 65) score += 1;
  if (conditions.includes('dm')) score += 1;
  if (conditions.includes('tia') || conditions.includes('stroke')) score += 2;
  if (conditions.includes('vascular')) score += 1;
  if (sex === 'female') score += 1;
  return score;
}
