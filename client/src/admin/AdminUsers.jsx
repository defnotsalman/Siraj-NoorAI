import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { Loader2, Search, ChevronRight, Users, UserPlus, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminUsers = () => {
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
      const res = await fetch('http://localhost:5000/api/admin/users', {
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
      const res = await fetch('http://localhost:5000/api/admin/users/register', {
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
      
      {/* Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--admin-surface)] rounded-2xl border border-[var(--admin-border)] shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-[var(--admin-border)] bg-[var(--admin-surface-hover)] shrink-0">
              <h2 className="text-lg font-semibold text-[var(--admin-text-primary)]">Register New Member</h2>
              <button 
                onClick={() => setShowRegisterModal(false)}
                className="p-1.5 rounded-lg text-[var(--admin-text-secondary)] hover:bg-[var(--admin-border)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleRegister} className="p-5 overflow-y-auto flex-1 custom-scrollbar">
              {registerError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl shrink-0">
                  {registerError}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--admin-text-secondary)] mb-1.5">Child's Name</label>
                  <input required type="text" value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} className="w-full px-4 py-2 bg-[var(--admin-surface-hover)] border border-[var(--admin-border)] rounded-xl text-[var(--admin-text-primary)] focus:outline-none focus:border-[var(--admin-accent)]" placeholder="E.g. Abdullah" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[var(--admin-text-secondary)] mb-1.5">Age</label>
                  <input type="number" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full px-4 py-2 bg-[var(--admin-surface-hover)] border border-[var(--admin-border)] rounded-xl text-[var(--admin-text-primary)] focus:outline-none focus:border-[var(--admin-accent)]" placeholder="E.g. 8" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--admin-text-secondary)] mb-1.5">Login Email</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 bg-[var(--admin-surface-hover)] border border-[var(--admin-border)] rounded-xl text-[var(--admin-text-primary)] focus:outline-none focus:border-[var(--admin-accent)]" placeholder="user@example.com" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--admin-text-secondary)] mb-1.5">Password</label>
                  <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-2 bg-[var(--admin-surface-hover)] border border-[var(--admin-border)] rounded-xl text-[var(--admin-text-primary)] focus:outline-none focus:border-[var(--admin-accent)]" placeholder="Minimum 6 characters" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--admin-text-secondary)] mb-1.5">Parent Email (Optional)</label>
                  <input type="email" value={formData.parentEmail} onChange={e => setFormData({...formData, parentEmail: e.target.value})} className="w-full px-4 py-2 bg-[var(--admin-surface-hover)] border border-[var(--admin-border)] rounded-xl text-[var(--admin-text-primary)] focus:outline-none focus:border-[var(--admin-accent)]" placeholder="parent@example.com" />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowRegisterModal(false)}
                  className="flex-1 py-2.5 px-4 bg-[var(--admin-surface-hover)] border border-[var(--admin-border)] text-[var(--admin-text-primary)] rounded-xl font-medium hover:bg-[var(--admin-border)] transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={registering}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-indigo-500 to-cyan-400 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {registering ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                  {registering ? 'Creating...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminUsers;
