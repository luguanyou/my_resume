"use client";

import { motion } from "framer-motion";
import { ArrowRight, MessageSquare, Mail } from "lucide-react";

// ─── 数据接口（与后端对接时替换） ───────────────────────────────
export interface HeroData {
  status: string;
  title: string;
  subtitle: string;
  bio: string;
  skills: Array<{ label: string; color: string }>;
  stats: Array<{ value: string; label: string }>;
}

const DEFAULT_DATA: HeroData = {
  status: "> status: Available for new opportunities",
  title: "全栈开发者",
  subtitle: "AI 应用开发工程师",
  bio: "专注于将 AI 能力融入企业级 Web 应用，擅长用 Vibe Coding 工作流加速产品交付。\n拥有从 0→1 独立落地 SaaS 系统、3D 可视化平台及智能体对话应用的完整经验。",
  skills: [
    { label: "Vibe Coding 实战者", color: "#22c55e" },
    { label: "3D 可视化架构师", color: "#3b82f6" },
    { label: "AI 应用工程师", color: "#a855f7" },
  ],
  stats: [
    { value: "5+", label: "年开发经验" },
    { value: "20+", label: "落地项目" },
    { value: "200%", label: "效能提升" },
  ],
};

// ─── 动画变体 ────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

function scrollTo(href: string) {
  document
    .querySelector(href)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ─── Props ───────────────────────────────────────────────────
interface HeroSectionProps {
  data?: HeroData;
}

export default function HeroSection({ data = DEFAULT_DATA }: HeroSectionProps) {
  return (
    <section className="relative w-full px-4 pt-16 pb-10 sm:px-8 md:px-12 lg:px-20 max-w-5xl mx-auto">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-6"
      >
        {/* ── Status Badge ── */}
        {/* <motion.div variants={itemVariants}>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-xs text-gray-600 font-mono tracking-tight">
            <span
              className="w-2 h-2 rounded-full bg-green-500 animate-pulse-green flex-shrink-0"
              aria-hidden
            />
            {data.status}
          </span>
        </motion.div> */}

        {/* ── Main Title ── */}
        <motion.div variants={itemVariants} className="flex flex-col gap-2">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-950 leading-tight">
            {data.title}
          </h1>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-gray-700">
            {data.subtitle}
          </h2>
        </motion.div>

        {/* ── Bio ── */}
        <motion.p
          variants={itemVariants}
          className="text-gray-500 text-base sm:text-lg leading-relaxed max-w-2xl whitespace-pre-line"
        >
          {data.bio}
        </motion.p>

        {/* ── Skill Tags ── */}
        <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
          {data.skills.map((skill) => (
            <span
              key={skill.label}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium border border-gray-200"
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: skill.color }}
                aria-hidden
              />
              {skill.label}
            </span>
          ))}
        </motion.div>

        {/* ── CTA Buttons ── */}
        <motion.div
          variants={itemVariants}
          className="flex flex-wrap items-center gap-3 pt-2"
        >
          <button
            onClick={() => scrollTo("#projects")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gray-950 text-white text-sm font-semibold hover:bg-gray-800 transition-colors duration-200 cursor-pointer"
          >
            查看项目
            <ArrowRight size={15} />
          </button>

          <button
            onClick={() => scrollTo("#chat")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-gray-900 text-sm font-semibold border border-gray-300 hover:border-gray-900 hover:bg-gray-50 transition-all duration-200 cursor-pointer"
          >
            <MessageSquare size={15} />与 AI 对话
          </button>

          <button
            onClick={() => scrollTo("#chat")}
            className="inline-flex items-center gap-1.5 px-2 py-2.5 text-sm text-gray-500 hover:text-gray-900 transition-colors duration-200 underline-offset-4 hover:underline cursor-pointer"
          >
            <Mail size={14} />
            联系我
          </button>
        </motion.div>

        {/* ── Stats ── */}
        {/* <motion.div
          variants={itemVariants}
          className="grid grid-cols-3 gap-4 pt-4 mt-2 border-t border-gray-100"
        >
          {data.stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + i * 0.1, duration: 0.4 }}
              className="flex flex-col gap-0.5"
            >
              <span className="text-3xl sm:text-4xl font-black text-gray-950 tracking-tight">
                {stat.value}
              </span>
              <span className="text-xs sm:text-sm text-gray-400 font-medium">
                {stat.label}
              </span>
            </motion.div>
          ))}
        </motion.div> */}
      </motion.div>
    </section>
  );
}
