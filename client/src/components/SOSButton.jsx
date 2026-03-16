import { useState } from 'react';
import toast from 'react-hot-toast';
import { Phone, MapPin, Loader2 } from 'lucide-react';

export default function SOSButton() {
  const [loading, setLoading] = useState(false);
  const [activated, setActivated] = useState(false);

  const handleSOS = async () => {
    setLoading(true);
    try {
      const pos = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) reject(new Error('Geolocation not supported'));
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 8000 });
      });
      const { latitude, longitude } = pos.coords;
      const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
      const body = `🚨 EMERGENCY SOS\nI need immediate help!\nMy location: ${mapsLink}\nCoordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

      // Try SMS first, fall back to email
      if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        window.open(`sms:112?body=${encodeURIComponent(body)}`);
      } else {
        window.open(`mailto:?subject=${encodeURIComponent('🚨 EMERGENCY SOS')}&body=${encodeURIComponent(body)}`);
      }
      setActivated(true);
      toast.success('SOS activated! Share your location with emergency contacts.', { duration: 6000, icon: '🚨' });
    } catch (err) {
      toast.error('Could not get location: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Pulsing button */}
      <div className="relative flex items-center justify-center">
        {/* Pulse rings */}
        <div className={`absolute w-28 h-28 rounded-full bg-red-500/20 sos-ring ${activated ? 'opacity-100' : 'opacity-0'}`} />
        <div className={`absolute w-28 h-28 rounded-full bg-red-500/10 sos-ring-2 ${activated ? 'opacity-100' : 'opacity-0'}`} />

        <button
          onClick={handleSOS}
          disabled={loading}
          className={`relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center gap-1
            font-bold text-white shadow-2xl transition-all duration-200 active:scale-95
            ${loading
              ? 'bg-red-800 cursor-wait'
              : 'bg-gradient-to-br from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 shadow-red-900/50'
            }`}
        >
          {loading
            ? <Loader2 size={24} className="animate-spin" />
            : <>
                <Phone size={22} className="fill-white" />
                <span className="text-xs font-black tracking-widest">SOS</span>
              </>
          }
        </button>
      </div>

      <div className="text-center max-w-xs">
        <p className="text-sm font-semibold text-slate-300">Emergency SOS</p>
        <p className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1">
          <MapPin size={11} />
          Shares your GPS location with emergency contacts
        </p>
      </div>
    </div>
  );
}
