'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Upload,
  FileText,
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle2,
  X,
  AlertCircle,
  Target,
  Download,
  RefreshCw,
  Eye,
  Check,
  Edit2,
  Trash,
  HelpCircle,
  FileCheck2,
  XCircle,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/lib/store';
import { resumeApi } from '@/lib/api';
import { ResumePreview } from '@/components/ui/templates';

const pipelineSteps = [
  { key: 'uploading', label: 'Uploading File', icon: Upload },
  { key: 'parsing', label: 'Parsing Details', icon: FileText },
  { key: 'analyzing', label: 'Extracting JD Keywords', icon: Target },
  { key: 'rewriting', label: 'AI Optimization', icon: Sparkles },
  { key: 'scoring', label: 'Assembling Score', icon: CheckCircle2 },
];

const templates = [
  { id: 'modern', label: 'Modern', desc: 'Clean, sleek sans-serif style', border: 'border-indigo-500' },
  { id: 'minimal', label: 'Minimal', desc: 'Elegant margins, light fonts', border: 'border-slate-300' },
  { id: 'executive', label: 'Executive', desc: 'Serif fonts, formal double lines', border: 'border-slate-800' },
  { id: 'tech', label: 'Tech', desc: 'Developer monospace sidebar', border: 'border-emerald-500' },
  { id: 'classic', label: 'Classic', desc: 'Traditional serif layout', border: 'border-gray-400' },
];

function ScoreRing({ score }: { score: number }) {
  const color = score >= 85 ? '#10b981' : score >= 70 ? '#f59e0b' : '#ef4444';
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex h-24 w-24 items-center justify-center shrink-0">
      <svg className="absolute -rotate-90" width="96" height="96" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/15" />
        <motion.circle
          cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="text-center">
        <span className="text-xl font-black tracking-tight">{score}</span>
        <p className="text-[8px] uppercase tracking-wider font-bold text-muted-foreground">Score</p>
      </div>
    </div>
  );
}

function PipelineProgress({ currentStep }: { currentStep: string }) {
  const currentIndex = pipelineSteps.findIndex((s) => s.key === currentStep);

  return (
    <div className="mx-auto max-w-lg space-y-6 py-20 px-6 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-xl shadow-indigo-500/25"
      >
        <Loader2 className="h-7 w-7 animate-spin text-white" />
      </motion.div>
      <div>
        <h3 className="text-xl font-bold tracking-tight">AI Tailoring Pipeline</h3>
        <p className="text-xs text-muted-foreground mt-1">Re-writing bullet points with STAR model and JD keywords...</p>
      </div>
      <div className="rounded-xl border border-border/50 bg-card p-4 space-y-2 text-left">
        {pipelineSteps.map((step, i) => {
          const isActive = i === currentIndex;
          const isDone = i < currentIndex;
          return (
            <div
              key={step.key}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs transition-all ${
                isActive ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/30' : 'border border-transparent'
              } ${isDone ? 'opacity-80' : isActive ? 'opacity-100' : 'opacity-40'}`}
            >
              {isDone ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              ) : isActive ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-indigo-500" />
              ) : (
                <step.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span className={`font-semibold ${isActive ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>
                {step.label}
              </span>
              {isDone && <span className="ml-auto text-[9px] text-emerald-600 font-bold uppercase tracking-wider">Done</span>}
              {isActive && <span className="ml-auto text-[9px] text-indigo-500 font-bold uppercase tracking-wider animate-pulse">Running</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TailorPage() {
  const {
    resumeId, originalText, jdText, tailoredData, liveTailoredData,
    atsScore, liveAtsScore, atsBreakdown, matchedKeywords, missingKeywords,
    improvements, aiChanges, selectedTemplate, pipelineStep, error,
    setOriginalText, setJdText, setTailoredResult, setSelectedTemplate,
    setPipelineStep, setError, reset, acceptChange, rejectChange, editChange, applyEdit,
  } = useAppStore();

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  const [downloadingResume, setDownloadingResume] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [hoverTemplate, setHoverTemplate] = useState<string | null>(null);
  const [editingChangeId, setEditingChangeId] = useState<string | null>(null);
  const [manualEditText, setManualEditText] = useState('');

  // Handle URL queries for history loading
  useEffect(() => {
    const loadFromQuery = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const queryId = urlParams.get('id');
      if (queryId) {
        try {
          setPipelineStep('uploading');
          const res: any = await resumeApi.getById(queryId);
          const resume = res.data || res;
          if (resume) {
            // Restore original text and job description if saved
            if (resume.originalText) {
              setOriginalText(resume.originalText);
            }
            if (resume.jdText) {
              setJdText(resume.jdText);
            }

            if (resume.tailoredData) {
              setTailoredResult({
                resumeId: resume._id,
                tailoredData: resume.tailoredData,
                atsScore: resume.atsScore || 0,
                atsBreakdown: resume.atsBreakdown || {
                  keywordScore: 0,
                  sectionScore: 0,
                  bulletQuality: 0,
                  formattingScore: 0,
                  lengthScore: 0,
                },
                matchedKeywords: resume.matchedKeywords || [],
                missingKeywords: resume.missingKeywords || [],
                improvements: resume.improvements || [],
                aiChanges: resume.aiChanges || [],
              });
              setSelectedTemplate(resume.selectedTemplate || 'modern');
            } else if (resume.status === 'failed') {
              toast.error('The previous tailoring attempt failed. Your details have been restored so you can try again.');
              setPipelineStep('idle');
            } else {
              toast.error('Resume details not fully compiled yet');
              setPipelineStep('idle');
            }
          } else {
            toast.error('Resume not found');
            setPipelineStep('idle');
          }
        } catch (err: any) {
          toast.error('Failed to load history resume');
          setPipelineStep('idle');
        }
      }
    };
    loadFromQuery();
  }, [setTailoredResult, setPipelineStep, setSelectedTemplate, setOriginalText, setJdText]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
      toast.success(`${file.name} successfully loaded`);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'application/pdf' || file.name.endsWith('.docx'))) {
      setResumeFile(file);
      toast.success(`${file.name} successfully loaded`);
    } else {
      toast.error('Please drop a valid text-based PDF or DOCX file');
    }
  }, []);

  const handleTailor = async () => {
    if (!jdText || jdText.trim().length < 50) {
      toast.error('Please provide a descriptive job description (min 50 characters)');
      return;
    }
    if (!resumeFile && !originalText) {
      toast.error('Please upload your resume file or paste your resume text');
      return;
    }

    try {
      setPipelineStep('uploading');
      setError(null);
      let resumeText = originalText;

      if (resumeFile) {
        setPipelineStep('parsing');
        const uploadResult: any = await resumeApi.upload(resumeFile);
        const data = uploadResult?.data || uploadResult;
        resumeText = data?.originalText || '';
        if (!resumeText) {
          throw new Error('Failed to parse text. Please paste the resume text directly instead.');
        }
        setOriginalText(resumeText);
      }

      setPipelineStep('analyzing');
      await new Promise((r) => setTimeout(r, 600));

      setPipelineStep('rewriting');
      const result: any = await resumeApi.tailor({
        resumeText,
        jdText,
      });

      const data = result?.data || result;

      setPipelineStep('scoring');
      await new Promise((r) => setTimeout(r, 450));

      setTailoredResult({
        resumeId: data._id,
        tailoredData: data.tailoredData,
        atsScore: data.atsScore,
        atsBreakdown: data.atsBreakdown,
        matchedKeywords: data.matchedKeywords || [],
        missingKeywords: data.missingKeywords || [],
        improvements: data.improvements || [],
        aiChanges: data.aiChanges || [],
      });

      toast.success('ATS Optimization successfully compiled!');
    } catch (err: any) {
      console.error('[Tailor] Error:', err);
      setPipelineStep('idle');
      setError(err.message || 'Optimization pipeline failed. Check configuration.');
      toast.error(err.message || 'Something went wrong');
    }
  };

  const handleDownloadResume = async () => {
    if (!resumeId) return;
    setDownloadingResume(true);
    try {
      const activeTemp = hoverTemplate || selectedTemplate;
      const res: any = await resumeApi.download(resumeId, activeTemp);
      
      const blob = new Blob([res], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Optimized_Resume_${activeTemp}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Optimized PDF successfully compiled and downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('Puppeteer generation failed. Verify server setup.');
    } finally {
      setDownloadingResume(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!resumeId) return;
    setDownloadingReport(true);
    try {
      const res: any = await resumeApi.downloadATSReport(resumeId);
      const blob = new Blob([res], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ATS_Score_Report_${resumeId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('ATS Diagnostic PDF downloaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to compile ATS PDF report');
    } finally {
      setDownloadingReport(false);
    }
  };

  const startInlineEdit = (id: string, text: string) => {
    setEditingChangeId(id);
    setManualEditText(text);
  };

  const saveInlineEdit = (id: string) => {
    if (!manualEditText.trim()) return;
    editChange(id, manualEditText);
    applyEdit(id);
    setEditingChangeId(null);
    toast.success('Manual adjustment integrated into active draft!');
  };

  // ── Processing Pipeline Step ──
  if (['uploading', 'parsing', 'analyzing', 'rewriting', 'scoring'].includes(pipelineStep)) {
    return <PipelineProgress currentStep={pipelineStep} />;
  }

  // ── Dual Column Workspace Editor State ──
  if (pipelineStep === 'done' && liveTailoredData) {
    const activeTemp = hoverTemplate || selectedTemplate;

    return (
      <div className="flex flex-col lg:flex-row h-[calc(100vh-4.5rem)] overflow-hidden -m-6 sm:-m-8">
        
        {/* LEFT COLUMN: Collaborative AI Suggestions Workspace */}
        <div className="w-full lg:w-[480px] shrink-0 border-r border-border h-full flex flex-col overflow-y-auto bg-background/95 p-5 space-y-5">
          
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold tracking-tight">AI Collaborative Workspace</h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">Approve, reject, or customize improvements in real-time</p>
            </div>
            <Button variant="outline" size="sm" onClick={reset} className="h-7 text-[10px] gap-1 px-2.5">
              <RefreshCw className="h-3 w-3" /> Re-start
            </Button>
          </div>

          <Separator className="bg-border/40" />

          {/* Scoring Assessment Overview */}
          <div className="flex gap-4 items-center bg-accent/30 rounded-xl p-4 border border-border/40">
            <ScoreRing score={liveAtsScore} />
            <div className="flex-1 space-y-1.5 text-xs">
              <p className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">Match Overview</p>
              {atsBreakdown && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span>Keywords Match</span>
                    <span className="font-mono font-bold text-indigo-500">{atsBreakdown.keywordScore}%</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span>Bullet Quality</span>
                    <span className="font-mono font-bold text-violet-500">{atsBreakdown.bulletQuality}%</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span>Formatting Checks</span>
                    <span className="font-mono font-bold text-emerald-500">{atsBreakdown.formattingScore}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="flex gap-2">
            <Button 
              onClick={handleDownloadResume} 
              disabled={downloadingResume} 
              className="flex-1 h-9 text-xs gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow shadow-indigo-500/20"
            >
              {downloadingResume ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Resume PDF
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDownloadReport} 
              disabled={downloadingReport} 
              className="flex-1 h-9 text-xs gap-1.5"
            >
              {downloadingReport ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileCheck2 className="h-3.5 w-3.5" />}
              ATS Report
            </Button>
          </div>

          {/* Main Controls Tabs */}
          <Tabs defaultValue="suggestions" className="w-full flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-3 h-8 text-[11px]">
              <TabsTrigger value="suggestions" className="py-1">AI Changes</TabsTrigger>
              <TabsTrigger value="keywords" className="py-1">Keywords</TabsTrigger>
              <TabsTrigger value="templates" className="py-1">Templates</TabsTrigger>
            </TabsList>

            {/* TAB 1: Granular Before/After Cards */}
            <TabsContent value="suggestions" className="mt-4 flex-1 overflow-y-auto space-y-3 min-h-0 pr-1">
              {aiChanges.length === 0 ? (
                <div className="text-center py-10 text-xs text-muted-foreground">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 text-indigo-500/30" />
                  No high-impact adjustments found. Your profile scores highly!
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {aiChanges.map((change) => {
                    const isRejected = change.status === 'rejected';
                    const isEditing = change.status === 'editing' || editingChangeId === change.id;
                    return (
                      <motion.div
                        key={change.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`rounded-xl border p-3.5 text-xs transition-all space-y-2.5 bg-card/60 backdrop-blur-sm ${
                          isRejected 
                            ? 'border-red-100 bg-red-50/10 opacity-70' 
                            : 'border-border/60 hover:border-indigo-100/80 hover:shadow-sm'
                        }`}
                      >
                        {/* Card Header Row */}
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[11px] text-gray-800 dark:text-gray-200 truncate pr-4">
                            {change.label}
                          </span>
                          <Badge variant="outline" className={`text-[8px] uppercase tracking-wider border-none py-0 px-2 font-bold ${
                            isRejected ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'
                          }`}>
                            {change.status}
                          </Badge>
                        </div>

                        {/* Diff Box */}
                        <div className="rounded-lg border border-border/40 overflow-hidden text-[11px]">
                          {/* Before (Original) */}
                          <div className="p-2 bg-red-50/15 text-gray-400 border-b border-border/20 line-through select-none leading-relaxed">
                            <span className="text-[8px] font-bold text-red-500 uppercase tracking-widest mr-1.5">Original</span>
                            {change.before || '(Empty)'}
                          </div>

                          {/* After (Optimized / Current Draft) */}
                          {isEditing ? (
                            <div className="p-2 bg-card">
                              <Textarea 
                                value={manualEditText} 
                                onChange={(e) => setManualEditText(e.target.value)} 
                                className="text-[11px] font-sans h-16 w-full resize-none p-1.5 focus-visible:ring-indigo-500 focus-visible:border-indigo-500" 
                              />
                            </div>
                          ) : (
                            <div className={`p-2 leading-relaxed ${isRejected ? 'text-gray-400' : 'bg-emerald-50/10 text-emerald-700 dark:text-emerald-400 font-medium'}`}>
                              <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest mr-1.5">Optimized</span>
                              {change.after}
                            </div>
                          )}
                        </div>

                        {/* Card Actions Panel */}
                        <div className="flex gap-2 justify-end pt-1">
                          {isEditing ? (
                            <>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => setEditingChangeId(null)} 
                                className="h-6 text-[10px] text-muted-foreground px-2"
                              >
                                Cancel
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => saveInlineEdit(change.id)} 
                                className="h-6 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white gap-1 px-2.5"
                              >
                                <Check className="h-3 w-3" /> Save & Apply
                              </Button>
                            </>
                          ) : (
                            <>
                              {isRejected ? (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => acceptChange(change.id)} 
                                  className="h-6 text-[10px] text-indigo-600 hover:text-indigo-700 gap-1 px-2"
                                >
                                  <CheckCircle2 className="h-3 w-3" /> Accept Optimization
                                </Button>
                              ) : (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => startInlineEdit(change.id, change.after)} 
                                    className="h-6 text-[10px] text-gray-500 gap-1 px-2 hover:bg-muted"
                                  >
                                    <Edit2 className="h-3 w-3" /> Edit
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => rejectChange(change.id)} 
                                    className="h-6 text-[10px] text-red-500 gap-1 px-2 hover:bg-red-50 hover:text-red-600"
                                  >
                                    <XCircle className="h-3 w-3" /> Reject
                                  </Button>
                                </>
                              )}
                            </>
                          )}
                        </div>

                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </TabsContent>

            {/* TAB 2: Match / Missing Keywords Cloud */}
            <TabsContent value="keywords" className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="bg-emerald-50/5 border border-emerald-100/10 rounded-xl p-3.5 space-y-2">
                <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  ✓ Matched Keywords ({matchedKeywords.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {matchedKeywords.map((kw) => (
                    <Badge key={kw} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-none text-[10px]">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="bg-red-50/5 border border-red-100/10 rounded-xl p-3.5 space-y-2">
                <p className="text-[11px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  ✗ Missing Keywords ({missingKeywords.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {missingKeywords.map((kw) => (
                    <Badge key={kw} variant="outline" className="border-red-200 text-red-600 dark:border-red-950/30 text-[10px]">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: Visual Template Switcher with thumbnails */}
            <TabsContent value="templates" className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1">
              {templates.map((t) => {
                const isActive = selectedTemplate === t.id;
                const isHovered = hoverTemplate === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTemplate(t.id);
                      toast.success(`Layout changed to ${t.label}!`);
                    }}
                    onMouseEnter={() => setHoverTemplate(t.id)}
                    onMouseLeave={() => setHoverTemplate(null)}
                    className={`w-full rounded-xl border p-3 text-left transition-all relative overflow-hidden flex gap-4 ${
                      isActive 
                        ? 'border-indigo-500 bg-indigo-50/10 shadow-sm' 
                        : isHovered 
                          ? 'border-indigo-200 bg-indigo-50/5' 
                          : 'border-border/60 hover:border-border'
                    }`}
                  >
                    {/* Miniature SVG Thumbnail placeholder representing spacing structure */}
                    <div className={`h-12 w-10 shrink-0 border rounded bg-gray-50 flex flex-col justify-between p-1 select-none ${t.border}`}>
                      <div className="h-1.5 w-full bg-gray-300 rounded" />
                      <div className="space-y-0.5">
                        <div className="h-0.5 w-3/4 bg-gray-200 rounded" />
                        <div className="h-0.5 w-full bg-gray-200 rounded" />
                        <div className="h-0.5 w-1/2 bg-gray-200 rounded" />
                      </div>
                      <div className="h-1 w-full bg-gray-200 rounded" />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{t.label}</p>
                        {isActive && <Check className="h-3.5 w-3.5 text-indigo-600" />}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{t.desc}</p>
                    </div>
                  </button>
                );
              })}
            </TabsContent>
          </Tabs>

        </div>

        {/* RIGHT COLUMN: Interactive A4-Styled Live Resume Canvas */}
        <div className="flex-1 h-full overflow-y-auto bg-slate-50 dark:bg-zinc-950 p-6 flex justify-center items-start border-t lg:border-t-0 select-none">
          <div className="w-full max-w-[800px] py-4 transition-transform duration-300">
            <ResumePreview data={liveTailoredData} templateId={activeTemp} />
          </div>
        </div>

      </div>
    );
  }

  // ── Baseline Input State ──
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-black tracking-tight">AI Resume Optimization</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Submit your active resume draft and target job details. Our AI structures keywords, STAR bullets, and quantifies results instantly.
        </p>
      </motion.div>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50/5 px-4 py-3 text-xs text-red-600 dark:border-red-950 dark:bg-red-950/20"
        >
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <p className="flex-1 leading-relaxed font-semibold">{error}</p>
          <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
        </motion.div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Step 1: Resume Submission */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <Card className="border-border/50 bg-card/45 backdrop-blur-sm shadow-sm">
            <CardHeader className="py-4">
              <CardTitle className="flex items-center gap-2 text-xs uppercase tracking-wider font-extrabold text-indigo-600">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-black text-white">1</span>
                Your Original Resume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'upload' | 'paste')}>
                <TabsList className="grid w-full grid-cols-2 h-8 text-[11px]">
                  <TabsTrigger value="upload" className="gap-1.5"><Upload className="h-3.5 w-3.5" /> Upload File</TabsTrigger>
                  <TabsTrigger value="paste" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Paste Raw Text</TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="mt-4">
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 px-6 py-10 text-center transition-all hover:border-indigo-400 hover:bg-indigo-50/10 cursor-pointer"
                  >
                    {resumeFile ? (
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-100">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div className="text-left text-xs">
                          <p className="font-semibold text-gray-800">{resumeFile.name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{(resumeFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button onClick={() => setResumeFile(null)} className="hover:text-red-500 transition-colors ml-2"><Trash className="h-4 w-4" /></button>
                      </div>
                    ) : (
                      <>
                        <Upload className="mb-3 h-7 w-7 text-muted-foreground/45" />
                        <p className="text-xs font-semibold">Drag & drop your resume file</p>
                        <p className="mb-4 text-[10px] text-muted-foreground">PDF or DOCX standard documents, max 10MB</p>
                        <label className="cursor-pointer">
                          <input type="file" accept=".pdf,.docx" onChange={handleFileChange} className="hidden" />
                          <Button variant="outline" size="sm" asChild className="h-8 text-xs font-semibold"><span>Choose File</span></Button>
                        </label>
                      </>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="paste" className="mt-4">
                  <Textarea
                    placeholder="Paste the full, raw text content of your current resume..."
                    value={originalText}
                    onChange={(e) => setOriginalText(e.target.value)}
                    rows={12}
                    className="resize-none text-xs leading-relaxed focus-visible:ring-indigo-500"
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* Step 2: Job Description Submission */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          <Card className="border-border/50 bg-card/45 backdrop-blur-sm shadow-sm h-full flex flex-col">
            <CardHeader className="py-4">
              <CardTitle className="flex items-center gap-2 text-xs uppercase tracking-wider font-extrabold text-violet-600">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-500 text-[10px] font-black text-white">2</span>
                Target Job Description
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0">
              <Textarea
                placeholder="Paste the complete job description details (including job title, core requirements, technical stack keywords, and qualifications) to maximize match scoring..."
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                className="resize-none flex-1 min-h-[220px] text-xs leading-relaxed focus-visible:ring-violet-500"
              />
              <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-2 font-mono">
                <span>{jdText.length} characters</span>
                {jdText.length < 50 && <span className="text-red-500 font-bold">Min 50 characters required</span>}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Primary Call-To-Action Trigger */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24 }}
        className="flex justify-center"
      >
        <Button
          size="lg"
          onClick={handleTailor}
          disabled={(!resumeFile && !originalText) || jdText.trim().length < 50}
          className="gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-5 text-sm text-white font-extrabold tracking-tight shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/35 transition-all disabled:opacity-50"
        >
          <Sparkles className="h-4.5 w-4.5 animate-pulse" />
          Compile & Optimize Resume
          <ArrowRight className="h-4.5 w-4.5" />
        </Button>
      </motion.div>
    </div>
  );
}
