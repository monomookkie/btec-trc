import { useLocation } from 'react-router-dom';
import Badge from './ui/Badge';
import Icon from './ui/Icon';

const titles = {
  '/admin/dashboard':    'Dashboard',
  '/admin/courses':      'Course Management',
  '/admin/training':     'Training Logger',
  '/admin/certificates': 'Certificate Engine',
  '/admin/users':        'Staff Directory',
  '/admin/reports':      'Reports & Analytics',
  '/dashboard':          'My Dashboard',
  '/courses':            'Course Catalogue',
  '/certs':              'My Certificates',
  '/report':             'My Report',
};

export default function TopBar({ user, onMenuClick }) {
  const { pathname } = useLocation();
  const title = titles[pathname] || 'HemoLabs LMS';

  return (
    <div className="h-14 bg-white border-b border-slate-100 px-4 md:px-7 flex items-center justify-between flex-shrink-0" style={{ paddingTop: 'env(safe-area-inset-top)', height: 'calc(3.5rem + env(safe-area-inset-top))' }}>
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button onClick={onMenuClick} className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
          <Icon name="grid" size={18} />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 hidden sm:block" style={{ boxShadow: '0 0 0 3px rgba(16,185,129,.15)' }} />
          <span className="text-sm font-semibold text-navy-900">{title}</span>
        </div>
      </div>
      <Badge variant={user.role === 'ADMIN' ? 'red' : 'blue'}>
        {user.role === 'ADMIN' ? 'Administrator' : 'User'}
      </Badge>
    </div>
  );
}
