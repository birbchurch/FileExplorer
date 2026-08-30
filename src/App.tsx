/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Settings } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { Settings as SettingsPage } from './components/Settings';
import { FolderTreePage } from './components/FolderTreePage';
import { ScannerProvider } from './contexts/ScannerContext';
import { cn } from './lib/utils';

function Sidebar() {
  const location = useLocation();
  
  return (
    <aside className="w-64 bg-[#16191E] border-r border-[#2D3139] flex flex-col">
      <div className="p-4 border-b border-[#2D3139]">
        <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          VaultIndex<span className="text-blue-500 font-mono text-sm ml-1">v1.0</span>
        </h1>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <Link
          to="/"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded text-[11px] font-bold uppercase tracking-widest transition-colors",
            location.pathname === '/' ? "bg-[#1A1D23] text-blue-400 border border-[#2D3139]" : "text-gray-500 hover:bg-[#1A1D23]"
          )}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </Link>
        <Link
          to="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded text-[11px] font-bold uppercase tracking-widest transition-colors",
            location.pathname === '/settings' ? "bg-[#1A1D23] text-blue-400 border border-[#2D3139]" : "text-gray-500 hover:bg-[#1A1D23]"
          )}
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
      </nav>
    </aside>
  );
}

function AppLayout() {
  return (
    <div className="flex flex-col h-screen w-full bg-[#0F1115] text-[#E0E0E0] font-sans overflow-hidden">
      <main className="flex flex-1 overflow-hidden">
        <Sidebar />
        <section className="flex-1 flex flex-col bg-[#0F1115] overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/folder" element={<FolderTreePage />} />
          </Routes>
        </section>
      </main>
      <footer className="h-8 bg-[#16191E] border-t border-[#2D3139] flex items-center justify-between px-4 text-[10px] text-gray-500 uppercase tracking-widest shrink-0">
        <div>Indexed via tree utility v2.1.0</div>
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Service Online</span>
          <span>Vite + React PWA Mode</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ScannerProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </ScannerProvider>
  );
}

