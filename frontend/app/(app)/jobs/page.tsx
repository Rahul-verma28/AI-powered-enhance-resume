'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Briefcase, Plus, MoreHorizontal, ExternalLink,
  FileText, Calendar, CheckCircle2, XCircle, Clock, Send, Award,
  Sparkles, Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { jobApi } from '@/lib/api';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  saved: { label: 'Saved', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', icon: Clock },
  applied: { label: 'Applied', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400', icon: Send },
  interview: { label: 'Interview', color: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400', icon: Calendar },
  offer: { label: 'Offer', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400', icon: Award },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400', icon: XCircle },
};

export default function JobsPage() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({ total: 0 });
  const [filter, setFilter] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ company: '', jobTitle: '', jdRaw: '', applicationUrl: '' });

  const fetchJobs = useCallback(async () => {
    try {
      const [jobsRes, statsRes] = await Promise.allSettled([
        jobApi.list(1, 50, filter || undefined),
        jobApi.getStats(),
      ]);
      if (jobsRes.status === 'fulfilled') setJobs((jobsRes.value as any)?.data?.items || []);
      if (statsRes.status === 'fulfilled') setStats((statsRes.value as any)?.data || { total: 0 });
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    const timer = setTimeout(fetchJobs, 500);
    return () => clearTimeout(timer);
  }, [fetchJobs]);

  const handleCreate = async () => {
    if (!form.company || !form.jobTitle || form.jdRaw.length < 50) {
      toast.error('Please fill in all required fields');
      return;
    }
    setCreating(true);
    try {
      await jobApi.create(form);
      toast.success('Job saved!');
      setDialogOpen(false);
      setForm({ company: '', jobTitle: '', jdRaw: '', applicationUrl: '' });
      fetchJobs();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create job');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await jobApi.updateStatus(id, { applicationStatus: status });
      toast.success(`Status updated to ${statusConfig[status]?.label || status}`);
      fetchJobs();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await jobApi.delete(id);
      toast.success('Job deleted');
      fetchJobs();
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2"><Skeleton className="h-9 w-16" /><Skeleton className="h-9 w-20" /><Skeleton className="h-9 w-20" /></div>
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Job Tracker</h1>
            <p className="mt-1 text-muted-foreground">Track your applications and progress.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/25">
                <Plus className="h-4 w-4" /> Add Job
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Job</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Company *</label>
                    <Input placeholder="e.g. Vercel" value={form.company} onChange={(e) => setForm(f => ({ ...f, company: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Job Title *</label>
                    <Input placeholder="e.g. Senior Engineer" value={form.jobTitle} onChange={(e) => setForm(f => ({ ...f, jobTitle: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Job Description * <span className="text-xs text-muted-foreground">(min 50 chars)</span></label>
                  <Textarea placeholder="Paste the full job description..." rows={6} value={form.jdRaw} onChange={(e) => setForm(f => ({ ...f, jdRaw: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Application URL <span className="text-xs text-muted-foreground">(optional)</span></label>
                  <Input placeholder="https://..." value={form.applicationUrl} onChange={(e) => setForm(f => ({ ...f, applicationUrl: e.target.value }))} />
                </div>
                <Button onClick={handleCreate} disabled={creating} className="w-full gap-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {creating ? 'Saving...' : 'Save Job'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Status Filter */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex flex-wrap gap-2">
          <Button variant={filter === null ? 'default' : 'outline'} size="sm" onClick={() => setFilter(null)} className="gap-1.5">
            All <Badge variant="secondary" className="ml-1 text-xs">{stats.total || 0}</Badge>
          </Button>
          {Object.entries(statusConfig).map(([key, cfg]) => (
            <Button key={key} variant={filter === key ? 'default' : 'outline'} size="sm" onClick={() => setFilter(filter === key ? null : key)} className="gap-1.5">
              <cfg.icon className="h-3.5 w-3.5" /> {cfg.label}
              <Badge variant="secondary" className="ml-1 text-xs">{(stats as any)[key] || 0}</Badge>
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Jobs List */}
      {jobs.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Briefcase className="mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-lg font-medium">{filter ? 'No jobs with this status' : 'No jobs tracked yet'}</p>
            <p className="text-sm text-muted-foreground">Click &quot;Add Job&quot; to start tracking applications</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job, i) => {
            const config = statusConfig[job.applicationStatus] || statusConfig.saved;
            return (
              <motion.div key={job._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.05 }}>
                <Card className="group border-border/50 transition-all hover:border-border hover:shadow-md">
                  <CardContent className="flex items-center justify-between p-4 sm:p-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 text-lg font-bold text-gray-400 dark:from-gray-800 dark:to-gray-900">
                        {job.company?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-medium">{job.jobTitle}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Briefcase className="h-3 w-3" /><span>{job.company}</span>
                          <span className="text-border">•</span>
                          <Clock className="h-3 w-3" /><span>{new Date(job.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`${config.color} gap-1 text-xs`}><config.icon className="h-3 w-3" />{config.label}</Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {job.applicationUrl && (
                            <DropdownMenuItem className="gap-2" onClick={() => window.open(job.applicationUrl, '_blank')}>
                              <ExternalLink className="h-4 w-4" /> Open Job Posting
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {Object.entries(statusConfig).map(([key, cfg]) => (
                            <DropdownMenuItem key={key} className="gap-2" onClick={() => handleUpdateStatus(job._id, key)}>
                              <cfg.icon className="h-4 w-4" /> Mark as {cfg.label}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2 text-red-600" onClick={() => handleDelete(job._id)}>
                            <XCircle className="h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
