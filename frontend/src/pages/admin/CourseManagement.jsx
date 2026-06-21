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
};
const EMPTY_MAT = { type: "pdf", title: "", url: "" };

export default function CourseManagement({ showToast }) {
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_COURSE);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [confirmDel, setConfirmDel] = useState(null);
  const [matForm, setMatForm] = useState(EMPTY_MAT);
  const [loading, setLoading] = useState(false);

  const load = () => api.getCourses().then(setCourses);
  useEffect(() => {
    load();
    api.getUsers().then(setUsers);
  }, []);

  const filtered =
    filter === "all"
      ? courses
      : courses.filter((c) => c.status === filter.toUpperCase());

  const openNew = () => {
    setForm(EMPTY_COURSE);
    setMatForm(EMPTY_MAT);
    setSelectedUsers([]);
    setEditId(null);
    setShowModal(true);
  };
  const openEdit = (c) => {
    setForm({ ...c, tags: c.tags || [], materials: c.materials || [] });
    setMatForm(EMPTY_MAT);
    setSelectedUsers([]);
    setEditId(c.id);
    setShowModal(true);
  };

  const [userSearch, setUserSearch] = useState('');
  const toggleUser = (id) => setSelectedUsers(s => s.includes(id) ? s.filter(u => u !== id) : [...s, id]);
  const toggleAll = () => {
    const eligible = users.filter(u => u.role === 'USER');
    setSelectedUsers(s => s.length === eligible.length ? [] : eligible.map(u => u.id));
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
              <div className="flex items-center gap-4 text-[11px] text-slate-400">
                <span>{c.category}</span>
                <span>·</span>
                <span>{c.duration} min</span>
                <span>·</span>
                <span>Pass: {c.passScore}%</span>
                <span>·</span>
                <span>{(c.materials || []).length} materials</span>
              </div>
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
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Title *
              </label>
              <input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                className={inputCls}
                placeholder="Course title"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Category *
              </label>
              <input
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
                className={inputCls}
                placeholder="e.g. Core Screening"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={3}
              className={inputCls + " resize-none"}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value }))
                }
                className={inputCls}
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Duration (min) *
              </label>
              <input
                type="number"
                value={form.duration}
                onChange={(e) =>
                  setForm((f) => ({ ...f, duration: e.target.value }))
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Pass Score (%)
              </label>
              <input
                type="number"
                value={form.passScore}
                onChange={(e) =>
                  setForm((f) => ({ ...f, passScore: Number(e.target.value) }))
                }
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Tags
            </label>
            <div className="flex gap-2 flex-wrap">
              {["mandatory", "core", "sop", "safety", "donor-facing"].map(
                (t) => (
                  <button
                    key={t}
                    onClick={() => toggleTag(t)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${form.tags.includes(t) ? "bg-brand-500 text-white border-brand-500" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                  >
                    {t}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Materials */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2">
              Materials
            </label>
            <div className="space-y-2 mb-3">
              {form.materials.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl"
                >
                  <MatBadge type={m.type} />
                  <span className="text-xs text-slate-700 flex-1 truncate">
                    {m.title}
                  </span>
                  <button
                    onClick={() => removeMaterial(i)}
                    className="text-slate-400 hover:text-red-500"
                  >
                    <Icon name="x" size={13} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <select
                value={matForm.type}
                onChange={(e) =>
                  setMatForm((m) => ({ ...m, type: e.target.value }))
                }
                className="px-2 py-2 rounded-lg border border-slate-200 text-xs bg-slate-50"
              >
                {MATERIAL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.toUpperCase()}
                  </option>
                ))}
              </select>
              <input
                value={matForm.title}
                onChange={(e) =>
                  setMatForm((m) => ({ ...m, title: e.target.value }))
                }
                placeholder="Title"
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs bg-slate-50"
              />
              <input
                value={matForm.url}
                onChange={(e) =>
                  setMatForm((m) => ({ ...m, url: e.target.value }))
                }
                placeholder="URL (optional)"
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs bg-slate-50"
              />
              <button
                onClick={addMaterial}
                className="px-3 py-2 bg-brand-500 text-white rounded-lg text-xs hover:bg-brand-600"
              >
                <Icon name="plus" size={13} />
              </button>
            </div>
          </div>

          {!editId && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-slate-500">Assign to Users <span className="text-slate-300">(optional)</span></label>
                <div className="flex items-center gap-3">
                  {selectedUsers.length > 0 && (
                    <span className="text-xs font-medium text-brand-500">{selectedUsers.length} selected</span>
                  )}
                  <button type="button" onClick={toggleAll} className="text-xs text-slate-400 hover:text-brand-500 transition-colors">
                    {selectedUsers.length === users.filter(u => u.role === 'USER').length ? 'Deselect all' : 'Select all'}
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="relative mb-2">
                <Icon name="search" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search users…"
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:border-brand-500" />
              </div>

              {/* Selected chips */}
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {selectedUsers.map(id => {
                    const u = users.find(u => u.id === id);
                    return u ? (
                      <span key={id} className="flex items-center gap-1 px-2.5 py-1 bg-brand-500/10 text-brand-600 rounded-full text-xs font-medium">
                        {u.name}
                        <button onClick={() => toggleUser(id)} className="ml-0.5 hover:text-red-500 transition-colors">×</button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}

              {/* User list */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                {users.filter(u => u.role === 'USER' && u.name.toLowerCase().includes(userSearch.toLowerCase())).length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-slate-400">No users found</div>
                ) : (
                  users.filter(u => u.role === 'USER' && u.name.toLowerCase().includes(userSearch.toLowerCase())).map(u => (
                    <label key={u.id} onClick={() => toggleUser(u.id)}
                      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors border-b border-slate-50 last:border-0 ${selectedUsers.includes(u.id) ? 'bg-brand-50' : 'hover:bg-slate-50'}`}>
                      <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors flex-shrink-0 ${selectedUsers.includes(u.id) ? 'bg-brand-500 border-brand-500' : 'border-slate-300'}`}>
                        {selectedUsers.includes(u.id) && <Icon name="check" size={10} className="text-white" />}
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
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowModal(false)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-60"
            >
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
