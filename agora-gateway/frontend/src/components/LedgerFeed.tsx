import { CheckCircle2, XCircle, ExternalLink, Activity } from 'lucide-react';

export function LedgerFeed({ entries }: { entries: any[] }) {
  return (
    <div className="glass-panel rounded-2xl flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
        <h3 className="font-semibold text-slate-200 flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400" />
          Agent Audit Ledger
        </h3>
        <span className="text-xs font-mono text-slate-400 bg-slate-800/50 px-2 py-1 rounded">
          {entries.length} EVENTS
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {entries.length === 0 ? (
          <div className="text-center text-slate-500 py-10 text-sm">
            Waiting for agent actions...
          </div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50 transition-all hover:bg-slate-800/50">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  {entry.policy_check_status === 'PASS' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400" />
                  )}
                  <span className="font-mono text-xs text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    {entry.tool_name}
                  </span>
                  {entry.merchant_id && (
                    <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                      {entry.merchant_id}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
              </div>
              
              <p className="text-sm text-slate-300 mb-3">{entry.intent_rationale}</p>
              
              {entry.details && (
                <pre className="text-[10px] font-mono text-slate-400 bg-slate-950 p-2 rounded-lg overflow-x-auto border border-slate-800 mb-3">
                  {JSON.stringify(entry.details, null, 2)}
                </pre>
              )}

              {entry.razorpay_payment_link && (
                <div className="mt-2 pt-3 border-t border-slate-800">
                  <a 
                    href={entry.razorpay_payment_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-900 bg-emerald-400 hover:bg-emerald-300 px-3 py-1.5 rounded-lg transition-colors shadow-[0_0_15px_rgba(52,211,153,0.3)]"
                  >
                    Pay Now <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
