import { useState, useEffect } from 'react';
import { api } from '../../api';
import { AdminDashboardSkeleton } from '../../components/ui/Skeleton';
import Icon from '../../components/ui/Icon';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const EMPTY_ANN = { title: '', content: '', type: 'info', fileData: null, fileName: '', link: '' };

export default function AdminDashboard({ showToast }) {
  const [summary, setSummary] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Announcement form state
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [annForm, setAnnForm] = useState(EMPTY_ANN);
  const [editAnnId, setEditAnnId] = useState(null);
  const [confirmDelAnn, setConfirmDelAnn] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.getReportSummary(), api.getEnrollments(), api.getCourses(), api.getAnnouncements()])
      .then(([s, e, c, a]) => { setSummary(s); setEnrollments(e); setCourses(c); setAnnouncements(a); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AdminDashboardSkeleton />;

  const statCards = [
    { label: 'Active Users',        val: summary.users,        icon: 'users', color: '#1A56DB', bg: '#EEF3FF' },
    { label: 'Published Courses',   val: summary.courses,      icon: 'book',  color: '#0E7490', bg: '#E0F2FE' },
    { label: 'Certificates Issued', val: summary.certificates, icon: 'cert',  color: '#6D28D9', bg: '#F5F3FF' },
    { label: 'Training Sessions',   val: summary.training,     icon: 'log',   color: '#C0392B', bg: '#FDF2F2' },
  ];

  const inProgress = enrollments.filter(e => !e.completed);
  const publishedCourses = courses.filter(c => c.status === 'PUBLISHED');

  const openNewAnn = () => {
    setAnnForm(EMPTY_ANN);
    setEditAnnId(null);
    setShowAnnModal(true);
  };

  const openEditAnn = (a) => {
    setAnnForm({ title: a.title, content: a.content, type: a.type, fileData: a.fileData || null, fileName: a.fileName || '', link: a.link || '' });
    setEditAnnId(a.id);
    setShowAnnModal(true);
  };

  const handleSaveAnn = async () => {
    if (!annForm.title.trim() || !annForm.content.trim()) {
      showToast('Please fill in title and content', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editAnnId) {
        const updated = await api.updateAnnouncement(editAnnId, annForm);
        setAnnouncements(as => as.map(a => a.id === editAnnId ? updated : a));
        showToast('Announcement updated');
      } else {
        const created = await api.createAnnouncement(annForm);
        setAnnouncements(as => [created, ...as]);
        showToast('Announcement posted');
      }
      setShowAnnModal(false);
    } catch { showToast('Something went wrong', 'error'); }
    finally { setSaving(false); }
  };

  const handleDeleteAnn = async () => {
    await api.deleteAnnouncement(confirmDelAnn);
    setAnnouncements(as => as.filter(a => a.id !== confirmDelAnn));
    setConfirmDelAnn(null);
    showToast('Announcement deleted');
  };

  return (
    <div className="p-4 md:p-7 page-enter">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-navy-900">Admin Dashboard</h2>
        <p className="text-slate-400 text-sm mt-1">HemoLabs Learning Management — Live Overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        {statCards.map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 md:p-5 flex items-center gap-3 md:gap-4 shadow-sm">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg, color: s.color }}>
              <Icon name={s.icon} size={20} />
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-light text-navy-900">{s.val}</div>
              <div className="text-[11px] md:text-xs text-slate-400 mt-0.5">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 mb-5">
        {/* Completion rate */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-navy-900">Course Completion Rate</h3>
            <Badge variant="green">{summary.completionRate}%</Badge>
          </div>
          {publishedCourses.map(c => {
            const enr = enrollments.filter(e => e.courseId === c.id);
            const done = enr.filter(e => e.completed).length;
            const pct = enr.length ? Math.round(done / enr.length * 100) : 0;
            return (
              <div key={c.id} className="mb-3.5">
                <div className="flex justify-between mb-1.5">
                  <span className="text-xs text-slate-600 font-medium truncate flex-1 pr-3">{c.title.length > 36 ? c.title.slice(0, 36) + '…' : c.title}</span>
                  <span className="text-xs text-slate-400 flex-shrink-0">{done}/{enr.length}</span>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}
          {publishedCourses.length === 0 && <p className="text-xs text-slate-400">No published courses yet.</p>}
        </div>

        {/* In-progress enrollments */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-navy-900">In-Progress Enrollments</h3>
            <Badge variant="blue">{inProgress.length}</Badge>
          </div>
          <div className="space-y-3">
            {inProgress.slice(0, 6).map(e => (
              <div key={e.id} className="flex items-center gap-3">
                <Avatar initials={e.user?.avatar} size={30} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-700 truncate">{e.user?.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{e.course?.title}</div>
                </div>
                <div className="text-xs text-slate-400 flex-shrink-0">{e.progress}%</div>
              </div>
            ))}
            {inProgress.length === 0 && <p className="text-xs text-slate-400">No active enrollments.</p>}
          </div>
        </div>
      </div>

      {/* Announcements management */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-navy-900">Announcements</h3>
          <button onClick={openNewAnn}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-medium hover:bg-brand-600">
            <Icon name="plus" size={13} /> Post Announcement
          </button>
        </div>

        {announcements.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-6">No announcements yet.</p>
        )}

        <div className="space-y-3">
          {announcements.map(a => (
            <div key={a.id} className={`flex gap-4 p-4 rounded-xl border ${a.type === 'important' ? 'border-red-100 bg-red-50' : 'border-slate-100 bg-slate-50'}`}>
              {a.fileData && a.fileData.startsWith('data:image') && (
                <img src={a.fileData} alt="" className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={a.type === 'important' ? 'red' : 'blue'} className="text-[10px]">{a.type}</Badge>
                  <span className="text-[10px] text-slate-400">{new Date(a.date).toLocaleDateString()}</span>
                </div>
                <p className="text-sm font-medium text-slate-800 mb-0.5">{a.title}</p>
                <p className="text-xs text-slate-500 line-clamp-2">{a.content}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => openEditAnn(a)} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600">
                  <Icon name="edit" size={13} />
                </button>
                <button onClick={() => setConfirmDelAnn(a.id)} className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-500">
                  <Icon name="trash" size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Announcement modal */}
      <Modal open={showAnnModal} onClose={() => setShowAnnModal(false)}
        title={editAnnId ? 'Edit Announcement' : 'Post New Announcement'} size="560px">
        <div className="space-y-3">
          <div className="flex gap-2">
            {['info', 'important'].map(t => (
              <button key={t} type="button"
                onClick={() => setAnnForm(f => ({ ...f, type: t }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${annForm.type === t
                  ? t === 'important' ? 'bg-red-500 text-white border-red-500' : 'bg-brand-500 text-white border-brand-500'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                {t === 'important' ? '🔴 Important' : '🔵 General'}
              </button>
            ))}
          </div>

          <input
            value={annForm.title}
            onChange={e => setAnnForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Announcement title *"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-500"
          />

          <textarea
            value={annForm.content}
            onChange={e => setAnnForm(f => ({ ...f, content: e.target.value }))}
            placeholder="Announcement content *"
            rows={4}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-500 resize-none"
          />

          <input
            value={annForm.link}
            onChange={e => setAnnForm(f => ({ ...f, link: e.target.value }))}
            placeholder="Link (optional) e.g. https://..."
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-500"
          />

          {/* Image upload */}
          <div>
            <p className="text-xs text-slate-500 mb-2">Image (optional)</p>
            {annForm.fileData && annForm.fileData.startsWith('data:image') && (
              <div className="relative mb-2 inline-block">
                <img src={annForm.fileData} alt="" className="max-h-48 rounded-xl object-cover border border-slate-200" />
                <button
                  onClick={() => setAnnForm(f => ({ ...f, fileData: null, fileName: '' }))}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-black/80">
                  ×
                </button>
              </div>
            )}
            <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer w-fit">
              <Icon name="upload" size={14} className="text-slate-400" />
              <span className="text-xs text-slate-500">{annForm.fileName || 'Choose image...'}</span>
              <input type="file" className="hidden" accept="image/*"
                onChange={e => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = ev => {
                    const img = new Image();
                    img.onload = () => {
                      const MAX_W = 1600;
                      const scale = img.width > MAX_W ? MAX_W / img.width : 1;
                      const canvas = document.createElement('canvas');
                      canvas.width = img.width * scale;
                      canvas.height = img.height * scale;
                      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                      setAnnForm(f => ({ ...f, fileData: canvas.toDataURL('image/jpeg', 0.92), fileName: file.name }));
                    };
                    img.src = ev.target.result;
                  };
                  reader.readAsDataURL(file);
                }} />
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowAnnModal(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-500 hover:bg-slate-50">
              Cancel
            </button>
            <button onClick={handleSaveAnn} disabled={saving}
              className="px-5 py-2 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-60">
              {saving ? 'Saving...' : editAnnId ? 'Update' : 'Post'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelAnn}
        title="Delete Announcement"
        message="Are you sure you want to delete this announcement?"
        onConfirm={handleDeleteAnn}
        onCancel={() => setConfirmDelAnn(null)}
      />
    </div>
  );
}
