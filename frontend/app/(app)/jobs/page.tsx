'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Briefcase, Plus, MoreHorizontal, ExternalLink,
  FileText, Calendar, CheckCircle2, XCircle, Clock, Send, Award,
  Sparkles, Loader2, Search, ArrowRight, Trash2, Edit3, ClipboardList, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { jobApi } from '@/lib/api';

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  saved: { label: 'Saved', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100/50 dark:bg-gray-800/40', icon: Clock },
  applied: { label: 'Applied', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50/50 dark:bg-blue-950/20', icon: Send },
  interview: { label: 'Interview', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50/50 dark:bg-violet-950/20', icon: Calendar },
  offer: { label: 'Offer', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50/50 dark:bg-emerald-950/20', icon: Award },
  rejected: { label: 'Rejected', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50/50 dark:bg-red-950/20', icon: XCircle },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  high: { label: 'High Priority', color: 'bg-red-50 text-red-700 border-red-100 hover:bg-red-50' },
  medium: { label: 'Medium', color: 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-50' },
  low: { label: 'Low', color: 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-50' },
};

export default function JobsPage() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);

  // Dialog & Modal Control
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ company: '', jobTitle: '', jdRaw: '', applicationUrl: '', priority: 'medium', notes: '' });

  // Notes Modal Control
  const [activeNotesJob, setActiveNotesJob] = useState<any | null>(null);
  const [activeNotesText, setActiveNotesText] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      const res: any = await jobApi.list(1, 100);
      setJobs(res?.data?.items || []);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      toast.error('Failed to fetch job credentials');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleCreate = async () => {
    if (!form.company || !form.jobTitle || form.jdRaw.length < 50) {
      toast.error('Please specify company name, job title, and details (min 50 chars)');
      return;
    }
    setCreating(true);
    try {
      await jobApi.create(form);
      toast.success('Job successfully tracked!');
      setAddDialogOpen(false);
      setForm({ company: '', jobTitle: '', jdRaw: '', applicationUrl: '', priority: 'medium', notes: '' });
      fetchJobs();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save job application');
    } finally {
      setCreating(false);
    }
  };

  // ── Optimistic Update Drag & Drop ──
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const jobToMove = jobs.find(j => j._id === id);

    if (!jobToMove || jobToMove.applicationStatus === targetStatus) return;

    const previousStatus = jobToMove.applicationStatus;

    // 1. Optimistic Update (Locally move)
    setJobs(prev => prev.map(j => j._id === id ? { ...j, applicationStatus: targetStatus } : j));
    toast.success(`Moved ${jobToMove.jobTitle} to ${statusConfig[targetStatus].label}`);

    // 2. Sync Background API
    try {
      await jobApi.update(id, { applicationStatus: targetStatus });
    } catch (err) {
      // Rollback on fail
      console.error(err);
      toast.error(`Failed to move ${jobToMove.jobTitle} on server. Rolling back.`);
      setJobs(prev => prev.map(j => j._id === id ? { ...j, applicationStatus: previousStatus } : j));
    }
  };

  const handleUpdatePriority = async (id: string, prio: string) => {
    try {
      await jobApi.update(id, { priority: prio });
      setJobs(prev => prev.map(j => j._id === id ? { ...j, priority: prio } : j));
      toast.success('Priority updated successfully!');
    } catch {
      toast.error('Failed to update priority details');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await jobApi.delete(id);
      setJobs(prev => prev.filter(j => j._id !== id));
      toast.success('Job application deleted');
    } catch {
      toast.error('Failed to delete job application');
    }
  };

  const openNotesModal = (job: any) => {
    setActiveNotesJob(job);
    setActiveNotesText(job.notes || '');
  };

  const saveNotes = async () => {
    if (!activeNotesJob) return;
    setSavingNotes(true);
    try {
      await jobApi.update(activeNotesJob._id, { notes: activeNotesText });
      setJobs(prev => prev.map(j => j._id === activeNotesJob._id ? { ...j, notes: activeNotesText } : j));
      toast.success('Notes saved successfully');
      setActiveNotesJob(null);
    } catch {
      toast.error('Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  // Filter & Search Jobs
  const filteredJobs = jobs.filter(j => {
    const matchesSearch = 
      j.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = selectedPriority ? j.priority === selectedPriority : true;
    return matchesSearch && matchesPriority;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full rounded" />
        <div className="grid grid-cols-5 gap-4 h-[450px]">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Job Tracker Kanban</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Drag & drop cards to track application stages seamlessly.</p>
          </div>

          <div className="flex gap-2">
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-1.5 h-8 text-xs bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow shadow-indigo-500/20">
                  <Plus className="h-3.5 w-3.5" /> Track Application
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-sm font-black uppercase text-indigo-600">Track New Application</DialogTitle>
                  <DialogDescription className="text-[11px]">Specify target role parameters to monitor pipelines.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block font-bold text-gray-700 dark:text-gray-300">Company Name *</label>
                      <Input placeholder="e.g. Vercel" value={form.company} onChange={(e) => setForm(f => ({ ...f, company: e.target.value }))} className="text-xs" />
                    </div>
                    <div>
                      <label className="mb-1 block font-bold text-gray-700 dark:text-gray-300">Job Title *</label>
                      <Input placeholder="e.g. Senior Frontend" value={form.jobTitle} onChange={(e) => setForm(f => ({ ...f, jobTitle: e.target.value }))} className="text-xs" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block font-bold text-gray-700 dark:text-gray-300">Priority Level</label>
                      <select 
                        value={form.priority} 
                        onChange={(e) => setForm(f => ({ ...f, priority: e.target.value }))}
                        className="w-full h-9 rounded-lg border border-border/80 bg-background px-3 py-1.5 text-xs font-semibold focus-visible:ring-indigo-500"
                      >
                        <option value="high">High Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="low">Low Priority</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block font-bold text-gray-700 dark:text-gray-300">Target Application URL</label>
                      <Input placeholder="https://jobs.vercel.com/..." value={form.applicationUrl} onChange={(e) => setForm(f => ({ ...f, applicationUrl: e.target.value }))} className="text-xs" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block font-bold text-gray-700 dark:text-gray-300">Paste Full Job Description * <span className="text-[10px] text-muted-foreground">(min 50 chars)</span></label>
                    <Textarea placeholder="Paste raw JD content here..." rows={4} value={form.jdRaw} onChange={(e) => setForm(f => ({ ...f, jdRaw: e.target.value }))} className="text-xs resize-none" />
                  </div>
                  <div>
                    <label className="mb-1 block font-bold text-gray-700 dark:text-gray-300">Pre-launch Notes <span className="text-[10px] text-muted-foreground">(optional)</span></label>
                    <Textarea placeholder="Write specific notes, keywords to mention, etc." rows={2} value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} className="text-xs resize-none" />
                  </div>
                  <Button onClick={handleCreate} disabled={creating} className="w-full h-9 gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs mt-2">
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {creating ? 'Saving to Kanban...' : 'Track Application'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </motion.div>

      {/* Filters & Search Row */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/50" />
          <Input 
            placeholder="Search tracked companies or job roles..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="pl-9 h-9 text-xs" 
          />
        </div>

        {/* Priority Filter */}
        <div className="flex gap-1.5 text-xs">
          <Button variant={selectedPriority === null ? 'secondary' : 'outline'} size="sm" onClick={() => setSelectedPriority(null)} className="h-9">
            All Priorities
          </Button>
          <Button variant={selectedPriority === 'high' ? 'secondary' : 'outline'} size="sm" onClick={() => setSelectedPriority('high')} className="h-9 text-red-600">
            High
          </Button>
          <Button variant={selectedPriority === 'medium' ? 'secondary' : 'outline'} size="sm" onClick={() => setSelectedPriority('medium')} className="h-9 text-amber-600">
            Medium
          </Button>
          <Button variant={selectedPriority === 'low' ? 'secondary' : 'outline'} size="sm" onClick={() => setSelectedPriority('low')} className="h-9 text-blue-600">
            Low
          </Button>
        </div>
      </motion.div>

      {/* 5-COLUMN KANBAN BOARD */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start select-none">
        {Object.entries(statusConfig).map(([statusKey, config]) => {
          const columnJobs = filteredJobs.filter(j => j.applicationStatus === statusKey);
          
          return (
            <div
              key={statusKey}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, statusKey)}
              className={`rounded-xl p-3 space-y-3 min-h-[460px] border border-border/40 flex flex-col ${config.bg}`}
            >
              {/* Column Header */}
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                  <config.icon className={`h-4.5 w-4.5 ${config.color}`} />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    {config.label}
                  </span>
                </div>
                <Badge variant="outline" className="text-[9px] font-bold py-0.5 border-none bg-background shadow-sm">
                  {columnJobs.length}
                </Badge>
              </div>

              {/* Column Cards Container */}
              <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[500px] pr-0.5">
                {columnJobs.length === 0 ? (
                  <div className="h-28 border border-dashed border-border/40 rounded-xl flex items-center justify-center text-center p-4">
                    <p className="text-[10px] text-muted-foreground/60 italic">Drop here</p>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {columnJobs.map((job) => {
                      const prio = priorityConfig[job.priority] || priorityConfig.medium;
                      return (
                        <motion.div
                          key={job._id}
                          layoutId={job._id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, job._id)}
                          className="bg-card border border-border/50 rounded-xl p-3.5 cursor-grab active:cursor-grabbing hover:border-border hover:shadow-md hover:shadow-black/5 transition-all space-y-2.5"
                        >
                          {/* Role Details */}
                          <div className="space-y-1">
                            <div className="flex items-start justify-between">
                              <span className="font-extrabold text-[11px] text-gray-800 dark:text-gray-200 leading-tight">
                                {job.jobTitle}
                              </span>
                              
                              {/* Quick Actions Dropdown */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="h-5 w-5 text-gray-400 hover:text-gray-900 rounded flex items-center justify-center shrink-0">
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="text-xs">
                                  {job.applicationUrl && (
                                    <DropdownMenuItem className="gap-2 text-xs" onClick={() => window.open(job.applicationUrl, '_blank')}>
                                      <ExternalLink className="h-3.5 w-3.5" /> Open Posting
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem className="gap-2 text-xs" onClick={() => openNotesModal(job)}>
                                    <ClipboardList className="h-3.5 w-3.5" /> Notes Drawer
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {Object.keys(priorityConfig).map(pKey => (
                                    <DropdownMenuItem key={pKey} className="gap-2 text-xs" onClick={() => handleUpdatePriority(job._id, pKey)}>
                                      Set {priorityConfig[pKey].label}
                                    </DropdownMenuItem>
                                  ))}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="gap-2 text-xs text-red-600 hover:bg-red-50" onClick={() => handleDelete(job._id)}>
                                    <Trash2 className="h-3.5 w-3.5" /> Delete Application
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>

                            </div>

                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold">
                              <span>{job.company}</span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-1 border-t border-border/30">
                            {/* Date Badge */}
                            <span className="text-[9px] text-muted-foreground/80 font-mono font-bold flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(job.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>

                            {/* Priority badge */}
                            <Badge className={`${prio.color} text-[8px] font-bold border py-0 px-1.5`}>
                              {prio.label}
                            </Badge>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── NOTES / SLIDE OUT NOTES DRAWER MODAL ── */}
      <Dialog open={activeNotesJob !== null} onOpenChange={(v) => { if(!v) setActiveNotesJob(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-black uppercase text-indigo-600 flex items-center gap-2">
              <ClipboardList className="h-4.5 w-4.5" /> Application Notebook & Prep
            </DialogTitle>
            {activeNotesJob && (
              <DialogDescription className="text-[11px]">
                Active Notes for <strong>{activeNotesJob.jobTitle}</strong> at <strong>{activeNotesJob.company}</strong>
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="space-y-4 pt-2 text-xs">
            <Textarea
              placeholder="Jot down notes, contact info, specific interview timestamps, preparation thoughts, or salary configurations..."
              value={activeNotesText}
              onChange={(e) => setActiveNotesText(e.target.value)}
              rows={12}
              className="resize-none text-xs leading-relaxed focus-visible:ring-indigo-500"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setActiveNotesJob(null)} className="h-8 text-xs">
                Close
              </Button>
              <Button 
                onClick={saveNotes} 
                disabled={savingNotes}
                className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1.5 px-4 shadow shadow-indigo-500/20"
              >
                {savingNotes ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Save Notes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
