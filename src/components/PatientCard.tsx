import type { Patient } from '../lib/types';

export function PatientCard({ patient }: { patient: Patient }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">{patient.name}</h2>
      <p className="mt-2 text-sm text-slate-600">{patient.summary}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Medications</div>
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
            {patient.medications.map((med) => (
              <li key={med}>{med}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Allergies</div>
          <p className="mt-2 text-sm text-slate-700">{patient.allergies.length ? patient.allergies.join(', ') : 'NKDA'}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {Object.entries(patient.labs).map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-slate-50 p-3 text-sm">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{label}</div>
            <div className="mt-1 font-medium text-slate-900">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
