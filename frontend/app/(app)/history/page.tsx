'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  FileText, Clock, Download, Trash2, Eye, TrendingUp, Filter, Sparkles,
  GitBranch, Check, GitCommit, ChevronRight, Scale, ArrowRight, Loader2, FileCheck2
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { resumeApi } from '@/lib/api';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 85
    ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400'
    : score >= 70
      ? 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400'
      : 'bg-red-50 text-red-700 border-red-100 hover:bg-red-50 dark:bg-red-950/20 dark:text-red-400';
  return <Badge variant="outline" className={`${color} font-mono text-[10px] font-black px-2.5 py-0.5`}>{score}% Match</Badge>;
}

export default function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [resumes, setResumes] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  // Download states
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null);

  // Comparison state
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [resumeADetails, setResumeADetails] = useState<any>(null);
  const [resumeBDetails, setResumeBDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const res: any = await resumeApi.getHistory(1, 50);
      setResumes(res?.data?.items || []);
      setTotal(res?.data?.total || 0);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDelete = async (id: string) => {
    try {
      await resumeApi.delete(id);
      setResumes((prev) => prev.filter((r) => r._id !== id));
      toast.success('Resume deleted successfully');
    } catch {
      toast.error('Failed to delete resume');
    }
  };

  const handleDownload = async (id: string, template: string) => {
    setDownloadingId(id);
    try {
      const res: any = await resumeApi.download(id, template || 'modern');
      const blob = new Blob([res], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Optimized_Resume_${template || 'modern'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Resume PDF successfully downloaded!');
    } catch (err) {
      toast.error('Failed to download resume PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadReport = async (id: string) => {
    setDownloadingReportId(id);
    try {
      const res: any = await resumeApi.downloadATSReport(id);
      const blob = new Blob([res], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ATS_Report_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('ATS Report PDF downloaded!');
    } catch (err) {
      toast.error('Failed to download report PDF');
    } finally {
      setDownloadingReportId(null);
    }
  };

  const toggleCompareSelect = (id: string) => {
    setSelectedForCompare(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      }
      if (prev.length >= 2) {
        return [prev[1], id];
      }
      return [...prev, id];
    });
  };

  const handleCompareTrigger = async () => {
    if (selectedForCompare.length !== 2) return;
    setLoadingDetails(true);
    setCompareModalOpen(true);
    try {
      const [resA, resB] = await Promise.all([
        resumeApi.getById(selectedForCompare[0]),
        resumeApi.getById(selectedForCompare[1])
      ]);
      setResumeADetails(resA.data || resA);
      setResumeBDetails(resB.data || resB);
    } catch (err) {
      toast.error('Failed to load version details');
      setCompareModalOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Recharts Chart Data (chronological order)
  const chartData = [...resumes]
    .reverse()
    .filter(r => r.atsScore)
    .map(r => ({
      name: new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      score: r.atsScore
    }));

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-44 w-full rounded-xl" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
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
            <h1 className="text-2xl font-black tracking-tight">Timeline & Iterations</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {total > 0 ? `Tracking ${total} resume optimizations` : 'Visualize score growth across job applications.'}
            </p>
          </div>
          <div className="flex gap-2">
            {selectedForCompare.length === 2 && (
              <Button onClick={handleCompareTrigger} className="gap-1.5 h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow shadow-indigo-500/20">
                <Scale className="h-3.5 w-3.5" /> Compare Selection
              </Button>
            )}
            <Link href="/tailor">
              <Button size="sm" className="gap-1 h-8 text-xs bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
                <Sparkles className="h-3.5 w-3.5" /> Tailor Resume
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {resumes.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm font-bold text-muted-foreground">No tailored history found</p>
            <p className="text-xs text-muted-foreground mb-4">Start tailoring resumes to populate your version history drawer.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ATS Score Growth Chart */}
          {chartData.length > 1 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
              <Card className="border-border/50 bg-card/45 backdrop-blur-sm p-4">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-xs uppercase tracking-wider font-extrabold text-indigo-600 flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5" /> Score Progression Growth
                  </CardTitle>
                </CardHeader>
                <div className="h-44 w-full text-xs font-mono">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-muted/10" />
                      <XAxis dataKey="name" stroke="currentColor" className="text-muted-foreground" fontSize={9} tickLine={false} />
                      <YAxis stroke="currentColor" className="text-muted-foreground" fontSize={9} domain={[30, 100]} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '10px' }} 
                        labelClassName="font-bold text-gray-900"
                      />
                      <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#scoreColor)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Timeline View Cards */}
          <div className="relative border-l-2 border-border/60 pl-6 ml-3 space-y-4">
            {resumes.map((resume, i) => {
              const isSelected = selectedForCompare.includes(resume._id);
              return (
                <motion.div
                  key={resume._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.12 + i * 0.05 }}
                  className="relative"
                >
                  {/* Timeline Commit Bullet */}
                  <div className={`absolute -left-[31px] top-4 h-4 w-4 rounded-full border-2 bg-background flex items-center justify-center transition-colors ${
                    isSelected ? 'border-indigo-600 bg-indigo-50' : 'border-border'
                  }`}>
                    {isSelected ? <Check className="h-2 w-2 text-indigo-600" /> : <GitCommit className="h-3 w-3 text-muted-foreground/50" />}
                  </div>

                  {/* Visual card */}
                  <Card className={`group border-border/50 transition-all hover:border-border/95 hover:shadow bg-card/65 backdrop-blur-sm ${
                    isSelected ? 'border-indigo-500/80 shadow shadow-indigo-500/5 bg-indigo-50/5' : ''
                  }`}>
                    <CardContent className="flex items-center justify-between p-4 sm:p-5">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          isSelected ? 'bg-indigo-50 text-indigo-600' : 'bg-accent/40 text-muted-foreground'
                        }`}>
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-xs text-gray-800 dark:text-gray-200">{resume.title || 'Untitled Application'}</p>
                            <Badge variant="outline" className="text-[9px] font-bold py-0 border-none bg-accent text-muted-foreground capitalize">
                              Version {resume.version || 1}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground font-medium mt-1">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{new Date(resume.createdAt).toLocaleDateString()}</span>
                            {resume.selectedTemplate && (
                              <><span className="opacity-45">•</span><span className="capitalize">{resume.selectedTemplate} Layout</span></>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Version Actions */}
                      <div className="flex items-center gap-2">
                        {resume.atsScore && <ScoreBadge score={resume.atsScore} />}
                        
                        <div className="flex items-center gap-1">
                          {/* Selection Checkbox */}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => toggleCompareSelect(resume._id)}
                            title="Select to compare versions"
                            className={`h-8 w-8 hover:bg-muted ${isSelected ? 'text-indigo-600 bg-indigo-50/50' : 'text-gray-400'}`}
                          >
                            <Scale className="h-4 w-4" />
                          </Button>
                          
                          <Link href={`/tailor?id=${resume._id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-900" title="Open collaborative editor">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            disabled={downloadingId === resume._id}
                            onClick={() => handleDownload(resume._id, resume.selectedTemplate)}
                            className="h-8 w-8 text-gray-500 hover:text-gray-900" 
                            title="Download PDF resume"
                          >
                            {downloadingId === resume._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-4 w-4" />}
                          </Button>

                          <Button 
                            variant="ghost" 
                            size="icon" 
                            disabled={downloadingReportId === resume._id}
                            onClick={() => handleDownloadReport(resume._id)}
                            className="h-8 w-8 text-gray-500 hover:text-gray-900" 
                            title="Download ATS Report PDF"
                          >
                            {downloadingReportId === resume._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileCheck2 className="h-4 w-4" />}
                          </Button>

                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDelete(resume._id)}
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" 
                            title="Delete draft"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Visual Side-by-Side Version Comparison Modal ── */}
      <Dialog open={compareModalOpen} onOpenChange={setCompareModalOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-6 overflow-hidden">
          <DialogHeader className="shrink-0 pb-4 border-b">
            <DialogTitle className="text-sm font-black uppercase tracking-wider text-indigo-600 flex items-center gap-2">
              <Scale className="h-4.5 w-4.5" /> Side-by-Side Version Comparison
            </DialogTitle>
            <DialogDescription className="text-xs">
              Compare visual layout parameters, summary updates, and bullet optimization details across versions.
            </DialogDescription>
          </DialogHeader>

          {loadingDetails ? (
            <div className="flex-1 flex flex-col justify-center items-center py-20 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <p className="text-xs text-muted-foreground">Fetching deep version structures...</p>
            </div>
          ) : (
            resumeADetails && resumeBDetails && (
              <div className="flex-1 overflow-y-auto pt-4 space-y-6 text-xs">
                
                {/* Metrics Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-indigo-50/10 border border-indigo-100/20 rounded-xl p-4 space-y-1">
                    <p className="font-extrabold uppercase text-[9px] text-indigo-600 tracking-wider">Draft A (v{resumeADetails.version})</p>
                    <p className="text-sm font-bold text-gray-800">{resumeADetails.title}</p>
                    <p className="text-xl font-black text-indigo-700 font-mono mt-1">{resumeADetails.atsScore}% Match</p>
                  </div>
                  <div className="bg-emerald-50/10 border border-emerald-100/20 rounded-xl p-4 space-y-1">
                    <p className="font-extrabold uppercase text-[9px] text-emerald-600 tracking-wider">Draft B (v{resumeBDetails.version})</p>
                    <p className="text-sm font-bold text-gray-800">{resumeBDetails.title}</p>
                    <p className="text-xl font-black text-emerald-700 font-mono mt-1">{resumeBDetails.atsScore}% Match</p>
                  </div>
                </div>

                {/* Professional Summary Comparison */}
                <div className="space-y-2">
                  <h4 className="font-bold border-b pb-1 text-slate-800 text-[11px] uppercase tracking-wider">1. Professional Summary</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted/30 rounded-lg text-gray-500 leading-relaxed italic border border-border/20">
                      {resumeADetails.liveTailoredData?.summary || resumeADetails.tailoredData?.summary || '(Empty summary)'}
                    </div>
                    <div className="p-3 bg-emerald-50/10 rounded-lg text-emerald-800 dark:text-emerald-400 leading-relaxed font-medium border border-emerald-100/10">
                      {resumeBDetails.liveTailoredData?.summary || resumeBDetails.tailoredData?.summary || '(Empty summary)'}
                    </div>
                  </div>
                </div>

                {/* Technical Skills Comparison */}
                <div className="space-y-2">
                  <h4 className="font-bold border-b pb-1 text-slate-800 text-[11px] uppercase tracking-wider">2. Core Technical Competencies</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-wrap gap-1">
                      {((resumeADetails.liveTailoredData?.skills?.technical || resumeADetails.tailoredData?.skills?.technical) || []).map((s: string) => (
                        <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {((resumeBDetails.liveTailoredData?.skills?.technical || resumeBDetails.tailoredData?.skills?.technical) || []).map((s: string) => (
                        <Badge key={s} variant="secondary" className="bg-emerald-50 text-emerald-700 border-none hover:bg-emerald-100 text-[10px] font-semibold">{s}</Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Work Experience Comparison */}
                <div className="space-y-3">
                  <h4 className="font-bold border-b pb-1 text-slate-800 text-[11px] uppercase tracking-wider">3. Work Chronology & Bullet Comparison</h4>
                  <div className="grid grid-cols-2 gap-4">
                    
                    {/* Experience A */}
                    <div className="space-y-3 border-r pr-2">
                      {(resumeADetails.liveTailoredData?.experience || resumeADetails.tailoredData?.experience || []).map((exp: any, eIdx: number) => (
                        <div key={eIdx} className="space-y-1">
                          <p className="font-bold text-gray-800">{exp.title} at {exp.company}</p>
                          <ul className="list-disc pl-4 space-y-1">
                            {exp.bullets.map((b: string, bIdx: number) => (
                              <li key={bIdx} className="text-gray-500 leading-normal">{b}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>

                    {/* Experience B */}
                    <div className="space-y-3">
                      {(resumeBDetails.liveTailoredData?.experience || resumeBDetails.tailoredData?.experience || []).map((exp: any, eIdx: number) => (
                        <div key={eIdx} className="space-y-1">
                          <p className="font-bold text-gray-800">{exp.title} at {exp.company}</p>
                          <ul className="list-disc pl-4 space-y-1">
                            {exp.bullets.map((b: string, bIdx: number) => (
                              <li key={bIdx} className="text-emerald-700 dark:text-emerald-400 font-medium leading-normal">{b}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>

                  </div>
                </div>

              </div>
            )
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
