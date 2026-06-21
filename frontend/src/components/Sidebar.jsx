import { NavLink } from 'react-router-dom';
import Icon from './ui/Icon';
import Avatar from './ui/Avatar';

const adminNav = [
  { to: '/admin/dashboard',    icon: 'home',  label: 'Dashboard' },
  { to: '/admin/courses',      icon: 'book',  label: 'Course Management' },
  { to: '/admin/training',     icon: 'log',   label: 'Training Logger' },
  { to: '/admin/certificates', icon: 'cert',  label: 'Certificate Engine' },
  { to: '/admin/users',        icon: 'users', label: 'Staff Directory' },
  { to: '/admin/reports',      icon: 'chart', label: 'Reports' },
];

const userNav = [
  { to: '/dashboard', icon: 'home',  label: 'My Dashboard' },
  { to: '/courses',   icon: 'book',  label: 'Course Catalogue' },
  { to: '/certs',     icon: 'cert',  label: 'My Certificates' },
  { to: '/report',    icon: 'chart', label: 'My Report' },
];

export default function Sidebar({ user, onLogout, onClose }) {
  const nav = user.role === 'ADMIN' ? adminNav : userNav;

  return (
    <div className="w-56 h-full flex flex-col" style={{ background: 'linear-gradient(180deg,#0D1B2A,#1A3A5C)', minHeight: '100vh' }}>
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/5 flex items-center justify-between" style={{ paddingTop: 'calc(1.25rem + env(safe-area-inset-top))' }}>
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain" />
          <div>
            <div className="text-white text-sm font-semibold">Blood Testing Education Center</div>
            <div className="text-white/30 text-[10px] mt-0.5">National Blood Center, Thai Red Cross Society</div>
          </div>
        </div>
        {/* Close button — mobile only */}
        <button onClick={onClose} className="lg:hidden text-white/40 hover:text-white p-1">
          <Icon name="x" size={18} />
        </button>
      </div>

      {/* Nav */}
      <div className="flex-1 py-3 overflow-y-auto">
        <div className="px-4 pb-2 text-[10px] font-semibold text-white/25 uppercase tracking-wider">
          {user.role === 'ADMIN' ? 'Administration' : 'User Portal'}
        </div>
        {nav.map(n => (
          <NavLink key={n.to} to={n.to} onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-4 py-2.5 mx-2 rounded-lg text-sm transition-all mb-0.5 ${isActive
                ? 'bg-brand-500/20 text-white font-medium'
                : 'text-white/50 hover:bg-white/5 hover:text-white/80'}`
            }>
            <Icon name={n.icon} size={16} />
            <span>{n.label}</span>
          </NavLink>
        ))}
      </div>

      {/* User footer */}
      <div className="border-t border-white/5 p-3">
        <NavLink to="/profile" onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-2.5 p-2 rounded-lg mb-2 transition-all ${isActive ? 'bg-brand-500/20' : 'hover:bg-white/5'}`
          }>
          <Avatar initials={user.avatar} size={32} />
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-medium truncate">{user.name}</div>
            <div className="text-white/30 text-[10px] capitalize">{user.role === 'ADMIN' ? 'Administrator' : 'User'}</div>
          </div>
        </NavLink>
        <button onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs text-white/45 hover:text-white/80 hover:bg-white/10 transition-all">
          <Icon name="logout" size={14} /> Sign Out
        </button>
      </div>
    </div>
  );
}
