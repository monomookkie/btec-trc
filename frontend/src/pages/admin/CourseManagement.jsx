import { useState, useEffect } from "react";
import { api } from "../../api";
import Icon from "../../components/ui/Icon";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";

const MATERIAL_TYPES = ["pdf", "word", "ppt", "video", "link"];
const TYPE_META = {
  pdf: { label: "PDF", color: "red" },
  word: { label: "DOC", color: "blue" },
  ppt: { label: "PPT", color: "amber" },
  video: { label: "VID", color: "green" },
  link: { label: "URL", color: "purple" },
};

function MatBadge({ type }) {
  const m = TYPE_META[type] || { label: "FILE", color: "gray" };
  return (
    <Badge variant={m.color} className="font-mono text-[10px]">
      {m.label}
    </Badge>
  );
}

const EMPTY_COURSE = {
  title: "",
  category: "",
  description: "",
  status: "DRAFT",
  duration: "",
  passScore: 80,
  tags: [],
  materials: [],
  questions: [],
  quizRequired: 0,
};
const EMPTY_MAT = { type: "pdf", title: "", url: "", weight: 0 };
const EMPTY_Q = { question: "", choices: ["", "", "", ""], correct: 0 };

export default function CourseManagement({ showToast }) {
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_COURSE);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [confirmDel, setConfirmDel] = useState(null);
  const [matForm, setMatForm] = useState(EMPTY_MAT);
  const [loading, setLoading] = useState(false);

  const load = () => Promise.all([api.getCourses(), api.getEnrollments()])
    .then(([c, e]) => { setCourses(c); setEnrollments(e); });
  useEffect(() => {
    load();
    api.getUsers().then(setUsers);
  }, []);

  // Re-fetch users every time the assign tab is opened
  useEffect(() => {
    if (showModal && modalTab === 'assign') {
      api.getUsers().then(setUsers);
    }
  }, [showModal, modalTab]);

  const filtered =
    filter === "all"
      ? courses
      : courses.filter((c) => c.status === filter.toUpperCase());

  const [modalTab, setModalTab] = useState('info');

  const openNew = () => {
    setForm(EMPTY_COURSE);
    setMatForm(EMPTY_MAT);
    setQForm(EMPTY_Q);
    setSelectedUsers([]);
    setPickerChecked([]);
    setEditId(null);
    setModalTab('info');
    setShowModal(true);
    api.getUsers().then(setUsers);
  };
  const openEdit = async (c) => {
    setForm({ ...c, tags: c.tags || [], materials: c.materials || [], questions: c.questions || [], quizRequired: c.quizRequired || 0 });
    setMatForm(EMPTY_MAT);
    setQForm(EMPTY_Q);
    setSelectedUsers([]);
    setPickerChecked([]);
    setEditId(c.id);
    setModalTab('info');
    setCourseEnrollments([]);
    setShowModal(true);
    const [enrs] = await Promise.all([
      api.getCourseEnrollments(c.id),
      api.getUsers().then(setUsers)
    ]);
    setCourseEnrollments(enrs);
  };

  const addQuestion = () => {
    if (!qForm.question.trim() || qForm.choices.some(c => !c.trim())) return;
    setForm(f => ({ ...f, questions: [...f.questions, { ...qForm, id: Date.now().toString() }] }));
    setQForm(EMPTY_Q);
  };
  const removeQuestion = (idx) => setForm(f => ({ ...f, questions: f.questions.filter((_, i) => i !== idx) }));

  const [userSearch, setUserSearch] = useState('');
  const [qForm, setQForm] = useState(EMPTY_Q);
  const [courseEnrollments, setCourseEnrollments] = useState([]);
  const [pickerChecked, setPickerChecked] = useState([]);

  const togglePicker = (id) => setPickerChecked(s => s.includes(id) ? s.filter(u => u !== id) : [...s, id]);
  const togglePickerAll = () => {
    const eligible = users.filter(u =>
      u.role === 'USER' &&
      !selectedUsers.includes(u.id) &&
      !courseEnrollments.find(e => e.userId === u.id)
    );
    setPickerChecked(s => s.length === eligible.length ? [] : eligible.map(u => u.id));
  };

  const confirmPickerToList = () => {
    setSelectedUsers(s => [...s, ...pickerChecked.filter(id => !s.includes(id))]);
    setPickerChecked([]);
  };

  const removeFromList = (id) => setSelectedUsers(s => s.filter(uid => uid !== id));

  const handleUnenroll = async (enrollmentId) => {
    try {
      await api.unenroll(enrollmentId);
      setCourseEnrollments(es => es.filter(e => e.id !== enrollmentId));
      showToast('Unenrolled');
    } catch (e) { showToast(e.message, 'error'); }
  };

  const handleAddToExisting = async () => {
    if (!pickerChecked.length || !editId) return;
    await Promise.allSettled(pickerChecked.map(uid => api.adminEnroll(uid, editId)));
    const updated = await api.getCourseEnrollments(editId);
    setCourseEnrollments(updated);
    setPickerChecked([]);
    showToast(`Added ${pickerChecked.length} user(s)`);
  };

  const addMaterial = () => {
    if (!matForm.title.trim()) return;
    setForm((f) => ({
      ...f,
      materials: [...f.materials, { ...matForm, id: Date.now().toString() }],
    }));
    setMatForm(EMPTY_MAT);
  };

  const removeMaterial = (idx) =>
    setForm((f) => ({
      ...f,
      materials: f.materials.filter((_, i) => i !== idx),
    }));

  const handleSave = async () => {
    if (!form.title.trim() || !form.category.trim() || !form.duration) {
      showToast("Fill required fields", "error");
      return;
    }
    setLoading(true);
    try {
      if (editId) {
        const updated = await api.updateCourse(editId, form);
        setCourses((cs) =>
          cs.map((c) =>
            c.id === editId ? { ...updated, tags: updated.tags || [] } : c,
          ),
        );
        showToast("Course updated");
      } else {
        const created = await api.createCourse(form);
        setCourses((cs) => [{ ...created, tags: created.tags || [] }, ...cs]);
        if (selectedUsers.length > 0) {
          await Promise.allSettled(selectedUsers.map(uid => api.adminEnroll(uid, created.id)));
        }
        showToast("Course created");
      }
      setShowModal(false);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.deleteCourse(confirmDel);
      setCourses((cs) => cs.filter((c) => c.id !== confirmDel));
      showToast("Course deleted");
    } catch (e) {
      showToast(e.message, "error");
    }
    setConfirmDel(null);
  };

  const toggleTag = (tag) => {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag)
        ? f.tags.filter((t) => t !== tag)
        : [...f.tags, tag],
    }));
  };

  const inputCls =
    "w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-brand-500 focus:bg-white transition-all";

  return (
    <div className="p-7 page-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-navy-900">
            Course Management
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {courses.length} courses total
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Icon name="plus" size={15} /> New Course
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-5">
        {["all", "published", "draft"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${filter === f ? "bg-brand-500 text-white" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Course list */}
      <div className="space-y-3">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-2xl border border-slate-100 p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                <span className="font-medium text-navy-900 text-sm">
                  {c.title}
                </span>
                <Badge variant={c.status === "PUBLISHED" ? "green" : "gray"}>
                  {c.status}
                </Badge>
                {(c.tags || []).map((t) => (
                  <Badge key={t} variant="blue" className="text-[10px]">
                    {t}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-slate-400 mb-2 line-clamp-2">
                {c.description}
              </p>
              <div className="flex items-center gap-4 text-[11px] text-slate-400 mb-3">
                <span>{c.category}</span>
                <span>·</span>
                <span>{c.duration} min</span>
                <span>·</span>
                <span>Pass: {c.passScore}%</span>
                <span>·</span>
                <span>{(c.materials || []).length} materials</span>
              </div>

              {/* Enrolled users */}
              {(() => {
                const courseEnrs = enrollments.filter(e => e.courseId === c.id);
                if (courseEnrs.length === 0) return (
                  <p className="text-[11px] text-slate-300 italic">ยังไม่มีผู้เรียน</p>
                );
                return (
                  <div className="flex flex-wrap gap-2">
                    {courseEnrs.map(e => (
                      <div key={e.id} className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-full px-2.5 py-1">
                        <div className="w-4 h-4 rounded-full bg-brand-500/10 flex items-center justify-center text-[9px] font-bold text-brand-600 flex-shrink-0">
                          {e.user?.avatar}
                        </div>
                        <span className="text-[11px] text-slate-600 font-medium">{e.user?.name}</span>
                        <span className={`text-[10px] font-semibold ml-0.5 ${e.completed ? 'text-emerald-500' : 'text-slate-400'}`}>
                          {e.completed ? '✓' : `${e.progress}%`}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => openEdit(c)}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors"
              >
                <Icon name="edit" size={14} />
              </button>
              <button
                onClick={() => setConfirmDel(c.id)}
                className="p-2 rounded-lg border border-red-100 hover:bg-red-50 text-red-400 transition-colors"
              >
                <Icon name="trash" size={14} />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">
            No courses found.
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editId ? "Edit Course" : "New Course"}
        size="700px"
      >
        {/* Modal Tabs */}
        <div className="flex gap-1.5 mb-5 border-b border-slate-100 pb-3">
          {[['info','Course Info'],['materials','Materials'],['quiz','Post-Test'],['assign','Users']].map(([k,l]) => (
            <button key={k} onClick={() => setModalTab(k)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${modalTab === k ? 'bg-brand-500 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
              {l}
              {k === 'quiz' && form.questions.length > 0 ? ` (${form.questions.length})` : ''}
              {k === 'assign' && !editId && selectedUsers.length > 0 ? ` (${selectedUsers.length})` : ''}
              {k === 'assign' && editId && courseEnrollments.length > 0 ? ` (${courseEnrollments.length})` : ''}
            </button>
          ))}
        </div>

        <div className="space-y-4">

          {/* ── Tab: Course Info ── */}
          {modalTab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Title *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputCls} placeholder="Course title" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Category *</label>
                  <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inputCls} placeholder="e.g. Core Screening" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className={inputCls + " resize-none"} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Duration (min) *</label>
                  <input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Pass Score (%)</label>
                  <input type="number" value={form.passScore} onChange={e => setForm(f => ({ ...f, passScore: Number(e.target.value) }))} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Tags</label>
                <div className="flex gap-2 flex-wrap">
                  {["mandatory", "core", "sop", "safety", "donor-facing"].map(t => (
                    <button key={t} onClick={() => toggleTag(t)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${form.tags.includes(t) ? "bg-brand-500 text-white border-brand-500" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Materials ── */}
          {modalTab === 'materials' && (
            <div>
              {/* Total weight indicator */}
              {form.materials.length > 0 && (() => {
                const total = form.materials.reduce((s, m) => s + (Number(m.weight) || 0), 0);
                return (
                  <div className={`flex items-center justify-between px-3 py-2 rounded-xl mb-3 text-xs font-medium ${total === 100 ? 'bg-emerald-50 text-emerald-700' : total > 100 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}>
                    <span>รวมตัวชี้วัด</span>
                    <span>{total}% {total === 100 ? '✓ ครบ 100%' : total > 100 ? '⚠ เกิน 100%' : `(ขาด ${100 - total}%)`}</span>
                  </div>
                );
              })()}

              <div className="space-y-2 mb-3">
                {form.materials.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl">
                    <MatBadge type={m.type} />
                    <span className="text-xs text-slate-700 flex-1 truncate">{m.title}</span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <input
                        type="number" min="0" max="100"
                        value={m.weight === 0 ? '' : m.weight}
                        onChange={e => {
                          const val = e.target.value === '' ? 0 : Number(e.target.value);
                          setForm(f => ({ ...f, materials: f.materials.map((mat, idx) => idx === i ? { ...mat, weight: val } : mat) }));
                        }}
                        placeholder="0"
                        className="w-12 px-1.5 py-1 rounded-lg border border-slate-200 bg-white text-[11px] text-center focus:outline-none focus:border-brand-500"
                      />
                      <span className="text-[10px] text-slate-400">%</span>
                    </div>
                    <button onClick={() => removeMaterial(i)} className="text-slate-400 hover:text-red-500">
                      <Icon name="x" size={13} />
                    </button>
                  </div>
                ))}
                {form.materials.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No materials yet</p>}
              </div>

              <div className="border border-slate-200 rounded-xl p-3 space-y-2">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">เพิ่ม Material</p>
                <div className="flex gap-2">
                  <select value={matForm.type} onChange={e => setMatForm(m => ({ ...m, type: e.target.value }))}
                    className="px-2 py-2 rounded-lg border border-slate-200 text-xs bg-slate-50">
                    {MATERIAL_TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                  </select>
                  <input value={matForm.title} onChange={e => setMatForm(m => ({ ...m, title: e.target.value }))}
                    placeholder="ชื่อ Material *" className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs bg-slate-50" />
                </div>
                <div className="flex gap-2">
                  <input value={matForm.url} onChange={e => setMatForm(m => ({ ...m, url: e.target.value }))}
                    placeholder="URL (optional)" className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs bg-slate-50" />
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <input type="number" min="0" max="100" value={matForm.weight === 0 ? '' : matForm.weight}
                      onChange={e => setMatForm(m => ({ ...m, weight: e.target.value === '' ? 0 : Number(e.target.value) }))}
                      placeholder="0"
                      className="w-16 px-2 py-2 rounded-lg border border-slate-200 text-xs bg-slate-50 text-center focus:outline-none focus:border-brand-500" />
                    <span className="text-xs text-slate-400">%</span>
                  </div>
                  <button onClick={addMaterial} className="px-3 py-2 bg-brand-500 text-white rounded-lg text-xs hover:bg-brand-600">
                    <Icon name="plus" size={13} />
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">ตัวชี้วัด = เมื่อ User ดู Material นี้เสร็จจะได้ความคืบหน้า % นี้ (ควรรวมกันได้ 100%)</p>
              </div>
            </div>
          )}

          {/* ── Tab: Post-Test ── */}
          {modalTab === 'quiz' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-3">
                <span className="text-xs text-slate-500">ต้องตอบถูก</span>
                <input type="number" min="0" max={form.questions.length} value={form.quizRequired}
                  onChange={e => setForm(f => ({ ...f, quizRequired: Number(e.target.value) }))}
                  className="w-16 px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs text-center focus:outline-none focus:border-brand-500" />
                <span className="text-xs text-slate-500">/ {form.questions.length} ข้อ ถึงจะผ่าน</span>
              </div>

              {form.questions.length > 0 && (
                <div className="space-y-2">
                  {form.questions.map((q, i) => (
                    <div key={q.id} className="bg-slate-50 rounded-xl p-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-xs font-medium text-navy-900">{i + 1}. {q.question}</span>
                        <button onClick={() => removeQuestion(i)} className="text-slate-300 hover:text-red-400 flex-shrink-0">
                          <Icon name="x" size={13} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {q.choices.map((c, ci) => (
                          <span key={ci} className={`text-[11px] px-2 py-1 rounded-lg ${ci === q.correct ? 'bg-emerald-100 text-emerald-700 font-medium' : 'text-slate-500'}`}>
                            {ci === q.correct ? '✓ ' : ''}{c}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border border-slate-200 rounded-xl p-3 space-y-2">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">เพิ่มคำถามใหม่</p>
                <input value={qForm.question} onChange={e => setQForm(q => ({ ...q, question: e.target.value }))}
                  placeholder="คำถาม *"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-brand-500" />
                <div className="grid grid-cols-2 gap-2">
                  {qForm.choices.map((c, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <input type="radio" name="correct" checked={qForm.correct === i}
                        onChange={() => setQForm(q => ({ ...q, correct: i }))}
                        className="accent-emerald-500 flex-shrink-0" title="เลือกเป็นเฉลย" />
                      <input value={c} onChange={e => {
                        const choices = [...qForm.choices]; choices[i] = e.target.value;
                        setQForm(q => ({ ...q, choices }));
                      }} placeholder={`ตัวเลือก ${i + 1} *`}
                        className="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-brand-500" />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-400">กด ● หน้าตัวเลือกเพื่อเลือกเฉลย</span>
                  <button onClick={addQuestion} className="px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs hover:bg-brand-600 transition-colors">
                    + เพิ่มคำถาม
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Users ── */}
          {modalTab === 'assign' && (
            <div className="space-y-4">
              {/* Confirmed list (edit = enrolled, new = selectedUsers) */}
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">
                  {editId ? `ผู้เรียนปัจจุบัน (${courseEnrollments.length} คน)` : `จะ Enroll (${selectedUsers.length} คน)`}
                </p>
                {(editId ? courseEnrollments.length === 0 : selectedUsers.length === 0) ? (
                  <p className="text-xs text-slate-400 text-center py-3 bg-slate-50 rounded-xl">ยังไม่มีผู้เรียน</p>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                    {editId
                      ? courseEnrollments.map(e => (
                          <div key={e.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-50 last:border-0">
                            <div className="w-7 h-7 rounded-full bg-brand-500/10 flex items-center justify-center text-[10px] font-bold text-brand-600 flex-shrink-0">
                              {e.user.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-navy-900 font-medium truncate">{e.user.name}</div>
                              <div className="text-[10px] text-slate-400 truncate">{e.user.dept}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400">{e.progress}%</span>
                              {e.completed && <Badge variant="green" className="text-[9px]">สำเร็จ</Badge>}
                              <button onClick={() => handleUnenroll(e.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                <Icon name="x" size={13} />
                              </button>
                            </div>
                          </div>
                        ))
                      : selectedUsers.map(id => {
                          const u = users.find(u => u.id === id);
                          return u ? (
                            <div key={id} className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-50 last:border-0">
                              <div className="w-7 h-7 rounded-full bg-brand-500/10 flex items-center justify-center text-[10px] font-bold text-brand-600 flex-shrink-0">
                                {u.avatar}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-navy-900 font-medium truncate">{u.name}</div>
                                <div className="text-[10px] text-slate-400 truncate">{u.dept}</div>
                              </div>
                              <button onClick={() => removeFromList(id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                <Icon name="x" size={13} />
                              </button>
                            </div>
                          ) : null;
                        })
                    }
                  </div>
                )}
              </div>

              {/* User picker */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-slate-500">เพิ่มผู้เรียน</p>
                  <button type="button" onClick={togglePickerAll} className="text-xs text-slate-400 hover:text-brand-500 transition-colors">
                    {pickerChecked.length > 0 && pickerChecked.length === users.filter(u =>
                      u.role === 'USER' && !selectedUsers.includes(u.id) && !courseEnrollments.find(e => e.userId === u.id)
                    ).length ? 'Deselect all' : 'Select all'}
                  </button>
                </div>
                <div className="relative mb-2">
                  <Icon name="search" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search users…"
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:border-brand-500" />
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-44 overflow-y-auto">
                  {users.filter(u =>
                    u.role === 'USER' &&
                    !selectedUsers.includes(u.id) &&
                    !courseEnrollments.find(e => e.userId === u.id) &&
                    u.name.toLowerCase().includes(userSearch.toLowerCase())
                  ).length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-slate-400">No users available</div>
                  ) : (
                    users.filter(u =>
                      u.role === 'USER' &&
                      !selectedUsers.includes(u.id) &&
                      !courseEnrollments.find(e => e.userId === u.id) &&
                      u.name.toLowerCase().includes(userSearch.toLowerCase())
                    ).map(u => (
                      <label key={u.id} onClick={() => togglePicker(u.id)}
                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors border-b border-slate-50 last:border-0 ${pickerChecked.includes(u.id) ? 'bg-brand-50' : 'hover:bg-slate-50'}`}>
                        <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors flex-shrink-0 ${pickerChecked.includes(u.id) ? 'bg-brand-500 border-brand-500' : 'border-slate-300'}`}>
                          {pickerChecked.includes(u.id) && <Icon name="check" size={10} className="text-white" />}
                        </div>
                        <div className="w-7 h-7 rounded-full bg-brand-500/10 flex items-center justify-center text-[10px] font-bold text-brand-600 flex-shrink-0">
                          {u.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-navy-900 font-medium truncate">{u.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{u.dept}</div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
                {pickerChecked.length > 0 && (
                  <button onClick={editId ? handleAddToExisting : confirmPickerToList}
                    className="w-full mt-2 py-2 rounded-xl bg-brand-500 text-white text-xs font-medium hover:bg-brand-600 transition-colors">
                    + เพิ่ม {pickerChecked.length} คน {editId ? 'เข้า Course' : 'เข้ารายการ'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Save / Cancel (always visible) ── */}
          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <button onClick={() => setShowModal(false)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button onClick={handleSave} disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-60">
              {loading ? "Saving…" : editId ? "Update Course" : "Create Course"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmDel}
        title="Delete Course"
        message="This will permanently delete the course and all its enrollments."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDel(null)}
      />
    </div>
  );
}
