import { useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import toast from 'react-hot-toast';

import { Upload, X, MapPin, Loader2, CheckCircle2, Copy } from 'lucide-react';
import { submitReport } from '../utils/api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const CATEGORIES = ['Theft', 'Harassment', 'Traffic', 'Domestic Violence', 'Others'];
const URGENCY_LEVELS = ['Low', 'Medium', 'High'];
const URGENCY_COLORS = { Low: 'text-green-400', Medium: 'text-yellow-400', High: 'text-red-400' };

function LocationPicker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} /> : null;
}

export default function ReportForm() {
  const [form, setForm] = useState({
    category: '',
    description: '',
    urgency: 'Low',
    contactPhone: '',
    contactEmail: '',
    isAnonymous: true,
  });
  const [position, setPosition] = useState(null);
  const [address, setAddress] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [mapCenter, setMapCenter] = useState([11.0168, 76.9558]); // Coimbatore default
  const fileInputRef = useRef();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported by your browser');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
        setMapCenter([latitude, longitude]);
        // Reverse geocode using Nominatim
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          setAddress(data.display_name || '');
        } catch {
          setAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        }
        setGpsLoading(false);
        toast.success('Location detected!');
      },
      (err) => {
        setGpsLoading(false);
        toast.error('Could not get location: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    const valid = newFiles.filter((f) => {
      if (f.size > 10 * 1024 * 1024) { toast.error(`${f.name} exceeds 10MB`); return false; }
      return true;
    });
    const combined = [...files, ...valid].slice(0, 5);
    setFiles(combined);
    const newPreviews = combined.map((f) => ({
      name: f.name,
      url: URL.createObjectURL(f),
      type: f.type.startsWith('video') ? 'video' : 'image',
    }));
    setPreviews(newPreviews);
  };

  const removeFile = (idx) => {
    const updated = files.filter((_, i) => i !== idx);
    setFiles(updated);
    setPreviews(updated.map((f) => ({ name: f.name, url: URL.createObjectURL(f), type: f.type.startsWith('video') ? 'video' : 'image' })));
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    const fakeEvent = { target: { files: droppedFiles } };
    handleFileChange(fakeEvent);
  }, [files]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category) return toast.error('Please select a crime category');
    if (!form.description.trim()) return toast.error('Please enter a description');
    if (!position) return toast.error('Please pin your location on the map or use GPS detection');

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('category', form.category);
      fd.append('description', form.description);
      fd.append('urgency', form.urgency);
      fd.append('latitude', position[0]);
      fd.append('longitude', position[1]);
      fd.append('address', address);
      fd.append('isAnonymous', form.isAnonymous);
      if (!form.isAnonymous) {
        fd.append('contactPhone', form.contactPhone);
        fd.append('contactEmail', form.contactEmail);
      }
      files.forEach((f) => fd.append('media', f));

      const res = await submitReport(fd);
      setSubmitted(res.data);
      toast.success('Report submitted successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const copyAnonId = () => {
    navigator.clipboard.writeText(submitted.anonId);
    toast.success('Tracking ID copied!');
  };

  if (submitted) {
    return (
      <div className="card p-8 text-center space-y-4 animate-slide-up">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 size={36} className="text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">Report Submitted!</h2>
        <p className="text-slate-400">Your report has been received. Use the tracking ID below to monitor its status.</p>
        <div className="bg-slate-800 rounded-xl p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500 mb-1">Your Tracking ID</p>
            <p className="font-mono text-primary-400 font-semibold text-sm break-all">{submitted.anonId}</p>
          </div>
          <button onClick={copyAnonId} className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600 text-slate-300 transition-colors flex-shrink-0">
            <Copy size={16} />
          </button>
        </div>
        <p className="text-xs text-slate-500">Save this ID. You'll need it to track your report. No account required.</p>
        <button
          onClick={() => { setSubmitted(null); setForm({ category: '', description: '', urgency: 'Low', contactPhone: '', contactEmail: '', isAnonymous: true }); setFiles([]); setPreviews([]); setPosition(null); }}
          className="btn-secondary"
        >
          Submit Another Report
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Category + Urgency */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Crime Category *</label>
          <select name="category" value={form.category} onChange={handleChange} className="input" required>
            <option value="">Select category...</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Urgency Level</label>
          <div className="flex gap-2">
            {URGENCY_LEVELS.map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setForm((p) => ({ ...p, urgency: u }))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200
                  ${form.urgency === u
                    ? u === 'Low' ? 'bg-green-900/40 border-green-500 text-green-400'
                      : u === 'Medium' ? 'bg-yellow-900/40 border-yellow-500 text-yellow-400'
                      : 'bg-red-900/40 border-red-500 text-red-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="label flex justify-between">
          <span>Description *</span>
          <span className={`text-xs ${form.description.length > 450 ? 'text-red-400' : 'text-slate-500'}`}>
            {form.description.length}/500
          </span>
        </label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          maxLength={500}
          rows={4}
          placeholder="Describe what happened, when, and any details that might help..."
          className="input resize-none"
          required
        />
      </div>

      {/* Location */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Location *</label>
          <button
            type="button"
            onClick={detectLocation}
            disabled={gpsLoading}
            className="flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 font-medium transition-colors disabled:opacity-50"
          >
            {gpsLoading ? <Loader2 size={13} className="animate-spin" /> : <MapPin size={13} />}
            {gpsLoading ? 'Detecting...' : 'Auto-detect GPS'}
          </button>
        </div>
        {address && (
          <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
            <MapPin size={11} className="text-primary-400" />{address}
          </p>
        )}
        <div className="h-56 rounded-xl overflow-hidden border border-slate-700">
          <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }} key={mapCenter.join(',')}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <LocationPicker position={position} setPosition={(pos) => {
              setPosition(pos);
              setAddress(`${pos[0].toFixed(5)}, ${pos[1].toFixed(5)}`);
            }} />
          </MapContainer>
        </div>
        <p className="text-xs text-slate-500 mt-1">Click on the map to drop a pin, or use GPS auto-detect above.</p>
      </div>

      {/* Media Upload */}
      <div>
        <label className="label">Upload Evidence (Optional)</label>
        <div
          className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center hover:border-primary-600/50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <Upload size={28} className="text-slate-500 mx-auto mb-2" />
          <p className="text-sm text-slate-400">Drag & drop or <span className="text-primary-400">browse</span></p>
          <p className="text-xs text-slate-600 mt-1">Images or videos • Max 10MB each • Up to 5 files</p>
          <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
        </div>
        {previews.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-3">
            {previews.map((p, i) => (
              <div key={i} className="relative group rounded-lg overflow-hidden bg-slate-800 aspect-square">
                {p.type === 'image'
                  ? <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                  : <video src={p.url} className="w-full h-full object-cover" />
                }
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="absolute top-1 right-1 bg-red-600 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={10} className="text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Anonymous toggle + contact */}
      <div className="card p-4 space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="isAnonymous"
            checked={form.isAnonymous}
            onChange={handleChange}
            className="w-4 h-4 accent-primary-600"
          />
          <span className="text-sm font-medium text-slate-300">Submit anonymously (no personal information stored)</span>
        </label>
        {!form.isAnonymous && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
            <div>
              <label className="label text-xs">Phone (optional)</label>
              <input type="tel" name="contactPhone" value={form.contactPhone} onChange={handleChange} placeholder="+91 98765 43210" className="input text-sm" />
            </div>
            <div>
              <label className="label text-xs">Email (optional)</label>
              <input type="email" name="contactEmail" value={form.contactEmail} onChange={handleChange} placeholder="your@email.com" className="input text-sm" />
            </div>
          </div>
        )}
      </div>

      {/* Submit */}
      <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base">
        {loading ? <><Loader2 size={18} className="animate-spin" /> Submitting...</> : 'Submit Report'}
      </button>
    </form>
  );
}
