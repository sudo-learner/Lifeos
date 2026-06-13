import { create } from 'zustand'

export const useUIStore = create((set, get) => ({
  sidebarOpen: false, // mobile sidebar
  searchOpen: false,
  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
  closeSidebar: () => set({ sidebarOpen: false }),
  openSearch: () => set({ searchOpen: true }),
  closeSearch: () => set({ searchOpen: false }),
}))
