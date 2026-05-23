'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import {
  FileText, Target, TrendingUp, Briefcase, Sparkles,
  ArrowRight, Clock, Download,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { resumeApi, jobApi, atsApi } from '@/lib/api';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

function StatCard({ icon: Icon, label, value, subtext, color, index }: {
  icon: React.ElementType; label: string; value: string | number;
  subtext?: string; color: string; index: number;
}) {
  return (
    <motion.div custom={index} variants={fadeUp} initial="hidden" animate="visible">
      <Card className="group relative overflow-hidden border-border/50 transition-all duration-300 hover:border-border hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20">
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
        <CardContent className="relative flex items-center gap-4 p-6">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
    : score >= 60
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
      : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400';
  return <Badge className={`${color} font-mono text-xs font-bold`}>{score}%</Badge>;
}

export default function DashboardPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalResumes: 0, avgScore: 0, bestScore: 0, jobsTracked: 0 });
  const [resumes, setResumes] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [historyRes, jobStatsRes, atsStatsRes] = await Promise.allSettled([
        resumeApi.getHistory(1, 5),
        jobApi.getStats(),
        atsApi.getDashboardStats(),
      ]);

      if (historyRes.status === 'fulfilled') {
        const data = (historyRes.value as any)?.data;
        setResumes(data?.items || []);
      }

      const jobData = jobStatsRes.status === 'fulfilled' ? (jobStatsRes.value as any)?.data : {};
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
    // Small delay to ensure auth token is synced
    const timer = setTimeout(fetchData, 500);
    return () => clearTimeout(timer);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="mb-2 h-8 w-48" />
          <Skeleton className="h-5 w-72" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  const greeting = user?.firstName ? `Welcome back, ${user.firstName}` : 'Dashboard';

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{greeting}</h1>
            <p className="mt-1 text-muted-foreground">Track your resume performance and job applications.</p>
          </div>
          <Link href="/tailor">
            <Button className="gap-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30">
              <Sparkles className="h-4 w-4" /> Tailor New Resume <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FileText} label="Total Resumes" value={stats.totalResumes} subtext="across all jobs" color="from-blue-500 to-blue-600" index={0} />
        <StatCard icon={Target} label="Avg ATS Score" value={stats.avgScore ? `${stats.avgScore}%` : '—'} subtext={stats.avgScore > 0 ? 'keep improving!' : 'tailor your first resume'} color="from-emerald-500 to-emerald-600" index={1} />
        <StatCard icon={TrendingUp} label="Best Score" value={stats.bestScore ? `${stats.bestScore}%` : '—'} color="from-violet-500 to-violet-600" index={2} />
        <StatCard icon={Briefcase} label="Jobs Tracked" value={stats.jobsTracked} color="from-amber-500 to-orange-600" index={3} />
      </div>

      {/* Recent Resumes */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Recent Resumes</CardTitle>
            <Link href="/history">
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                View All <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {resumes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm font-medium text-muted-foreground">No resumes yet</p>
                <p className="mb-4 text-xs text-muted-foreground">Tailor your first resume to see it here</p>
                <Link href="/tailor">
                  <Button size="sm" className="gap-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white">
                    <Sparkles className="h-3.5 w-3.5" /> Get Started
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {resumes.map((resume: any, i: number) => (
                  <motion.div
                    key={resume._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="group flex items-center justify-between px-6 py-4 transition-colors hover:bg-accent/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/50">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium">{resume.title || 'Untitled'}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(resume.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {resume.atsScore && <ScoreBadge score={resume.atsScore} />}
                      {resume.selectedTemplate && (
                        <Badge variant="outline" className="text-xs capitalize">{resume.selectedTemplate}</Badge>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ATS Performance */}
      {stats.avgScore > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.5 }}>
          <Card className="border-border/50 bg-gradient-to-r from-blue-50/50 to-violet-50/50 dark:from-blue-950/20 dark:to-violet-950/20">
            <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Your ATS Performance</p>
                <p className="text-lg font-semibold">
                  Average score: <span className="text-blue-600 dark:text-blue-400">{stats.avgScore}%</span>
                </p>
              </div>
              <div className="w-full max-w-xs">
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-muted-foreground">Average Score</span>
                  <span className="font-mono font-bold">{stats.avgScore}%</span>
                </div>
                <Progress value={stats.avgScore} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
