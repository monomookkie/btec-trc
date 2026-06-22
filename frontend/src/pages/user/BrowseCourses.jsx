import { useState, useEffect, useRef } from 'react';
import { api } from '../../api';
import Icon from '../../components/ui/Icon';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { BrowseCourseSkeleton } from '../../components/ui/Skeleton';

const TYPE_META = {
  pdf:   { label: 'PDF', color: 'red' }, word: { label: 'DOC', color: 'blue' },
  ppt:   { label: 'PPT', color: 'amber' }, video: { label: 'VID', color: 'green' },
  link:  { label: 'URL', color: 'purple' },
};

export default function BrowseCourses({ user, showToast }) {
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [search, setSearch] = useState('');
  const [viewCourse, setViewCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  // Quiz state
  const [quizMode, setQuizMode] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);

  // Material confirm state: { [materialId]: countdown (seconds left) | 0 = ready | null = not opened }
  const [matCountdown, setMatCountdown] = useState({});
  const countdownRefs = useRef({});

  const CONFIRM_SECONDS = 30;
  const [expandedMat, setExpandedMat] = useState(null);

  const [ytPlaying, setYtPlaying] = useState({});
  const [ytVolume, setYtVolume] = useState({});
  const [ytEnded, setYtEnded] = useState({});
  const [ytShowControls, setYtShowControls] = useState({});
  const ytRefs = useRef({});
  const ytContainerRefs = useRef({});
  const ytControlTimers = useRef({});

  const showControls = (materialId) => {
    setYtShowControls(s => ({ ...s, [materialId]: true }));
    clearTimeout(ytControlTimers.current[materialId]);
    ytControlTimers.current[materialId] = setTimeout(() => {
      setYtShowControls(s => ({ ...s, [materialId]: false }));
    }, 3000);
  };

  const getYouTubeEmbedUrl = (url) => {
    try {
      const u = new URL(url);
      let videoId = null;
      if (u.hostname.includes('youtube.com')) videoId = u.searchParams.get('v');
      else if (u.hostname === 'youtu.be') videoId = u.pathname.slice(1);
      if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&disablekb=1&rel=0&modestbranding=1&enablejsapi=1&vq=hd1080`;
    } catch (_) {}
    return null;
  };

  const ytCommand = (materialId, func, args) => {
    const iframe = ytRefs.current[materialId];
    if (!iframe) return;
    iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args: args || [] }), '*');
  };

  const toggleYtPlay = (materialId) => {
    const playing = ytPlaying[materialId];
    ytCommand(materialId, playing ? 'pauseVideo' : 'playVideo');
    setYtPlaying(s => ({ ...s, [materialId]: !playing }));
  };

  const changeYtVolume = (materialId, value) => {
    ytCommand(materialId, 'unMute');
    ytCommand(materialId, 'setVolume', [value]);
    setYtVolume(s => ({ ...s, [materialId]: value }));
  };

  const toggleYtFullscreen = (materialId) => {
    const el = ytContainerRefs.current[materialId];
    if (!el) return;
    const exitFs = document.exitFullscreen || document.webkitExitFullscreen;
    const enterFs = el.requestFullscreen || el.webkitRequestFullscreen;
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      exitFs && exitFs.call(document);
      return;
    }
    else enterFs && enterFs.call(el);
  };

  // Listen for YouTube video ended event (state = 0)
  useEffect(() => {
    const handler = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.event !== 'infoDelivery' || data.info?.playerState === undefined) return;
        const state = data.info.playerState;
        // Find which material this iframe belongs to
        const matId = Object.keys(ytRefs.current).find(id => ytRefs.current[id]?.contentWindow === e.source);
        if (!matId) return;
        if (state === 1) {
          setYtPlaying(s => ({ ...s, [matId]: true }));
          // Force highest available quality on play
          ytRefs.current[matId]?.contentWindow?.postMessage(
            JSON.stringify({ event: 'command', func: 'setPlaybackQuality', args: ['hd1080'] }), '*'
          );
        }
        if (state === 2) setYtPlaying(s => ({ ...s, [matId]: false }));
        if (state === 0) {
          setYtPlaying(s => ({ ...s, [matId]: false }));
          setYtEnded(s => ({ ...s, [matId]: true }));
        }
      } catch (_) {}
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const startCountdown = (materialId) => {
    if (matCountdown[materialId] !== undefined) return; // already opened
    setMatCountdown(s => ({ ...s, [materialId]: CONFIRM_SECONDS }));
    const interval = setInterval(() => {
      setMatCountdown(s => {
        const cur = s[materialId];
        if (cur <= 1) {
          clearInterval(interval);
          return { ...s, [materialId]: 0 };
        }
        return { ...s, [materialId]: cur - 1 };
      });
    }, 1000);
    countdownRefs.current[materialId] = interval;
  };

  // Clear timers on modal close
  const closeCourse = () => {
    Object.values(countdownRefs.current).forEach(clearInterval);
    countdownRefs.current = {};
    setMatCountdown({});
    setExpandedMat(null);
    setYtPlaying({});
    setYtVolume({});
    setYtEnded({});
    setYtShowControls({});
    Object.values(ytControlTimers.current).forEach(clearTimeout);
    ytControlTimers.current = {};
    ytRefs.current = {};
    ytContainerRefs.current = {};
    setViewCourse(null);
  };

  useEffect(() => {
    Promise.all([api.getCourses(), api.getEnrollments()])
      .then(([c, e]) => {
        const enrolledIds = new Set(e.map(en => en.courseId));
        setCourses(c.filter(c => c.status === 'PUBLISHED' || enrolledIds.has(c.id)));
        setEnrollments(e);
      })
      .finally(() => setLoading(false));
  }, []);

  const getEnrollment = (courseId) => enrollments.find(e => e.courseId === courseId);

  const handleOpenMaterial = (m, isDone) => {
    if (m.dataUrl) {
      fetch(m.dataUrl).then(r => r.blob()).then(blob => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      });
      if (!isDone) startCountdown(m.id);
    } else {
      const embedUrl = getYouTubeEmbedUrl(m.url);
      if (embedUrl) {
        setExpandedMat(prev => prev === m.id ? null : m.id);
        // YouTube: no countdown — wait for video to end instead
      } else if (m.url && m.url !== '#') {
        window.open(m.url, '_blank');
        if (!isDone) startCountdown(m.id);
      }
    }
  };

  const handleConfirmMaterial = async (m, enr) => {
    if (!enr || matCountdown[m.id] !== 0) return;
    try {
      const result = await api.markMaterialDone(enr.id, m.id);
      setEnrollments(es => es.map(e => e.id === enr.id
        ? { ...e, completedMaterials: JSON.stringify(result.completedMaterials), progress: result.progress, completed: result.completed ?? e.completed }
        : e
      ));
      showToast('Progress saved');
    } catch (_) {}
  };

  const filtered = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleEnroll = async (courseId) => {
    try {
      const enr = await api.enroll(courseId);
      setEnrollments(es => [...es, enr]);
      showToast('Enrolled successfully!');
    } catch (e) { showToast(e.message, 'error'); }
  };

  const openCourse = (c) => {
    setViewCourse(c);
    setQuizMode(false);
    setQuizAnswers({});
    setQuizResult(null);
  };

  const submitQuiz = async () => {
    const qs = viewCourse.questions || [];
    let correct = 0;
    qs.forEach((q, i) => { if (Number(quizAnswers[i]) === q.correct) correct++; });
    const passed = correct >= (viewCourse.quizRequired || qs.length);
    setQuizResult({ correct, total: qs.length, passed });

    const enr = getEnrollment(viewCourse.id);
    if (enr) {
      try {
        const result = await api.submitQuiz(enr.id, { correct, total: qs.length, passed });
        setEnrollments(es => es.map(e => e.id === enr.id
          ? { ...e, quizPassed: result.quizPassed, quizScore: result.quizScore, completed: result.completed ?? e.completed }
          : e
        ));
      } catch (_) {}
    }
  };

  if (loading) return <BrowseCourseSkeleton />;

  return (
    <div className="p-4 md:p-7 page-enter">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-navy-900">Course Catalogue</h2>
        <p className="text-slate-400 text-sm mt-1">{courses.length} courses available</p>
      </div>

      <div className="relative mb-5">
        <Icon name="search" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-brand-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(c => {
          const enr = getEnrollment(c.id);
          const hasQuiz = (c.questions || []).length > 0;
          return (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-navy-900 mb-1.5">{c.title}</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="blue" className="text-[10px]">{c.category}</Badge>
                    {hasQuiz && <Badge variant="purple" className="text-[10px]">Has Post-Test</Badge>}
                  </div>
                </div>
                {enr && (
                  <div className="flex-shrink-0 text-right">
                    <div className="text-xs text-slate-400 mb-1">{enr.progress}%</div>
                    <div className="w-16 progress-bar"><div className="progress-fill" style={{ width: `${enr.progress}%` }} /></div>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 mb-4 line-clamp-2">{c.description}</p>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-4">
                <span>{c.duration} min</span>
                <span>·</span>
                <span>Pass: {c.passScore}%</span>
                <span>·</span>
                <span>{(c.materials || []).length} materials</span>
                {hasQuiz && <><span>·</span><span>{(c.questions || []).length} questions</span></>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => openCourse(c)} className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  View Details
                </button>
                {!enr ? (
                  <button onClick={() => handleEnroll(c.id)} className="flex-1 py-2 rounded-xl bg-brand-500 text-white text-xs font-medium hover:bg-brand-600 transition-colors">
                    Enroll
                  </button>
                ) : enr.completed ? (
                  <Badge variant="green" className="flex-1 justify-center py-2">Completed</Badge>
                ) : enr.progress >= 100 && (c.questions || []).length > 0 && !enr.quizPassed ? (
                  <button onClick={() => openCourse(c)} className="flex-1 py-2 rounded-xl bg-purple-600 text-white text-xs font-medium hover:bg-purple-700 transition-colors">
                    Take Post-Test
                  </button>
                ) : (
                  <Badge variant="amber" className="flex-1 justify-center py-2">In Progress</Badge>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div className="col-span-full text-center py-12 text-slate-400 text-sm">No courses found.</div>}
      </div>

      {/* Course Detail / Quiz Modal */}
      <Modal open={!!viewCourse} onClose={closeCourse} title={quizMode ? `Post-Test: ${viewCourse?.title}` : (viewCourse?.title || '')} size="640px">
        {viewCourse && !quizMode && (
          <div>
            <p className="text-sm text-slate-600 mb-5">{viewCourse.description}</p>
            <div className="flex flex-wrap gap-4 text-xs text-slate-400 mb-4">
              <span><strong className="text-slate-600">Category:</strong> {viewCourse.category}</span>
              <span><strong className="text-slate-600">Duration:</strong> {viewCourse.duration} min</span>
              <span><strong className="text-slate-600">Pass Score:</strong> {viewCourse.passScore}%</span>
            </div>
            <div className="flex gap-1.5 flex-wrap mb-5">
              {(viewCourse.tags || []).map(t => <Badge key={t} variant="blue" className="text-[10px]">{t}</Badge>)}
            </div>

            {/* Materials */}
            {viewCourse.materials?.length > 0 && (() => {
              const enr = getEnrollment(viewCourse.id);
              const doneMaterials = JSON.parse(enr?.completedMaterials || '[]');
              return (
                <div className="mb-5">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Materials</h4>
                  <div className="space-y-2">
                    {viewCourse.materials.map(m => {
                      const meta = TYPE_META[m.type] || { label: 'FILE', color: 'gray' };
                      const isDone = doneMaterials.includes(m.id);
                      return (
                        <div key={m.id} className={`flex flex-col gap-2 p-3 rounded-xl border transition-colors ${isDone ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-transparent'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold ${isDone ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                              {isDone ? '✓' : '✕'}
                            </div>
                            <Badge variant={meta.color} className="font-mono text-[10px] flex-shrink-0">{meta.label}</Badge>
                            <span className={`text-sm flex-1 truncate ${isDone ? 'text-emerald-700 font-medium' : 'text-slate-700'}`}>{m.title}</span>
                            {Number(m.weight) > 0 && (
                              <span className="text-[10px] font-semibold text-brand-500 bg-brand-50 px-2 py-0.5 rounded-full flex-shrink-0">
                                +{m.weight}%
                              </span>
                            )}
                            {(m.url && m.url !== '#' || m.dataUrl) && (
                              <button onClick={() => handleOpenMaterial(m, isDone)}
                                className={`text-xs flex-shrink-0 transition-colors ${isDone ? 'text-emerald-600 hover:text-emerald-700' : 'text-brand-500 hover:text-brand-700'}`}>
                                {m.dataUrl ? 'Open File →' : getYouTubeEmbedUrl(m.url) ? (expandedMat === m.id ? 'Hide ↑' : 'Watch ▶') : 'Open →'}
                              </button>
                            )}
                          </div>
                          {/* YouTube embed */}
                          {expandedMat === m.id && getYouTubeEmbedUrl(m.url) && (
                            <div ref={el => ytContainerRefs.current[m.id] = el}
                              className="rounded-xl overflow-hidden border border-slate-200 aspect-video w-full relative bg-black"
                              onMouseMove={() => showControls(m.id)}
                              onMouseLeave={() => {
                                clearTimeout(ytControlTimers.current[m.id]);
                                setYtShowControls(s => ({ ...s, [m.id]: false }));
                              }}>
                              {/* iframe — pointer-events:none blocks seek */}
                              <iframe
                                ref={el => ytRefs.current[m.id] = el}
                                src={getYouTubeEmbedUrl(m.url)}
                                className="w-full h-full pointer-events-none"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              />
                              {/* Transparent overlay — desktop click = play/pause, mobile touch = show controls first */}
                              <div className="absolute inset-0 bottom-14 cursor-pointer"
                                onClick={() => toggleYtPlay(m.id)}
                                onTouchEnd={e => {
                                  e.preventDefault();
                                  if (ytShowControls[m.id]) toggleYtPlay(m.id);
                                  else showControls(m.id);
                                }} />
                              {/* Control bar */}
                              <div className={`absolute bottom-0 left-0 right-0 flex items-center gap-3 px-4 py-3 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 ${ytShowControls[m.id] ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                                <button
                                  onClick={e => { e.stopPropagation(); toggleYtPlay(m.id); }}
                                  onTouchEnd={e => { e.preventDefault(); e.stopPropagation(); toggleYtPlay(m.id); }}
                                  className="text-white text-xl w-10 h-10 flex items-center justify-center select-none">
                                  {ytPlaying[m.id] ? '⏸' : '▶'}
                                </button>
                                <span className="text-white text-sm select-none">
                                  {(ytVolume[m.id] ?? 100) === 0 ? '🔇' : '🔊'}
                                </span>
                                <input
                                  type="range" min="0" max="100"
                                  value={ytVolume[m.id] ?? 100}
                                  onChange={e => changeYtVolume(m.id, Number(e.target.value))}
                                  onTouchStart={e => e.stopPropagation()}
                                  onTouchMove={e => { e.stopPropagation(); changeYtVolume(m.id, Number(e.target.value)); }}
                                  className="flex-1 accent-white cursor-pointer h-1.5"
                                />
                                <button
                                  onClick={e => { e.stopPropagation(); toggleYtFullscreen(m.id); }}
                                  onTouchEnd={e => { e.preventDefault(); e.stopPropagation(); toggleYtFullscreen(m.id); }}
                                  className="text-white text-xl w-10 h-10 flex items-center justify-center select-none">
                                  ⛶
                                </button>
                              </div>
                            </div>
                          )}
                          {/* Confirm row */}
                          {!isDone && (() => {
                            const isYoutube = !!getYouTubeEmbedUrl(m.url);
                            if (isYoutube && expandedMat === m.id) {
                              return ytEnded[m.id] ? (
                                <div className="flex items-center gap-2 pl-8">
                                  <button onClick={() => handleConfirmMaterial(m, enr)}
                                    className="text-[11px] px-3 py-1 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 font-medium transition-colors">
                                    ✓ Mark as Completed
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 pl-8">
                                  <span className="text-[11px] text-slate-400">Watch video until the end to confirm</span>
                                </div>
                              );
                            }
                            if (!isYoutube && matCountdown[m.id] !== undefined) {
                              return (
                                <div className="flex items-center gap-2 pl-8">
                                  {matCountdown[m.id] > 0 ? (
                                    <span className="text-[11px] text-slate-400">
                                      Available in <span className="font-semibold text-amber-500">{matCountdown[m.id]}s</span>
                                    </span>
                                  ) : (
                                    <button onClick={() => handleConfirmMaterial(m, enr)}
                                      className="text-[11px] px-3 py-1 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 font-medium transition-colors">
                                      ✓ Mark as Completed
                                    </button>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Quiz info */}
            {(viewCourse.questions || []).length > 0 && (
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-purple-600 text-sm font-semibold">Post-Test</span>
                  <Badge variant="purple" className="text-[10px]">{viewCourse.questions.length} questions</Badge>
                </div>
                <p className="text-xs text-purple-500">
                  Must answer at least <strong>{viewCourse.quizRequired || viewCourse.questions.length}</strong> of {viewCourse.questions.length} questions correctly to pass
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex gap-3">
              {!getEnrollment(viewCourse.id) ? (
                <button onClick={() => { handleEnroll(viewCourse.id); setViewCourse(null); }}
                  className="flex-1 py-3 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600">
                  Enroll Now
                </button>
              ) : (
                <>
                  <p className="flex-1 text-center text-sm text-slate-500 self-center">You are enrolled</p>
                  {(viewCourse.questions || []).length > 0 && (
                    getEnrollment(viewCourse.id)?.quizPassed ? (
                      <div className="flex-1 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm font-medium text-center">
                        ✓ Post-Test Passed
                      </div>
                    ) : (
                      <button onClick={() => { setQuizMode(true); setQuizAnswers({}); setQuizResult(null); }}
                        className="flex-1 py-3 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-700">
                        Take Post-Test
                      </button>
                    )
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Quiz Mode */}
        {viewCourse && quizMode && (
          <div className="space-y-5">
            {quizResult ? (
              <div className="text-center py-6">
                <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center text-2xl font-bold mb-4 ${quizResult.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                  {quizResult.correct}/{quizResult.total}
                </div>
                <p className={`text-lg font-semibold mb-1 ${quizResult.passed ? 'text-emerald-600' : 'text-red-600'}`}>
                  {quizResult.passed ? 'Passed!' : 'Not Passed'}
                </p>
                <p className="text-sm text-slate-500 mb-6">
                  {quizResult.correct} of {quizResult.total} correct
                  {!quizResult.passed && ` (need ${viewCourse.quizRequired || quizResult.total} to pass)`}
                </p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => { setQuizAnswers({}); setQuizResult(null); }}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
                    Retake
                  </button>
                  <button onClick={() => { setQuizMode(false); setViewCourse(null); }}
                    className="px-5 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600">
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-400 text-right">Need {viewCourse.quizRequired || viewCourse.questions.length}/{viewCourse.questions.length} correct to pass</p>
                {(viewCourse.questions || []).map((q, qi) => (
                  <div key={qi} className="border border-slate-100 rounded-xl p-4">
                    <p className="text-sm font-medium text-navy-900 mb-3">{qi + 1}. {q.question}</p>
                    <div className="space-y-2">
                      {q.choices.map((c, ci) => (
                        <label key={ci}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer border transition-colors ${quizAnswers[qi] === ci ? 'border-brand-400 bg-brand-50' : 'border-slate-100 hover:bg-slate-50'}`}>
                          <input type="radio" name={`q${qi}`} checked={quizAnswers[qi] === ci}
                            onChange={() => setQuizAnswers(a => ({ ...a, [qi]: ci }))}
                            className="accent-brand-500" />
                          <span className="text-sm text-slate-700">{c}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="flex gap-3 pt-2 border-t border-slate-100">
                  <button onClick={() => setQuizMode(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
                    Cancel
                  </button>
                  <button onClick={submitQuiz}
                    disabled={Object.keys(quizAnswers).length < (viewCourse.questions || []).length}
                    className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
                    Submit
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
