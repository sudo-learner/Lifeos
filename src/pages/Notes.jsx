import { useState, useMemo, useRef } from 'react'
import {
  LuPlus,
  LuSearch,
  LuPencil,
  LuTrash2,
  LuBold,
  LuItalic,
  LuHeading2,
  LuList,
  LuListChecks,
  LuEye,
  LuPenLine,
  LuNotebookPen,
  LuBookOpen,
} from 'react-icons/lu'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import { db } from '../db/db'
import { useNotes } from '../hooks/useLiveData'
import { todayKey, formatDisplayDate } from '../utils/dateUtils'
import { renderMarkdown, markdownToPlainText } from '../utils/markdown'

const TOOLBAR = [
  { icon: LuBold, label: 'Bold', wrap: ['**', '**'] },
  { icon: LuItalic, label: 'Italic', wrap: ['*', '*'] },
  { icon: LuHeading2, label: 'Heading', line: '## ' },
  { icon: LuList, label: 'Bullet list', line: '- ' },
  { icon: LuListChecks, label: 'Checkbox', line: '- [ ] ' },
]

export default function Notes() {
  const allNotes = useNotes()
  const [tab, setTab] = useState('notes') // notes | journal
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', content: '' })
  const [preview, setPreview] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const textareaRef = useRef(null)

  const notes = useMemo(() => allNotes.filter((n) => n.type === tab), [allNotes, tab])

  const filtered = useMemo(() => {
    if (!search) return notes
    const q = search.toLowerCase()
    return notes.filter((n) => (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q))
  }, [notes, search])

  function openNewNote() {
    setEditing(null)
    setForm({ title: '', content: '' })
    setPreview(false)
    setModalOpen(true)
  }

  function openNewJournal() {
    const today = todayKey()
    const existing = allNotes.find((n) => n.type === 'journal' && n.date === today)
    if (existing) {
      openEdit(existing)
      return
    }
    setEditing({ __newJournal: true, date: today })
    setForm({ title: '', content: '' })
    setPreview(false)
    setModalOpen(true)
  }

  function openEdit(note) {
    setEditing(note)
    setForm({ title: note.title || '', content: note.content || '' })
    setPreview(false)
    setModalOpen(true)
  }

  async function saveNote(e) {
    e.preventDefault()
    const now = new Date().toISOString()
    if (tab === 'journal') {
      if (editing?.id) {
        await db.notes.update(editing.id, { content: form.content, updatedAt: now })
      } else {
        await db.notes.add({ type: 'journal', date: editing?.date || todayKey(), title: '', content: form.content, createdAt: now, updatedAt: now })
      }
    } else {
      if (!form.title.trim() && !form.content.trim()) return
      if (editing?.id) {
        await db.notes.update(editing.id, { title: form.title.trim(), content: form.content, updatedAt: now })
      } else {
        await db.notes.add({ type: 'note', title: form.title.trim() || 'Untitled note', content: form.content, createdAt: now, updatedAt: now })
      }
    }
    setModalOpen(false)
  }

  async function deleteNote(id) {
    await db.notes.delete(id)
    setConfirmDelete(null)
  }

  function applyFormat(item) {
    const ta = textareaRef.current
    if (!ta) return
    const { selectionStart, selectionEnd, value } = ta
    const selected = value.slice(selectionStart, selectionEnd)
    let newValue, cursorPos
    if (item.wrap) {
      const [before, after] = item.wrap
      newValue = value.slice(0, selectionStart) + before + selected + after + value.slice(selectionEnd)
      cursorPos = selectionEnd + before.length + (selected ? after.length : 0)
    } else if (item.line) {
      // insert at start of current line
      const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1
      newValue = value.slice(0, lineStart) + item.line + value.slice(lineStart)
      cursorPos = selectionStart + item.line.length
    }
    setForm((f) => ({ ...f, content: newValue }))
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(cursorPos, cursorPos)
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-semibold">Notes & Journal</h1>
          <p className="text-sm text-muted dark:text-muted-dark mt-1">Capture ideas, write daily reflections, and keep track of what matters.</p>
        </div>
        <button className="btn-primary" onClick={tab === 'notes' ? openNewNote : openNewJournal}>
          <LuPlus size={16} /> {tab === 'notes' ? 'New Note' : "Today's Entry"}
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-surface2 dark:bg-surface2-dark rounded-lg p-1">
          <button onClick={() => setTab('notes')} className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors ${tab === 'notes' ? 'bg-surface dark:bg-surface-dark shadow-sm' : 'text-muted dark:text-muted-dark'}`}>
            <LuNotebookPen size={14} /> Notes
          </button>
          <button onClick={() => setTab('journal')} className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors ${tab === 'journal' ? 'bg-surface dark:bg-surface-dark shadow-sm' : 'text-muted dark:text-muted-dark'}`}>
            <LuBookOpen size={14} /> Journal
          </button>
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted dark:text-muted-dark" size={16} />
          <input className="input pl-9" placeholder={`Search ${tab}...`} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={tab === 'notes' ? LuNotebookPen : LuBookOpen}
          title={tab === 'notes' ? 'No notes yet' : 'No journal entries yet'}
          description={tab === 'notes' ? 'Jot down ideas, references, or anything worth remembering.' : 'Write a short reflection on your day.'}
          action={<button className="btn-primary" onClick={tab === 'notes' ? openNewNote : openNewJournal}><LuPlus size={16} /> {tab === 'notes' ? 'New Note' : "Write today's entry"}</button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((note) => (
            <Card key={note.id} className="flex flex-col cursor-pointer hover:border-violet/40 transition-colors" onClick={() => openEdit(note)}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium font-display truncate">
                  {note.type === 'journal' ? formatDisplayDate(note.date, { weekday: 'short' }) : note.title}
                </p>
                <div className="flex items-center gap-1 shrink-0 -mr-1 -mt-1">
                  <button className="btn-ghost p-1.5" onClick={(e) => { e.stopPropagation(); openEdit(note) }} aria-label="Edit"><LuPencil size={14} /></button>
                  <button className="btn-ghost p-1.5 hover:text-red-500" onClick={(e) => { e.stopPropagation(); setConfirmDelete(note) }} aria-label="Delete"><LuTrash2 size={14} /></button>
                </div>
              </div>
              <p className="text-sm text-muted dark:text-muted-dark mt-1 line-clamp-3">{markdownToPlainText(note.content) || 'Empty note'}</p>
              <p className="text-xs text-muted dark:text-muted-dark font-mono mt-auto pt-2">
                {note.type === 'journal' ? formatDisplayDate(note.date) : `Updated ${formatDisplayDate(note.updatedAt.slice(0, 10))}`}
              </p>
            </Card>
          ))}
        </div>
      )}

      {/* Editor modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={tab === 'journal' ? formatDisplayDate(editing?.date || todayKey(), { weekday: 'long' }) : editing ? 'Edit Note' : 'New Note'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={saveNote} className="space-y-3">
          {tab === 'notes' && (
            <input className="input font-display font-medium" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Note title" autoFocus />
          )}

          <div className="flex items-center gap-1 border border-border dark:border-border-dark rounded-lg p-1">
            {TOOLBAR.map((item) => (
              <button key={item.label} type="button" title={item.label} className="btn-ghost p-2" onClick={() => applyFormat(item)}>
                <item.icon size={15} />
              </button>
            ))}
            <div className="flex-1" />
            <button type="button" className={`btn-ghost p-2 ${!preview ? 'text-violet dark:text-teal-soft' : ''}`} title="Write" onClick={() => setPreview(false)}>
              <LuPenLine size={15} />
            </button>
            <button type="button" className={`btn-ghost p-2 ${preview ? 'text-violet dark:text-teal-soft' : ''}`} title="Preview" onClick={() => setPreview(true)}>
              <LuEye size={15} />
            </button>
          </div>

          {preview ? (
            <div className="input min-h-[240px] prose-sm" dangerouslySetInnerHTML={{ __html: renderMarkdown(form.content) || '<p class="text-muted">Nothing to preview yet.</p>' }} />
          ) : (
            <textarea
              ref={textareaRef}
              className="input min-h-[240px] font-mono text-sm"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder={'Write in Markdown...\n\n# Heading\n**bold** and *italic*\n- bullet point\n- [ ] checkbox item'}
              autoFocus={tab === 'journal'}
            />
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Save</button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete this entry?" maxWidth="max-w-sm">
        <p className="text-sm text-muted dark:text-muted-dark">This cannot be undone.</p>
        <div className="flex justify-end gap-2 pt-4">
          <button className="btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
          <button className="btn-danger" onClick={() => deleteNote(confirmDelete.id)}>Delete</button>
        </div>
      </Modal>
    </div>
  )
}
