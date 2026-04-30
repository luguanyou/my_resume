// ─── Base URL ──────────────────────────────────────────────────────────────
// 服务端用 API_BASE_URL，客户端用 NEXT_PUBLIC_API_BASE_URL
const BASE_URL =
  (typeof window === "undefined"
    ? process.env.API_BASE_URL
    : process.env.NEXT_PUBLIC_API_BASE_URL) ?? "http://localhost:8000";

// ─── API Response Types ────────────────────────────────────────────────────

export interface ApiProfile {
  id: number;
  name: string;
  /** 职位名称，如 "后端工程师 / AI 应用开发工程师" */
  title: string;
  years_of_experience: number;
  email: string;
  phone: string;
  location: string;
  bio: string;
  github?: string;
  blog?: string;
}

export interface ApiExperience {
  id: number;
  company: string;
  /** 职位 */
  position: string;
  /** 格式 "YYYY-MM" */
  start_date: string;
  /** 格式 "YYYY-MM" 或 "至今" */
  end_date: string;
  /** 工作内容描述（纯文本或换行分隔） */
  description: string;
  // 🔴 待后端补充：tech_stack?: string  (逗号分隔的技术栈，如 "Vue3, FastAPI")
}

export interface ApiProject {
  id: number;
  name: string;
  /** 逗号分隔的技术栈，如 "FastAPI, SQLAlchemy, ChromaDB" */
  tech_stack: string;
  description: string;
  role: string;
  /** 项目亮点（纯文本，逗号或换行分隔） */
  highlights: string;
  // 🔴 待后端补充：status?: "live" | "enterprise" | "open-source" | "wip" | "archived"
  // 🔴 待后端补充：start_date?: string  end_date?: string  icon?: string
}

export interface ApiSkill {
  id: number;
  category: string;
  name: string;
  proficiency: string;
}

export interface ApiHealth {
  status: string;
  version: string;
  database: string;
  vector_store: string;
}

export interface ApiEducation {
  id: number;
  school: string;
  /** 学历，如 "硕士" / "本科" */
  degree: string;
  major: string;
  /** 格式 "YYYY" */
  start_date: string;
  /** 格式 "YYYY" */
  end_date: string;
  /** 教育亮点，可能为空字符串 */
  highlights: string;
}

// ─── Chat Types ────────────────────────────────────────────────────────────

export interface ChatRequest {
  session_id: string;
  message: string;
}

// ─── Generic Fetch ─────────────────────────────────────────────────────────

async function apiFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE_URL}/myresume/api${path}`, {
      cache: "no-store", // 禁用缓存，每次请求都实时拉取
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

export const fetchProfile = () => apiFetch<ApiProfile>("/profile");
export const fetchExperiences = () =>
  apiFetch<ApiExperience[]>("/experiences");
export const fetchProjects = () => apiFetch<ApiProject[]>("/projects");
export const fetchSkills = () => apiFetch<ApiSkill[]>("/skills");
export const fetchHealth = () => apiFetch<ApiHealth>("/health");
export const fetchEducation = () => apiFetch<ApiEducation[]>("/education");

export interface ProjectDetail {
  id: string | number;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  link?: string;
  description: string;
  tech_stack: string[];
  role_and_responsibilities: string;
  highlights: string;
}

export const fetchProjectDetail = (id: string | number) => 
  apiFetch<ProjectDetail>(`/projects/${id}`);

// ─── Data Mappers ──────────────────────────────────────────────────────────
// 将 API 原始数据转换为各组件 Props 所需的格式

import type { HeroData } from "@/app/components/HeroSection";
import type { ExperienceItem } from "@/app/components/ExperienceTimeline";
import type { ProjectCase } from "@/app/components/CaseStudiesGrid";
import type { EducationItem } from "@/app/components/EducationSection";

/** 按技能分类映射颜色 */
const CATEGORY_COLORS: Record<string, string> = {
  后端: "#3b82f6",
  前端: "#22c55e",
  数据库: "#a855f7",
  AI: "#f59e0b",
  工具: "#6b7280",
  移动端: "#ec4899",
  运维: "#14b8a6",
};

/** 项目默认 Emoji（无 icon 字段时按索引循环）*/
const DEFAULT_ICONS = ["🚀", "🤖", "📊", "🏭", "🧩", "⚡", "🌐", "🔧"];

/** 格式化日期 "2022-07" → "2022.07" */
function formatDate(d: string): string {
  return d.replace("-", ".");
}

/**
 * 将纯文本分段转为 string[]
 * 按换行符或 "。" 分割，过滤空行
 */
function splitToLines(text: string): string[] {
  return text
    .split(/[\n。]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// ── Profile → HeroData ──────────────────────────────────────

export function mapProfileToHero(
  profile: ApiProfile | null,
  skills: ApiSkill[] | null,
  projectsCount: number = 0
): HeroData {
  // 技能标签：每个分类取第一个技能，最多 3 个
  const skillTags = (() => {
    if (!skills?.length) return [];
    const seen = new Set<string>();
    const result: HeroData["skills"] = [];
    for (const s of skills) {
      if (seen.has(s.category) || result.length >= 3) continue;
      seen.add(s.category);
      result.push({
        label: s.proficiency ? `${s.name}（${s.proficiency}）` : s.name,
        color: CATEGORY_COLORS[s.category] ?? "#6b7280",
      });
    }
    return result;
  })();

  return {
    status: "> status: Available for new opportunities",
    // title 保留设计稿的大标题，subtitle 使用 API 的职位名称
    title: "全栈开发者",
    subtitle: profile?.title ?? "AI 应用开发工程师",
    bio: profile?.bio ?? "专注于将 AI 能力融入企业级 Web 应用，擅长用 Vibe Coding 工作流加速产品交付。",
    skills: skillTags.length
      ? skillTags
      : [
          { label: "Vibe Coding 实战者", color: "#22c55e" },
          { label: "3D 可视化架构师", color: "#3b82f6" },
          { label: "AI 应用工程师", color: "#a855f7" },
        ],
    stats: [
      {
        value: profile ? `${profile.years_of_experience}+` : "5+",
        label: "年开发经验",
      },
      {
        value: projectsCount > 0 ? `${projectsCount}+` : "20+",
        label: "落地项目",
      },
      { value: "200%", label: "效能提升" },
    ],
  };
}

// ── ApiExperience[] → ExperienceItem[] ──────────────────────

export function mapExperiences(
  experiences: ApiExperience[] | null
): ExperienceItem[] {
  if (!experiences?.length) return [];

  return experiences.map((exp) => ({
    id: String(exp.id),
    title: exp.position,
    company: exp.company,
    period: `${formatDate(exp.start_date)} — ${exp.end_date === "至今" ? "至今" : formatDate(exp.end_date)}`,
    highlights: splitToLines(exp.description),
    // 🔴 tech_stack 字段后端暂未提供，等后端补充后替换此行：
    // tags: (exp.tech_stack ?? "").split(/,\s*/).filter(Boolean),
    tags: [],
  }));
}

// ── ApiProject[] → ProjectCase[] ────────────────────────────

export function mapProjects(projects: ApiProject[] | null): ProjectCase[] {
  if (!projects?.length) return [];

  return projects.map((proj, index) => ({
    id: String(proj.id),
    // 🔴 icon 字段后端暂未提供，使用循环默认 Emoji
    icon: DEFAULT_ICONS[index % DEFAULT_ICONS.length],
    // 🔴 日期字段后端暂未提供，暂用 role 字段作为说明
    period: proj.role,
    title: proj.name,
    subtitle: proj.description,
    highlights: splitToLines(proj.highlights),
    tags: proj.tech_stack.split(/,\s*/).filter(Boolean),
    // 🔴 status 字段后端暂未提供，默认 "enterprise"
    status: "enterprise" as const,
  }));
}

// ── ApiEducation[] → EducationItem[] ────────────────────────

export function mapEducation(
  educations: ApiEducation[] | null
): EducationItem[] {
  if (!educations?.length) return [];

  return educations.map((edu) => ({
    id: String(edu.id),
    school: edu.school,
    degree: edu.degree,
    major: edu.major,
    period: `${edu.start_date} — ${edu.end_date}`,
    highlights: splitToLines(edu.highlights),
  }));
}
