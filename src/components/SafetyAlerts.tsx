import type { SafetyFinding } from '../lib/types';

export function SafetyAlerts({ findings, egfr, cha2ds2vasc }: { findings: SafetyFinding[]; egfr: number; cha2ds2vasc: number }) {
  const sorted = [...findings].sort((a, b) => b.importance - a.importance);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Safety alerts</h2>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{findings.length} alerts</div>
      </div>
      <div className="mt-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-3 text-sm">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">eGFR</div>
            <div className="mt-1 font-medium text-slate-900">{egfr} mL/min/1.73m²</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3 text-sm">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">CHA₂DS₂-VASc</div>
            <div className="mt-1 font-medium text-slate-900">{cha2ds2vasc}</div>
          </div>
        </div>
        {sorted.length ? (
          <div className="space-y-3">
            {sorted.map((finding) => (
              <div key={`${finding.title}-${finding.severity}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{finding.title}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">{finding.source}</div>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{finding.severity}</span>
                </div>
                <p className="mt-3 text-sm text-slate-700">{finding.detail}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">No deterministic alerts detected for this proposed drug and patient combination.</div>
        )}
      </div>
    </div>
  );
}
