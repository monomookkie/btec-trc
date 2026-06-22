import { useState, useEffect } from 'react';
import { api } from '../../api';
import Icon from '../../components/ui/Icon';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { UsersPageSkeleton } from '../../components/ui/Skeleton';

const EMPTY_FORM = { name: '', email: '', password: '', role: 'USER', dept: '' };

export default function UsersPage({ showToast }) {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmDel, setConfirmDel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { api.getUsers().then(setUsers).finally(() => setInitLoading(false)); }, []);

  if (initLoading) return <UsersPageSkeleton />;

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => { setForm(EMPTY_FORM); setEditId(null); setShowModal(true); };
  const openEdit = (u) => { setForm({ name: u.name, email: u.email, password: '', role: u.role, dept: u.dept }); setEditId(u.id); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) { showToast('Fill required fields', 'error'); return; }
    setLoading(true);
    try {
      if (editId) {
        const updated = await api.updateUser(editId, form);
        setUsers(us => us.map(u => u.id === editId ? { ...u, ...updated } : u));
        showToast('User updated');
      } else {
        const created = await api.createUser(form);
        setUsers(us => [...us, created]);
        showToast('User created');
      }
      setShowModal(false);
    } catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    try {
      await api.deleteUser(confirmDel);
      setUsers(us => us.filter(u => u.id !== confirmDel));
      showToast('User deleted');
    } catch (e) { showToast(e.message, 'error'); }
    setConfirmDel(null);
  };

  const inputCls = 'w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-brand-500 focus:bg-white transition-all';

  return (
    <div className="p-4 md:p-7 page-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-navy-900">User Directory</h2>
          <p className="text-slate-400 text-sm mt-1">{users.length} registered users</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-3 md:px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-medium transition-colors">
          <Icon name="plus" size={15} /> <span className="hidden sm:inline">Add User</span>
        </button>
      </div>

      <div className="relative mb-5">
        <Icon name="search" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-brand-500" />
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {['User', 'Department', 'Role', 'Enrollments', 'Certificates', ''].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar initials={u.avatar} size={34} />
                    <div>
                      <div className="text-sm font-medium text-navy-900">{u.name}</div>
                      <div className="text-xs text-slate-400">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm text-slate-600">{u.dept}</td>
                <td className="px-5 py-3.5"><Badge variant={u.role === 'ADMIN' ? 'red' : 'blue'}>{u.role}</Badge></td>
                <td className="px-5 py-3.5 text-sm text-slate-500">{u._count?.enrollments ?? 0}</td>
                <td className="px-5 py-3.5 text-sm text-slate-500">{u._count?.certificates ?? 0}</td>
                <td className="px-5 py-3.5">
                  <div className="flex gap-1.5 justify-end">
                    <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500"><Icon name="edit" size={13}/></button>
                    <button onClick={() => setConfirmDel(u.id)} className="p-1.5 rounded-lg border border-red-100 hover:bg-red-50 text-red-400"><Icon name="trash" size={13}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-12 text-slate-400 text-sm">No users found.</div>}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.map(u => (
          <div key={u.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <Avatar initials={u.avatar} size={38} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-navy-900 truncate">{u.name}</div>
                <div className="text-xs text-slate-400 truncate">{u.email}</div>
              </div>
              <Badge variant={u.role === 'ADMIN' ? 'red' : 'blue'}>{u.role}</Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
              <span>{u.dept}</span>
              <span>·</span>
              <span>{u._count?.enrollments ?? 0} enrolled</span>
              <span>·</span>
              <span>{u._count?.certificates ?? 0} certs</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(u)} className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1.5">
                <Icon name="edit" size={13}/> Edit
              </button>
              <button onClick={() => setConfirmDel(u.id)} className="flex-1 py-2 rounded-xl border border-red-100 text-xs font-medium text-red-500 hover:bg-red-50 flex items-center justify-center gap-1.5">
                <Icon name="trash" size={13}/> Delete
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center py-12 text-slate-400 text-sm">No users found.</div>}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Edit User' : 'Add User'} size="480px">
        <div className="space-y-4">
          {[
            { label: 'Full Name *', key: 'name', ph: 'Dr. Jane Doe' },
            { label: 'Email *', key: 'email', ph: 'user@hemolabs.org', type: 'email' },
            { label: editId ? 'New Password (leave blank to keep)' : 'Password', key: 'password', ph: 'min 6 characters', type: 'password' },
            { label: 'Department', key: 'dept', ph: 'e.g. Blood Screening' },
          ].map(({ label, key, ph, type }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">{label}</label>
              <input type={type || 'text'} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={ph} className={inputCls} />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Role</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className={inputCls}>
              <option value="USER">User</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            <button onClick={handleSave} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-60">
              {loading ? 'Saving…' : editId ? 'Update' : 'Create User'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!confirmDel} title="Delete User" message="This will permanently delete the user and all their data." onConfirm={handleDelete} onCancel={() => setConfirmDel(null)} />
    </div>
  );
}
