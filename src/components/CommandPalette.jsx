import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LuSearch, LuListChecks, LuMap, LuTarget, LuFlame, LuNotebookPen } from 'react-icons/lu'
import { db } from '../db/db'
import { useUIStore } from '../store/useUIStore'

const TYPE_META = {
  routine: { label: 'Routine', icon: LuListChecks, path: '/routines' },
  roadmap: { label: 'Roadmap', icon: LuMap, path: '/roadmap' },
  goal: { label: 'Goal', icon: LuTarget, path: '/goals' },
  habit: { label: 'Habit', icon: LuFlame, path: '/habits' },
  note: { label: 'Note', icon: LuNotebookPen, path: '/notes' },
}

export default function CommandPalette() {
  const open = useUIStore((s) => s.searchOpen)
  const close = useUIStore((s) => s.closeSearch)
  const openSearch = useUIStore((s) => s.openSearch)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const inputRef = useRef(null)
  const navigate = useNavigate()

  // Global keyboard shortcut: Ctrl/Cmd + K
  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        openSearch()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openSearch])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
    else {
      setQuery('')
      setResults([])
    }
  }, [open])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    let active = true
    async function run() {
      const q = query.toLowerCase()
      const [routines, roadmap, goals, habits, notes] = await Promise.all([
        db.routines.toArray(),
        db.roadmap.toArray(),
        db.goals.toArray(),
        db.habits.toArray(),
        db.notes.toArray(),
      ])
      const out = []
      routines.filter((r) => r.title?.toLowerCase().includes(q)).forEach((r) => out.push({ type: 'routine', id: r.id, title: r.title }))
      roadmap.filter((r) => r.title?.toLowerCase().includes(q)).forEach((r) => out.push({ type: 'roadmap', id: r.id, title: `Day ${r.day}: ${r.title}` }))
      goals.filter((g) => g.title?.toLowerCase().includes(q)).forEach((g) => out.push({ type: 'goal', id: g.id, title: g.title }))
      habits.filter((h) => h.title?.toLowerCase().includes(q)).forEach((h) => out.push({ type: 'habit', id: h.id, title: h.title }))
      notes.filter((n) => n.title?.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q)).forEach((n) => out.push({ type: 'note', id: n.id, title: n.title || 'Untitled note' }))
      if (active) setResults(out.slice(0, 30))
    }
    run()
    return () => {
      active = false
    }
  }, [query])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />
      <div className="relative w-full max-w-lg card p-0 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border dark:border-border-dark">
          <LuSearch className="text-muted dark:text-muted-dark" size={18} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search routines, roadmap, goals, habits, notes..."
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted dark:placeholder:text-muted-dark"
          />
          <kbd className="hidden sm:inline text-[10px] font-mono text-muted dark:text-muted-dark border border-border dark:border-border-dark rounded px-1.5 py-0.5">Esc</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {query && results.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-muted dark:text-muted-dark">No results for "{query}"</div>
          )}
          {results.map((r) => {
            const meta = TYPE_META[r.type]
            const Icon = meta.icon
            return (
              <button
                key={`${r.type}-${r.id}`}
                onClick={() => {
                  navigate(meta.path)
                  close()
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-surface2 dark:hover:bg-surface2-dark transition-colors"
              >
                <Icon size={16} className="text-violet dark:text-teal-soft shrink-0" />
                <span className="truncate">{r.title}</span>
                <span className="ml-auto text-xs text-muted dark:text-muted-dark shrink-0">{meta.label}</span>
              </button>
            )
          })}
          {!query && (
            <div className="px-4 py-6 text-center text-sm text-muted dark:text-muted-dark">
              Start typing to search everything in LifeOS
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
