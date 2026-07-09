import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Users, MessageSquare, Menu, X, LogOut, Moon, Sun, Bell, Search } from 'lucide-react';
import { supabase } from '../supabase/supabaseClient';
import { useAdminTheme } from './context/AdminThemeContext';

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { adminTheme, toggleAdminTheme } = useAdminTheme();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Stories', path: '/admin/stories', icon: BookOpen },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Chat Logs', path: '/admin/chat-logs', icon: MessageSquare },
  ];

  return (
    <div className={`admin-portal ${adminTheme === 'dark' ? 'admin-dark' : ''} min-h-screen bg-[var(--admin-bg)] text-[var(--admin-text-primary)] flex flex-col md:flex-row font-sans relative overflow-hidden transition-colors duration-300`}>
      
      {/* Mobile Header */}
      <div className="md:hidden bg-[var(--admin-surface)] text-[var(--admin-text-primary)] p-4 flex justify-between items-center shadow-[0_4px_20px_rgba(0,0,0,0.05)] z-20 relative border-b border-[var(--admin-border)] transition-colors duration-300">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 shadow-md shadow-indigo-500/20 p-[2px]">
            <div className="w-full h-full bg-white rounded-md flex items-center justify-center overflow-hidden">
              <img src="/logo.jpg" alt="NoorKids" className="w-full h-full object-contain transform scale-110" />
            </div>
          </div>
          <span className="text-lg font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-cyan-400 tracking-tight">NoorKids AI</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-[var(--admin-text-primary)]">
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:sticky md:top-0 inset-y-0 left-0 w-64 h-screen bg-[var(--admin-surface)] border-r border-[var(--admin-border)] z-30 transition-all duration-300 ease-in-out flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.05)]`}
      >
        <div className="hidden md:flex flex-col items-center justify-center border-b border-[var(--admin-border)] w-full bg-[var(--admin-surface)]">
          {/* Logo Container */}
          <div className="w-full flex items-center justify-center py-6 px-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 shadow-lg shadow-indigo-500/20 transform hover:scale-105 transition-transform duration-300 p-[2px]">
                <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center overflow-hidden">
                  <img src="/logo.jpg" alt="NoorKids" className="w-full h-full object-contain transform scale-110" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-cyan-400 tracking-tight leading-none">NoorKids AI</span>
                <span className="text-[10px] font-bold text-[var(--admin-text-secondary)] uppercase tracking-widest mt-1">Admin Portal</span>
              </div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-16 md:mt-0 relative z-10">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-[var(--admin-accent-bg)] text-[var(--admin-accent)] border border-[var(--admin-accent)]/20 shadow-sm'
                    : 'text-[var(--admin-text-secondary)] hover:bg-[var(--admin-surface-hover)] hover:text-[var(--admin-text-primary)] border border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={20} className={isActive ? "text-[var(--admin-accent)]" : "text-[var(--admin-text-secondary)]"} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-[var(--admin-border)] relative z-10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl font-medium text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors border border-transparent hover:border-rose-200"
          >
            <LogOut size={20} />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 z-10">
        {/* Top Navigation Bar */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-[var(--admin-surface)]/80 backdrop-blur-md border-b border-[var(--admin-border)] sticky top-0 z-20 transition-colors duration-300">
          <div className="flex items-center gap-4 bg-[var(--admin-surface-hover)] border border-[var(--admin-border)] rounded-full px-4 py-2 w-96 transition-all focus-within:ring-2 focus-within:ring-[var(--admin-accent)] focus-within:border-[var(--admin-accent)] shadow-inner">
            <Search size={18} className="text-[var(--admin-text-secondary)]" />
            <input 
              type="text" 
              placeholder="Search across the portal..." 
              className="bg-transparent border-none outline-none text-sm text-[var(--admin-text-primary)] placeholder-[var(--admin-text-secondary)] w-full"
            />
          </div>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={toggleAdminTheme}
              className="relative p-2 text-[var(--admin-text-secondary)] hover:text-[var(--admin-accent)] transition-colors rounded-full hover:bg-[var(--admin-surface-hover)]"
              aria-label="Toggle Theme"
            >
              {adminTheme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button className="relative p-2 text-[var(--admin-text-secondary)] hover:text-[var(--admin-accent)] transition-colors rounded-full hover:bg-[var(--admin-surface-hover)]">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-[var(--admin-surface)]"></span>
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-[var(--admin-border)]">
              <div className="w-8 h-8 rounded-full bg-[var(--admin-accent)] flex items-center justify-center text-white font-bold text-sm shadow-md">
                A
              </div>
              <div className="hidden lg:block text-sm">
                <p className="text-[var(--admin-text-primary)] font-medium">Administrator</p>
                <p className="text-[var(--admin-text-secondary)] text-xs">admin@noorkids.com</p>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full relative">
          <div className="max-w-7xl mx-auto w-full animate-fade-in-up">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/20 z-0"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;
