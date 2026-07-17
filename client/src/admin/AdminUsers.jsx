import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../supabase/supabaseClient';
import { Loader2, Search, ChevronRight, Users, UserPlus, X, Mail, User, Calendar, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAdminTheme } from './context/AdminThemeContext';

const AdminUsers = () => {
  const { adminTheme } = useAdminTheme();
  const isDark = adminTheme === 'dark';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', displayName: '', parentEmail: '', age: '' });
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState("");

  const fetchUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('http://192.168.18.64:5000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegistering(true);
    setRegisterError("");
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('http://192.168.18.64:5000/api/admin/users/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}` 
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register user');
      }
      
      setShowRegisterModal(false);
      setFormData({ email: '', password: '', displayName: '', parentEmail: '', age: '' });
      fetchUsers(); // Refresh the table
    } catch (err) {
      setRegisterError(err.message);
    } finally {
      setRegistering(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    u.parentEmail?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[var(--admin-accent)]" size={32} /></div>;
  }

  return (
    <div className="min-h-screen p-6 transition-colors duration-300">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6">
        
        {/* Premium Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 p-[2px]">
            <div className="w-full h-full bg-[var(--admin-surface)] rounded-xl flex items-center justify-center overflow-hidden">
              <Users className="text-[var(--admin-accent)]" size={20} />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--admin-text-primary)] tracking-tight mb-0.5">User Management</h1>
            <p className="text-[var(--admin-text-secondary)] text-sm">Oversee registered kids and monitor their reading progress.</p>
          </div>
        </div>

        {/* Premium Search & Register Button */}
        <div className="flex gap-4 w-full xl:w-auto flex-col sm:flex-row">
          <div className="relative w-full sm:w-[320px] group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--admin-text-secondary)] group-focus-within:text-[var(--admin-accent)] transition-colors duration-300">
              <Search size={16} />
            </div>
            <input 
              type="text" 
              placeholder="Search users..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-[var(--admin-border)] rounded-xl bg-[var(--admin-surface)] hover:bg-[var(--admin-surface-hover)] text-[var(--admin-text-primary)] placeholder-[var(--admin-text-secondary)] text-[15px] focus:outline-none focus:border-[var(--admin-accent)] focus:ring-4 focus:ring-[var(--admin-accent)]/10 shadow-sm transition-all duration-300"
            />
          </div>
          <button 
            onClick={() => setShowRegisterModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-cyan-400 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 transform hover:-translate-y-0.5 whitespace-nowrap"
          >
            <UserPlus size={18} />
            <span>Register Member</span>
          </button>
        </div>
      </div>

      <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] overflow-hidden shadow-sm hidden md:block transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--admin-border)]">
            <thead className="bg-[var(--admin-surface-hover)]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--admin-text-secondary)] uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--admin-text-secondary)] uppercase tracking-wider">Age</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--admin-text-secondary)] uppercase tracking-wider">Stories Read</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--admin-text-secondary)] uppercase tracking-wider">Joined</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[var(--admin-text-secondary)] uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--admin-border)]">
              {filteredUsers.map((user) => {
                return (
                <tr key={user.id} className="hover:bg-[var(--admin-surface-hover)] transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex items-center justify-center text-sm font-semibold text-[var(--admin-accent)] bg-[var(--admin-accent-bg)] rounded-full border border-[var(--admin-accent)]/20 shadow-sm">
                        {getInitials(user.displayName || user.email)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[15px] font-medium text-[var(--admin-text-primary)]">{user.displayName || 'Unknown'}</span>
                        <span className="text-sm text-[var(--admin-text-secondary)] mt-0.5">{user.parentEmail || user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[13px] font-medium bg-[var(--admin-surface-hover)] border border-[var(--admin-border)] text-[var(--admin-text-secondary)]">
                      {user.age ? `${user.age} yrs` : '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-[15px] font-medium text-[var(--admin-text-primary)]">
                      {user.storiesRead || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-[15px] text-[var(--admin-text-secondary)]">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Link to={`/admin/users/${user.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[14px] font-medium text-[var(--admin-text-secondary)] hover:text-[var(--admin-accent)] bg-transparent hover:bg-[var(--admin-accent-bg)] rounded-lg border border-transparent transition-colors">
                      View details
                      <ChevronRight size={14} />
                    </Link>
                  </td>
                </tr>
              )})}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center text-[var(--admin-text-secondary)]">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-[var(--admin-surface-hover)] flex items-center justify-center mb-3">
                        <Search size={20} className="text-[var(--admin-text-secondary)] opacity-50" />
                      </div>
                      <p className="font-medium text-[15px]">No users found</p>
                      <p className="text-sm mt-1">Try adjusting your search terms.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4 mt-6">
        {filteredUsers.map((user) => {
          return (
            <div key={user.id} className="bg-[var(--admin-surface)] p-5 rounded-2xl border border-[var(--admin-border)] shadow-sm transition-colors duration-300 relative overflow-hidden">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 flex items-center justify-center text-sm font-semibold text-[var(--admin-accent)] bg-[var(--admin-accent-bg)] rounded-full border border-[var(--admin-accent)]/20 shadow-sm">
                  {getInitials(user.displayName || user.email)}
                </div>
                <div className="flex flex-col">
                  <span className="text-[16px] font-semibold text-[var(--admin-text-primary)]">{user.displayName || 'Unknown'}</span>
                  <span className="text-sm text-[var(--admin-text-secondary)] mt-0.5">{user.parentEmail || user.email}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-3 border-y border-[var(--admin-border)] mb-4">
                <div className="flex flex-col">
                  <span className="text-xs uppercase font-semibold text-[var(--admin-text-secondary)] tracking-wider mb-1">Age</span>
                  <span className="text-[15px] font-medium text-[var(--admin-text-primary)]">{user.age ? `${user.age} yrs` : '—'}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-xs uppercase font-semibold text-[var(--admin-text-secondary)] tracking-wider mb-1">Stories Read</span>
                  <span className="text-[15px] font-medium text-[var(--admin-text-primary)]">{user.storiesRead || 0}</span>
                </div>
              </div>

              <Link to={`/admin/users/${user.id}`} className="w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--admin-surface-hover)] text-[var(--admin-text-primary)] rounded-xl border border-[var(--admin-border)] font-medium text-sm transition-colors hover:bg-[var(--admin-accent-bg)] hover:text-[var(--admin-accent)]">
                View Profile Details
                <ChevronRight size={16} />
              </Link>
            </div>
          );
        })}
        {filteredUsers.length === 0 && (
          <div className="bg-[var(--admin-surface)] p-8 text-center rounded-2xl border border-[var(--admin-border)] text-[var(--admin-text-secondary)] shadow-sm">
            <p className="font-medium text-[15px]">No users found</p>
          </div>
        )}
      </div>
      
      {/* Register Modal via Portal */}
      {showRegisterModal && createPortal(
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 ${isDark ? 'bg-[#020617]/80' : 'bg-slate-900/40'} backdrop-blur-md animate-in fade-in duration-300`}>
          <div className="absolute inset-0 transition-opacity" onClick={() => setShowRegisterModal(false)}></div>

          <div className={`${isDark ? 'bg-[#0b1021] border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.6)]' : 'bg-white border-slate-200 shadow-2xl'} rounded-[2rem] border w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 relative group/modal`}>
            
            {/* Glowing top accent */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent ${isDark ? 'opacity-50' : 'opacity-100'}`}></div>

            {/* Modal Header */}
            <div className={`px-8 py-6 border-b ${isDark ? 'border-white/5' : 'border-slate-100'} flex justify-between items-center relative z-10`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-400/20 flex items-center justify-center border ${isDark ? 'border-indigo-500/30' : 'border-indigo-200'}`}>
                  <UserPlus size={24} className="text-indigo-500" />
                </div>
                <div>
                  <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} tracking-tight`}>Register Member</h2>
                  <p className={`text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Create a new kid account</p>
                </div>
              </div>
              <button 
                onClick={() => setShowRegisterModal(false)} 
                className={`p-2.5 rounded-xl transition-all duration-200 border ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/10 bg-white/5 border-transparent hover:border-white/10' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 bg-slate-50 border-transparent hover:border-slate-200'}`}
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="px-8 py-6 overflow-y-auto custom-scrollbar relative z-10">
              {registerError && (
                <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  <div className="w-1.5 h-full bg-rose-500 rounded-full absolute left-0 top-0 bottom-0"></div>
                  <p className="text-sm font-medium text-rose-500 ml-2">{registerError}</p>
                </div>
              )}
              
              <form id="registerForm" onSubmit={handleRegister} className="space-y-5">
                <div className="space-y-4">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User size={18} className={`transition-colors ${isDark ? 'text-slate-500 group-focus-within:text-indigo-400' : 'text-slate-400 group-focus-within:text-indigo-500'}`} />
                    </div>
                    <input required type="text" value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} className={`w-full pl-11 pr-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner transition-all ${isDark ? 'bg-[#151a2d] border-white/10 text-white placeholder-slate-500 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white'}`} placeholder="Kid's Name (e.g. Abdullah)" />
                  </div>
                  
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Calendar size={18} className={`transition-colors ${isDark ? 'text-slate-500 group-focus-within:text-indigo-400' : 'text-slate-400 group-focus-within:text-indigo-500'}`} />
                    </div>
                    <input type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className={`w-full pl-11 pr-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner transition-all ${isDark ? 'bg-[#151a2d] border-white/10 text-white placeholder-slate-500 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white'}`} placeholder="Age (e.g. 8)" />
                  </div>
                  
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail size={18} className={`transition-colors ${isDark ? 'text-slate-500 group-focus-within:text-indigo-400' : 'text-slate-400 group-focus-within:text-indigo-500'}`} />
                    </div>
                    <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={`w-full pl-11 pr-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner transition-all ${isDark ? 'bg-[#151a2d] border-white/10 text-white placeholder-slate-500 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white'}`} placeholder="Login Email" />
                  </div>
                  
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock size={18} className={`transition-colors ${isDark ? 'text-slate-500 group-focus-within:text-indigo-400' : 'text-slate-400 group-focus-within:text-indigo-500'}`} />
                    </div>
                    <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className={`w-full pl-11 pr-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner transition-all ${isDark ? 'bg-[#151a2d] border-white/10 text-white placeholder-slate-500 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white'}`} placeholder="Password (Min 6 chars)" />
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail size={18} className={`transition-colors ${isDark ? 'text-slate-500 group-focus-within:text-indigo-400' : 'text-slate-400 group-focus-within:text-indigo-500'}`} />
                    </div>
                    <input type="email" value={formData.parentEmail} onChange={e => setFormData({...formData, parentEmail: e.target.value})} className={`w-full pl-11 pr-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner transition-all ${isDark ? 'bg-[#151a2d] border-white/10 text-white placeholder-slate-500 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white'}`} placeholder="Parent's Email (Optional)" />
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className={`px-8 py-5 border-t ${isDark ? 'border-white/5 bg-[#0b1021]' : 'border-slate-100 bg-slate-50/50'} flex flex-col-reverse sm:flex-row gap-3 sm:justify-end relative z-10 rounded-b-[2rem]`}>
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${isDark ? 'text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border-transparent hover:border-white/10 border' : 'text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200'}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="registerForm"
                disabled={registering}
                className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] text-white rounded-xl font-bold transition-all disabled:opacity-50 border border-indigo-400/30"
              >
                {registering ? <Loader2 className="animate-spin" size={18} /> : 'Register Member'}
              </button>
            </div>
          </div>
        </div>, document.body
      )}

    </div>
  );
};

export default AdminUsers;
