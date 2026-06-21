import { useState, useEffect } from 'react';
import { api } from '../../api';
import Icon from '../../components/ui/Icon';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

export default function CertificateEngine({ showToast }) {
  const [certs, setCerts] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [externalCerts, setExternalCerts] = useState([]);
  const [tab, setTab] = useState('certs');
  const [confirmDel, setConfirmDel] = useState(null);
  const [showIssue, setShowIssue] = useState(false);
  const [issueEnrId, setIssueEnrId] = useState('');
  const [issueScore, setIssueScore] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const [c, e, t, ex] = await Promise.all([api.getCertificates(), api.getEnrollments(), api.getCertTemplates(), api.getAllExternalCerts()]);
    setCerts(c);
    setEnrollments(e.filter(e => e.completed && !e.certificate));
    setTemplates(t);
    setExternalCerts(ex);
  };

  useEffect(() => { load(); }, []);

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
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Recipient', 'Course', 'Cert No.', 'Score', 'Issued', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {certs.map(c => (
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
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Staff', 'Certificate', 'Issued By', 'Issue Date', 'Expiry', 'File'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {externalCerts.map(c => {
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

      <ConfirmDialog open={!!confirmDel} title="Revoke Certificate" message="This will permanently delete the certificate." onConfirm={handleDelete} onCancel={() => setConfirmDel(null)} />
    </div>
  );
}
