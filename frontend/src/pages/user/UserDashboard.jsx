import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import Icon from '../../components/ui/Icon';
import Badge from '../../components/ui/Badge';

function AnnouncementCarousel({ announcements }) {
  const [current, setCurrent] = useState(0);
  const startX = useRef(null);

  const prev = () => setCurrent(c => Math.max(0, c - 1));
  const next = () => setCurrent(c => Math.min(announcements.length - 1, c + 1));

  const onTouchStart = e => { startX.current = e.touches[0].clientX; };
  const onTouchEnd = e => {
    if (startX.current === null) return;
    const diff = startX.current - e.changedTouches[0].clientX;
    if (diff > 40) next();
    else if (diff < -40) prev();
    startX.current = null;
  };

  return (
    <div className="max-w-2xl mx-auto mb-5">
      <h3 className="text-sm font-semibold text-navy-900 mb-3 text-center">ประกาศ / ข่าวสาร</h3>
      <div className="relative">
        <div className="overflow-hidden rounded-2xl" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <div className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${current * 100}%)` }}>
            {announcements.map(a => (
              <div key={a.id} className="w-full flex-shrink-0">
                <div className={`border overflow-hidden shadow-sm rounded-2xl ${a.type === 'important' ? 'border-red-100' : 'border-slate-100'}`}>
                  {a.fileData && a.fileData.startsWith('data:image') && (
                    <img src={a.fileData} alt={a.title} className="w-full max-h-64 object-cover" />
                  )}
                  <div className={`p-4 ${a.type === 'important' ? 'bg-red-50' : 'bg-white'}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant={a.type === 'important' ? 'red' : 'blue'} className="text-[10px]">
                        {a.type === 'important' ? 'สำคัญ' : 'ทั่วไป'}
                      </Badge>
                      <span className="text-[10px] text-slate-400">{new Date(a.date).toLocaleDateString('th-TH')}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 mb-1">{a.title}</p>
                    <p className="text-xs text-slate-500 whitespace-pre-wrap">{a.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {current > 0 && (
          <button onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-8 h-8 rounded-full bg-white border border-slate-200 shadow text-slate-500 hover:bg-slate-50 z-10 text-lg leading-none">
            ‹
          </button>
        )}
        {current < announcements.length - 1 && (
          <button onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-8 h-8 rounded-full bg-white border border-slate-200 shadow text-slate-500 hover:bg-slate-50 z-10 text-lg leading-none">
            ›
          </button>
        )}
      </div>

      {announcements.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {announcements.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`rounded-full transition-all duration-200 ${i === current ? 'w-4 h-2 bg-brand-500' : 'w-2 h-2 bg-slate-300'}`} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function UserDashboard({ user, showToast }) {
  const [enrollments, setEnrollments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.getEnrollments(), api.getAnnouncements()])
      .then(([e, a]) => { setEnrollments(e); setAnnouncements(a); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Loading…</div>;

  const completed = enrollments.filter(e => e.completed);
  const inProgress = enrollments.filter(e => !e.completed);
  const certs = enrollments.filter(e => e.certificate);

  return (
    <div className="p-4 md:p-7 page-enter">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-navy-900">Welcome back, {user.name.split(' ')[0]}</h2>
        <p className="text-slate-400 text-sm mt-1">{user.dept}</p>
      </div>

      {announcements.length > 0 && <AnnouncementCarousel announcements={announcements} />}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
        {[
          { label: 'In Progress', val: inProgress.length, icon: 'book', color: '#1A56DB', bg: '#EEF3FF' },
          { label: 'Completed',   val: completed.length,  icon: 'check', color: '#1A7A4A', bg: '#F0FDF4' },
          { label: 'Certificates',val: certs.length,      icon: 'cert', color: '#6D28D9', bg: '#F5F3FF' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-3 md:p-5 flex flex-col sm:flex-row items-center sm:items-start gap-2 md:gap-4 shadow-sm">
            <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg, color: s.color }}>
              <Icon name={s.icon} size={18} />
            </div>
            <div className="text-center sm:text-left">
              <div className="text-2xl md:text-3xl font-light text-navy-900">{s.val}</div>
              <div className="text-[10px] md:text-xs text-slate-400 mt-0.5">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        {/* My Courses */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-navy-900">My Courses</h3>
            <button onClick={() => navigate('/courses')} className="text-xs text-brand-500 hover:underline">Browse all →</button>
          </div>
          <div className="space-y-3">
            {enrollments.slice(0, 5).map(e => (
              <div key={e.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-700 font-medium truncate flex-1 pr-2">{e.course?.title}</span>
                  <span className="text-[11px] text-slate-400 flex-shrink-0">{e.progress}%</span>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${e.progress}%` }} /></div>
              </div>
            ))}
            {enrollments.length === 0 && (
              <p className="text-xs text-slate-400">No enrollments yet. <button onClick={() => navigate('/courses')} className="text-brand-500 hover:underline">Browse courses →</button></p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-center">
          <p className="text-xs text-slate-300">—</p>
        </div>
      </div>
    </div>
  );
}
