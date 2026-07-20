import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { Loader2, MessageSquare } from 'lucide-react';

const AdminChatLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('http://localhost:5000/api/admin/chat-logs', {
          headers: { 'Authorization': `Bearer ${session?.access_token}` }
        });
        if (res.ok) {
          setLogs(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[var(--admin-accent)]" size={32} /></div>;
  }

  return (
    <div className="transition-colors duration-300">
      <h1 className="text-2xl font-bold text-[var(--admin-text-primary)] mb-6 flex items-center gap-2">
        <MessageSquare className="text-[var(--admin-accent)]" /> Chat Logs Oversight
      </h1>

      <div className="bg-[var(--admin-surface)] p-6 rounded-3xl border border-[var(--admin-border)] shadow-sm mb-6 transition-colors duration-300">
        <p className="text-sm text-[var(--admin-text-secondary)]">
          This is a read-only view of recent AI chatbot conversations for spot-checking safety and quality. 
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="bg-[var(--admin-surface)] p-12 text-center rounded-3xl border border-[var(--admin-border)] shadow-sm transition-colors duration-300">
          <MessageSquare className="mx-auto text-[var(--admin-text-secondary)] mb-4" size={48} />
          <h3 className="text-lg font-medium text-[var(--admin-text-primary)]">No chat logs yet</h3>
          <p className="text-[var(--admin-text-secondary)] mt-1">When kids talk to the AI, logs will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log, i) => (
            <div key={i} className="bg-[var(--admin-surface)] rounded-3xl border border-[var(--admin-border)] shadow-sm p-6 transition-colors duration-300">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-[var(--admin-border)]">
                <span className="text-xs font-bold text-[var(--admin-accent)] bg-[var(--admin-accent-bg)] px-3 py-1.5 rounded-lg border border-[var(--admin-accent)]/20 shadow-sm">Story: {log.storyId}</span>
                <span className="text-xs font-medium text-[var(--admin-text-secondary)] bg-[var(--admin-surface-hover)] px-3 py-1.5 rounded-lg border border-[var(--admin-border)]">{new Date(log.timestamp).toLocaleString()}</span>
              </div>
              <div className="space-y-4">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[var(--admin-text-secondary)] uppercase tracking-wider mb-1">Q:</span>
                  <p className="text-sm font-medium text-[var(--admin-text-primary)] bg-[var(--admin-surface-hover)] p-4 rounded-2xl border border-[var(--admin-border)] shadow-sm">{log.question}</p>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[var(--admin-text-secondary)] uppercase tracking-wider mb-1">A:</span>
                  <p className="text-sm text-[var(--admin-text-primary)] bg-[var(--admin-accent-bg)] p-4 rounded-2xl border border-[var(--admin-accent)]/20 shadow-sm leading-relaxed">{log.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminChatLogs;
