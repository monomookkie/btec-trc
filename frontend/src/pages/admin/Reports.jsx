import { useState, useEffect } from 'react';
import { api } from '../../api';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Icon from '../../components/ui/Icon';
import { AdminReportSkeleton } from '../../components/ui/Skeleton';

export default function Reports({ showToast }) {
  const [compliance, setCompliance] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getComplianceReport(), api.getReportSummary()])
      .then(([c, s]) => { setCompliance(c); setSummary(s); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AdminReportSkeleton />;

  return (
    <div className="p-4 md:p-7 page-enter">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-navy-900">Reports & Analytics</h2>
        <p className="text-slate-400 text-sm mt-1">Compliance tracking and training overview</p>
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-7">
          {[
            { label: 'Total Enrollments', val: summary.enrollments, color: 'text-brand-500' },
            { label: 'Completion Rate',   val: `${summary.completionRate}%`, color: 'text-emerald-600' },
            { label: 'Certificates',      val: summary.certificates, color: 'text-purple-600' },
            { label: 'Training Sessions', val: summary.training, color: 'text-red-500' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 md:p-5 shadow-sm">
              <div className={`text-2xl md:text-3xl font-light ${s.color}`}>{s.val}</div>
              <div className="text-xs text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 md:px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-navy-900">Mandatory Course Compliance</h3>
        </div>
        {compliance.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">No user data available.</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {compliance.map(({ user, mandatory, complianceRate }) => (
              <div key={user.id} className="px-5 md:px-6 py-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar initials={user.avatar} size={34} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-navy-900">{user.name}</div>
                    <div className="text-xs text-slate-400">{user.dept}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-16 md:w-24 progress-bar">
                      <div className="progress-fill" style={{ width: `${complianceRate}%`, background: complianceRate === 100 ? '#10b981' : complianceRate >= 50 ? '#f59e0b' : '#ef4444' }} />
                    </div>
                    <Badge variant={complianceRate === 100 ? 'green' : complianceRate >= 50 ? 'amber' : 'red'}>{complianceRate}%</Badge>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {mandatory.map(m => (
                    <div key={m.course} className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full ${m.completed ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      <Icon name={m.completed ? 'check' : 'x'} size={10} />
                      <span className="truncate max-w-[120px] md:max-w-[160px]">{m.course}</span>
                      {m.score != null && <span className="font-medium">{m.score}%</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
