"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import SectionHeader from "./SectionHeader";

import Link from "next/link";

// ─── 数据接口 ─────────────────────────────────────────────────
export type ProjectStatus =
  | "live"
  | "enterprise"
  | "open-source"
  | "archived"
  | "wip";

const MotionLink = motion.create(Link);

const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; className: string }
> = {
  live: {
    label: "Live on this page",
    className: "bg-green-50 text-green-700 border-green-200",
  },
  enterprise: {
    label: "Enterprise Project",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  "open-source": {
    label: "Open Source",
    className: "bg-purple-50 text-purple-700 border-purple-200",
  },
  archived: {
    label: "Archived",
    className: "bg-gray-50 text-gray-500 border-gray-200",
  },
  wip: {
    label: "In Progress",
    className: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
};

export interface ProjectCase {
  id: string;
  icon: string;              // Emoji 或路径
  period: string;            // 时间跨度
  title: string;
  subtitle: string;          // 一句话描述
  highlights: string[];      // 核心亮点
  tags: string[];            // 技术栈
  status: ProjectStatus;
  link?: string;             // 项目链接（可选）
}

interface CaseStudiesGridProps {
  items?: ProjectCase[];
  title?: string;
}

const DEFAULT_CASES: ProjectCase[] = [
  
  {
    id: "proj-6",
    icon: "⚡",
    period: "2024.11 — 至今",
    title: "Vibe Coding 工具集",
    subtitle: "AI 辅助研发工作流的最佳实践与工具集合",
    highlights: [
      "整合 Claude Code / Cursor / v0 多 AI 工具协作链路",
      "总结 Prompt Engineering 模板库，覆盖 10+ 业务场景",
      "团队实践后，人均功能交付速度提升 200%",
    ],
    tags: ["Claude Code", "Cursor", "v0", "Prompt Engineering"],
    status: "wip",
  },
];

// ─── 单个项目卡片 ─────────────────────────────────────────────
function ProjectCard({
  project,
  index,
}: {
  project: ProjectCase;
  index: number;
}) {
  const statusCfg = STATUS_CONFIG[project.status];

  // 统一使用 MotionLink 进行内部跳转
  return (
    <MotionLink
      href={`/projects/${project.id}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: (index % 2) * 0.1 }}
      whileHover={{ y: -2 }}
      className="group relative flex flex-col gap-4 p-5 rounded-xl border border-gray-200 bg-white hover:border-gray-400 hover:shadow-md transition-all duration-200 cursor-pointer"
    >
      {/* ── 顶部：图标 + 时间 ── */}
      <div className="flex items-start justify-between">
        <span className="text-3xl leading-none" role="img" aria-label={project.title}>
          {project.icon}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs text-gray-400">{project.period}</span>
          <ArrowUpRight
            size={13}
            className="text-gray-400 group-hover:text-gray-700 transition-colors"
          />
        </div>
      </div>

      {/* ── 标题与副标题 ── */}
      <div>
        <h3 className="font-bold text-gray-950 text-base leading-snug mb-1">
          {project.title}
        </h3>
        <p className="text-sm text-gray-500">{project.subtitle}</p>
      </div>

      {/* ── 亮点列表 ── */}
      <ul className="flex flex-col gap-1.5 flex-1">
        {project.highlights.map((h, i) => (
          <li key={i} className="flex gap-2 text-sm text-gray-600">
            <span className="text-gray-400 font-mono flex-shrink-0">›</span>
            <span>{h}</span>
          </li>
        ))}
      </ul>

      {/* ── 底部：Tags + 状态 ── */}
      <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-100">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-mono"
          >
            {tag}
          </span>
        ))}
        {/* <span
          className={`ml-auto text-xs px-2 py-0.5 rounded-md border font-medium ${statusCfg.className}`}
        >
          {statusCfg.label}
        </span> */}
      </div>
    </MotionLink>
  );
}

// ─── 主组件 ───────────────────────────────────────────────────
export default function CaseStudiesGrid({
  items = DEFAULT_CASES,
  title = "项目案例",
}: CaseStudiesGridProps) {
  return (
    <section className="w-full px-4 sm:px-8 md:px-12 lg:px-20 max-w-5xl mx-auto">
      <SectionHeader title={title} />

      {/* 项目网格：两列响应式 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((project, index) => (
          <ProjectCard key={project.id} project={project} index={index} />
        ))}
      </div>
    </section>
  );
}
