'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import {
  FileText, Target, TrendingUp, Briefcase, Sparkles,
  ArrowRight, Clock, Download, Flame, Award, Zap, BookOpen, Lightbulb, CheckCircle2, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { resumeApi, jobApi, atsApi } from '@/lib/api';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Cell
} from 'recharts';

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' },
  }),
};

function StatCard({ icon: Icon, label, value, subtext, color, index }: {
  icon: React.ElementType; label: string; value: string | number;
  subtext?: string; color: string; index: number;
}) {
  return (
    <motion.div custom={index} variants={fadeUp} initial="hidden" animate="visible">
      <Card className="group relative overflow-hidden border-border/50 bg-card/45 backdrop-blur-sm transition-all duration-300 hover:border-border hover:shadow-lg">
        <CardContent className="flex items-center gap-4 p-5">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow shadow-indigo-500/10`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{label}</p>
            <p className="text-xl font-black tracking-tight mt-0.5">{value}</p>
            {subtext && <p className="text-[9px] text-muted-foreground/80 mt-0.5">{subtext}</p>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 85
    ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400'
    : score >= 70
      ? 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400'
      : 'bg-red-50 text-red-700 border-red-100 hover:bg-red-50 dark:bg-red-950/20 dark:text-red-400';
  return <Badge variant="outline" className={`${color} font-mono text-[9px] font-bold px-2 py-0`}>{score}%</Badge>;
}

export default function DashboardPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalResumes: 0, avgScore: 0, bestScore: 0, jobsTracked: 0 });
  const [resumes, setResumes] = useState<any[]>([]);
  const [jobStats, setJobStats] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      const [historyRes, jobStatsRes, atsStatsRes] = await Promise.allSettled([
        resumeApi.getHistory(1, 5),
        jobApi.getStats(),
        atsApi.getDashboardStats(),
      ]);

      if (historyRes.status === 'fulfilled') {
        setResumes((historyRes.value as any)?.data?.items || []);
      }

      const jobData = jobStatsRes.status === 'fulfilled' ? (jobStatsRes.value as any)?.data : null;
      setJobStats(jobData);

      const atsData = atsStatsRes.status === 'fulfilled' ? (atsStatsRes.value as any)?.data : {};

      setStats({
        totalResumes: atsData?.totalResumes || 0,
        avgScore: atsData?.avgScore || 0,
        bestScore: atsData?.bestScore || 0,
        jobsTracked: jobData?.total || 0,
      });
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchData, 500);
    return () => clearTimeout(timer);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="lg:col-span-2 h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  const greeting = user?.firstName ? `Welcome back, ${user.firstName}` : 'Executive Dashboard';

  // ── RECHARTS DATA PREP ──
  // 1. ATS Scores Growth over recent tailings
  const scoreChartData = [...resumes]
    .reverse()
    .filter(r => r.atsScore)
    .map(r => ({
      name: new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      score: r.atsScore
    }));

  // 2. Job Tracker Pipeline stages
  const jobChartData = jobStats ? [
    { name: 'Saved', count: jobStats.saved || 0, color: '#94a3b8' },
    { name: 'Applied', count: jobStats.applied || 0, color: '#3b82f6' },
    { name: 'Interview', count: jobStats.interview || 0, color: '#8b5cf6' },
    { name: 'Offer', count: jobStats.offer || 0, color: '#10b981' },
    { name: 'Rejected', count: jobStats.rejected || 0, color: '#ef4444' }
  ] : [];

  return (
    <div className="space-y-6">
      
      {/* Header Widget */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight">{greeting}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Track your resume optimizations and application pipelines.</p>
          </div>
          <Link href="/tailor">
            <Button size="sm" className="gap-1.5 h-8.5 text-xs bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow shadow-indigo-500/20">
              <Sparkles className="h-3.5 w-3.5" /> Tailor New Resume <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stat Cards Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FileText} label="Total Resumes" value={stats.totalResumes} subtext="Tailored variants saved" color="from-indigo-500 to-indigo-600" index={0} />
        <StatCard icon={Target} label="Average Score" value={stats.avgScore ? `${stats.avgScore}%` : '—'} subtext="Weighted ATS average" color="from-emerald-500 to-emerald-600" index={1} />
        <StatCard icon={TrendingUp} label="Best ATS Match" value={stats.bestScore ? `${stats.bestScore}%` : '—'} subtext="Top performing draft" color="from-violet-500 to-violet-600" index={2} />
        <StatCard icon={Briefcase} label="Jobs Tracked" value={stats.jobsTracked} subtext="Active Kanban pipelines" color="from-amber-500 to-orange-500" index={3} />
      </div>

      {/* Analytics Graph Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        
        {/* Graph A: ATS Score Progression (8 Columns) */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-border/50 bg-card/45 backdrop-blur-sm">
            <CardHeader className="py-4">
              <CardTitle className="text-xs uppercase tracking-wider font-extrabold text-indigo-600 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" /> ATS Score Growth Over Time
              </CardTitle>
              <CardDescription className="text-[10px]">Track match percentage increases over subsequent optimization drafts.</CardDescription>
            </CardHeader>
            <CardContent>
              {scoreChartData.length > 1 ? (
                <div className="h-56 w-full text-xs font-mono">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={scoreChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-muted/10" />
                      <XAxis dataKey="name" stroke="currentColor" className="text-muted-foreground" fontSize={9} tickLine={false} />
                      <YAxis stroke="currentColor" className="text-muted-foreground" fontSize={9} domain={[40, 100]} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '10px' }} 
                        labelClassName="font-bold text-gray-900"
                      />
                      <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#scoreColor)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center font-normal">
                  <TrendingUp className="mb-2 h-8 w-8 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">Tailor multiple resumes to generate score progression insights.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Resumes List */}
          <Card className="border-border/50 bg-card/45 backdrop-blur-sm">
            <CardHeader className="py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-xs uppercase tracking-wider font-extrabold text-indigo-600">Recent Optimizations</CardTitle>
              <Link href="/history">
                <Button variant="ghost" size="sm" className="h-7 text-[10px] text-muted-foreground gap-0.5">
                  Full Timeline <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-border/40">
              {resumes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-xs">
                  <FileText className="mb-2 h-8 w-8 text-muted-foreground/25" />
                  <p className="font-bold text-muted-foreground">No recent resume drafts</p>
                  <p className="text-[10px] text-muted-foreground/80 mt-0.5">Your optimized revisions will log here.</p>
                </div>
              ) : (
                resumes.slice(0, 3).map((resume, i) => (
                  <div key={resume._id} className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-accent/15">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50/50 text-indigo-600 border border-indigo-100/10">
                        <FileText className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="font-bold text-xs text-gray-800 dark:text-gray-200">{resume.title || 'Untitled Application'}</p>
                        <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-semibold mt-0.5">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(resume.createdAt).toLocaleDateString()}</span>
                          {resume.selectedTemplate && (
                            <><span className="opacity-45">•</span><span className="capitalize">{resume.selectedTemplate} template</span></>
                          )}
                        </div>
                      </div>
                    </div>
                    {resume.atsScore && <ScoreBadge score={resume.atsScore} />}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Pipeline Chart & AI Banners (4 Columns) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Graph B: Kanban Pipeline Stages (4 Columns) */}
          <Card className="border-border/50 bg-card/45 backdrop-blur-sm">
            <CardHeader className="py-4">
              <CardTitle className="text-xs uppercase tracking-wider font-extrabold text-indigo-600 flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5" /> Pipeline stages distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.jobsTracked > 0 && jobChartData.length > 0 ? (
                <div className="h-44 w-full text-xs font-mono">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={jobChartData} margin={{ top: 10, right: 0, left: -32, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-muted/10" />
                      <XAxis dataKey="name" stroke="currentColor" className="text-muted-foreground" fontSize={8} tickLine={false} />
                      <YAxis stroke="currentColor" className="text-muted-foreground" fontSize={9} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '9px' }} 
                        labelClassName="font-bold text-gray-900"
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {jobChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center font-normal">
                  <Briefcase className="mb-2 h-8 w-8 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">Add jobs in Tracker to visualize pipeline logs.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Visual Streak Counter & Profile Completeness */}
          <Card className="border-border/50 bg-card/45 backdrop-blur-sm">
            <CardContent className="p-5 space-y-4 text-xs">
              
              {/* Daily Streak Indicator */}
              <div className="flex items-center justify-between bg-orange-50/5 border border-orange-100/10 rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500 text-white shadow shadow-orange-500/20">
                    <Flame className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 dark:text-gray-200">5-Day Active Streak</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">Keep optimizing to build career momentum!</p>
                  </div>
                </div>
                <span className="text-lg font-black text-orange-500 font-mono">5 🔥</span>
              </div>

              {/* Top Skills cloud */}
              <div className="space-y-2">
                <p className="font-bold uppercase text-[9px] tracking-wider text-muted-foreground">Top Matched Competencies</p>
                <div className="flex flex-wrap gap-1">
                  {resumes[0]?.matchedKeywords?.slice(0, 6).map((kw: string) => (
                    <Badge key={kw} variant="secondary" className="text-[9px] font-semibold bg-indigo-50/40 text-indigo-700 border-none hover:bg-indigo-50">
                      {kw}
                    </Badge>
                  )) || (
                    <span className="text-[10px] text-muted-foreground italic">Compile resumes to extract top skills</span>
                  )}
                </div>
              </div>

              {/* Personalized AI Suggestions & Insight Banner */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                <p className="font-extrabold uppercase text-[9px] tracking-wider text-indigo-600 flex items-center gap-1">
                  <Lightbulb className="h-3.5 w-3.5" /> AI Personalized Insight
                </p>
                <div className="bg-indigo-50/5 border border-indigo-100/15 rounded-xl p-3 text-[10px] text-indigo-700 dark:text-indigo-400 font-medium leading-relaxed">
                  {stats.avgScore > 0 ? (
                    <span>Your resume matches average at <strong className="font-extrabold">{stats.avgScore}%</strong>. Head over to <strong>AI Cover Letters</strong> to generate a tailored companion draft with <strong>Enthusiastic</strong> tone. It increases outreach response rate by up to 25%.</span>
                  ) : (
                    <span>Optimize your first profile draft in <strong>Collaborative AI Editor</strong>. Our parser will extract 40+ JD keywords to align ATS matching indices instantly.</span>
                  )}
                </div>
              </div>

            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
