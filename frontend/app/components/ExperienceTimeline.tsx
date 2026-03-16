"use client";

import { motion } from "framer-motion";
import SectionHeader from "./SectionHeader";

// ─── 数据接口 ─────────────────────────────────────────────────
export interface ExperienceItem {
  id: string;
  title: string;           // 职位名称
  company: string;         // 公司名称
  companyLink?: string;    // 公司官网
  period: string;          // 时间段
  type?: string;           // 全职 / 兼职 / 远程
  highlights: string[];    // 工作内容亮点
  tags: string[];          // 技术栈 Tags
}

interface ExperienceTimelineProps {
  items?: ExperienceItem[];
  title?: string;
}

const DEFAULT_ITEMS: ExperienceItem[] = [
  {
    id: "exp-1",
    title: "高级全栈工程师",
    company: "某科技有限公司",
    period: "2023.03 — 2025.10",
    type: "全职",
    highlights: [
      "主导农资行业 SaaS 系统从 0→1 建设，覆盖进销存、财务、供应链全链路",
      "设计并实现基于 Three.js 的 3D 仓储可视化模块，实时渲染 5000+ 货位状态",
      "引入 Vibe Coding 工作流，结合 AI 辅助生成，团队交付效能提升 200%",
      "封装通用组件库（40+ 组件），统一 UI 规范，复用率达 85%",
    ],
    tags: ["Vue3", "TypeScript", "Three.js", "FastAPI", "PostgreSQL", "Redis"],
  },
  {
    id: "exp-2",
    title: "前端工程师",
    company: "某互联网公司",
    period: "2021.06 — 2023.02",
    type: "全职",
    highlights: [
      "负责 B 端管理后台和 C 端 H5 页面的开发与维护",
      "使用 ECharts + AMap 实现物流可视化大屏，日均访问量 10 万+",
      "基于 WebSocket 实现实时订单推送系统，延迟 < 200ms",
      "参与团队前端工程化建设，迁移 Webpack → Vite，构建速度提升 300%",
    ],
    tags: ["React", "Ant Design", "ECharts", "Node.js", "MySQL"],
  },
  {
    id: "exp-3",
    title: "初级前端开发",
    company: "某传统软件企业",
    period: "2019.07 — 2021.05",
    type: "全职",
    highlights: [
      "负责企业 OA 系统前端开发，对接政府、医院等 10+ 行业客户",
      "独立完成移动端 H5 审批流程改版，操作步骤减少 40%",
      "学习并推广 Vue.js 技术栈，替代原 jQuery 混合开发模式",
    ],
    tags: ["Vue2", "jQuery", "Element UI", "Java Spring"],
  },
];

// ─── 单条经历项 ───────────────────────────────────────────────
function TimelineItem({
  item,
  isLast,
  index,
}: {
  item: ExperienceItem;
  isLast: boolean;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative flex gap-5 pl-1"
    >
      {/* ── 时间轴左侧：圆点 + 连接线 ── */}
      <div className="relative flex flex-col items-center">
        <div className="w-5 h-5 rounded-full border-2 border-gray-950 bg-white flex-shrink-0 z-10 mt-1" />
        {!isLast && (
          <div className="flex-1 w-0.5 bg-gray-200 mt-1 min-h-8" />
        )}
      </div>

      {/* ── 内容区 ── */}
      <div className="flex-1 min-w-0" style={{ paddingBottom: isLast ? 0 : "2.5rem" }}>
        {/* 顶部：职位 + 时间 */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 mb-1">
          <div>
            <span className="font-bold text-gray-950 text-base">{item.title}</span>
            {item.type && (
              <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">
                {item.type}
              </span>
            )}
          </div>
          <span className="font-mono text-xs text-gray-400 whitespace-nowrap mt-0.5 sm:mt-1">
            {item.period}
          </span>
        </div>

        {/* 公司名 */}
        <p className="text-sm text-gray-500 mb-3">
          {item.companyLink ? (
            <a
              href={item.companyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-900 underline underline-offset-2 transition-colors"
            >
              @ {item.company}
            </a>
          ) : (
            <span>@ {item.company}</span>
          )}
        </p>

        {/* 工作亮点 */}
        <ul className="flex flex-col gap-1.5 mb-4">
          {item.highlights.map((h, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-600">
              <span className="text-gray-400 font-mono flex-shrink-0 mt-0.5">›</span>
              <span>{h}</span>
            </li>
          ))}
        </ul>

        {/* 技术栈 Tags */}
        <div className="flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-mono border border-gray-200"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── 主组件 ───────────────────────────────────────────────────
export default function ExperienceTimeline({
  items = DEFAULT_ITEMS,
  title = "工作经历",
}: ExperienceTimelineProps) {
  return (
    <section className="w-full px-4 sm:px-8 md:px-12 lg:px-20 max-w-5xl mx-auto">
      <SectionHeader title={title} />

      {/* 时间轴列表 */}
      <div className="flex flex-col">
        {items.map((item, index) => (
          <TimelineItem
            key={item.id}
            item={item}
            isLast={index === items.length - 1}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}
