"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import SectionHeader from "./SectionHeader";

// ─── 数据接口 ─────────────────────────────────────────────────
export type ProjectStatus =
  | "live"
  | "enterprise"
  | "open-source"
  | "archived"
  | "wip";

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
    id: "proj-1",
    icon: "🌾",
    period: "2023.06 — 2025.10",
    title: "农资店数字化进销存系统",
    subtitle: "面向农资零售商的全链路 SaaS 管理平台",
    highlights: [
      "支持多仓库、多门店的实时库存管理与预警",
      "对接农业银行、工商银行的支付与对账接口",
      "内置 AI 销售预测模块，采购准确率提升 30%",
      "累计服务 200+ 农资经销商，年交易额超千万",
    ],
    tags: ["Vue3", "FastAPI", "PostgreSQL", "Redis", "Docker"],
    status: "enterprise",
  },
  {
    id: "proj-2",
    icon: "🤖",
    period: "2024.08 — 至今",
    title: "AI 简历对话助手",
    subtitle: "基于 RAG 的个人简历智能问答系统",
    highlights: [
      "使用向量数据库存储简历知识，支持语义检索",
      "流式 SSE 输出，打字机效果响应延迟 < 500ms",
      "部署于 Vercel Edge Runtime，全球冷启动 < 100ms",
    ],
    tags: ["Next.js", "LangChain", "Pinecone", "OpenAI API", "Vercel"],
    status: "live",
    link: "#chat",
  },
  {
    id: "proj-3",
    icon: "🏭",
    period: "2022.03 — 2023.01",
    title: "3D 工厂数字孪生平台",
    subtitle: "实时渲染工厂布局与设备状态的可视化系统",
    highlights: [
      "基于 Three.js + WebGL 实现 5000+ 设备实时渲染",
      "对接 MQTT 协议，设备状态更新延迟 < 100ms",
      "支持路径规划动画模拟，辅助生产排班优化",
    ],
    tags: ["Vue3", "Three.js", "WebSocket", "MQTT", "Node.js"],
    status: "enterprise",
  },
  {
    id: "proj-4",
    icon: "📊",
    period: "2021.09 — 2022.02",
    title: "物流可视化大屏系统",
    subtitle: "面向城配物流的实时数据监控驾驶舱",
    highlights: [
      "ECharts + 高德地图实现配送轨迹实时追踪",
      "支持 30+ 业务指标自定义 KPI 看板配置",
      "日均活跃用户 500+，峰值并发处理 1000+ 请求",
    ],
    tags: ["React", "ECharts", "AMap API", "Ant Design", "MySQL"],
    status: "enterprise",
  },
  {
    id: "proj-5",
    icon: "🧩",
    period: "2024.01 — 2024.06",
    title: "低代码表单引擎",
    subtitle: "拖拽式表单构建器，支持复杂联动逻辑",
    highlights: [
      "实现 20+ 表单控件拖拽排列与属性配置",
      "支持 JSON Schema 导入导出，与后端无缝对接",
      "开源后获得 GitHub 300+ Stars",
    ],
    tags: ["Vue3", "TypeScript", "VueDraggable", "JSON Schema"],
    status: "open-source",
    link: "https://github.com",
  },
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

  // 统一使用 motion.a；无 link 时 href 为 undefined，点击无跳转行为
  return (
    <motion.a
      href={project.link}
      {...(project.link && { target: "_blank", rel: "noopener noreferrer" })}
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
          {project.link && (
            <ArrowUpRight
              size={13}
              className="text-gray-400 group-hover:text-gray-700 transition-colors"
            />
          )}
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
        <span
          className={`ml-auto text-xs px-2 py-0.5 rounded-md border font-medium ${statusCfg.className}`}
        >
          {statusCfg.label}
        </span>
      </div>
    </motion.a>
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
