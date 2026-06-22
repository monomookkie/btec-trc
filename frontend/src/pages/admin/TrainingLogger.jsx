import { useState, useEffect } from 'react';
import { api } from '../../api';
import Icon from '../../components/ui/Icon';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const EMPTY_FORM = { title: '', date: '', trainer: '', location: '', duration: '', type: 'classroom', topics: '', doc: '', attendeeIds: [] };

export default function TrainingLogger({ showToast }) {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmDel, setConfirmDel] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([api.getTraining(), api.getUsers()]).then(([t, u]) => { setLogs(t); setUsers(u.filter(u => u.role === 'USER')); });
  }, []);

  const openNew = () => { setForm({ ...EMPTY_FORM, attendeeIds: [] }); setEditId(null); setShowModal(true); };
  const openEdit = (l) => {
    setForm({ title: l.title, date: l.date?.slice(0, 10), trainer: l.trainer, location: l.location, duration: l.duration, type: l.type, topics: l.topics, doc: l.doc || '', attendeeIds: l.attendees?.map(a => a.userId) || [] });
    setEditId(l.id); setShowModal(true);
  };

  const toggleAttendee = (uid) => setForm(f => ({ ...f, attendeeIds: f.attendeeIds.includes(uid) ? f.attendeeIds.filter(x => x !== uid) : [...f.attendeeIds, uid] }));

  const handleSave = async () => {
    if (!form.title.trim() || !form.date || !form.duration) { showToast('Fill required fields', 'error'); return; }
    setLoading(true);
    try {
      if (editId) {
        const updated = await api.updateTraining(editId, form);
        setLogs(ls => ls.map(l => l.id === editId ? updated : l));
        showToast('Training log updated');
      } else {
        const created = await api.createTraining(form);
        setLogs(ls => [created, ...ls]);
        showToast('Training log created');
      }
      setShowModal(false);
    } catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    try {
      await api.deleteTraining(confirmDel);
      setLogs(ls => ls.filter(l => l.id !== confirmDel));
      showToast('Deleted');
    } catch (e) { showToast(e.message, 'error'); }
    setConfirmDel(null);
  };

  const inputCls = 'w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-brand-500 focus:bg-white transition-all';

  return (
    <div className="p-7 page-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-navy-900">Training Logger</h2>
          <p className="text-slate-400 text-sm mt-1">{logs.length} sessions recorded</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-medium transition-colors">
          <Icon name="plus" size={15} /> Log Session
        </button>
      </div>

      <div className="space-y-3">
        {logs.map(l => (
          <div key={l.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <span className="font-medium text-navy-900 text-sm">{l.title}</span>
                  <Badge variant={l.type === 'classroom' ? 'blue' : 'green'}>{l.type}</Badge>
                  {l.doc && <Badge variant="gray" className="font-mono text-[10px]">{l.doc}</Badge>}
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                  <span>{new Date(l.date).toLocaleDateString()}</span>
                  <span>·</span>
                  <span>{l.trainer}</span>
                  <span>·</span>
                  <span>{l.location}</span>
                  <span>·</span>
                  <span>{l.duration} min</span>
                </div>
                <p className="text-xs text-slate-500 mb-3 line-clamp-2">{l.topics}</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(l.attendees || []).map(a => (
                    <div key={a.userId} className="flex items-center gap-1.5 bg-slate-50 rounded-full px-2.5 py-1">
                      <Avatar initials={a.user?.avatar} size={18} />
                      <span className="text-[11px] text-slate-600">{a.user?.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openEdit(l)} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500"><Icon name="edit" size={14}/></button>
                <button onClick={() => setConfirmDel(l.id)} className="p-2 rounded-lg border border-red-100 hover:bg-red-50 text-red-400"><Icon name="trash" size={14}/></button>
              </div>
            </div>
          </div>
        ))}
        {logs.length === 0 && <div className="text-center py-12 text-slate-400 text-sm">No training logs yet.</div>}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Edit Training Log' : 'Log Training Session'} size="620px">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Title *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputCls} placeholder="e.g. Annual BioSafety Refresher" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Date *</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inputCls}>
                <option value="classroom">Classroom</option>
                <option value="practical">Practical</option>
                <option value="online">Online</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Trainer</label>
              <input value={form.trainer} onChange={e => setForm(f => ({ ...f, trainer: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Location</label>
              <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Duration (min) *</label>
              <input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Doc No.</label>
              <input value={form.doc} onChange={e => setForm(f => ({ ...f, doc: e.target.value }))} className={inputCls} placeholder="BTEC-TR-2025-001" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Topics</label>
            <textarea value={form.topics} onChange={e => setForm(f => ({ ...f, topics: e.target.value }))} rows={3} className={inputCls + ' resize-none'} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2">Attendees ({form.attendeeIds.length} selected)</label>
            <div className="grid grid-cols-2 gap-2">
              {users.map(u => (
                <button key={u.id} onClick={() => toggleAttendee(u.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left text-xs transition-colors ${form.attendeeIds.includes(u.id) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                  <Avatar initials={u.avatar} size={24} />
                  <span className="font-medium">{u.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            <button onClick={handleSave} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-60">
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!confirmDel} title="Delete Training Log" message="This action cannot be undone." onConfirm={handleDelete} onCancel={() => setConfirmDel(null)} />
    </div>
  );
}
