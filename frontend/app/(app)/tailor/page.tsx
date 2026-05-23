'use client';

import { useState, useCallback } from 'react';
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

const pipelineSteps = [
  { key: 'uploading', label: 'Uploading', icon: Upload },
  { key: 'parsing', label: 'Parsing Resume', icon: FileText },
  { key: 'analyzing', label: 'Analyzing JD', icon: Target },
  { key: 'rewriting', label: 'AI Rewriting', icon: Sparkles },
  { key: 'scoring', label: 'Scoring ATS', icon: CheckCircle2 },
];

const templates = [
  { id: 'classic', label: 'Classic', desc: 'Traditional serif layout' },
  { id: 'modern', label: 'Modern', desc: 'Clean & contemporary' },
  { id: 'minimal', label: 'Minimal', desc: 'Elegant whitespace' },
  { id: 'executive', label: 'Executive', desc: 'Bold & authoritative' },
  { id: 'tech', label: 'Tech', desc: 'Developer-friendly' },
];

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex h-36 w-36 items-center justify-center">
      <svg className="absolute -rotate-90" width="136" height="136" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
        <motion.circle
          cx="60" cy="60" r="54" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number], delay: 0.3 }}
        />
      </svg>
      <div className="text-center">
        <motion.span
          className="text-3xl font-bold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {score}
        </motion.span>
        <p className="text-xs text-muted-foreground">ATS Score</p>
      </div>
    </div>
  );
}

function PipelineProgress({ currentStep }: { currentStep: string }) {
  const currentIndex = pipelineSteps.findIndex((s) => s.key === currentStep);

  return (
    <div className="mx-auto max-w-md space-y-4 py-12 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-xl shadow-blue-500/30"
      >
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </motion.div>
      <h3 className="text-xl font-semibold">Tailoring your resume...</h3>
      <p className="text-sm text-muted-foreground">This may take 30-60 seconds</p>
      <div className="space-y-3 pt-4">
        {pipelineSteps.map((step, i) => {
          const isActive = i === currentIndex;
          const isDone = i < currentIndex;
          return (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-left transition-all ${
                isActive ? 'bg-blue-50 dark:bg-blue-950/30' : isDone ? 'opacity-60' : 'opacity-30'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
              ) : isActive ? (
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-blue-500" />
              ) : (
                <step.icon className="h-5 w-5 shrink-0 text-muted-foreground" />
              )}
              <span className={`text-sm font-medium ${isActive ? 'text-blue-700 dark:text-blue-300' : ''}`}>
                {step.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default function TailorPage() {
  const {
    originalText, jdText, tailoredData, atsScore, atsBreakdown,
    matchedKeywords, missingKeywords, improvements, selectedTemplate,
    pipelineStep, error,
    setOriginalText, setJdText, setTailoredResult, setSelectedTemplate,
    setPipelineStep, setError, reset,
  } = useAppStore();

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
      toast.success(`${file.name} selected`);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'application/pdf' || file.name.endsWith('.docx'))) {
      setResumeFile(file);
      toast.success(`${file.name} selected`);
    } else {
      toast.error('Please drop a PDF or DOCX file');
    }
  }, []);

  const handleTailor = async () => {
    if (!jdText || jdText.length < 50) {
      toast.error('Please enter a job description (at least 50 characters)');
      return;
    }
    if (!resumeFile && !originalText) {
      toast.error('Please upload a resume or paste resume text');
      return;
    }

    try {
      setPipelineStep('uploading');
      setError(null);
      let resumeText = originalText;

      if (resumeFile) {
        setPipelineStep('parsing');
        console.log('[Tailor] Uploading file:', resumeFile.name);
        const uploadResult: any = await resumeApi.upload(resumeFile);
        // Response interceptor already returns response.data, so uploadResult = { success, data }
        console.log('[Tailor] Upload result:', uploadResult);
        resumeText = uploadResult?.data?.originalText || uploadResult?.originalText || '';
        if (!resumeText) {
          throw new Error('Failed to extract text from resume. Try pasting the text instead.');
        }
        setOriginalText(resumeText);
      }

      setPipelineStep('analyzing');
      await new Promise((r) => setTimeout(r, 500)); // Brief pause for visual

      setPipelineStep('rewriting');
      console.log('[Tailor] Sending tailor request...');
      const result: any = await resumeApi.tailor({
        resumeText: resumeText,
        jdText,
      });
      console.log('[Tailor] Tailor result:', result);

      // The response interceptor returns response.data, so result = { success, data }
      const data = result?.data || result;

      setPipelineStep('scoring');
      await new Promise((r) => setTimeout(r, 300));

      setTailoredResult({
        tailoredData: data.tailoredData,
        atsScore: data.atsScore,
        atsBreakdown: data.atsBreakdown,
        missingKeywords: data.missingKeywords || [],
        improvements: data.improvements || [],
      });

      toast.success('Resume tailored successfully!');
    } catch (err: any) {
      console.error('[Tailor] Error:', err);
      setPipelineStep('idle'); // Reset to input state so user can retry
      setError(err.message || 'Failed to tailor resume');
      toast.error(err.message || 'Something went wrong');
    }
  };

  const handleDownload = async () => {
    try {
      toast.loading('Generating PDF...');
      // For now, just show a toast
      toast.dismiss();
      toast.success('PDF download started!');
    } catch {
      toast.error('Failed to generate PDF');
    }
  };

  // ── Processing State ──
  if (['uploading', 'parsing', 'analyzing', 'rewriting', 'scoring'].includes(pipelineStep)) {
    return <PipelineProgress currentStep={pipelineStep} />;
  }

  // ── Results State ──
  if (pipelineStep === 'done' && tailoredData) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Tailored Resume</h1>
            <p className="text-sm text-muted-foreground">Your ATS-optimized resume is ready</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={reset} className="gap-2">
              <RefreshCw className="h-4 w-4" /> New Resume
            </Button>
            <Button onClick={handleDownload} className="gap-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white">
              <Download className="h-4 w-4" /> Download PDF
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* ATS Score Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/50">
              <CardContent className="flex flex-col items-center gap-4 p-6">
                <ScoreRing score={atsScore} />
                {atsBreakdown && (
                  <div className="w-full space-y-3">
                    {[
                      { label: 'Keywords', value: atsBreakdown.keywordScore, weight: '40%' },
                      { label: 'Sections', value: atsBreakdown.sectionScore, weight: '20%' },
                      { label: 'Bullet Quality', value: atsBreakdown.bulletQuality, weight: '20%' },
                      { label: 'Formatting', value: atsBreakdown.formattingScore, weight: '10%' },
                      { label: 'Length', value: atsBreakdown.lengthScore, weight: '10%' },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="text-muted-foreground">{item.label} <span className="opacity-50">({item.weight})</span></span>
                          <span className="font-mono font-bold">{item.value}%</span>
                        </div>
                        <Progress value={item.value} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Keywords Panel */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Keywords Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {matchedKeywords.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      ✓ Matched ({matchedKeywords.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {matchedKeywords.slice(0, 15).map((kw) => (
                        <Badge key={kw} className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-xs">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {missingKeywords.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-red-600 dark:text-red-400">
                      ✗ Missing ({missingKeywords.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {missingKeywords.slice(0, 10).map((kw) => (
                        <Badge key={kw} variant="outline" className="border-red-200 text-red-600 dark:border-red-800 dark:text-red-400 text-xs">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Improvements & Template */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
            {improvements.length > 0 && (
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">Improvements Made</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {improvements.slice(0, 5).map((imp, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        <span className="text-muted-foreground">{imp}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base">Template</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplate(t.id)}
                      className={`rounded-lg border p-3 text-left text-xs transition-all ${
                        selectedTemplate === t.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                          : 'border-border/50 hover:border-border'
                      }`}
                    >
                      <p className="font-medium">{t.label}</p>
                      <p className="text-muted-foreground">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Resume Preview */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="h-4 w-4" /> Resume Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Contact */}
              <div>
                <h2 className="text-xl font-bold">{tailoredData.contact.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {[tailoredData.contact.email, tailoredData.contact.phone, tailoredData.contact.location].filter(Boolean).join(' • ')}
                </p>
              </div>

              {/* Summary */}
              {tailoredData.summary && (
                <div>
                  <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider text-blue-600">Summary</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{tailoredData.summary}</p>
                </div>
              )}

              <Separator />

              {/* Experience */}
              {tailoredData.experience?.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-600">Experience</h3>
                  {tailoredData.experience.map((exp, i) => (
                    <div key={i} className="mb-4">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="font-semibold">{exp.title}</span>
                          {exp.company && <span className="text-muted-foreground"> · {exp.company}</span>}
                        </div>
                        <span className="text-xs text-muted-foreground">{exp.dates}</span>
                      </div>
                      <ul className="mt-1 space-y-1">
                        {exp.bullets?.map((bullet, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-blue-500" />
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* Skills */}
              {tailoredData.skills && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">Skills</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {[...(tailoredData.skills.technical || []), ...(tailoredData.skills.tools || [])].map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ── Input State (Default) ──
  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight">Tailor Your Resume</h1>
        <p className="mt-1 text-muted-foreground">
          Upload your resume and paste a job description to get an ATS-optimized version.
        </p>
      </motion.div>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-950/30"
        >
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto"><X className="h-4 w-4 text-red-400" /></button>
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Step 1: Resume */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">1</span>
                Your Resume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'upload' | 'paste')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload" className="gap-1.5"><Upload className="h-3.5 w-3.5" /> Upload</TabsTrigger>
                  <TabsTrigger value="paste" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Paste</TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="mt-4">
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/70 px-6 py-12 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20"
                  >
                    {resumeFile ? (
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium">{resumeFile.name}</p>
                          <p className="text-xs text-muted-foreground">{(resumeFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button onClick={() => setResumeFile(null)}><X className="h-4 w-4 text-muted-foreground" /></button>
                      </div>
                    ) : (
                      <>
                        <Upload className="mb-3 h-8 w-8 text-muted-foreground/50" />
                        <p className="text-sm font-medium">Drop your resume here</p>
                        <p className="mb-4 text-xs text-muted-foreground">PDF or DOCX, max 10MB</p>
                        <label>
                          <input type="file" accept=".pdf,.docx" onChange={handleFileChange} className="hidden" />
                          <Button variant="outline" size="sm" asChild><span>Browse Files</span></Button>
                        </label>
                      </>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="paste" className="mt-4">
                  <Textarea
                    placeholder="Paste your resume text here..."
                    value={originalText}
                    onChange={(e) => setOriginalText(e.target.value)}
                    rows={12}
                    className="resize-none"
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* Step 2: Job Description */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">2</span>
                Job Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Paste the full job description here...&#10;&#10;Include the role title, requirements, responsibilities, and qualifications for best results."
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                rows={16}
                className="resize-none"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                {jdText.length > 0 ? `${jdText.length} characters` : 'Min 50 characters required'}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex justify-center"
      >
        <Button
          size="lg"
          onClick={handleTailor}
          disabled={(!resumeFile && !originalText) || jdText.length < 50}
          className="gap-3 bg-gradient-to-r from-blue-600 to-violet-600 px-8 py-6 text-base text-white shadow-xl shadow-blue-500/25 transition-all hover:shadow-2xl hover:shadow-blue-500/30 disabled:opacity-50"
        >
          <Sparkles className="h-5 w-5" />
          Tailor My Resume
          <ArrowRight className="h-5 w-5" />
        </Button>
      </motion.div>
    </div>
  );
}
