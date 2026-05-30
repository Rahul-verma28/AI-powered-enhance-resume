'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Mail, Sparkles, Copy, Download, FileText, CheckCircle2, Loader2,
  RefreshCw, History, FileEdit, Trash2, ArrowRight, BookOpen, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { coverLetterApi, resumeApi } from '@/lib/api';

const tones = [
  { id: 'professional', label: 'Professional', desc: 'Polished, authoritative, formal' },
  { id: 'confident', label: 'Confident', desc: 'Direct, assertive, bold' },
  { id: 'concise', label: 'Concise', desc: 'Short, precise, highly targeted' },
  { id: 'friendly', label: 'Friendly', desc: 'Warm, personable, enthusiastic' },
];

export default function CoverLetterPage() {
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [resumes, setResumes] = useState<any[]>([]);
  const [coverLetters, setCoverLetters] = useState<any[]>([]);
  
  // Generation parameters
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [selectedTone, setSelectedTone] = useState<string>('professional');
  const [generationMode, setGenerationMode] = useState<'linked' | 'standalone'>('linked');
  
  // Standalone parameters
  const [standaloneCompany, setStandaloneCompany] = useState('');
  const [standaloneTitle, setStandaloneTitle] = useState('');
  const [standaloneJd, setStandaloneJd] = useState('');
  const [standaloneResume, setStandaloneResume] = useState('');

  // Active Draft
  const [activeLetter, setActiveLetter] = useState<any | null>(null);
  const [activeContent, setActiveContent] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setFetchingData(true);
      const [resumesRes, lettersRes] = await Promise.allSettled([
        resumeApi.getHistory(1, 20),
        coverLetterApi.list()
      ]);

      if (resumesRes.status === 'fulfilled') {
        const data = (resumesRes.value as any)?.data?.items || [];
        setResumes(data.filter((r: any) => r.status === 'done'));
        if (data.length > 0) {
          setSelectedResumeId(data[0]._id);
        }
      }

      if (lettersRes.status === 'fulfilled') {
        const lettersList = (lettersRes.value as any)?.data || [];
        setCoverLetters(lettersList);
        if (lettersList.length > 0 && !activeLetter) {
          setActiveLetter(lettersList[0]);
          setActiveContent(lettersList[0].content);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load credentials history');
    } finally {
      setFetchingData(false);
    }
  }, [activeLetter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerate = async () => {
    if (generationMode === 'linked' && !selectedResumeId) {
      toast.error('Please select a tailored resume to align your cover letter');
      return;
    }
    if (generationMode === 'standalone') {
      if (!standaloneCompany || !standaloneTitle || standaloneJd.length < 50) {
        toast.error('Please specify company name, job title, and details (min 50 chars)');
        return;
      }
      if (!standaloneResume) {
        toast.error('Please provide your resume details');
        return;
      }
    }

    setLoading(true);
    try {
      toast.loading('AI is drafting your customized cover letter...');
      
      let payload: any = { tone: selectedTone };
      
      if (generationMode === 'linked') {
        const targetResume = resumes.find(r => r._id === selectedResumeId);
        payload.resumeId = selectedResumeId;
        payload.jobId = targetResume?.jobId?._id || targetResume?.jobId;
        
        // Fetch detailed resume data if required
        const detailedResumeRes: any = await resumeApi.getById(selectedResumeId);
        const detailedResume = detailedResumeRes?.data || detailedResumeRes;
        payload.resumeText = detailedResume.originalText;
        // Search if linked job is stored
        if (detailedResume.jobId) {
          payload.company = detailedResume.title || 'Target Company';
          payload.jobTitle = detailedResume.title || 'Target Title';
        }
      } else {
        payload.company = standaloneCompany;
        payload.jobTitle = standaloneTitle;
        payload.jdText = standaloneJd;
        payload.resumeText = standaloneResume;
      }

      const res: any = await coverLetterApi.generate(payload);
      const newLetter = res.data || res;
      
      toast.dismiss();
      toast.success('Cover letter successfully generated!');
      
      // Add to list and activate
      setCoverLetters(prev => [newLetter, ...prev]);
      setActiveLetter(newLetter);
      setActiveContent(newLetter.content);
      
      // Refresh historical lists
      fetchData();
    } catch (err: any) {
      toast.dismiss();
      console.error(err);
      toast.error(err.message || 'Generation failed. Check AI provider.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLetter = (letter: any) => {
    setActiveLetter(letter);
    setActiveContent(letter.content);
    toast.success(`Loaded letter for ${letter.company || 'Job'}`);
  };

  const handleUpdateContent = async (val: string) => {
    setActiveContent(val);
    if (!activeLetter) return;
    
    setSavingEdit(true);
    try {
      await coverLetterApi.update(activeLetter._id, val);
      // Immutably update state
      setCoverLetters(prev => prev.map(l => l._id === activeLetter._id ? { ...l, content: val } : l));
    } catch (err) {
      console.error(err);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDownload = async () => {
    if (!activeLetter) return;
    setDownloadingPDF(true);
    try {
      const res: any = await coverLetterApi.download(activeLetter._id);
      const blob = new Blob([res], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Cover_Letter_${activeLetter.company || 'Application'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Cover Letter PDF successfully compiled and downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to compile PDF. Check server Puppeteer settings.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContent);
    toast.success('Copied to clipboard!');
  };

  const handleDelete = async (id: string) => {
    try {
      await coverLetterApi.delete(id);
      toast.success('Cover letter deleted');
      setCoverLetters(prev => prev.filter(l => l._id !== id));
      if (activeLetter?._id === id) {
        setActiveLetter(null);
        setActiveContent('');
      }
    } catch (err) {
      toast.error('Failed to delete cover letter');
    }
  };

  if (fetchingData && coverLetters.length === 0) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2 h-96 bg-muted animate-pulse rounded-xl" />
          <div className="lg:col-span-3 h-[500px] bg-muted animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-black tracking-tight">AI Cover Letter Hub</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Generate persuasive, human-written cover letters matching your resume and JD perfectly.
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        
        {/* LEFT COLUMN: Controls Panel (5 Columns) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-border/50 bg-card/45 backdrop-blur-sm">
            <CardHeader className="py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-xs uppercase tracking-wider font-extrabold text-indigo-600">
                Letter Configuration
              </CardTitle>
              <div className="flex gap-1 bg-muted p-0.5 rounded-lg text-[10px]">
                <button
                  onClick={() => setGenerationMode('linked')}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                    generationMode === 'linked' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  Linked
                </button>
                <button
                  onClick={() => setGenerationMode('standalone')}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                    generationMode === 'standalone' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  Standalone
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Linked Mode */}
              {generationMode === 'linked' ? (
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-700 dark:text-gray-300">Select Tailored Profile *</label>
                  {resumes.length === 0 ? (
                    <div className="flex items-center gap-2 rounded-lg border border-yellow-200/50 bg-yellow-50/5 p-3 text-[10px] text-yellow-700">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>No tailored resumes found. Tailor a resume first to align content automatically!</span>
                    </div>
                  ) : (
                    <select
                      value={selectedResumeId}
                      onChange={(e) => setSelectedResumeId(e.target.value)}
                      className="w-full rounded-lg border border-border/80 bg-background px-3 py-2 text-xs font-medium focus-visible:ring-indigo-500"
                    >
                      {resumes.map((r) => (
                        <option key={r._id} value={r._id}>
                          {r.title} (ATS Score: {r.atsScore}%)
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                /* Standalone Mode Inputs */
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-[10px] font-bold text-muted-foreground">Target Company *</label>
                      <Input 
                        placeholder="e.g. Vercel" 
                        value={standaloneCompany} 
                        onChange={(e) => setStandaloneCompany(e.target.value)}
                        className="text-xs h-8"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold text-muted-foreground">Target Role Title *</label>
                      <Input 
                        placeholder="e.g. Frontend Engineer" 
                        value={standaloneTitle} 
                        onChange={(e) => setStandaloneTitle(e.target.value)}
                        className="text-xs h-8"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold text-muted-foreground">Paste Job Description * (min 50 chars)</label>
                    <Textarea 
                      placeholder="Paste the JD raw text details..." 
                      rows={4}
                      value={standaloneJd} 
                      onChange={(e) => setStandaloneJd(e.target.value)}
                      className="text-xs resize-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold text-muted-foreground">Paste Your Background/Resume Details *</label>
                    <Textarea 
                      placeholder="Paste your active experience bullet details or bio..." 
                      rows={4}
                      value={standaloneResume} 
                      onChange={(e) => setStandaloneResume(e.target.value)}
                      className="text-xs resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Select Tone */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-700 dark:text-gray-300">Select Writing Tone</label>
                <div className="grid grid-cols-2 gap-2">
                  {tones.map((tone) => (
                    <button
                      key={tone.id}
                      onClick={() => setSelectedTone(tone.id)}
                      className={`rounded-lg border p-2 text-left transition-all ${
                        selectedTone === tone.id
                          ? 'border-indigo-500 bg-indigo-50/10 shadow-sm'
                          : 'border-border/60 hover:border-border'
                      }`}
                    >
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{tone.label}</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">{tone.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full h-10 gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-extrabold text-xs shadow-md shadow-indigo-500/25"
          >
            {loading ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Customizing Draft...</>
            ) : (
              <><Sparkles className="h-3.5 w-3.5" /> Generate Customized Letter</>
            )}
          </Button>

          {/* Historical Drafts Log */}
          {coverLetters.length > 0 && (
            <Card className="border-border/50 bg-card/45 backdrop-blur-sm">
              <CardHeader className="py-3">
                <CardTitle className="text-xs uppercase tracking-wider font-extrabold text-indigo-600 flex items-center gap-1">
                  <History className="h-3.5 w-3.5" /> Letter History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 max-h-48 overflow-y-auto divide-y divide-border/40">
                {coverLetters.map((l) => (
                  <div
                    key={l._id}
                    onClick={() => handleSelectLetter(l)}
                    className={`flex items-center justify-between px-4 py-2.5 cursor-pointer text-xs transition-colors ${
                      activeLetter?._id === l._id ? 'bg-accent/60 font-semibold' : 'hover:bg-accent/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-indigo-500/60" />
                      <div>
                        <p className="font-bold text-gray-800 dark:text-gray-200 truncate max-w-[180px]">
                          {l.company || 'Application'}
                        </p>
                        <p className="text-[9px] text-muted-foreground capitalize mt-0.5">
                          {l.jobTitle || 'Role'} · {l.tone}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(l._id);
                      }} 
                      className="hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT COLUMN: Interactive textured letter canvas (7 Columns) */}
        <div className="lg:col-span-7">
          <Card className="border-border/50 bg-card/40 shadow-sm overflow-hidden flex flex-col h-[560px]">
            <CardHeader className="py-3 flex flex-row items-center justify-between shrink-0 bg-background/50 border-b border-border/30">
              <CardTitle className="flex items-center gap-2 text-xs font-black uppercase text-gray-800 dark:text-gray-200">
                <BookOpen className="h-4 w-4 text-indigo-500" /> Letter Editor Sheet
              </CardTitle>
              {activeContent && (
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={handleCopy} className="h-7 text-[10px] gap-1 px-2">
                    <Copy className="h-3 w-3" /> Copy
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDownload} 
                    disabled={downloadingPDF}
                    className="h-7 text-[10px] gap-1 px-2.5"
                  >
                    {downloadingPDF ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                    PDF Letter
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden relative">
              {activeContent ? (
                <div className="h-full w-full p-6 bg-slate-50 dark:bg-zinc-950/20 overflow-y-auto flex justify-center items-start">
                  <div className="w-full max-w-[550px] relative p-6 bg-white dark:bg-white dark:text-gray-900 border border-gray-100 rounded-lg shadow-sm font-serif text-[11px] leading-relaxed select-text space-y-4">
                    
                    {/* Header Details */}
                    {activeLetter && (
                      <div className="border-b pb-3 border-gray-150 mb-3 text-[10px] font-sans text-gray-500 space-y-0.5">
                        <p><strong>Subject:</strong> {activeLetter.subject}</p>
                        <p><strong>Date:</strong> {new Date(activeLetter.createdAt).toLocaleDateString()}</p>
                        {savingEdit && <span className="text-[9px] text-indigo-500 font-extrabold uppercase animate-pulse absolute top-4 right-4">Saving...</span>}
                      </div>
                    )}

                    {/* Rich text area resembling actual printed paper */}
                    <textarea
                      value={activeContent}
                      onChange={(e) => handleUpdateContent(e.target.value)}
                      className="w-full min-h-[420px] focus:outline-none border-none resize-none font-serif text-[11px] leading-relaxed text-gray-800 bg-transparent select-text"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                  <Mail className="mb-3 h-10 w-10 text-muted-foreground/25" />
                  <p className="text-sm font-bold text-muted-foreground">No active cover letter</p>
                  <p className="text-[10px] text-muted-foreground/75 mt-0.5">Pick a tone, specify parameters, and click generate</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
