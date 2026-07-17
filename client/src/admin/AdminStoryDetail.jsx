import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { Loader2, ArrowLeft, RefreshCw, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useParams, Link, useNavigate } from 'react-router-dom';

const AdminStoryDetail = () => {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchStory();
  }, [storyId]);

  const fetchStory = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('http://192.168.1.69:5000/api/admin/stories', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      if (res.ok) {
        const stories = await res.json();
        const found = stories.find(s => s.id === storyId);
        setStory(found);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to completely delete this story?")) return;
    
    try {
      setProcessing(true);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`http://192.168.1.69:5000/api/admin/stories/${storyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      
      if (res.ok) {
        navigate('/admin/stories');
      } else {
        alert("Failed to delete story.");
      }
    } catch (err) {
      alert("Error deleting story.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[var(--admin-accent)]" size={32} /></div>;
  }

  if (!story) {
    return <div className="text-center py-12 text-[var(--admin-text-secondary)]">Story not found</div>;
  }

  return (
    <div className="transition-colors duration-300">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <Link to="/admin/stories" className="text-[var(--admin-accent)] hover:opacity-80 flex items-center gap-2 mb-4 font-medium text-sm transition-opacity">
            <ArrowLeft size={16} /> Back to Stories
          </Link>
          <h1 className="text-2xl font-bold text-[var(--admin-text-primary)]">{story.title}</h1>
          <p className="text-[var(--admin-text-secondary)]">ID: {story.id}</p>
        </div>
        <button 
          onClick={handleDelete}
          disabled={processing}
          className="flex items-center gap-2 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-transparent hover:border-rose-200 dark:hover:border-rose-500/30 px-4 py-2 rounded-xl font-medium transition-colors"
        >
          <Trash2 size={20} />
          Delete Story
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-[var(--admin-surface)] rounded-3xl border border-[var(--admin-border)] shadow-sm p-6 transition-colors duration-300">
          <h2 className="text-lg font-bold text-[var(--admin-text-primary)] mb-4">Metadata</h2>
          <div className="space-y-4">
            <div className="p-3 bg-[var(--admin-surface-hover)] rounded-xl border border-[var(--admin-border)]">
              <p className="text-sm font-bold text-[var(--admin-text-secondary)] uppercase tracking-wider mb-1">Category</p>
              <p className="font-medium text-[var(--admin-text-primary)]">{story.category}</p>
            </div>
            <div className="p-3 bg-[var(--admin-surface-hover)] rounded-xl border border-[var(--admin-border)]">
              <p className="text-sm font-bold text-[var(--admin-text-secondary)] uppercase tracking-wider mb-1">Word Count</p>
              <p className="font-medium text-[var(--admin-text-primary)]">{story.wordCount}</p>
            </div>
            <div className="p-3 bg-[var(--admin-surface-hover)] rounded-xl border border-[var(--admin-border)]">
              <p className="text-sm font-bold text-[var(--admin-text-secondary)] uppercase tracking-wider mb-1">Moral Lesson</p>
              <p className="font-medium text-[var(--admin-text-primary)]">{story.moralLesson || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--admin-surface)] rounded-3xl border border-[var(--admin-border)] shadow-sm p-6 transition-colors duration-300">
          <h2 className="text-lg font-bold text-[var(--admin-text-primary)] mb-4">Generation Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[var(--admin-surface-hover)] rounded-xl border border-[var(--admin-border)]">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={24} />
                <span className="font-medium text-[var(--admin-text-primary)]">Story Index & Embeddings</span>
              </div>
              <span className="text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-2.5 py-1 rounded-full shadow-sm">Generated</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-[var(--admin-surface-hover)] rounded-xl border border-[var(--admin-border)]">
              <div className="flex items-center gap-3">
                {story.hasQuiz ? <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={24} /> : <XCircle className="text-rose-600 dark:text-rose-400" size={24} />}
                <span className="font-medium text-[var(--admin-text-primary)]">Quiz Content</span>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border shadow-sm ${story.hasQuiz ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'}`}>
                {story.hasQuiz ? 'Generated' : 'Missing'}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-[var(--admin-surface-hover)] rounded-xl border border-[var(--admin-border)]">
              <div className="flex items-center gap-3">
                {story.hasAudio ? <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={24} /> : <XCircle className="text-rose-600 dark:text-rose-400" size={24} />}
                <span className="font-medium text-[var(--admin-text-primary)]">Audio Narration</span>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border shadow-sm ${story.hasAudio ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'}`}>
                {story.hasAudio ? 'Generated' : 'Missing'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStoryDetail;
