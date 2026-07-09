import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { Loader2, ArrowLeft, Book, Clock, Target } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';

const AdminUserDetail = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserDetail = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        
        // Fetch profile and progress history via Admin API
        const res = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const { profile, progress } = await res.json();
          setUser(profile);
          setProgress(progress);
        } else {
          console.error("Failed to fetch user details", res.statusText);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserDetail();
  }, [userId]);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[var(--admin-accent)]" size={32} /></div>;
  }

  if (!user) {
    return <div className="text-center py-12 text-[var(--admin-text-secondary)]">User not found</div>;
  }

  return (
    <div className="transition-colors duration-300">
      <div className="mb-6">
        <Link to="/admin/users" className="text-[var(--admin-accent)] hover:opacity-80 flex items-center gap-2 mb-4 font-medium text-sm transition-opacity">
          <ArrowLeft size={16} /> Back to Users
        </Link>
        <h1 className="text-2xl font-bold text-[var(--admin-text-primary)]">{user.displayName || 'Unknown'}'s Profile</h1>
        <p className="text-[var(--admin-text-secondary)]">{user.parentEmail || user.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-[var(--admin-surface)] p-6 rounded-3xl border border-[var(--admin-border)] shadow-sm flex items-center gap-4 transition-colors duration-300">
          <div className="p-3 bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-xl border border-sky-200 dark:border-sky-500/20"><Book size={24} /></div>
          <div>
            <p className="text-sm font-bold text-[var(--admin-text-secondary)] uppercase tracking-wider mb-0.5">Stories Read</p>
            <p className="text-2xl font-extrabold text-[var(--admin-text-primary)]">{user.storiesRead || 0}</p>
          </div>
        </div>
        <div className="bg-[var(--admin-surface)] p-6 rounded-3xl border border-[var(--admin-border)] shadow-sm flex items-center gap-4 transition-colors duration-300">
          <div className="p-3 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-500/20"><Target size={24} /></div>
          <div>
            <p className="text-sm font-bold text-[var(--admin-text-secondary)] uppercase tracking-wider mb-0.5">Total XP</p>
            <p className="text-2xl font-extrabold text-[var(--admin-text-primary)]">{user.xp || 0}</p>
          </div>
        </div>
        <div className="bg-[var(--admin-surface)] p-6 rounded-3xl border border-[var(--admin-border)] shadow-sm flex items-center gap-4 transition-colors duration-300">
          <div className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-500/20"><Clock size={24} /></div>
          <div>
            <p className="text-sm font-bold text-[var(--admin-text-secondary)] uppercase tracking-wider mb-0.5">Day Streak</p>
            <p className="text-2xl font-extrabold text-[var(--admin-text-primary)]">{user.streak || 0}</p>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-[var(--admin-text-primary)] mb-4">Reading History</h2>
      {progress.length === 0 ? (
        <div className="bg-[var(--admin-surface)] p-8 text-center rounded-3xl border border-[var(--admin-border)] text-[var(--admin-text-secondary)] shadow-sm transition-colors duration-300">
          No reading history found for this user.
        </div>
      ) : (
        <div className="bg-[var(--admin-surface)] rounded-3xl border border-[var(--admin-border)] shadow-sm overflow-hidden transition-colors duration-300">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--admin-border)]">
              <thead className="bg-[var(--admin-surface-hover)]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[var(--admin-text-secondary)] uppercase tracking-wider">Story ID</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[var(--admin-text-secondary)] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[var(--admin-text-secondary)] uppercase tracking-wider">Completed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--admin-border)]">
                {progress.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--admin-surface-hover)] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--admin-text-primary)]">{p.story_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs font-bold rounded-full border shadow-sm ${p.completed ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'}`}>
                        {p.completed ? 'Completed' : 'In Progress'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--admin-text-secondary)]">
                      {p.completed_at ? new Date(p.completed_at).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserDetail;
