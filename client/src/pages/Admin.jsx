import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  LayoutDashboard, Map, FileText, BarChart2, Download, RefreshCw,
  ChevronLeft, ChevronRight, ListFilter, X, CheckCircle2, Loader2,
} from 'lucide-react';
import { getAdminReports, updateReportStatus, getAnalytics, exportPDF } from '../utils/api';
import { setReports, updateReport, setAnalytics } from '../store/reportSlice';
import { logout } from '../store/adminSlice';
import { connectSocket, joinAdminRoom } from '../utils/socket';
import MapView from '../components/MapView';

const TABS = [
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'map', label: 'Map View', icon: Map },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
];

const STATUSES = ['Submitted', 'Assigned', 'In Progress', 'Resolved'];
const CATEGORIES = ['Theft', 'Harassment', 'Traffic', 'Domestic Violence', 'Others'];
const URGENCY = ['Low', 'Medium', 'High'];

const STATUS_COLORS = {
  Submitted: 'bg-blue-900/40 text-blue-400 border border-blue-700/30',
  Assigned: 'bg-yellow-900/40 text-yellow-400 border border-yellow-700/30',
  'In Progress': 'bg-orange-900/40 text-orange-400 border border-orange-700/30',
  Resolved: 'bg-green-900/40 text-green-400 border border-green-700/30',
};

const URGENCY_COLORS_MAP = { Low: '#22c55e', Medium: '#eab308', High: '#ef4444' };
const CHART_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

export default function Admin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { adminInfo } = useSelector((s) => s.admin);
  const { list: reports, pagination, analytics } = useSelector((s) => s.reports);

  const [tab, setTab] = useState('reports');
  const [filters, setFilters] = useState({ status: '', category: '', urgency: '' });
  const [page, setPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState({ status: '', note: '', assignedTo: '' });
  const [loadingReports, setLoadingReports] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoadingReports(true);
    try {
      const res = await getAdminReports({ ...filters, page, limit: 15 });
      dispatch(setReports(res));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingReports(false);
    }
  }, [filters, page]);

  const fetchAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    try {
      const res = await getAnalytics();
      dispatch(setAnalytics(res.data));
    } catch (err) {
      toast.error('Analytics load failed');
      console.error('Analytics error:', err.message);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [dispatch]);

  useEffect(() => { fetchReports(); }, [fetchReports]);
  useEffect(() => { if (tab === 'analytics' && !analytics) fetchAnalytics(); }, [tab, analytics, fetchAnalytics]);

  // Real-time socket
  useEffect(() => {
    if (!adminInfo) { navigate('/admin/login'); return; }
    const socket = connectSocket();
    joinAdminRoom();
    socket.on('newReport', (data) => {
      toast(`New ${data.urgency} priority ${data.category} report!`, { icon: '🚨', duration: 5000 });
      fetchReports();
    });
    socket.on('reportUpdated', () => fetchReports());
    return () => { socket.off('newReport'); socket.off('reportUpdated'); };
  }, [adminInfo]);

  const handleUpdateStatus = async () => {
    if (!statusUpdate.status) return toast.error('Select a status');
    setLoadingUpdate(true);
    try {
      const res = await updateReportStatus(selectedReport._id, statusUpdate);
      dispatch(updateReport(res.data));
      toast.success('Status updated!');
      setSelectedReport(res.data);
      setStatusUpdate({ status: '', note: '', assignedTo: '' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingUpdate(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await exportPDF(filters);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'crime-reports.pdf';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('PDF exported!');
    } catch (err) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  if (!adminInfo) return null;

  return (
    <div className="min-h-[calc(100vh-64px)] flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-slate-900 border-r border-slate-800 p-4 gap-1">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 px-2">Dashboard</div>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left
              ${tab === id ? 'bg-primary-600/20 text-primary-400 border border-primary-700/30' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
        <div className="mt-auto pt-4 border-t border-slate-800">
          <button
            onClick={() => { dispatch(logout()); navigate('/'); }}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-400 px-3 py-2 w-full rounded-xl transition-colors"
          >
            <X size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-bold text-white">Police Dashboard</h1>
            <p className="text-xs text-slate-500">Welcome, {adminInfo.displayName || adminInfo.username}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile tabs */}
            <div className="flex lg:hidden gap-1">
              {TABS.map(({ id, icon: Icon }) => (
                <button key={id} onClick={() => setTab(id)}
                  className={`p-2 rounded-lg ${tab === id ? 'bg-primary-600/20 text-primary-400' : 'text-slate-400 hover:bg-slate-800'}`}>
                  <Icon size={16} />
                </button>
              ))}
            </div>
            <button onClick={fetchReports} className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
              <RefreshCw size={15} className={loadingReports ? 'animate-spin' : ''} />
            </button>
            <button onClick={handleExport} disabled={exporting} className="btn-secondary flex items-center gap-1.5 text-xs py-2 px-3">
              {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              Export PDF
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          {/* REPORTS TAB */}
          {tab === 'reports' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="card p-4 flex flex-wrap gap-3 items-end">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <ListFilter size={13} /> Filters:
                </div>
                {[
                  { label: 'Status', key: 'status', options: STATUSES },
                  { label: 'Category', key: 'category', options: CATEGORIES },
                  { label: 'Urgency', key: 'urgency', options: URGENCY },
                ].map(({ label, key, options }) => (
                  <select
                    key={key}
                    value={filters[key]}
                    onChange={(e) => { setFilters((p) => ({ ...p, [key]: e.target.value })); setPage(1); }}
                    className="input text-xs py-2 w-auto"
                  >
                    <option value="">All {label}s</option>
                    {options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ))}
                {(filters.status || filters.category || filters.urgency) && (
                  <button onClick={() => { setFilters({ status: '', category: '', urgency: '' }); setPage(1); }}
                    className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1">
                    <X size={12} /> Clear
                  </button>
                )}
                <span className="ml-auto text-xs text-slate-500">{pagination.total} total</span>
              </div>

              {/* Table */}
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-left">
                        {['Category', 'Urgency', 'Status', 'Location', 'Assigned', 'Date', 'Action'].map((h) => (
                          <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {loadingReports ? (
                        <tr><td colSpan={7} className="py-12 text-center text-slate-500">
                          <Loader2 size={24} className="animate-spin mx-auto mb-2" />Loading reports...
                        </td></tr>
                      ) : reports.length === 0 ? (
                        <tr><td colSpan={7} className="py-12 text-center text-slate-500">No reports found</td></tr>
                      ) : reports.map((r) => (
                        <tr key={r._id} className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                          onClick={() => { setSelectedReport(r); setStatusUpdate({ status: r.status, note: '', assignedTo: r.assignedTo || '' }); }}>
                          <td className="px-4 py-3 font-medium text-slate-200">{r.category}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-medium" style={{ color: URGENCY_COLORS_MAP[r.urgency] }}>{r.urgency}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`status-badge text-[10px] ${STATUS_COLORS[r.status]}`}>{r.status}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-xs max-w-[140px] truncate">
                            {r.location?.address || `${r.location?.coordinates?.[1]?.toFixed(3)}, ${r.location?.coordinates?.[0]?.toFixed(3)}`}
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{r.assignedTo || '—'}</td>
                          <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <button className="text-xs text-primary-400 hover:text-primary-300 font-medium">Manage</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                <div className="border-t border-slate-800 px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Page {pagination.page} of {pagination.pages}</span>
                  <div className="flex gap-2">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pagination.page <= 1} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-40">
                      <ChevronLeft size={14} />
                    </button>
                    <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={pagination.page >= pagination.pages} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-40">
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MAP TAB */}
          {tab === 'map' && (
            <div className="h-[calc(100vh-220px)]">
              <MapView reports={reports} />
            </div>
          )}

          {/* ANALYTICS TAB */}
          {tab === 'analytics' && (
            <div className="space-y-6">
              {loadingAnalytics ? (
                <div className="text-center py-12"><Loader2 size={28} className="animate-spin mx-auto text-primary-400" /></div>
              ) : analytics ? (
                <>
                  {/* KPIs */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Reports', value: analytics.totalReports, color: 'text-white' },
                      { label: 'Resolved', value: analytics.resolved, color: 'text-green-400' },
                      { label: 'Resolution Rate', value: `${analytics.resolutionRate}%`, color: 'text-blue-400' },
                      { label: 'Active Cases', value: analytics.totalReports - analytics.resolved, color: 'text-yellow-400' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="card p-5">
                        <div className={`text-3xl font-extrabold ${color}`}>{value}</div>
                        <div className="text-xs text-slate-500 mt-1">{label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="grid lg:grid-cols-2 gap-6">
                    {/* Monthly trend */}
                    <div className="card p-5">
                      <h3 className="text-sm font-semibold text-slate-300 mb-4">Monthly Reports</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={analytics.monthly.map((m) => ({ name: `${m._id.month}/${m._id.year}`, count: m.count }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
                          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                          <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, color: '#f1f5f9' }} />
                          <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Category pie */}
                    <div className="card p-5">
                      <h3 className="text-sm font-semibold text-slate-300 mb-4">By Category</h3>
                      <div className="flex items-center gap-4">
                        <ResponsiveContainer width="60%" height={180}>
                          <PieChart>
                            <Pie data={analytics.byCategory} dataKey="count" nameKey="_id" innerRadius={45} outerRadius={75}>
                              {analytics.byCategory.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, color: '#f1f5f9' }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-1.5 flex-1">
                          {analytics.byCategory.map((c, i) => (
                            <div key={c._id} className="flex items-center gap-2 text-xs">
                              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                              <span className="text-slate-400 truncate">{c._id}</span>
                              <span className="text-slate-200 font-medium ml-auto">{c.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Urgency breakdown */}
                    <div className="card p-5">
                      <h3 className="text-sm font-semibold text-slate-300 mb-4">By Urgency</h3>
                      <div className="space-y-3">
                        {analytics.byUrgency.map((u) => {
                          const pct = Math.round((u.count / analytics.totalReports) * 100) || 0;
                          return (
                            <div key={u._id}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-400">{u._id}</span>
                                <span className="text-slate-200">{u.count} ({pct}%)</span>
                              </div>
                              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-500"
                                  style={{ width: `${pct}%`, background: URGENCY_COLORS_MAP[u._id] }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Status breakdown */}
                    <div className="card p-5">
                      <h3 className="text-sm font-semibold text-slate-300 mb-4">By Status</h3>
                      <div className="space-y-3">
                        {analytics.byStatus.map((s, i) => {
                          const pct = Math.round((s.count / analytics.totalReports) * 100) || 0;
                          return (
                            <div key={s._id}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-400">{s._id}</span>
                                <span className="text-slate-200">{s.count}</span>
                              </div>
                              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: CHART_COLORS[i] }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-slate-500 py-12 space-y-3">
                  <p>No analytics data available yet.</p>
                  <button
                    onClick={fetchAnalytics}
                    disabled={loadingAnalytics}
                    className="btn-secondary text-xs flex items-center gap-1.5 mx-auto"
                  >
                    <RefreshCw size={13} className={loadingAnalytics ? 'animate-spin' : ''} />
                    Retry
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Report detail slide-over */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={(e) => e.target === e.currentTarget && setSelectedReport(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-slate-900 border-l border-slate-800 w-full max-w-md h-full overflow-auto p-6 space-y-5 animate-slide-up">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-white">Report Details</h2>
              <button onClick={() => setSelectedReport(null)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400">
                <X size={18} />
              </button>
            </div>

            {/* Info */}
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="card p-3">
                  <p className="text-xs text-slate-500">Category</p>
                  <p className="font-medium text-white mt-0.5">{selectedReport.category}</p>
                </div>
                <div className="card p-3">
                  <p className="text-xs text-slate-500">Urgency</p>
                  <p className="font-medium mt-0.5" style={{ color: URGENCY_COLORS_MAP[selectedReport.urgency] }}>{selectedReport.urgency}</p>
                </div>
              </div>
              <div className="card p-3">
                <p className="text-xs text-slate-500 mb-1">Description</p>
                <p className="text-slate-300 text-sm leading-relaxed">{selectedReport.description}</p>
              </div>
              <div className="card p-3">
                <p className="text-xs text-slate-500 mb-1">Tracking ID</p>
                <p className="font-mono text-xs text-primary-400 break-all">{selectedReport.anonId}</p>
              </div>
              {selectedReport.location?.address && (
                <div className="card p-3">
                  <p className="text-xs text-slate-500 mb-1">Location</p>
                  <p className="text-slate-300 text-xs">{selectedReport.location.address}</p>
                </div>
              )}
            </div>

            {/* Update status */}
            <div className="card p-4 space-y-3">
              <h3 className="text-sm font-semibold text-white">Update Status</h3>
              <select value={statusUpdate.status} onChange={(e) => setStatusUpdate((p) => ({ ...p, status: e.target.value }))} className="input text-sm">
                <option value="">Select status...</option>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input
                value={statusUpdate.assignedTo}
                onChange={(e) => setStatusUpdate((p) => ({ ...p, assignedTo: e.target.value }))}
                placeholder="Assign to officer..."
                className="input text-sm"
              />
              <textarea
                value={statusUpdate.note}
                onChange={(e) => setStatusUpdate((p) => ({ ...p, note: e.target.value }))}
                placeholder="Add a note (optional)..."
                rows={3}
                className="input resize-none text-sm"
              />
              <button onClick={handleUpdateStatus} disabled={loadingUpdate} className="btn-primary w-full flex items-center justify-center gap-2">
                {loadingUpdate ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Update Status
              </button>
            </div>

            {/* Status history */}
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-white mb-3">History</h3>
              <div className="space-y-2.5">
                {[...selectedReport.statusHistory].reverse().map((h, i) => (
                  <div key={i} className="flex gap-3 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-slate-200">{h.status}</div>
                      {h.note && <div className="text-slate-400 mt-0.5">{h.note}</div>}
                      <div className="text-slate-600">{new Date(h.updatedAt).toLocaleString()} · {h.updatedBy}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Media */}
            {selectedReport.media?.length > 0 && (
              <div className="card p-4">
                <h3 className="text-sm font-semibold text-white mb-3">Evidence ({selectedReport.media.length})</h3>
                <div className="grid grid-cols-3 gap-2">
                  {selectedReport.media.map((m, i) => (
                    <a key={i} href={m.url} target="_blank" rel="noreferrer" className="block rounded-lg overflow-hidden border border-slate-700 aspect-square">
                      {m.type === 'image'
                        ? <img src={m.url} alt="evidence" className="w-full h-full object-cover" />
                        : <video src={m.url} className="w-full h-full object-cover" />
                      }
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
