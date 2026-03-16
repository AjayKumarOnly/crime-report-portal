import ReportForm from '../components/ReportForm';
import SOSButton from '../components/SOSButton';
import { Shield, Eye, Bell, MapPin } from 'lucide-react';

const features = [
  { icon: Eye, title: 'Anonymous Reporting', desc: 'Report crimes without revealing your identity. No account needed.' },
  { icon: MapPin, title: 'GPS Location Tagging', desc: 'Auto-detect or manually pin your location on an interactive map.' },
  { icon: Bell, title: 'Real-time Updates', desc: 'Track your report status live with WebSocket push notifications.' },
  { icon: Shield, title: 'Secure & Encrypted', desc: 'All data encrypted. Your privacy is our top priority.' },
];

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-64px)]">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-950/30 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left: Hero text + Form */}
            <div className="space-y-8 animate-slide-up">
              <div>
                <div className="inline-flex items-center gap-2 bg-primary-900/30 border border-primary-700/30 rounded-full px-3 py-1 text-xs text-primary-400 font-medium mb-4">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary-500" />
                  </span>
                  Serving Pudukkottai &amp; Coimbatore communities
                </div>
                <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">
                  Report Crime.
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">
                    Stay Safe.
                  </span>
                </h1>
                <p className="mt-4 text-slate-400 text-lg leading-relaxed">
                  Submit anonymous crime reports with evidence, GPS location, and real-time status tracking. 
                  Helping local communities improve safety and police accountability.
                </p>
              </div>

              {/* Report Form card */}
              <div className="card-glass p-6">
                <h2 className="text-lg font-bold text-white mb-5">Submit a Report</h2>
                <ReportForm />
              </div>
            </div>

            {/* Right: SOS + Features */}
            <div className="space-y-6 animate-fade-in">
              {/* SOS Card */}
              <div className="card-glass p-6 flex flex-col items-center text-center">
                <div className="text-xs font-bold text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="animate-pulse">⚠</span> Emergency
                </div>
                <SOSButton />
                <p className="text-xs text-slate-500 mt-4 max-w-xs">
                  In immediate danger? Press SOS to share your live GPS location with emergency contacts and police.
                </p>
              </div>

              {/* Feature highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {features.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="card p-4 hover:border-slate-700 transition-colors group">
                    <div className="bg-primary-900/30 w-9 h-9 rounded-lg flex items-center justify-center mb-3 group-hover:bg-primary-900/50 transition-colors">
                      <Icon size={18} className="text-primary-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="card p-5 grid grid-cols-3 gap-4 text-center">
                {[
                  { label: 'Reports Filed', value: '500+' },
                  { label: 'Cases Resolved', value: '78%' },
                  { label: 'Avg Response', value: '2h' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="text-2xl font-extrabold text-white">{value}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
