create extension if not exists "pgcrypto";

create table if not exists patients (
  id serial primary key,
  name text not null,
  age integer not null,
  sex text not null check (sex in ('male', 'female')),
  weight_kg numeric,
  conditions jsonb not null default '[]',
  allergies jsonb not null default '[]',
  medications jsonb not null default '[]',
  labs jsonb not null default '{}',
  summary text not null
);

create table if not exists drugs (
  id uuid primary key default gen_random_uuid(),
  generic_name text not null,
  generic_name_normalized text not null,
  drug_class text not null,
  renal_dosing jsonb
);

create table if not exists drug_interactions (
  id uuid primary key default gen_random_uuid(),
  drug_a_id uuid not null references drugs(id),
  drug_b_id uuid not null references drugs(id),
  severity text not null check (severity in ('CONTRAINDICATED', 'SEVERE', 'MODERATE', 'MINOR')),
  mechanism text not null,
  clinical_effect text not null,
  management text not null
);

create table if not exists allergy_cross_reactivity (
  id uuid primary key default gen_random_uuid(),
  drug_class_a text not null,
  drug_class_b text not null,
  cross_reactivity_pct numeric(5,2) not null,
  clinical_guidance text not null
);
