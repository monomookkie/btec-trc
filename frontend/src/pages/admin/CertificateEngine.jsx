import { useState, useEffect } from 'react';
import { api } from '../../api';
import Icon from '../../components/ui/Icon';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { CertificateEngineSkeleton } from '../../components/ui/Skeleton';

export default function CertificateEngine({ showToast }) {
  const [certs, setCerts] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [externalCerts, setExternalCerts] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [extSearch, setExtSearch] = useState('');
  const [tab, setTab] = useState('certs');
  const [confirmDel, setConfirmDel] = useState(null);
  const [showIssue, setShowIssue] = useState(false);
  const [showAddExt, setShowAddExt] = useState(false);
  const [extForm, setExtForm] = useState({ userId: '', title: '', issuer: '', issuedAt: '', expiresAt: '' });
  const [extFile, setExtFile] = useState(null);
  const [extFileName, setExtFileName] = useState('');
  const [issueEnrId, setIssueEnrId] = useState('');
  const [issueScore, setIssueScore] = useState('');
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);

  const load = async () => {
    const [c, e, t, ex, u] = await Promise.all([api.getCertificates(), api.getEnrollments(), api.getCertTemplates(), api.getAllExternalCerts(), api.getUsers()]);
    setCerts(c);
    setEnrollments(e.filter(e => e.completed && !e.certificate));
    setTemplates(t);
    setExternalCerts(ex);
    setUsers(u);
  };

  useEffect(() => { load().finally(() => setInitLoading(false)); }, []);

  if (initLoading) return <CertificateEngineSkeleton />;

  const handleIssue = async () => {
    if (!issueEnrId || !issueScore) { showToast('Select enrollment and enter score', 'error'); return; }
    setLoading(true);
    try {
      await api.issueCertificate({ enrollmentId: issueEnrId, score: Number(issueScore) });
      showToast('Certificate issued');
      setShowIssue(false); setIssueEnrId(''); setIssueScore('');
      load();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const handleExtFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return showToast('File must be under 5MB', 'error');
    setExtFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setExtFile(reader.result);
    reader.readAsDataURL(file);
  };

  const handleAddExt = async () => {
    if (!extForm.title.trim() || !extForm.issuer.trim() || !extForm.issuedAt) return showToast('Please fill all required fields', 'error');
    setLoading(true);
    try {
      const cert = await api.addExternalCert({ ...extForm, fileData: extFile });
      setExternalCerts(ex => [{ ...cert, user: users.find(u => u.id === extForm.userId) }, ...ex]);
      setShowAddExt(false);
      setExtForm({ userId: '', title: '', issuer: '', issuedAt: '', expiresAt: '' });
      setExtFile(null); setExtFileName('');
      showToast('Certificate added');
    } catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    try {
      await api.deleteCertificate(confirmDel);
      setCerts(cs => cs.filter(c => c.id !== confirmDel));
      showToast('Certificate deleted');
    } catch (e) { showToast(e.message, 'error'); }
    setConfirmDel(null);
  };

  return (
    <div className="p-7 page-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-navy-900">Certificate Engine</h2>
          <p className="text-slate-400 text-sm mt-1">{certs.length} certificates issued</p>
        </div>
        <button onClick={() => setShowIssue(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-medium transition-colors">
          <Icon name="cert" size={15} /> Issue Certificate
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {[['certs','Certificates'],['external','External Certs'],['templates','Templates']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === k ? 'bg-brand-500 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'certs' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <div className="relative">
              <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by user or course name…"
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-brand-500" />
            </div>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Recipient', 'Course', 'Cert No.', 'Score', 'Issued', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {certs.filter(c => {
                const q = search.toLowerCase();
                return !q || c.user?.name?.toLowerCase().includes(q) || c.course?.title?.toLowerCase().includes(q) || c.certNumber?.toLowerCase().includes(q);
              }).map(c => (
                <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar initials={c.user?.avatar} size={30} />
                      <div>
                        <div className="text-sm font-medium text-navy-900">{c.user?.name}</div>
                        <div className="text-xs text-slate-400">{c.user?.dept}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600 max-w-[200px] truncate">{c.course?.title}</td>
                  <td className="px-5 py-3.5"><span className="font-mono text-xs text-slate-500">{c.certNumber}</span></td>
                  <td className="px-5 py-3.5"><Badge variant="green">{c.score}%</Badge></td>
                  <td className="px-5 py-3.5 text-xs text-slate-400">{new Date(c.issuedAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => setConfirmDel(c.id)} className="p-1.5 rounded-lg border border-red-100 hover:bg-red-50 text-red-400"><Icon name="trash" size={13}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {certs.length === 0 && <div className="text-center py-12 text-slate-400 text-sm">No certificates yet.</div>}
        </div>
      )}

      {tab === 'external' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3">
            <div className="relative flex-1">
              <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={extSearch} onChange={e => setExtSearch(e.target.value)} placeholder="Search by user or certificate name…"
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-brand-500" />
            </div>
            <button onClick={() => setShowAddExt(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-medium transition-colors flex-shrink-0">
              <Icon name="plus" size={14} /> Add
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['User', 'Certificate', 'Issued By', 'Issue Date', 'Expiry', 'File'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {externalCerts.filter(c => {
                const q = extSearch.toLowerCase();
                return !q || c.user?.name?.toLowerCase().includes(q) || c.title?.toLowerCase().includes(q) || c.issuer?.toLowerCase().includes(q);
              }).map(c => {
                const openFile = () => {
                  if (!c.fileData) return;
                  const mime = c.fileData.split(';')[0].replace('data:', '');
                  const isViewable = mime.startsWith('image/') || mime === 'application/pdf';
                  const ext = { 'application/msword': 'doc', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx', 'application/vnd.ms-excel': 'xls', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx' }[mime] || 'file';
                  const bytes = Uint8Array.from(atob(c.fileData.split(',')[1]), ch => ch.charCodeAt(0));
                  const blob = new Blob([bytes], { type: mime });
                  const url = URL.createObjectURL(blob);
                  if (isViewable) { window.open(url, '_blank'); }
                  else { const a = document.createElement('a'); a.href = url; a.download = `${c.title}.${ext}`; a.click(); }
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                };
                return (
                  <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar initials={c.user?.avatar} size={30} />
                        <div>
                          <div className="text-sm font-medium text-navy-900">{c.user?.name}</div>
                          <div className="text-xs text-slate-400">{c.user?.dept}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-navy-900 max-w-[160px] truncate">{c.title}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">{c.issuer}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">{new Date(c.issuedAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '—'}</td>
                    <td className="px-5 py-3.5">
                      {c.fileData
                        ? <button onClick={openFile} className="text-xs text-brand-500 hover:underline">View</button>
                        : <span className="text-xs text-slate-300">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {externalCerts.length === 0 && <div className="text-center py-12 text-slate-400 text-sm">No external certificates.</div>}
        </div>
      )}

      {tab === 'templates' && (
        <div className="space-y-3">
          {templates.map(t => (
            <div key={t.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-white text-sm flex-shrink-0"
                style={{ background: t.primaryColor }}>{t.logoText}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-navy-900">{t.name}</span>
                  {t.isDefault && <Badge variant="blue">Default</Badge>}
                </div>
                <div className="text-xs text-slate-400">{t.orgName} · {t.signatory}</div>
              </div>
            </div>
          ))}
          {templates.length === 0 && <div className="text-center py-12 text-slate-400 text-sm">No templates yet.</div>}
        </div>
      )}

      {/* Issue Modal */}
      <Modal open={showIssue} onClose={() => setShowIssue(false)} title="Issue Certificate" size="440px">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Completed Enrollment</label>
            <select value={issueEnrId} onChange={e => setIssueEnrId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-brand-500">
              <option value="">Select…</option>
              {enrollments.map(e => (
                <option key={e.id} value={e.id}>{e.user?.name} — {e.course?.title}</option>
              ))}
            </select>
            {enrollments.length === 0 && <p className="text-xs text-slate-400 mt-1">No completed enrollments without certificates.</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Score (%)</label>
            <input type="number" min="0" max="100" value={issueScore} onChange={e => setIssueScore(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-brand-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowIssue(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            <button onClick={handleIssue} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-60">
              {loading ? 'Issuing…' : 'Issue Certificate'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add External Cert Modal */}
      <Modal open={showAddExt} onClose={() => setShowAddExt(false)} title="Add External Certificate" size="480px">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Certificate Name *</label>
            <input value={extForm.title} onChange={e => setExtForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. OSHA Safety Training" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-brand-500 focus:bg-white transition-all" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Issued By *</label>
            <input value={extForm.issuer} onChange={e => setExtForm(f => ({ ...f, issuer: e.target.value }))} placeholder="e.g. Ministry of Public Health" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-brand-500 focus:bg-white transition-all" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Issue Date *</label>
            <input type="date" value={extForm.issuedAt} onChange={e => setExtForm(f => ({ ...f, issuedAt: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-brand-500 focus:bg-white transition-all" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Expiry Date (optional)</label>
            <input type="date" value={extForm.expiresAt} onChange={e => setExtForm(f => ({ ...f, expiresAt: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-brand-500 focus:bg-white transition-all" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">File (optional — PDF, JPG, PNG, Word, Excel, max 5MB)</label>
            <label className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
              <Icon name="plus" size={14} className="text-slate-400 flex-shrink-0" />
              <span className="text-sm text-slate-500 truncate">{extFileName || 'Choose file…'}</span>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" onChange={handleExtFile} className="hidden" />
            </label>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={() => setShowAddExt(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={handleAddExt} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-60">
            {loading ? 'Saving…' : 'Add Certificate'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog open={!!confirmDel} title="Revoke Certificate" message="This will permanently delete the certificate." onConfirm={handleDelete} onCancel={() => setConfirmDel(null)} />
    </div>
  );
}
