"use client";

import { motion, Variants } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Calendar, GitPullRequest, LayoutTemplate, Briefcase } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { ProjectDetail } from "@/lib/api";

export function ProjectDetailClient({ project }: { project: ProjectDetail }) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.1, delayChildren: 0.1 } 
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900 selection:bg-gray-200">
      {/* 顶部导航 */}
      <nav className="sticky top-0 z-10 bg-[#fafafa]/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm font-mono text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>返回主页</span>
          </Link>
        </div>
      </nav>

      {/* 主体内容 */}
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        <motion.article 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-16"
        >
          {/* Header 区域 */}
          <motion.header variants={itemVariants} className="space-y-6 border-b border-gray-200 pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 text-xs font-mono bg-gray-900 text-white rounded-md">
                    {project.status || "Project"}
                  </span>
                  {project.link && (
                    <a 
                      href={project.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-mono text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      <ExternalLink size={14} />
                      <span>Live Demo / Repo</span>
                    </a>
                  )}
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-950">
                  {project.name}
                </h1>
              </div>
              <div className="flex items-center gap-2 text-sm font-mono text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
                <Calendar size={14} />
                <span>{project.start_date}</span>
                <span className="text-gray-300">—</span>
                <span>{project.end_date}</span>
              </div>
            </div>
          </motion.header>

          {/* 内容两栏布局 */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
            
            {/* 左侧主要内容 */}
            <div className="md:col-span-8 space-y-12">
              {/* 项目概述 */}
              <motion.section variants={itemVariants} className="space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2 text-gray-900">
                  <LayoutTemplate size={18} className="text-gray-400" />
                  项目概述
                </h2>
                <div className="prose prose-gray max-w-none text-gray-600 leading-relaxed text-sm md:text-base">
                  <ReactMarkdown>{project.description}</ReactMarkdown>
                </div>
              </motion.section>

              {/* 个人职责 */}
              <motion.section variants={itemVariants} className="space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2 text-gray-900">
                  <Briefcase size={18} className="text-gray-400" />
                  职责分工
                </h2>
                <div className="prose prose-gray max-w-none text-gray-600 leading-relaxed text-sm md:text-base bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <ReactMarkdown>{project.role_and_responsibilities}</ReactMarkdown>
                </div>
              </motion.section>

              {/* 业绩与成果 */}
              <motion.section variants={itemVariants} className="space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2 text-gray-900">
                  <GitPullRequest size={18} className="text-gray-400" />
                  业绩与成果亮点
                </h2>
                <div className="prose prose-gray max-w-none text-gray-600 leading-relaxed text-sm md:text-base marker:text-gray-400">
                  <ReactMarkdown>{project.highlights}</ReactMarkdown>
                </div>
              </motion.section>
            </div>

            {/* 右侧边栏：技术栈 */}
            <motion.div variants={itemVariants} className="md:col-span-4">
              <div className="sticky top-24 bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 font-mono">
                  Tech Stack
                </h3>
                <div className="flex flex-wrap gap-2">
                  {project.tech_stack?.length > 0 ? (
                    project.tech_stack.map((tech, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1.5 text-xs font-mono bg-gray-50 text-gray-700 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
                      >
                        {tech}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400 font-mono italic">No tech stack specified</span>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.article>
      </main>
    </div>
  );
}
