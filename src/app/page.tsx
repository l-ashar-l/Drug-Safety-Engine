'use client';

import { useEffect, useMemo, useState } from 'react';
import { PatientCard } from '../components/PatientCard';
import { SafetyAlerts } from '../components/SafetyAlerts';
import { ResponseComparison } from '../components/ResponseComparison';
import type { Patient, SafetyResults } from '../lib/types';

export default function HomePage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [proposedDrug, setProposedDrug] = useState('Clarithromycin');
  const [question, setQuestion] = useState('Can I add Clarithromycin 500mg for pneumonia?');
  const [safetyResults, setSafetyResults] = useState<SafetyResults | null>(null);
  const [genericResponse, setGenericResponse] = useState('');
  const [enhancedResponse, setEnhancedResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPatients = async () => {
      setError('');

      try {
        const response = await fetch('/api/patients');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Unable to load patients from the database.');
        }

        setPatients(data);
        if (data.length > 0) {
          setSelectedPatientId(String(data[0].id));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load patients.');
      }
    };

    loadPatients();
  }, []);

  const patient = useMemo(
    () => patients.find((item) => String(item.id) === selectedPatientId) ?? patients[0] ?? null,
    [patients, selectedPatientId],
  );

  const patientSummary = useMemo(() => {
    if (!patient) {
      return 'Loading patient...';
    }

    return `${patient.summary}\nMedications: ${patient.medications.join(', ')}\nAllergies: ${patient.allergies.length ? patient.allergies.join(', ') : 'NKDA'}\nLabs: ${Object.entries(patient.labs)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ')}`;
  }, [patient]);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    setGenericResponse('');
    setEnhancedResponse('');
    setSafetyResults(null);

    try {
      const safetyRes = await fetch('/api/safety-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposedDrug,
          currentMeds: patient?.medications ?? [],
          allergies: patient?.allergies ?? [],
          patient,
        }),
      });
      const safetyData = await safetyRes.json();
      if (!safetyRes.ok) {
        setError(safetyData.error || 'Safety check failed.');
        return;
      }
      setSafetyResults(safetyData);

      const renderAI = async (mode: 'generic' | 'enhanced') => {
        const response = await fetch('/api/claude', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question,
            patientSummary,
            safetyText: mode === 'enhanced' ? safetyData.alertText : undefined,
            mode,
          }),
        });
        const data = await response.json();
        return data.response ?? data.error ?? 'No response received.';
      };

      const [generic, enhanced] = await Promise.all([renderAI('generic'), renderAI('enhanced')]);
      setGenericResponse(generic);
      setEnhancedResponse(enhanced);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Drug Safety Engine</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Make AI safe for doctors</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
                Deterministic drug interaction, allergy, and renal dosing checks run before the AI responds. Compare generic versus safety-enhanced output side-by-side.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Patient selector</h2>
              <div className="mt-4 space-y-3">
                <label className="block text-sm font-medium text-slate-700">Select patient</label>
                <select
                  value={selectedPatientId}
                  onChange={(event) => setSelectedPatientId(event.target.value)}
                  disabled={patients.length === 0}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="" disabled>
                    {patients.length ? 'Select patient' : 'Loading patients...'}
                  </option>
                  {patients.map((option) => (
                    <option key={option.id} value={String(option.id)}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {patient ? (
              <PatientCard patient={patient} />
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
                Loading patient data from the database...
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Simulation</h2>
              <div className="mt-4 grid gap-4">
                <label className="block text-sm font-medium text-slate-700">Proposed drug</label>
                <input
                  type="text"
                  value={proposedDrug}
                  onChange={(event) => setProposedDrug(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-500"
                />
                <label className="block text-sm font-medium text-slate-700">Doctor question</label>
                <textarea
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-500"
                />
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !patient}
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  Run safety check
                </button>
                {error ? <p className="text-sm text-rose-600">{error}</p> : null}
              </div>
            </div>

            {safetyResults ? (
              <SafetyAlerts
                findings={safetyResults.findings}
                egfr={safetyResults.egfr}
                cha2ds2vasc={safetyResults.cha2ds2vasc}
              />
            ) : null}
          </div>
        </section>

        <ResponseComparison generic={genericResponse} enhanced={enhancedResponse} loading={loading} />

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">How it works</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            The system uses Supabase-driven drug and interaction tables, deterministic renal dosing rules, and allergy cross-reactivity. It computes eGFR and CHA₂DS₂-VASc, then injects safety constraints into the AI prompt for the enhanced response.
          </p>
        </section>
      </div>
    </main>
  );
}
