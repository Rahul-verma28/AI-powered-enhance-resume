'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  FileText, Clock, Download, Trash2, Eye, TrendingUp, Filter, Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { resumeApi } from '@/lib/api';

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
    : score >= 60
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
      : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400';
  return <Badge className={`${color} font-mono text-xs font-bold`}>{score}%</Badge>;
}

export default function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [resumes, setResumes] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

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
    const timer = setTimeout(fetchHistory, 500);
    return () => clearTimeout(timer);
  }, [fetchHistory]);

  const handleDelete = async (id: string) => {
    try {
      await resumeApi.delete(id);
      setResumes((prev) => prev.filter((r) => r._id !== id));
      toast.success('Resume deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Resume History</h1>
            <p className="mt-1 text-muted-foreground">
              {total > 0 ? `${total} resume${total === 1 ? '' : 's'} total` : 'Track all your resume versions and score improvements.'}
            </p>
          </div>
          <Link href="/tailor">
            <Button className="gap-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white">
              <Sparkles className="h-4 w-4" /> New Resume
            </Button>
          </Link>
        </div>
      </motion.div>

      {resumes.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="mb-3 h-12 w-12 text-muted-foreground/30" />
              <p className="text-lg font-medium">No resumes yet</p>
              <p className="mb-4 text-sm text-muted-foreground">Tailor your first resume to start tracking versions</p>
              <Link href="/tailor">
                <Button className="gap-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white">
                  <Sparkles className="h-4 w-4" /> Tailor Your First Resume
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {resumes.map((resume, i) => (
            <motion.div key={resume._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.05 }}>
              <Card className="group border-border/50 transition-all hover:border-border hover:shadow-md">
                <CardContent className="flex items-center justify-between p-4 sm:p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/50">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{resume.title || 'Untitled'}</p>
                        <Badge variant="outline" className="text-[10px]">
                          {resume.status === 'done' ? '✓ Done' : resume.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(resume.createdAt).toLocaleDateString()}</span>
                        {resume.selectedTemplate && (
                          <><span className="text-border">•</span><span className="capitalize">{resume.selectedTemplate}</span></>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {resume.atsScore && <ScoreBadge score={resume.atsScore} />}
                    <div className="hidden gap-1 sm:flex">
                      <Link href={`/tailor?id=${resume._id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                      </Link>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDelete(resume._id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
