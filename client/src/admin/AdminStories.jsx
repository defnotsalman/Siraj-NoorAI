import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../supabase/supabaseClient';
import { Plus, Edit2, CheckCircle, XCircle, Loader2, BookOpen, Search, Filter, AlertCircle, FileText, UploadCloud, ChevronRight, Activity, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAdminTheme } from './context/AdminThemeContext';

const AdminStories = () => {
  const { adminTheme } = useAdminTheme();
  const isDark = adminTheme === 'dark';
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Upload Flow State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadStep, setUploadStep] = useState(1); // 1: Select File, 2: Review Metadata, 3: Processing
  const [previewMetadata, setPreviewMetadata] = useState(null);
  const [storagePath, setStoragePath] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // Processing State (SSE)
  const [processingStatus, setProcessingStatus] = useState([]);
  
  const fileInputRef = useRef();

  const fetchStories = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('http://localhost:5000/api/admin/stories', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      if (res.ok) {
        setStories(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile) return;
    setUploading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const formData = new FormData();
      formData.append('file', uploadFile);

      const res = await fetch('http://localhost:5000/api/admin/stories/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token}` },
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStoragePath(data.storagePath);
        setPreviewMetadata(data.metadata);
        setUploadStep(2);
      } else {
        alert(data.error || "Upload failed");
      }
    } catch (err) {
      alert("Error uploading file");
    } finally {
      setUploading(false);
    }
  };

  const handleProcessSubmit = async () => {
    setUploadStep(3);
    setProcessingStatus([{ type: 'info', message: 'Starting process job...' }]);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch('http://localhost:5000/api/admin/stories/process', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          storagePath,
          title: previewMetadata.title
        })
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');
        
        lines.forEach(line => {
          if (line.startsWith('event:')) {
            const eventType = line.match(/event: (.*)/)[1];
            const dataLine = line.split('\n').find(l => l.startsWith('data: '));
            if (dataLine) {
              const dataStr = dataLine.substring(6);
              try {
                const dataObj = JSON.parse(dataStr);
                
                if (eventType === 'status') {
                  setProcessingStatus(prev => [...prev, { type: 'info', message: dataObj.message }]);
                } else if (eventType === 'error') {
                  setProcessingStatus(prev => [...prev, { type: 'error', message: dataObj.message }]);
                } else if (eventType === 'complete') {
                  setProcessingStatus(prev => [...prev, { type: 'success', message: 'All done!' }]);
                  fetchStories();
                }
              } catch (e) {}
            }
          }
        });
      }

    } catch (err) {
      setProcessingStatus(prev => [...prev, { type: 'error', message: 'Connection lost' }]);
    }
  };

  const resetUploadModal = () => {
    setShowUploadModal(false);
    setUploadStep(1);
    setUploadFile(null);
    setPreviewMetadata(null);
    setStoragePath(null);
    setProcessingStatus([]);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-4 md:p-8 h-full">
        <div className="flex justify-between">
          <div className="h-10 w-48 bg-[var(--admin-surface)] rounded-lg"></div>
          <div className="h-10 w-32 bg-[var(--admin-surface)] rounded-lg"></div>
        </div>
        <div className="h-[500px] w-full bg-[var(--admin-surface)] rounded-3xl border border-[var(--admin-border)]"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--admin-text-primary)] mb-2 tracking-tight">Story Library</h1>
          <p className="text-[var(--admin-text-secondary)] text-sm">Upload, process, and manage all your AI-powered stories here.</p>
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="group flex items-center gap-2 bg-[var(--admin-accent)] hover:opacity-90 text-white px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg border border-transparent hover:-translate-y-0.5"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          Upload New Story
        </button>
      </div>

      {stories.length === 0 ? (
        <div className="flex-1 bg-[var(--admin-surface)] p-12 text-center rounded-3xl border border-[var(--admin-border)] shadow-sm flex flex-col items-center justify-center transition-colors duration-300">
          <div className="w-24 h-24 bg-[var(--admin-accent-bg)] rounded-full flex items-center justify-center mb-6 border border-[var(--admin-accent)]/20">
            <BookOpen className="text-[var(--admin-accent)]" size={48} />
          </div>
          <h3 className="text-2xl font-bold text-[var(--admin-text-primary)] mb-2">Your library is empty</h3>
          <p className="text-[var(--admin-text-secondary)] max-w-md mx-auto mb-8">You haven't uploaded any stories yet. Upload a `.docx` file to automatically generate an AI quiz and audio narration!</p>
          <button 
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 bg-[var(--admin-surface-hover)] hover:bg-[var(--admin-border)] text-[var(--admin-text-primary)] px-6 py-3 rounded-xl font-medium transition-colors border border-[var(--admin-border)]"
          >
            <UploadCloud size={20} /> Browse Files
          </button>
        </div>
      ) : (
        <div className="flex-1 bg-[var(--admin-surface)] rounded-3xl border border-[var(--admin-border)] overflow-hidden shadow-sm flex flex-col transition-colors duration-300">
          {/* Table Toolbar */}
          <div className="p-4 border-b border-[var(--admin-border)] flex flex-col sm:flex-row gap-4 justify-between items-center bg-[var(--admin-surface)]">
            <div className="relative w-full sm:w-72">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-secondary)]" />
              <input 
                type="text" 
                placeholder="Search stories..." 
                className="w-full bg-[var(--admin-surface-hover)] border border-[var(--admin-border)] rounded-lg pl-10 pr-4 py-2 text-sm text-[var(--admin-text-primary)] placeholder-[var(--admin-text-secondary)] focus:outline-none focus:border-[var(--admin-accent)] focus:ring-1 focus:ring-[var(--admin-accent)] transition-all"
              />
            </div>
            <button className="flex items-center gap-2 text-sm font-medium text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] px-4 py-2 rounded-lg hover:bg-[var(--admin-surface-hover)] transition-colors border border-transparent hover:border-[var(--admin-border)]">
              <Filter size={16} /> Filter
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="min-w-full divide-y divide-[var(--admin-border)]">
              <thead className="bg-[var(--admin-surface-hover)]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--admin-text-secondary)] uppercase tracking-wider">Story Details</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--admin-text-secondary)] uppercase tracking-wider">Length</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-[var(--admin-text-secondary)] uppercase tracking-wider">Quiz Ready</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-[var(--admin-text-secondary)] uppercase tracking-wider">Audio Ready</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-[var(--admin-text-secondary)] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--admin-border)]">
                {stories.map((story) => (
                  <tr key={story.id} className="hover:bg-[var(--admin-surface-hover)] transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[var(--admin-accent-bg)] text-[var(--admin-accent)] flex items-center justify-center border border-[var(--admin-accent)]/20 group-hover:scale-110 transition-transform">
                          <FileText size={20} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-[var(--admin-text-primary)] mb-0.5">{story.title}</div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[var(--admin-surface-hover)] text-[var(--admin-text-secondary)] border border-[var(--admin-border)]">
                            {story.category || 'Uncategorized'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-[var(--admin-text-primary)] flex items-center gap-2">
                        {story.wordCount} <span className="text-[var(--admin-text-secondary)] text-xs font-normal">words</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {story.hasQuiz 
                        ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"><CheckCircle size={14} /> Yes</span>
                        : <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20"><XCircle size={14} /> No</span>
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {story.hasAudio 
                        ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"><CheckCircle size={14} /> Yes</span>
                        : <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20"><XCircle size={14} /> No</span>
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        to={`/admin/stories/${story.id}`} 
                        className="inline-flex items-center gap-2 text-[var(--admin-accent)] hover:text-[var(--admin-text-primary)] hover:bg-[var(--admin-surface-hover)] px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-[var(--admin-border)]"
                      >
                        <Edit2 size={16} /> Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Wizard Modal */}
      {showUploadModal && createPortal(
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 ${isDark ? 'bg-[#020617]/80' : 'bg-slate-900/40'} backdrop-blur-md animate-in fade-in duration-300`}>
          <div className="absolute inset-0 transition-opacity" onClick={uploadStep !== 3 ? resetUploadModal : null}></div>

          <div className={`${isDark ? 'bg-[#0b1021] border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.6)]' : 'bg-white border-slate-200 shadow-2xl'} rounded-[2rem] border w-full max-w-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 relative group/modal`}>
            
            {/* Glowing top accent */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent ${isDark ? 'opacity-50' : 'opacity-100'}`}></div>

            {/* Modal Header */}
            <div className={`px-6 py-5 border-b ${isDark ? 'border-white/5' : 'border-slate-100'} flex justify-between items-center relative z-10`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-400/20 flex items-center justify-center border ${isDark ? 'border-indigo-500/30' : 'border-indigo-200'}`}>
                  <UploadCloud size={20} className="text-indigo-500" />
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} tracking-tight`}>
                    {uploadStep === 1 ? 'Upload Story' : uploadStep === 2 ? 'Review & Confirm' : 'Processing AI'}
                  </h2>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Automated Story Ingestion</p>
                </div>
              </div>
              {uploadStep !== 3 && (
                <button 
                  onClick={resetUploadModal} 
                  className={`p-2 rounded-xl transition-all duration-200 border ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/10 bg-white/5 border-transparent hover:border-white/10' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 bg-slate-50 border-transparent hover:border-slate-200'}`}
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Stepper UI */}
            <div className="px-8 pt-6 pb-2 relative z-10">
              <div className="flex items-center justify-between relative">
                <div className={`absolute left-0 top-1/2 w-full h-0.5 -z-10 -translate-y-1/2 ${isDark ? 'bg-white/5' : 'bg-slate-200'}`}></div>
                
                {[1, 2, 3].map(step => (
                  <div key={step} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                    uploadStep > step ? 'bg-indigo-500 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' :
                    uploadStep === step ? `${isDark ? 'bg-[#0b1021]' : 'bg-white'} border-indigo-500 text-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]` :
                    `${isDark ? 'bg-[#151a2d] border-white/10 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400'}`
                  }`}>
                    {uploadStep > step ? <CheckCircle size={16} /> : step}
                  </div>
                ))}
              </div>
              <div className={`flex justify-between text-xs font-bold mt-3 px-1 uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <span className={uploadStep >= 1 ? 'text-indigo-400' : ''}>Upload</span>
                <span className={uploadStep >= 2 ? 'text-indigo-400' : ''}>Review</span>
                <span className={uploadStep === 3 ? 'text-indigo-400' : ''}>Process</span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-8 py-6 flex-1 relative z-10">
              {uploadStep === 1 && (
                <div className="animate-in fade-in zoom-in-95 duration-300">
                  <div 
                    onClick={() => fileInputRef.current.click()}
                    className={`mt-2 border-2 border-dashed ${uploadFile ? 'border-indigo-500 bg-indigo-500/10' : (isDark ? 'border-white/20 bg-[#151a2d]/50 hover:bg-[#151a2d]' : 'border-slate-300 bg-slate-50 hover:bg-slate-100')} rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 group`}
                  >
                    <input 
                      type="file" 
                      accept=".docx" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden" 
                    />
                    <div className={`w-16 h-16 mx-auto rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${uploadFile ? 'bg-indigo-500 shadow-lg shadow-indigo-500/30' : (isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-slate-200 shadow-sm')}`}>
                      <FileText className={`${uploadFile ? 'text-white' : (isDark ? 'text-slate-400 group-hover:text-white' : 'text-slate-400 group-hover:text-indigo-500')}`} size={28} />
                    </div>
                    {uploadFile ? (
                      <div>
                        <p className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{uploadFile.name}</p>
                        <p className="text-sm text-indigo-500">Ready to parse</p>
                      </div>
                    ) : (
                      <div>
                        <p className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Click or drag `.docx` file here</p>
                        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Microsoft Word document containing the story</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {uploadStep === 2 && previewMetadata && (
                <div className="animate-in fade-in zoom-in-95 duration-300 space-y-5">
                  <div className={`rounded-xl p-4 border shadow-inner ${isDark ? 'bg-[#151a2d] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                    <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Extracted Title</label>
                    <div className={`font-medium text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{previewMetadata.title}</div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className={`rounded-xl p-4 border shadow-inner flex-1 ${isDark ? 'bg-[#151a2d] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                      <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Word Count</label>
                      <div className="text-emerald-500 font-bold text-xl">{previewMetadata.wordCount}</div>
                    </div>
                    <div className={`rounded-xl p-4 border shadow-inner flex-1 ${isDark ? 'bg-[#151a2d] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                      <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Format</label>
                      <div className="text-cyan-500 font-bold text-xl flex items-center gap-2"><FileText size={20}/> .docx</div>
                    </div>
                  </div>

                  <div className={`rounded-xl p-4 border shadow-inner ${isDark ? 'bg-[#151a2d] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                    <label className={`block text-[11px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Preview Text Extract</label>
                    <div className={`text-sm leading-relaxed max-h-32 overflow-y-auto pr-2 custom-scrollbar italic border-l-2 border-indigo-500 pl-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      "{previewMetadata.previewText}"
                    </div>
                  </div>

                  <div className={`border p-4 rounded-xl flex items-start gap-3 ${isDark ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'}`}>
                    <Activity className="text-indigo-500 mt-0.5 shrink-0" size={18} />
                    <p className={`text-sm ${isDark ? 'text-indigo-100/80' : 'text-indigo-900/80'}`}>
                      Confirming will immediately trigger the AI to generate a custom quiz and natural voice narration. This usually takes 1-2 minutes.
                    </p>
                  </div>
                </div>
              )}

              {uploadStep === 3 && (
                <div className="animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex flex-col items-center justify-center mb-6 mt-4">
                    <div className="relative">
                      <div className={`w-20 h-20 border-4 rounded-full animate-spin ${isDark ? 'border-indigo-500/20 border-t-indigo-500' : 'border-indigo-100 border-t-indigo-500'}`}></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Activity className="text-indigo-500 animate-pulse" size={28} />
                      </div>
                    </div>
                    <h3 className={`font-bold text-lg mt-5 ${isDark ? 'text-white' : 'text-slate-900'}`}>AI is Processing...</h3>
                    <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Please do not close this window</p>
                  </div>

                  <div className={`border font-mono text-[13px] p-5 rounded-2xl h-56 overflow-y-auto custom-scrollbar shadow-inner ${isDark ? 'bg-[#020617] border-white/5' : 'bg-slate-100 border-slate-200'}`}>
                    {processingStatus.map((s, i) => (
                      <div key={i} className={`mb-2.5 flex gap-3 ${s.type === 'error' ? 'text-rose-500' : s.type === 'success' ? 'text-emerald-600' : (isDark ? 'text-slate-300' : 'text-slate-700')}`}>
                        <span className={`shrink-0 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>[{new Date().toLocaleTimeString()}]</span>
                        <span className="flex-1">
                          {s.type === 'info' && <span className="text-indigo-500 mr-2">➜</span>}
                          {s.type === 'success' && <span className="text-emerald-500 mr-2">✔</span>}
                          {s.type === 'error' && <span className="text-rose-500 mr-2">✖</span>}
                          {s.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className={`px-6 py-5 border-t ${isDark ? 'border-white/5 bg-[#0b1021]' : 'border-slate-100 bg-slate-50/50'} flex flex-col-reverse sm:flex-row gap-3 sm:justify-end relative z-10 rounded-b-[2rem]`}>
              {uploadStep === 1 && (
                <>
                  <button
                    onClick={resetUploadModal}
                    className={`px-6 py-3 rounded-xl font-medium transition-all ${isDark ? 'text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border-transparent hover:border-white/10 border' : 'text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200'}`}
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!uploadFile || uploading}
                    className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] text-white rounded-xl font-bold transition-all disabled:opacity-50 border border-indigo-400/30"
                    onClick={handleUploadSubmit}
                  >
                    {uploading ? <Loader2 className="animate-spin" size={18} /> : 'Parse Document'} 
                    {!uploading && <ChevronRight size={18} />}
                  </button>
                </>
              )}

              {uploadStep === 2 && (
                <>
                  <button
                    onClick={resetUploadModal}
                    className={`px-6 py-3 rounded-xl font-medium transition-all ${isDark ? 'text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border-transparent hover:border-white/10 border' : 'text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200'}`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProcessSubmit}
                    className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] text-white rounded-xl font-bold transition-all border border-emerald-400/30"
                  >
                    <Activity size={18} /> Confirm & Run AI
                  </button>
                </>
              )}

              {uploadStep === 3 && processingStatus.some(s => s.type === 'success' || s.type === 'error') && (
                <button
                  onClick={resetUploadModal}
                  className="w-full sm:w-auto px-10 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] text-white rounded-xl font-bold transition-all border border-indigo-400/30"
                >
                  Done
                </button>
              )}
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminStories;
