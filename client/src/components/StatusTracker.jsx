import { useState, useEffect } from 'react';
import { Search, Loader2, CheckCircle2, Clock, UserCheck, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { getReportStatus } from '../utils/api';
import { connectSocket, joinReportRoom } from '../utils/socket';
import toast from 'react-hot-toast';

const STEPS = ['Submitted', 'Assigned', 'In Progress', 'Resolved'];

const STEP_META = {
  Submitted: { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30', desc: 'Your report has been received by the system.' },
  Assigned: { icon: UserCheck, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', desc: 'An officer has been assigned to your report.' },
  'In Progress': { icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30', desc: 'Officers are actively working on this report.' },
  Resolved: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30', desc: 'This case has been resolved.' },
};

const URGENCY_COLORS = { Low: 'text-green-400 bg-green-900/30', Medium: 'text-yellow-400 bg-yellow-900/30', High: 'text-red-400 bg-red-900/30' };

export default function StatusTracker({ initialId }) {
  const [anonId, setAnonId] = useState(initialId || '');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const fetchStatus = async (id) => {
    const trackId = id || anonId;
    if (!trackId.trim()) return toast.error('Enter your tracking ID');
    setLoading(true);
    try {
      const res = await getReportStatus(trackId.trim());
      setReport(res.data);
    } catch (err) {
      toast.error(err.message || 'Report not found');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  // Real-time subscription
  useEffect(() => {
    if (!report?.anonId) return;
    const socket = connectSocket();
    joinReportRoom(report.anonId);
    socket.on('reportUpdate', (data) => {
      if (data.anonId === report.anonId) {
        setReport((prev) => ({ ...prev, ...data }));
        toast.success(`Status updated: ${data.status}`);
      }
    });
    return () => socket.off('reportUpdate');
  }, [report?.anonId]);

  useEffect(() => {
    if (initialId) fetchStatus(initialId);
  }, []);

  const currentStep = report ? STEPS.indexOf(report.status) : -1;

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex gap-2">
        <input
          value={anonId}
          onChange={(e) => setAnonId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchStatus()}
          placeholder="Enter your tracking ID..."
          className="input font-mono"
        />
        <button
          onClick={() => fetchStatus()}
          disabled={loading}
          className="btn-primary flex items-center gap-2 whitespace-nowrap px-5"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          Track
        </button>
      </div>

      {/* Report card */}
      {report && (
        <div className="space-y-4 animate-slide-up">
          {/* Header */}
          <div className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="font-bold text-white text-lg">{report.category}</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{report.anonId}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`status-badge ${URGENCY_COLORS[report.urgency]}`}>{report.urgency} Priority</span>
                <span className={`status-badge border ${STEP_META[report.status]?.bg} ${STEP_META[report.status]?.color}`}>
                  {report.status}
                </span>
              </div>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{report.description}</p>
            {report.assignedTo && (
              <p className="text-xs text-slate-500 mt-2">Assigned to: <span className="text-slate-300">{report.assignedTo}</span></p>
            )}
          </div>

          {/* Progress stepper */}
          <div className="card p-5">
            <h4 className="text-sm font-semibold text-slate-300 mb-4">Report Progress</h4>
            <div className="relative">
              {/* Connector line */}
              <div className="absolute top-5 left-5 right-5 h-0.5 bg-slate-700" />
              <div
                className="absolute top-5 left-5 h-0.5 bg-primary-500 transition-all duration-700"
                style={{ width: currentStep >= 0 ? `${(currentStep / (STEPS.length - 1)) * 100}%` : '0%' }}
              />
              <div className="relative flex justify-between">
                {STEPS.map((step, idx) => {
                  const done = idx <= currentStep;
                  const Meta = STEP_META[step];
                  const Icon = Meta.icon;
                  return (
                    <div key={step} className="flex flex-col items-center gap-2 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10
                        ${done ? `border-primary-500 bg-primary-900/50 ${Meta.color}` : 'border-slate-700 bg-slate-900 text-slate-600'}`}>
                        <Icon size={18} />
                      </div>
                      <span className={`text-[10px] font-medium text-center leading-tight px-1
                        ${done ? 'text-slate-200' : 'text-slate-600'}`}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-4 text-center">{STEP_META[report.status]?.desc}</p>
          </div>

          {/* Status history */}
          {report.statusHistory?.length > 0 && (
            <div className="card overflow-hidden">
              <button
                onClick={() => setHistoryOpen(!historyOpen)}
                className="w-full flex items-center justify-between p-4 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <span>Status History ({report.statusHistory.length} updates)</span>
                {historyOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {historyOpen && (
                <div className="px-4 pb-4 space-y-3 animate-fade-in border-t border-slate-800 pt-3">
                  {[...report.statusHistory].reverse().map((h, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-200">{h.status}</span>
                          <span className="text-xs text-slate-500">{new Date(h.updatedAt).toLocaleString()}</span>
                        </div>
                        {h.note && <p className="text-xs text-slate-400 mt-0.5">{h.note}</p>}
                        <p className="text-xs text-slate-600">by {h.updatedBy}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Media thumbnails */}
          {report.media?.length > 0 && (
            <div className="card p-4">
              <h4 className="text-sm font-semibold text-slate-300 mb-3">Attached Evidence</h4>
              <div className="flex gap-2 flex-wrap">
                {report.media.map((m, i) => (
                  <a key={i} href={m.url} target="_blank" rel="noreferrer" className="block rounded-lg overflow-hidden border border-slate-700 hover:border-primary-500 transition-colors">
                    {m.type === 'image'
                      ? <img src={m.url} alt="evidence" className="w-20 h-20 object-cover" />
                      : <video src={m.url} className="w-20 h-20 object-cover" />
                    }
                  </a>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-slate-600 text-center">
            Last updated: {new Date(report.updatedAt).toLocaleString()} • Listening for live updates...
          </p>
        </div>
      )}
    </div>
  );
}
