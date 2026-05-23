'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FileText, Target, Sparkles, Download, Briefcase, History,
  ChevronRight, ArrowRight, Check, Star, Zap, Shield,
  BarChart3, Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/layout/navbar';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const features = [
  { icon: Sparkles, title: 'AI Rewriting', desc: 'Full resume rewrite using JD keywords with STAR method and quantified results.', color: 'from-blue-500 to-cyan-500' },
  { icon: Target, title: 'ATS Scoring', desc: '5-component scoring engine: keywords, sections, bullets, formatting, length.', color: 'from-violet-500 to-purple-500' },
  { icon: Download, title: '5 PDF Templates', desc: 'Classic, Modern, Minimal, Executive, and Tech — all ATS-safe by design.', color: 'from-emerald-500 to-teal-500' },
  { icon: Mail, title: 'Cover Letters', desc: 'AI-generated cover letters matching your resume and JD perfectly.', color: 'from-amber-500 to-orange-500' },
  { icon: BarChart3, title: 'Gap Analysis', desc: 'See exactly which keywords and skills you\'re missing and how to add them.', color: 'from-pink-500 to-rose-500' },
  { icon: Briefcase, title: 'Job Tracker', desc: 'Track applications from saved through interview to offer — all in one place.', color: 'from-indigo-500 to-blue-500' },
];

const steps = [
  { num: '01', title: 'Upload Resume', desc: 'Drop your PDF or DOCX file — we extract every detail.' },
  { num: '02', title: 'Paste Job Description', desc: 'Paste the JD and our AI extracts 40+ keywords instantly.' },
  { num: '03', title: 'AI Tailors Your Resume', desc: 'Full rewrite with JD keywords, action verbs, and quantified results.' },
  { num: '04', title: 'Download & Apply', desc: 'Choose a template, download your ATS-optimized PDF, and apply.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ── Hero ───────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50/80 via-transparent to-transparent dark:from-blue-950/20" />
          <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-400/20 to-violet-400/20 blur-3xl dark:from-blue-600/10 dark:to-violet-600/10" />
        </div>

        <div className="mx-auto max-w-5xl px-4 pb-20 pt-20 text-center sm:px-6 sm:pt-28">
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
            <Badge className="mb-6 gap-1.5 border-blue-200 bg-blue-50 px-4 py-1.5 text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
              <Zap className="h-3.5 w-3.5" /> AI-Powered Resume Optimization
            </Badge>
          </motion.div>

          <motion.h1
            custom={1} variants={fadeUp} initial="hidden" animate="visible"
            className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            Paste a JD. Get a{' '}
            <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              90%+ ATS Resume
            </span>{' '}
            in 30 Seconds.
          </motion.h1>

          <motion.p
            custom={2} variants={fadeUp} initial="hidden" animate="visible"
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground"
          >
            Upload your resume, paste any job description, and our AI rewrites every bullet point
            with exact JD keywords, action verbs, and quantified results. Download as a professional PDF.
          </motion.p>

          <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/tailor">
              <Button size="lg" className="gap-2 bg-gradient-to-r from-blue-600 to-violet-600 px-8 py-6 text-base text-white shadow-xl shadow-blue-500/25 transition-all hover:shadow-2xl hover:shadow-blue-500/30">
                Start Free — No Credit Card
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="gap-2 px-8 py-6 text-base">
                View Dashboard <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>

          <motion.p custom={4} variants={fadeUp} initial="hidden" animate="visible" className="mt-4 text-xs text-muted-foreground">
            Free tier: 3 resumes/month · No credit card required
          </motion.p>

          {/* Score Demo */}
          <motion.div
            custom={5} variants={fadeUp} initial="hidden" animate="visible"
            className="mx-auto mt-16 max-w-3xl"
          >
            <Card className="overflow-hidden border-border/50 shadow-2xl shadow-black/10 dark:shadow-black/30">
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-4 py-2.5">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <div className="h-3 w-3 rounded-full bg-green-500/80" />
                </div>
              </div>
              <CardContent className="grid gap-6 p-8 sm:grid-cols-3">
                <div className="text-center">
                  <div className="mb-2 text-4xl font-bold text-red-500">47%</div>
                  <p className="text-sm text-muted-foreground">Before</p>
                  <p className="text-xs text-muted-foreground">Original resume</p>
                </div>
                <div className="flex items-center justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 shadow-lg shadow-blue-500/30">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="text-center">
                  <div className="mb-2 text-4xl font-bold text-emerald-500">92%</div>
                  <p className="text-sm text-muted-foreground">After</p>
                  <p className="text-xs text-muted-foreground">AI-tailored resume</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────── */}
      <section className="border-t border-border/50 bg-muted/30 py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">How It Works</h2>
            <p className="mt-2 text-muted-foreground">Four steps to a perfect resume.</p>
          </motion.div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full border-border/50 transition-all hover:border-border hover:shadow-lg">
                  <CardContent className="p-6">
                    <span className="text-4xl font-bold text-blue-200 dark:text-blue-900">{step.num}</span>
                    <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Everything You Need</h2>
            <p className="mt-2 text-muted-foreground">A complete toolkit for landing your dream job.</p>
          </motion.div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="group h-full border-border/50 transition-all hover:border-border hover:shadow-lg hover:shadow-black/5">
                  <CardContent className="p-6">
                    <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${feat.color} shadow-lg`}>
                      <feat.icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold">{feat.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────── */}
      <section className="border-t border-border/50 bg-gradient-to-r from-blue-600 to-violet-600 py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Stop Getting Rejected by ATS
            </h2>
            <p className="mt-3 text-lg text-blue-100">
              Join thousands of job seekers who landed interviews with AI-optimized resumes.
            </p>
            <Link href="/tailor">
              <Button size="lg" className="mt-8 gap-2 bg-white px-8 py-6 text-base text-blue-700 shadow-xl transition-all hover:bg-blue-50 hover:shadow-2xl">
                Get Started Free <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────── */}
      <footer className="border-t border-border/50 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 text-sm text-muted-foreground sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-blue-600 to-violet-600">
              <FileText className="h-3 w-3 text-white" />
            </div>
            <span className="font-semibold text-foreground">ResumeAI Pro</span>
          </div>
          <p>© {new Date().getFullYear()} ResumeAI Pro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
