# Data Sources

## Overview

This project implements a deterministic clinical safety engine for medication interaction checking, allergy conflict detection, renal dosing validation, and clinical calculator support.

The current implementation uses manually curated seed data loaded into Supabase for deterministic safety checks.

The seed dataset is based primarily on the assessment specification and intentionally structured for rule-based evaluation rather than probabilistic AI reasoning.

---

# Current Implementation Data Sources

## 1. Drug Catalog (`drugs` table)

The medication catalog contains:

- generic medication names
- normalized lookup names
- therapeutic classes
- renal dosing rules

These entries were seeded manually based on:

- assessment-provided drug list
- standard prescribing knowledge
- clinically common renal dosing guidance

Examples:

- Metformin
- Gabapentin
- Clarithromycin
- Warfarin
- Spironolactone

Stored attributes:

```sql
generic_name
generic_name_normalized
drug_class
renal_dosing
```

Example:

```json
{
  "rules": [
    {
      "maxEGR": 30,
      "action": "contraindicated",
      "message": "eGFR < 30: contraindicated"
    }
  ]
}
```

---

## 2. Drug Interaction Rules (`drug_interactions` table)

The interaction database contains deterministic drug-drug interaction rules including:

- severity classification
- interaction mechanism
- clinical effect
- management recommendations

Examples:

- Clarithromycin + Atorvastatin
- Warfarin + Aspirin
- Fluoxetine + Tramadol
- Digoxin + Amiodarone
- Methotrexate + Co-trimoxazole

Stored attributes:

```sql
severity
mechanism
clinical_effect
management
```

Example:

```json
{
  "severity": "SEVERE",
  "mechanism": "CYP3A4 inhibition",
  "clinical_effect": "4-5x statin levels → rhabdomyolysis",
  "management": "Avoid clarithromycin or use azithromycin"
}
```

These rules were manually curated from assessment requirements and clinically common interaction knowledge.

---

## 3. Allergy Cross-Reactivity (`allergy_cross_reactivity` table)

Contains class-level allergy mappings.

Examples:

- Penicillin → Penicillin
- Penicillin → Cephalosporins
- Penicillin → Carbapenems
- Sulfonamide → Sulfonamide
- NSAID → NSAID

Stored attributes:

```sql
drug_class_a
drug_class_b
cross_reactivity_pct
clinical_guidance
```

Example:

```json
{
  "drug_class_a": "penicillin",
  "drug_class_b": "cephalosporin_1st",
  "cross_reactivity_pct": 1.5,
  "clinical_guidance": "Avoid if anaphylaxis"
}
```

These mappings were manually curated using standard clinical prescribing logic.

---

## 4. Patient Data (`patients` table)

Patient records are synthetic demonstration data.

No real patient Protected Health Information (PHI) is used.

Data includes:

- demographics
- allergies
- medications
- conditions
- labs
- summary context

Purpose:

- demo scenarios
- safety engine validation
- UI testing

---

## 5. Clinical Calculators

Implemented deterministic calculators:

### eGFR
CKD-EPI style renal function logic

Used for:

- renal dose safety checks

---

### CHA₂DS₂-VASc
Used for:

- atrial fibrillation stroke risk assessment

---

# Production Data Sources (Recommended)

For real-world deployment, manually curated seed data should be replaced with validated clinical data providers.

Recommended sources:

## Drug Naming / Standardization
- RxNorm
https://www.nlm.nih.gov/research/umls/rxnorm/index.html

---

## Drug Metadata / Pharmacology
- DrugBank
https://go.drugbank.com

---

## Clinical Interaction Databases
- Lexicomp
https://www.wolterskluwer.com/en/solutions/lexicomp

- Micromedex
https://www.ibm.com/products/micromedex

---

## Renal Dosing Guidance
- BNF
https://bnf.nice.org.uk

- KDIGO
https://kdigo.org/guidelines/

---

## Allergy / Cross-Reactivity Guidance
- CDC
https://www.cdc.gov/std/treatment-guidelines/penicillin-allergy.htm

- NICE
https://www.nice.org.uk/guidance

