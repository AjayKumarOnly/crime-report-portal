import StatusTracker from '../components/StatusTracker';
import { MapPin } from 'lucide-react';

export default function TrackReport() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 text-primary-400 text-sm font-medium mb-2">
            <MapPin size={14} /> Report Tracker
          </div>
          <h1 className="text-3xl font-extrabold text-white">Track Your Report</h1>
          <p className="text-slate-400 mt-2">
            Enter the tracking ID you received when submitting your report to view real-time status updates.
          </p>
        </div>
        <div className="card-glass p-6">
          <StatusTracker />
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-slate-500">
            🔒 Status tracking is anonymous. We never ask for your personal details.
            Updates are delivered in real-time via secure WebSocket connection.
          </p>
        </div>
      </div>
    </div>
  );
}
