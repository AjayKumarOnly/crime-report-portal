import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/adminSlice';
import { Shield, MapPin, FileText, BarChart2, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { adminInfo } = useSelector((s) => s.admin);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const links = [
    { to: '/', label: 'Report Crime', icon: FileText },
    { to: '/track', label: 'Track Report', icon: MapPin },
    ...(adminInfo ? [{ to: '/admin', label: 'Admin Panel', icon: BarChart2 }] : []),
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="bg-primary-600 p-1.5 rounded-lg group-hover:bg-primary-500 transition-colors">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-base leading-none">Crime Report</span>
              <span className="block text-[10px] text-primary-400 font-medium tracking-widest uppercase">Portal</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive(to)
                    ? 'bg-primary-600/20 text-primary-400 border border-primary-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'}`}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
            {adminInfo ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-all ml-2"
              >
                <LogOut size={16} />
                Logout
              </button>
            ) : (
              <Link
                to="/admin/login"
                className="flex items-center gap-2 ml-2 px-4 py-2 rounded-lg text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
              >
                <Shield size={16} />
                Admin
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-3 border-t border-slate-800 space-y-1 animate-fade-in">
            {links.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${isActive(to) ? 'bg-primary-600/20 text-primary-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
            {adminInfo ? (
              <button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-950/30">
                <LogOut size={16} /> Logout
              </button>
            ) : (
              <Link to="/admin/login" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800">
                <Shield size={16} /> Admin Login
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
