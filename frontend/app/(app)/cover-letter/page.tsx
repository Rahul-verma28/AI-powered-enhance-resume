'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Mail, Sparkles, Copy, Download, FileText, CheckCircle2, Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

const tones = [
  { id: 'professional', label: 'Professional', desc: 'Formal, polished tone' },
  { id: 'enthusiastic', label: 'Enthusiastic', desc: 'Warm, excited tone' },
  { id: 'concise', label: 'Concise', desc: 'Direct and brief' },
];

const mockCoverLetter = `Dear Hiring Manager,

I am writing to express my strong interest in the Senior Frontend Engineer position at Vercel. With over 6 years of experience building performant, scalable web applications using React, Next.js, and TypeScript, I am confident in my ability to contribute meaningfully to your team.

In my current role at TechCorp, I led the migration of a legacy jQuery application to a modern Next.js architecture, resulting in a 40% improvement in Core Web Vitals scores and a 25% increase in user engagement. I also architected a component library used across 3 product teams, reducing development time by 30%.

I am particularly drawn to Vercel's mission of enabling developers to build the best web experiences. My deep expertise in React Server Components, edge computing, and performance optimization aligns perfectly with your team's focus on pushing the boundaries of web development.

I would welcome the opportunity to discuss how my experience and passion for developer tools can contribute to Vercel's continued success. Thank you for considering my application.

Best regards,
[Your Name]`;

export default function CoverLetterPage() {
  const [selectedTone, setSelectedTone] = useState('professional');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    // Simulate AI generation
    await new Promise((r) => setTimeout(r, 2000));
    setContent(mockCoverLetter);
    setLoading(false);
    toast.success('Cover letter generated!');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight">Cover Letter</h1>
        <p className="mt-1 text-muted-foreground">
          Generate a tailored cover letter that complements your resume.
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Controls */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Select Tone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {tones.map((tone) => (
                <button
                  key={tone.id}
                  onClick={() => setSelectedTone(tone.id)}
                  className={`w-full rounded-lg border p-3 text-left transition-all ${
                    selectedTone === tone.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                      : 'border-border/50 hover:border-border'
                  }`}
                >
                  <p className="text-sm font-medium">{tone.label}</p>
                  <p className="text-xs text-muted-foreground">{tone.desc}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Resume & Job</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg border border-border/50 p-3">
                <FileText className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Senior FE Engineer</p>
                  <p className="text-xs text-muted-foreground">Vercel · ATS: 92%</p>
                </div>
                <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-xs text-muted-foreground">
                Select a tailored resume from your history to generate a matching cover letter.
              </p>
            </CardContent>
          </Card>

          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full gap-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/25"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Generate Cover Letter</>
            )}
          </Button>
        </motion.div>

        {/* Preview */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-3">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="h-4 w-4" /> Cover Letter Preview
              </CardTitle>
              {content && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Download className="h-3.5 w-3.5" /> PDF
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {content ? (
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={22}
                  className="resize-none font-serif text-sm leading-relaxed"
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Mail className="mb-3 h-12 w-12 text-muted-foreground/30" />
                  <p className="text-sm font-medium text-muted-foreground">No cover letter yet</p>
                  <p className="text-xs text-muted-foreground">Select a tone and click generate</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
