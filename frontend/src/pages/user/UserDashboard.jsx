import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import Icon from '../../components/ui/Icon';
import Badge from '../../components/ui/Badge';

function AnnouncementCarousel({ announcements }) {
  const [current, setCurrent] = useState(0);
  const startX = useRef(null);
  const timerRef = useRef(null);

  const resetTimer = () => {
    clearInterval(timerRef.current);
    if (announcements.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % announcements.length);
    },10000);
  };

  useEffect(() => {
    resetTimer();
    return () => clearInterval(timerRef.current);
  }, [announcements.length]);

  const goTo = (i) => { setCurrent(i); resetTimer(); };
  const prev = () => goTo((current - 1 + announcements.length) % announcements.length);
  const next = () => goTo((current + 1) % announcements.length);

  const onTouchStart = e => { startX.current = e.touches[0].clientX; };
  const onTouchEnd = e => {
    if (startX.current === null) return;
    const diff = startX.current - e.changedTouches[0].clientX;
    if (diff > 40) next();
    else if (diff < -40) prev();
    startX.current = null;
  };

  const a = announcements[current];
  const hasImage = a.fileData && a.fileData.startsWith('data:image');

  return (
    <div className="mb-6">
      <div className="relative overflow-hidden rounded-2xl shadow-sm select-none"
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

        {/* Slides */}
        <div className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${current * 100}%)` }}>
          {announcements.map(ann => {
            const img = ann.fileData && ann.fileData.startsWith('data:image');
            return (
              <div key={ann.id} className="w-full flex-shrink-0 relative"
                onClick={() => ann.link && window.open(ann.link, '_blank', 'noopener,noreferrer')}
                style={{ cursor: ann.link ? 'pointer' : 'default' }}>
                {img ? (
                  <div className="relative w-full" style={{ aspectRatio: '16/6' }}>
                    <img src={ann.fileData} alt={ann.title}
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ imageRendering: 'auto' }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    {/* Text on image */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ann.type === 'important' ? 'bg-red-500 text-white' : 'bg-white/20 text-white backdrop-blur-sm'}`}>
                          {ann.type === 'important' ? 'สำคัญ' : 'ทั่วไป'}
                        </span>
                        <span className="text-[11px] text-white/70">{new Date(ann.date).toLocaleDateString('th-TH')}</span>
                      </div>
                      <p className="text-white font-semibold text-base md:text-lg leading-snug">{ann.title}</p>
                      <p className="text-white/80 text-xs mt-1 line-clamp-2">{ann.content}</p>
                    </div>
                  </div>
                ) : (
                  <div className={`px-5 md:px-7 py-8 ${ann.type === 'important' ? 'bg-red-50' : 'bg-gradient-to-r from-brand-50 to-slate-50'}`}>
                    <div className="max-w-2xl mx-auto">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ann.type === 'important' ? 'bg-red-100 text-red-600' : 'bg-brand-100 text-brand-600'}`}>
                          {ann.type === 'important' ? 'สำคัญ' : 'ทั่วไป'}
                        </span>
                        <span className="text-[11px] text-slate-400">{new Date(ann.date).toLocaleDateString('th-TH')}</span>
                      </div>
                      <p className="font-semibold text-slate-800 text-base mb-1">{ann.title}</p>
                      <p className="text-slate-500 text-sm whitespace-pre-wrap">{ann.content}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Arrow buttons */}
        {announcements.length > 1 && (
          <>
            <button onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center text-lg transition-colors z-10">
              ‹
            </button>
            <button onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center text-lg transition-colors z-10">
              ›
            </button>
          </>
        )}
      </div>

      {/* Dots */}
      {announcements.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2.5">
          {announcements.map((_, i) => (
            <button key={i} onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-300 ${i === current ? 'w-5 h-2 bg-brand-500' : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'}`} />
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
  const [popupAnn, setPopupAnn] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.getEnrollments(), api.getAnnouncements()])
      .then(([e, a]) => {
        setEnrollments(e);
        setAnnouncements(a);
        if (a.length > 0 && !sessionStorage.getItem('ann_popup_shown')) {
          setPopupAnn(a[0]);
          sessionStorage.setItem('ann_popup_shown', '1');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const closePopup = () => setPopupAnn(null);

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Loading…</div>;

  const completed = enrollments.filter(e => e.completed);
  const inProgress = enrollments.filter(e => !e.completed);
  const certs = enrollments.filter(e => e.certificate);

  return (
    <div className="p-4 md:p-7 page-enter">

      {/* Announcement Popup */}
      {popupAnn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', padding: 24 }}
          onClick={closePopup}>
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden"
            style={{ width: '100%', maxWidth: 520 }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${popupAnn.type === 'important' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                  {popupAnn.type === 'important' ? 'สำคัญ' : 'ประกาศ'}
                </span>
                <span className="text-xs text-slate-400">{new Date(popupAnn.date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <button onClick={closePopup}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 text-lg flex items-center justify-center transition-colors border-0">
                ×
              </button>
            </div>

            {/* Image */}
            {popupAnn.fileData && popupAnn.fileData.startsWith('data:image') && (
              <div className="mx-6 rounded-xl overflow-hidden" style={{ height: 240 }}>
                <img src={popupAnn.fileData} alt={popupAnn.title} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Content */}
            <div className="px-6 py-4">
              <p className="text-slate-800 font-bold text-lg mb-1.5">{popupAnn.title}</p>
              <p className="text-slate-500 text-sm leading-relaxed whitespace-pre-wrap">{popupAnn.content}</p>
              {popupAnn.link && (
                <a href={popupAnn.link} target="_blank" rel="noopener noreferrer" onClick={closePopup}
                  className="inline-block mt-4 px-5 py-2 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors no-underline">
                  ดูรายละเอียด →
                </a>
              )}
            </div>
            <div className="pb-2" />
          </div>
        </div>
      )}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-navy-900">Welcome back, {user.name.split(' ')[0]}</h2>
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
