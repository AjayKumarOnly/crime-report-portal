import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginSuccess } from '../store/adminSlice';
import { adminLogin, seedAdmin } from '../utils/api';
import toast from 'react-hot-toast';
import { Shield, Loader2, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await adminLogin(form);
      dispatch(loginSuccess(res));
      toast.success(`Welcome, ${res.admin.displayName || res.admin.username}!`);
      navigate('/admin');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await seedAdmin();
      toast.success(res.message || 'Admin seeded!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 animate-slide-up">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-600/20 border border-primary-600/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield size={28} className="text-primary-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Police Admin Login</h1>
          <p className="text-slate-400 text-sm mt-1">Authorized personnel only</p>
        </div>

        {/* Form */}
        <div className="card-glass p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Username</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                placeholder="admin"
                className="input"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                  className="input pr-11"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {loading ? <><Loader2 size={17} className="animate-spin" /> Signing in...</> : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Dev seed helper */}
        <div className="card p-4 text-center">
          <p className="text-xs text-slate-500 mb-2">First time? Seed the admin account:</p>
          <button onClick={handleSeed} disabled={seeding} className="text-xs text-primary-400 hover:text-primary-300 font-medium flex items-center gap-1 mx-auto">
            {seeding && <Loader2 size={12} className="animate-spin" />}
            Seed admin / admin123
          </button>
        </div>
      </div>
    </div>
  );
}
