'use client';

import React from 'react';
import { ResumeData } from '@/lib/store';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, MapPin, Link2, X, ExternalLink } from 'lucide-react';

interface ResumePreviewProps {
  data: ResumeData;
  templateId: string;
}

export function ResumePreview({ data, templateId }: ResumePreviewProps) {
  const { contact, summary, experience, skills, education, certifications, projects } = data;

  if (templateId === 'tech') {
    return <TechTemplate {...data} />;
  }
  if (templateId === 'minimal') {
    return <MinimalTemplate {...data} />;
  }
  if (templateId === 'executive') {
    return <ExecutiveTemplate {...data} />;
  }
  if (templateId === 'classic') {
    return <ClassicTemplate {...data} />;
  }
  return <ModernTemplate {...data} />;
}

// ─── 1. MODERN TEMPLATE ─────────────────────────────────────────
function ModernTemplate({ contact, summary, experience, skills, education, certifications, projects }: ResumeData) {
  return (
    <div className="font-sans text-[#1f2937] leading-relaxed max-w-[800px] mx-auto p-8 bg-white dark:bg-white dark:text-gray-900 shadow-sm border border-gray-100 rounded-lg min-h-[1050px]">
      {/* Header */}
      <div className="border-b-2 border-indigo-600 pb-6 mb-6">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{contact.name}</h2>
        <div className="mt-2 flex flex-wrap gap-y-1 gap-x-4 text-xs font-medium text-gray-500">
          {contact.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {contact.email}</span>}
          {contact.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {contact.phone}</span>}
          {contact.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {contact.location}</span>}
          {contact.linkedin && <span className="flex items-center gap-1"><Link2 className="h-3 w-3" /> {contact.linkedin}</span>}
          {contact.github && <span className="flex items-center gap-1"><X className="h-3 w-3" /> {contact.github}</span>}
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">Professional Summary</h3>
          <p className="text-xs leading-relaxed text-gray-600 font-normal">{summary}</p>
        </div>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-3">Work Experience</h3>
          <div className="space-y-4">
            {experience.map((exp, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-baseline mb-1">
                  <div>
                    <span className="font-bold text-xs text-gray-900">{exp.title}</span>
                    {exp.company && <span className="text-gray-400 font-light"> | </span>}
                    <span className="text-gray-500 font-semibold text-xs">{exp.company}</span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400 font-semibold">{exp.dates}</span>
                </div>
                {exp.location && <p className="text-[10px] text-gray-400 font-medium mb-1.5">{exp.location}</p>}
                <ul className="list-disc pl-4 space-y-1">
                  {exp.bullets.map((bullet, bIdx) => (
                    <li key={bIdx} className="text-xs text-gray-600 leading-normal">{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {skills && (
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">Key Skills</h3>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {[...(skills.technical || []), ...(skills.tools || []), ...(skills.soft || [])].map((skill, sIdx) => (
              <Badge key={sIdx} variant="secondary" className="bg-indigo-50/50 text-indigo-700 hover:bg-indigo-50 border-none font-semibold text-[10px] py-0.5 px-2">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-3">Key Projects</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map((proj, idx) => (
              <div key={idx} className="border border-gray-100 rounded-lg p-3 hover:border-indigo-100 transition-colors">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-bold text-xs text-gray-800 flex items-center gap-1">
                    {proj.name} {proj.link && <ExternalLink className="h-3 w-3 opacity-45" />}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed mb-2">{proj.description}</p>
                <div className="flex flex-wrap gap-1">
                  {proj.tech.map((t, tIdx) => (
                    <span key={tIdx} className="text-[9px] bg-gray-50 text-gray-600 font-mono py-0.5 px-1.5 rounded">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-3">Education</h3>
          <div className="space-y-2">
            {education.map((edu, idx) => (
              <div key={idx} className="flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-xs text-gray-900">{edu.degree}</span>
                  <span className="text-gray-400 font-light"> · </span>
                  <span className="text-gray-500 font-medium text-xs">{edu.school}</span>
                </div>
                <span className="text-[10px] font-mono text-gray-400 font-semibold">{edu.year}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 2. MINIMAL TEMPLATE ────────────────────────────────────────
function MinimalTemplate({ contact, summary, experience, skills, education, certifications, projects }: ResumeData) {
  return (
    <div className="font-sans text-gray-800 leading-relaxed max-w-[800px] mx-auto p-10 bg-white dark:bg-white dark:text-gray-900 shadow-sm border border-gray-100 rounded-lg min-h-[1050px]">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-light tracking-widest uppercase text-gray-900 mb-2">{contact.name}</h2>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-gray-400 tracking-wider uppercase">
          {contact.email && <span>{contact.email}</span>}
          {contact.phone && <span>· {contact.phone}</span>}
          {contact.location && <span>· {contact.location}</span>}
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="mb-8">
          <p className="text-xs leading-relaxed text-gray-500 italic text-center max-w-lg mx-auto">{summary}</p>
        </div>
      )}

      {/* Skills */}
      {skills && (
        <div className="mb-8">
          <div className="text-center text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-3 border-b pb-1 border-gray-100">Key Expertise</div>
          <div className="flex flex-wrap justify-center gap-1.5">
            {[...(skills.technical || []), ...(skills.tools || [])].map((skill, idx) => (
              <span key={idx} className="text-xs bg-gray-50 text-gray-600 py-0.5 px-2 rounded-full font-medium">{skill}</span>
            ))}
          </div>
        </div>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <div className="mb-8">
          <div className="text-center text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-4 border-b pb-1 border-gray-100">Work Experience</div>
          <div className="space-y-6">
            {experience.map((exp, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-baseline mb-1">
                  <div>
                    <span className="font-bold text-xs text-gray-800">{exp.company}</span>
                    <span className="text-gray-400 font-light mx-2">/</span>
                    <span className="text-gray-500 font-light text-xs">{exp.title}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 italic">{exp.dates}</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 mt-2">
                  {exp.bullets.map((bullet, bIdx) => (
                    <li key={bIdx} className="text-xs text-gray-500 leading-relaxed font-light">{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <div className="mb-8">
          <div className="text-center text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-4 border-b pb-1 border-gray-100">Featured Projects</div>
          <div className="space-y-4">
            {projects.map((proj, idx) => (
              <div key={idx}>
                <div className="font-bold text-xs text-gray-800 mb-1">{proj.name}</div>
                <p className="text-xs text-gray-500 font-light leading-relaxed">{proj.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <div>
          <div className="text-center text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-3 border-b pb-1 border-gray-100">Academic Background</div>
          <div className="space-y-2">
            {education.map((edu, idx) => (
              <div key={idx} className="flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-xs text-gray-800">{edu.school}</span>
                  <span className="text-gray-400 font-light mx-2">·</span>
                  <span className="text-gray-500 text-xs font-light">{edu.degree}</span>
                </div>
                <span className="text-[10px] text-gray-400 italic">{edu.year}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 3. EXECUTIVE TEMPLATE ──────────────────────────────────────
function ExecutiveTemplate({ contact, summary, experience, skills, education, certifications, projects }: ResumeData) {
  return (
    <div className="font-serif text-[#1e293b] leading-relaxed max-w-[800px] mx-auto p-10 bg-white dark:bg-white dark:text-gray-900 shadow-sm border border-gray-100 rounded-lg min-h-[1050px]">
      {/* Header */}
      <div className="text-center border-b-4 border-slate-800 pb-4 mb-6">
        <h2 className="text-3xl font-extrabold tracking-tight text-gray-950 uppercase">{contact.name}</h2>
        <div className="mt-2 flex flex-wrap justify-center gap-x-4 text-xs font-serif text-gray-500 italic">
          {contact.email && <span>{contact.email}</span>}
          {contact.phone && <span>· {contact.phone}</span>}
          {contact.location && <span>· {contact.location}</span>}
          {contact.linkedin && <span>· LinkedIn</span>}
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-2">Executive Summary</h3>
          <p className="text-xs leading-relaxed text-gray-700">{summary}</p>
        </div>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-3">Professional Chronology</h3>
          <div className="space-y-4">
            {experience.map((exp, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-baseline mb-1">
                  <div>
                    <span className="font-bold text-xs text-gray-900">{exp.company}</span>
                    <span className="text-gray-500 italic text-xs"> — {exp.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-500 font-semibold">{exp.dates}</span>
                </div>
                <ul className="list-disc pl-5 space-y-1">
                  {exp.bullets.map((bullet, bIdx) => (
                    <li key={bIdx} className="text-xs text-gray-700 leading-normal">{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {skills && (
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-2">Areas of Competency</h3>
          <p className="text-xs text-gray-600 leading-relaxed font-semibold">
            {[...(skills.technical || []), ...(skills.tools || [])].join(' · ')}
          </p>
        </div>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 mb-3">Academic credentials</h3>
          <div className="space-y-2">
            {education.map((edu, idx) => (
              <div key={idx} className="flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-xs text-gray-900">{edu.school}</span>
                  <span className="text-gray-400 font-light mx-2">·</span>
                  <span className="text-gray-500 text-xs italic">{edu.degree}</span>
                </div>
                <span className="text-[10px] font-mono text-gray-400 font-semibold">{edu.year}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 4. TECH TEMPLATE ──────────────────────────────────────────
function TechTemplate({ contact, summary, experience, skills, education, certifications, projects }: ResumeData) {
  return (
    <div className="font-mono text-gray-800 leading-relaxed max-w-[800px] mx-auto p-8 bg-white dark:bg-white dark:text-gray-900 shadow-sm border border-gray-100 rounded-lg min-h-[1050px] grid grid-cols-3 gap-6">
      {/* Monospace Sidebar */}
      <div className="col-span-1 border-r border-gray-100 pr-6 space-y-6 text-xs">
        <div>
          <h2 className="text-lg font-bold text-gray-950 leading-tight mb-1">{contact.name}</h2>
          <p className="text-[10px] text-indigo-600 font-bold mb-4">// developer profile</p>
        </div>

        <div className="space-y-2 text-[10px]">
          {contact.email && <p className="truncate"><strong>Email:</strong><br />{contact.email}</p>}
          {contact.phone && <p><strong>Phone:</strong><br />{contact.phone}</p>}
          {contact.location && <p><strong>Location:</strong><br />{contact.location}</p>}
          {contact.linkedin && <p className="truncate"><strong>LinkedIn:</strong><br />{contact.linkedin.replace(/https?:\/\/(www\.)?/, '')}</p>}
          {contact.github && <p className="truncate"><strong>GitHub:</strong><br />{contact.github.replace(/https?:\/\/(www\.)?/, '')}</p>}
        </div>

        {skills && (
          <div>
            <h3 className="font-bold uppercase text-gray-900 border-b border-gray-150 pb-1 mb-2 text-[10px] tracking-wider">&lt;skills&gt;</h3>
            <div className="space-y-1.5 text-[10px] font-medium text-gray-600">
              <p><strong>Languages/Tech:</strong><br />{skills.technical?.slice(0, 8).join(', ')}</p>
              <p><strong>Tools/Platforms:</strong><br />{skills.tools?.slice(0, 8).join(', ')}</p>
            </div>
          </div>
        )}

        {education && education.length > 0 && (
          <div>
            <h3 className="font-bold uppercase text-gray-900 border-b border-gray-150 pb-1 mb-2 text-[10px] tracking-wider">&lt;education&gt;</h3>
            <div className="space-y-3">
              {education.map((edu, idx) => (
                <div key={idx} className="text-[10px] leading-tight text-gray-600">
                  <span className="font-bold text-gray-900">{edu.school}</span><br />
                  <span>{edu.degree}</span><br />
                  <span className="text-gray-400 font-mono text-[9px]">{edu.year}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="col-span-2 space-y-6">
        {summary && (
          <div>
            <h3 className="text-xs font-bold text-indigo-600 mb-2">// professional summary</h3>
            <p className="text-xs leading-relaxed text-gray-600 font-light">{summary}</p>
          </div>
        )}

        {experience && experience.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-indigo-600 mb-3">// work history</h3>
            <div className="space-y-4">
              {experience.map((exp, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-bold text-xs text-gray-950">{exp.company}</span>
                    <span className="text-[9px] text-gray-400">{exp.dates}</span>
                  </div>
                  <p className="text-[10px] font-bold text-indigo-500 mb-1.5">{exp.title}</p>
                  <ul className="space-y-1">
                    {exp.bullets.map((bullet, bIdx) => (
                      <li key={bIdx} className="text-[11px] text-gray-600 leading-normal pl-3 relative">
                        <span className="absolute left-0 text-indigo-500">-</span>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {projects && projects.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-indigo-600 mb-3">// featured projects</h3>
            <div className="space-y-3">
              {projects.map((proj, idx) => (
                <div key={idx}>
                  <p className="font-bold text-xs text-gray-900 mb-0.5">{proj.name}</p>
                  <p className="text-[11px] text-gray-500 leading-relaxed font-light">{proj.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 5. CLASSIC TEMPLATE ────────────────────────────────────────
function ClassicTemplate({ contact, summary, experience, skills, education, certifications, projects }: ResumeData) {
  return (
    <div className="font-serif text-[#111827] leading-relaxed max-w-[800px] mx-auto p-10 bg-white dark:bg-white dark:text-gray-900 shadow-sm border border-gray-100 rounded-lg min-h-[1050px]">
      {/* Header */}
      <div className="text-center border-b border-gray-300 pb-4 mb-5">
        <h2 className="text-2xl font-bold tracking-wide uppercase text-black mb-1">{contact.name}</h2>
        <div className="mt-1 flex flex-wrap justify-center gap-x-4 text-xs font-medium text-gray-500">
          {contact.email && <span>{contact.email}</span>}
          {contact.phone && <span>| {contact.phone}</span>}
          {contact.location && <span>| {contact.location}</span>}
          {contact.linkedin && <span>| {contact.linkedin}</span>}
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="mb-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-black border-b border-gray-200 pb-0.5 mb-2">Qualifications Summary</h3>
          <p className="text-xs leading-relaxed text-gray-700">{summary}</p>
        </div>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <div className="mb-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-black border-b border-gray-200 pb-0.5 mb-3">Professional Experience</h3>
          <div className="space-y-4">
            {experience.map((exp, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-baseline mb-1">
                  <div>
                    <span className="font-bold text-xs text-black">{exp.title}</span>
                    <span className="text-gray-400 font-light mx-2">·</span>
                    <span className="text-gray-700 font-medium text-xs">{exp.company}</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-semibold">{exp.dates}</span>
                </div>
                <ul className="list-disc pl-5 space-y-1">
                  {exp.bullets.map((bullet, bIdx) => (
                    <li key={bIdx} className="text-xs text-gray-700 leading-normal">{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {skills && (
        <div className="mb-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-black border-b border-gray-200 pb-0.5 mb-2">Technical Capabilities</h3>
          <div className="text-xs text-gray-700 space-y-1 leading-normal">
            <p><strong>Technical Competencies:</strong> {[...(skills.technical || [])].join(', ')}</p>
            <p><strong>Software & Tools:</strong> {[...(skills.tools || [])].join(', ')}</p>
          </div>
        </div>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-black border-b border-gray-200 pb-0.5 mb-2">Educational Background</h3>
          <div className="space-y-2">
            {education.map((edu, idx) => (
              <div key={idx} className="flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-xs text-black">{edu.school}</span>
                  <span className="text-gray-400 font-light mx-2">·</span>
                  <span className="text-gray-700 text-xs">{edu.degree}</span>
                </div>
                <span className="text-[10px] text-gray-500 font-semibold">{edu.year}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
