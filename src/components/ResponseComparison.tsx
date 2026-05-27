import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function ResponseComparison({ generic, enhanced, loading }: { generic: string; enhanced: string; loading: boolean }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">AI response comparison</h2>
      {loading ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">Generating responses...</div>
      ) : (
        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <span className="rounded-full bg-red-100 px-2 py-1">Generic AI</span>
            </div>
            <div className="prose prose-sm max-w-none prose-slate prose-headings:text-slate-900prose-strong:text-red-700 prose-table:border prose-th:border prose-td:border prose-li:my-1">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
              >
                {generic || 'No response yet.'}
              </ReactMarkdown>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <span className="rounded-full bg-emerald-100 px-2 py-1">Safety-enhanced AI</span>
            </div>
            <div className="prose prose-sm max-w-none prose-slate prose-headings:text-slate-900prose-strong:text-red-700 prose-table:border prose-th:border prose-td:border prose-li:my-1">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
              >
                {enhanced || 'No response yet.'}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
