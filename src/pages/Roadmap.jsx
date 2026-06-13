import { useState, useMemo } from 'react'
import {
  LuPlus,
  LuPencil,
  LuTrash2,
  LuGripVertical,
  LuSearch,
  LuCheck,
  LuMap,
  LuChevronLeft,
  LuChevronRight,
  LuSquareCheck,
  LuSquare,
  LuX,
} from 'react-icons/lu'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import ProgressBar from '../components/ui/ProgressBar'
import { db } from '../db/db'
import { useRoadmap } from '../hooks/useLiveData'
import { formatDisplayDate, todayKey } from '../utils/dateUtils'

const PRIORITY_STYLES = {
  low: 'bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark',
  medium: 'bg-violet/10 text-violet dark:text-violet-soft',
  high: 'bg-red-500/10 text-red-600 dark:text-red-400',
}
const PAGE_SIZE = 50
const EMPTY_FORM = { day: '', title: '', category: '', priority: 'medium', tags: '', dueDate: '', notes: '' }

export default function Roadmap() {
  const roadmap = useRoadmap()

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all') // all | completed | incomplete
  const [sortBy, setSortBy] = useState('order') // order | day | category | progress | date
  const [page, setPage] = useState(1)
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmBulk, setConfirmBulk] = useState(null) // 'delete' | 'complete' | null
  const [draggedId, setDraggedId] = useState(null)

  const categories = useMemo(() => {
    const set = new Set(roadmap.map((r) => r.category).filter(Boolean))
    return ['all', ...Array.from(set)]
  }, [roadmap])

  const total = roadmap.length
  const completedCount = roadmap.filter((r) => r.completed).length
  const overallPct = total ? Math.round((completedCount / total) * 100) : 0

  const filteredSorted = useMemo(() => {
    let list = roadmap.filter((r) => {
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false
      if (statusFilter === 'completed' && !r.completed) return false
      if (statusFilter === 'incomplete' && r.completed) return false
      if (search) {
        const q = search.toLowerCase()
        const inTitle = r.title?.toLowerCase().includes(q)
        const inCategory = r.category?.toLowerCase().includes(q)
        const inTags = (r.tags || []).some((t) => t.toLowerCase().includes(q))
        if (!inTitle && !inCategory && !inTags) return false
      }
      return true
    })

    list = [...list]
    switch (sortBy) {
      case 'day':
        list.sort((a, b) => (a.day ?? 0) - (b.day ?? 0))
        break
      case 'category':
        list.sort((a, b) => (a.category || '').localeCompare(b.category || '') || (a.day ?? 0) - (b.day ?? 0))
        break
      case 'progress':
        list.sort((a, b) => Number(a.completed) - Number(b.completed) || (a.order ?? 0) - (b.order ?? 0))
        break
      case 'date':
        list.sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return (a.day ?? 0) - (b.day ?? 0)
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return a.dueDate.localeCompare(b.dueDate)
        })
        break
      default:
        list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    }
    return list
  }, [roadmap, categoryFilter, statusFilter, search, sortBy])

  const dragEnabled = sortBy === 'order' && categoryFilter === 'all' && statusFilter === 'all' && !search

  const pageCount = Math.max(1, Math.ceil(filteredSorted.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageItems = filteredSorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function resetFiltersPage() {
    setPage(1)
  }

  async function toggleComplete(item) {
    await db.roadmap.update(item.id, {
      completed: !item.completed,
      completedAt: !item.completed ? new Date().toISOString() : null,
    })
  }

  function openAdd() {
    setEditing(null)
    const maxDay = roadmap.length ? Math.max(...roadmap.map((r) => r.day ?? 0)) : 0
    setForm({ ...EMPTY_FORM, day: maxDay + 1 })
    setModalOpen(true)
  }

  function openEdit(item) {
    setEditing(item)
    setForm({
      day: item.day ?? '',
      title: item.title,
      category: item.category || '',
      priority: item.priority || 'medium',
      tags: (item.tags || []).join(', '),
      dueDate: item.dueDate || '',
      notes: item.notes || '',
    })
    setModalOpen(true)
  }

  async function saveItem(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    const payload = {
      day: form.day === '' ? null : Number(form.day),
      title: form.title.trim(),
      category: form.category.trim() || 'Uncategorized',
      priority: form.priority,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      dueDate: form.dueDate || null,
      notes: form.notes,
    }
    if (editing) {
      await db.roadmap.update(editing.id, payload)
    } else {
      const maxOrder = roadmap.length ? Math.max(...roadmap.map((r) => r.order ?? 0)) : -1
      await db.roadmap.add({ ...payload, order: maxOrder + 1, completed: false, completedAt: null })
    }
    setModalOpen(false)
  }

  async function deleteItem(id) {
    await db.roadmap.delete(id)
    setConfirmDelete(null)
    setSelected((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAllOnPage() {
    setSelected((prev) => {
      const next = new Set(prev)
      pageItems.forEach((item) => next.add(item.id))
      return next
    })
  }

  function clearSelection() {
    setSelected(new Set())
    setSelectMode(false)
  }

  async function bulkComplete() {
    const ids = Array.from(selected)
    await db.transaction('rw', db.roadmap, async () => {
      for (const id of ids) {
        await db.roadmap.update(id, { completed: true, completedAt: new Date().toISOString() })
      }
    })
    setConfirmBulk(null)
    clearSelection()
  }

  async function bulkDelete() {
    await db.roadmap.bulkDelete(Array.from(selected))
    setConfirmBulk(null)
    clearSelection()
  }

  function onDragStart(id) {
    if (!dragEnabled) return
    setDraggedId(id)
  }
  function onDragOver(e) {
    if (!dragEnabled) return
    e.preventDefault()
  }
  async function onDrop(targetId) {
    if (!dragEnabled || draggedId === null || draggedId === targetId) return
    const ordered = [...filteredSorted]
    const fromIdx = ordered.findIndex((r) => r.id === draggedId)
    const toIdx = ordered.findIndex((r) => r.id === targetId)
    const [moved] = ordered.splice(fromIdx, 1)
    ordered.splice(toIdx, 0, moved)
    await db.roadmap.bulkPut(ordered.map((r, i) => ({ ...r, order: i })))
    setDraggedId(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-semibold">Roadmap Tracker</h1>
          <p className="text-sm text-muted dark:text-muted-dark mt-1">
            {completedCount} of {total} items complete ({overallPct}%)
          </p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <LuPlus size={16} /> Add Item
        </button>
      </div>

      <Card>
        <ProgressBar percent={overallPct} height="h-3" />
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted dark:text-muted-dark" size={16} />
          <input
            className="input pl-9"
            placeholder="Search title, category, tags..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              resetFiltersPage()
            }}
          />
        </div>
        <select
          className="input w-auto"
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value)
            resetFiltersPage()
          }}
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>
          ))}
        </select>
        <select
          className="input w-auto"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            resetFiltersPage()
          }}
        >
          <option value="all">All status</option>
          <option value="incomplete">Incomplete</option>
          <option value="completed">Completed</option>
        </select>
        <select className="input w-auto" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="order">Sort: Manual order</option>
          <option value="day">Sort: Day</option>
          <option value="category">Sort: Category</option>
          <option value="progress">Sort: Progress</option>
          <option value="date">Sort: Due date</option>
        </select>
        <button
          className={`btn-secondary ${selectMode ? 'border-violet text-violet dark:text-teal-soft' : ''}`}
          onClick={() => {
            setSelectMode((v) => !v)
            if (selectMode) clearSelection()
          }}
        >
          <LuSquareCheck size={16} /> Select
        </button>
      </div>

      {/* Bulk action bar */}
      {selectMode && (
        <Card className="flex flex-wrap items-center gap-2 bg-aurora-soft border-violet/20">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <button className="btn-secondary" onClick={selectAllOnPage}>Select all on page</button>
          <button className="btn-secondary" disabled={!selected.size} onClick={() => setConfirmBulk('complete')}>
            <LuCheck size={15} /> Mark Complete
          </button>
          <button className="btn-danger" disabled={!selected.size} onClick={() => setConfirmBulk('delete')}>
            <LuTrash2 size={15} /> Delete
          </button>
          <button className="btn-ghost ml-auto" onClick={clearSelection}><LuX size={15} /> Cancel</button>
        </Card>
      )}

      {/* List */}
      {total === 0 ? (
        <EmptyState icon={LuMap} title="No roadmap items" description="Add your first roadmap item to start tracking progress." action={<button className="btn-primary" onClick={openAdd}><LuPlus size={16} /> Add Item</button>} />
      ) : filteredSorted.length === 0 ? (
        <EmptyState icon={LuSearch} title="No matching items" description="Try a different search or filter." />
      ) : (
        <>
          <div className="space-y-2">
            {pageItems.map((item) => (
              <Card
                key={item.id}
                draggable={dragEnabled}
                onDragStart={() => onDragStart(item.id)}
                onDragOver={onDragOver}
                onDrop={() => onDrop(item.id)}
                className={`flex items-center gap-3 transition-opacity ${draggedId === item.id ? 'opacity-50' : ''}`}
              >
                {dragEnabled && (
                  <div className="cursor-grab text-muted dark:text-muted-dark touch-none" title="Drag to reorder">
                    <LuGripVertical size={16} />
                  </div>
                )}
                {selectMode ? (
                  <button onClick={() => toggleSelect(item.id)} className="shrink-0 text-violet dark:text-teal-soft" aria-label="Select">
                    {selected.has(item.id) ? <LuSquareCheck size={20} /> : <LuSquare size={20} />}
                  </button>
                ) : (
                  <button
                    onClick={() => toggleComplete(item)}
                    className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      item.completed ? 'bg-aurora border-transparent text-white' : 'border-border dark:border-border-dark'
                    }`}
                    aria-label={item.completed ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {item.completed && <LuCheck size={14} />}
                  </button>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.day != null && <span className="chip bg-surface2 dark:bg-surface2-dark font-mono text-muted dark:text-muted-dark">Day {item.day}</span>}
                    <p className={`font-medium truncate ${item.completed ? 'line-through text-muted dark:text-muted-dark' : ''}`}>{item.title}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {item.category && <span className="chip bg-violet/10 text-violet dark:text-violet-soft">{item.category}</span>}
                    <span className={`chip capitalize ${PRIORITY_STYLES[item.priority || 'medium']}`}>{item.priority || 'medium'}</span>
                    {(item.tags || []).map((tag) => (
                      <span key={tag} className="chip bg-surface2 dark:bg-surface2-dark text-muted dark:text-muted-dark">#{tag}</span>
                    ))}
                    {item.dueDate && <span className="text-xs text-muted dark:text-muted-dark font-mono">Due {formatDisplayDate(item.dueDate)}</span>}
                    {item.completed && item.completedAt && (
                      <span className="text-xs text-teal dark:text-teal-soft font-mono">Done {formatDisplayDate(item.completedAt.slice(0, 10))}</span>
                    )}
                  </div>
                </div>
                {!selectMode && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button className="btn-ghost p-2" onClick={() => openEdit(item)} aria-label="Edit"><LuPencil size={15} /></button>
                    <button className="btn-ghost p-2 hover:text-red-500" onClick={() => setConfirmDelete(item)} aria-label="Delete"><LuTrash2 size={15} /></button>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pageCount > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button className="btn-secondary" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
                <LuChevronLeft size={16} /> Prev
              </button>
              <span className="text-sm text-muted dark:text-muted-dark font-mono">Page {currentPage} of {pageCount}</span>
              <button className="btn-secondary" disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)}>
                Next <LuChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Add/Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Roadmap Item' : 'Add Roadmap Item'}>
        <form onSubmit={saveItem} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="label">Day</label>
              <input type="number" className="input" value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} placeholder="1" />
            </div>
            <div className="col-span-2">
              <label className="label">Title</label>
              <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Subnetting Practice" autoFocus required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Networking" />
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Tags (comma separated)</label>
              <input className="input" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="e.g. networking, lab" />
            </div>
            <div>
              <label className="label">Due Date</label>
              <input type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional details, resource links..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Save Changes' : 'Add Item'}</button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete item?" maxWidth="max-w-sm">
        <p className="text-sm text-muted dark:text-muted-dark">This will permanently delete "{confirmDelete?.title}". This cannot be undone.</p>
        <div className="flex justify-end gap-2 pt-4">
          <button className="btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
          <button className="btn-danger" onClick={() => deleteItem(confirmDelete.id)}>Delete</button>
        </div>
      </Modal>

      {/* Bulk confirmation */}
      <Modal open={!!confirmBulk} onClose={() => setConfirmBulk(null)} title={confirmBulk === 'delete' ? 'Delete selected items?' : 'Mark selected as complete?'} maxWidth="max-w-sm">
        <p className="text-sm text-muted dark:text-muted-dark">
          {confirmBulk === 'delete'
            ? `This will permanently delete ${selected.size} item(s). This cannot be undone.`
            : `This will mark ${selected.size} item(s) as complete with today's date (${formatDisplayDate(todayKey())}).`}
        </p>
        <div className="flex justify-end gap-2 pt-4">
          <button className="btn-secondary" onClick={() => setConfirmBulk(null)}>Cancel</button>
          {confirmBulk === 'delete' ? (
            <button className="btn-danger" onClick={bulkDelete}>Delete</button>
          ) : (
            <button className="btn-primary" onClick={bulkComplete}>Mark Complete</button>
          )}
        </div>
      </Modal>
    </div>
  )
}
