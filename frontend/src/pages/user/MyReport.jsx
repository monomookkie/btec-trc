import { useState, useEffect } from 'react';
import { api } from '../../api';
import Badge from '../../components/ui/Badge';
import { ReportSkeleton } from '../../components/ui/Skeleton';

export default function MyReport({ user, showToast }) {
  const [enrollments, setEnrollments] = useState([]);
  const [training, setTraining] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getEnrollments(), api.getTraining()])
      .then(([e, t]) => {
        setEnrollments(e);
        setTraining(t.filter(s => s.attendees?.some(a => a.userId === user.id)));
      })
      .finally(() => setLoading(false));
  }, [user.id]);

  if (loading) return <ReportSkeleton />;

  const completed = enrollments.filter(e => e.completed);
  const inProgress = enrollments.filter(e => !e.completed);
  const avgScore = completed.length ? Math.round(completed.reduce((s, e) => s + (e.score || 0), 0) / completed.length) : 0;

  return (
    <div className="p-4 md:p-7 page-enter">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-navy-900">My Report</h2>
        <p className="text-slate-400 text-sm mt-1">Personal training summary for {user.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        {[
          { label: 'Enrolled',   val: enrollments.length, color: 'text-brand-500' },
          { label: 'Completed',  val: completed.length,   color: 'text-emerald-600' },
          { label: 'In Progress',val: inProgress.length,  color: 'text-amber-600' },
          { label: 'Avg Score',  val: `${avgScore}%`,     color: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 md:p-5 shadow-sm text-center">
            <div className={`text-2xl md:text-3xl font-light ${s.color}`}>{s.val}</div>
            <div className="text-xs text-slate-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        {/* Course progress */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-navy-900 mb-4">Course Progress</h3>
          <div className="space-y-4">
            {enrollments.map(e => (
              <div key={e.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-700 font-medium truncate flex-1 pr-3">{e.course?.title}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {e.score != null && <Badge variant="green" className="text-[10px]">{e.score}%</Badge>}
                    {e.completed
                      ? <Badge variant="green">Done</Badge>
                      : <span className="text-[11px] text-slate-400">{e.progress}%</span>
                    }
                  </div>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${e.progress}%` }} /></div>
              </div>
            ))}
            {enrollments.length === 0 && <p className="text-xs text-slate-400">No enrollments yet.</p>}
          </div>
        </div>

        {/* Training attendance */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-navy-900 mb-4">Training Attendance ({training.length})</h3>
          <div className="space-y-3">
            {training.map(t => (
              <div key={t.id} className="p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-700 truncate flex-1 pr-2">{t.title}</span>
                  <Badge variant={t.type === 'classroom' ? 'blue' : 'green'} className="text-[10px] flex-shrink-0">{t.type}</Badge>
                </div>
                <div className="text-[11px] text-slate-400">
                  {new Date(t.date).toLocaleDateString()} · {t.duration} min · {t.location}
                </div>
              </div>
            ))}
            {training.length === 0 && <p className="text-xs text-slate-400">No training sessions recorded.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
