import { useState, useEffect, useRef } from 'react';
import { api } from '../../api';
import Icon from '../../components/ui/Icon';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { CertificateSkeleton } from '../../components/ui/Skeleton';

export default function MyCertificates({ user, showToast }) {
  const [certs, setCerts] = useState([]);
  const [external, setExternal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', issuer: '', issuedAt: '', expiresAt: '' });
  const [fileData, setFileData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [saving, setSaving] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const certRefs = useRef({});

  const handleDownload = async (c) => {
    setDownloadingId(c.id);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');
      const el = certRefs.current[c.id];
      const canvas = await html2canvas(el, { scale: 3, useCORS: true, backgroundColor: null });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const ratio = canvas.width / canvas.height;
      let w = pw - 20, h = w / ratio;
      if (h > ph - 20) { h = ph - 20; w = h * ratio; }
      pdf.addImage(imgData, 'PNG', (pw - w) / 2, (ph - h) / 2, w, h);
      pdf.save(`Certificate-${c.certNumber}.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      setDownloadingId(null);
    }
  };

  useEffect(() => {
    Promise.all([api.getCertificates(), api.getExternalCerts()])
      .then(([c, e]) => { setCerts(c); setExternal(e); })
      .finally(() => setLoading(false));
  }, []);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return showToast('File must be under 5MB', 'error');
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setFileData(reader.result);
    reader.readAsDataURL(file);
  };

  const handleAdd = async () => {
    if (!form.title.trim() || !form.issuer.trim() || !form.issuedAt) return showToast('Please fill all required fields', 'error');
    setSaving(true);
    try {
      const cert = await api.addExternalCert({ ...form, fileData });
      setExternal(e => [cert, ...e]);
      setShowAdd(false);
      setForm({ title: '', issuer: '', issuedAt: '', expiresAt: '' });
      setFileData(null); setFileName('');
      showToast('Certificate added');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteExternalCert(id);
      setExternal(e => e.filter(c => c.id !== id));
      showToast('Certificate removed');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  if (loading) return <CertificateSkeleton />;

  const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-brand-500 focus:bg-white transition-all';

  return (
    <div className="p-4 md:p-7 page-enter">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-navy-900">My Certificates</h2>
          <p className="text-slate-400 text-sm mt-1">{certs.length + external.length} certificates total</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors">
          <Icon name="plus" size={15} /> Add
        </button>
      </div>

      {/* Course Certificates */}
      {certs.length > 0 && (
        <>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Course Certificates</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {certs.map(c => (
              <div key={c.id} className="bg-white rounded-2xl border border-slate-100 p-5 md:p-6 shadow-sm">
                {/* cert card — captured for PDF */}
                <div ref={el => certRefs.current[c.id] = el}
                  className="rounded-xl p-4 md:p-5 mb-4 text-white text-center"
                  style={{ background: 'linear-gradient(135deg,#0D1B2A,#1A56DB)' }}>
                  <img src="/logo.png" alt="Logo" className="w-12 h-12 mx-auto mb-1 object-contain" />
                  <div className="text-[10px] uppercase tracking-widest opacity-60 mb-4">Certificate of Completion</div>
                  <div className="text-xs opacity-70 mb-1">This certifies that</div>
                  <div className="font-semibold text-base mb-1">{user.name}</div>
                  <div className="text-xs opacity-70 mb-3">has successfully completed</div>
                  <div className="text-sm font-medium px-4 leading-snug">{c.course?.title}</div>
                  <div className="mt-3 text-[10px] opacity-50">Score: {c.score}% · Issued {new Date(c.issuedAt).toLocaleDateString('th-TH')}</div>
                  <div className="mt-1 font-mono text-[10px] opacity-30">{c.certNumber}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">{c.course?.category}</div>
                    <div className="text-[11px] text-slate-400">Issued {new Date(c.issuedAt).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="green" className="text-sm font-semibold">{c.score}%</Badge>
                    <button onClick={() => handleDownload(c)} disabled={downloadingId === c.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors disabled:opacity-60">
                      {downloadingId === c.id ? (
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                      ) : (
                        <Icon name="download" size={12} />
                      )}
                      {downloadingId === c.id ? 'Generating…' : 'Download PDF'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* External Certificates */}
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">External Certificates</div>
      {external.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Icon name="cert" size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No external certificates yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {external.map(c => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-navy-900 mb-1">{c.title}</p>
                  <p className="text-xs text-slate-500">{c.issuer}</p>
                </div>
                <button onClick={() => handleDelete(c.id)} className="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0 p-1">
                  <Icon name="x" size={14} />
                </button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span>Issued {new Date(c.issuedAt).toLocaleDateString()}</span>
                  {c.expiresAt && <><span>·</span><span>Expires {new Date(c.expiresAt).toLocaleDateString()}</span></>}
                </div>
                {c.fileData && (() => {
                  const mime = c.fileData.split(';')[0].replace('data:', '');
                  const isViewable = mime.startsWith('image/') || mime === 'application/pdf';
                  const ext = { 'application/msword': 'doc', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx', 'application/vnd.ms-excel': 'xls', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx' }[mime] || 'file';
                  const openFile = () => {
                    const base64 = c.fileData.split(',')[1];
                    const bytes = Uint8Array.from(atob(base64), ch => ch.charCodeAt(0));
                    const blob = new Blob([bytes], { type: mime });
                    const url = URL.createObjectURL(blob);
                    if (isViewable) { window.open(url, '_blank'); }
                    else { const a = document.createElement('a'); a.href = url; a.download = `${c.title}.${ext}`; a.click(); }
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                  };
                  return (
                    <button onClick={openFile} className="text-xs text-brand-500 hover:underline flex items-center gap-1 flex-shrink-0">
                      <Icon name="search" size={11} /> {isViewable ? 'View' : 'Download'}
                    </button>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      )}

      {certs.length === 0 && external.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          <Icon name="cert" size={40} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm">No certificates yet.</p>
        </div>
      )}

      {/* Add Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add External Certificate" size="480px">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Certificate Name *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. OSHA Safety Training" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Issued By *</label>
            <input value={form.issuer} onChange={e => setForm(f => ({ ...f, issuer: e.target.value }))} placeholder="e.g. Ministry of Public Health" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Issue Date *</label>
            <input type="date" value={form.issuedAt} onChange={e => setForm(f => ({ ...f, issuedAt: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Expiry Date (optional)</label>
            <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">File (optional — PDF, JPG, PNG, Word, Excel, max 5MB)</label>
            <label className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
              <Icon name="plus" size={14} className="text-slate-400 flex-shrink-0" />
              <span className="text-sm text-slate-500 truncate">{fileName || 'Choose file…'}</span>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" onChange={handleFile} className="hidden" />
            </label>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={handleAdd} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-60">
            {saving ? 'Saving…' : 'Add Certificate'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
