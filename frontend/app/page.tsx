import HeroSection from "./components/HeroSection";
import AIChatWindow from "./components/AIChatWindow";
import ExperienceTimeline from "./components/ExperienceTimeline";
import CaseStudiesGrid from "./components/CaseStudiesGrid";
import EducationSection from "./components/EducationSection";
import SectionHeader from "./components/SectionHeader";
import {
  fetchProfile,
  fetchExperiences,
  fetchProjects,
  fetchSkills,
  fetchEducation,
  mapProfileToHero,
  mapExperiences,
  mapProjects,
  mapEducation,
} from "@/lib/api";

export default async function Home() {
  // 并行拉取所有接口，任一失败返回 null，组件自动降级到内置默认数据
  const [profile, experiences, projects, skills, educations] = await Promise.all([
    fetchProfile(),
    fetchExperiences(),
    fetchProjects(),
    fetchSkills(),
    fetchEducation(),
  ]);

  const heroData = mapProfileToHero(profile, skills, projects?.length ?? 0);
  // API 返回 null（服务不可用）时传 undefined，让组件使用内置默认数据
  const experienceItems = experiences ? mapExperiences(experiences) : undefined;
  const projectCases = projects ? mapProjects(projects) : undefined;
  const educationItems = educations ? mapEducation(educations) : undefined;

  return (
    <main className="min-h-screen bg-white">
      {/* ── 1. Hero Section ── */}
      <section id="about" className="scroll-mt-14">
        <HeroSection data={heroData} />
      </section>

      <Divider />

      {/* ── 2. AI Chat Window ── */}
      <section id="chat" className="mb-6 scroll-mt-14">
        <div className="px-4 sm:px-8 md:px-12 lg:px-20 max-w-5xl mx-auto">
          <SectionHeader
            title="与 AI 对话"
            description="直接向 AI 提问，探索我的项目经历与技术能力。"
          />
        </div>
        <AIChatWindow />
      </section>

      <Divider />

      {/* ── 3. Experience Timeline ── */}
      <section id="experience" className="scroll-mt-14">
        <ExperienceTimeline items={experienceItems} />
      </section>

      <Divider />

      {/* ── 4. Education Section ── */}
      <section id="education" className="scroll-mt-14">
        <EducationSection items={educationItems} />
      </section>

      <Divider />

      {/* ── 5. Case Studies Grid ── */}
      <section id="projects" className="scroll-mt-14">
        <CaseStudiesGrid items={projectCases} />
      </section>

      {/* 页脚 */}
      <footer className="mt-20 pb-12 px-4 sm:px-8 md:px-12 lg:px-20 max-w-5xl mx-auto">
        <div className="border-t border-gray-100 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-gray-400 font-mono">
            © 2025 管友. Built with Next.js + AI.
          </p>
          <p className="text-xs text-gray-300 font-mono">
            guanyou-resume v1.0.0
          </p>
        </div>
      </footer>
    </main>
  );
}

// 区块分隔线（避免在 page 内重复粘贴相同 JSX）
function Divider() {
  return (
    <div className="my-8 sm:my-12 px-4 sm:px-8 md:px-12 lg:px-20 max-w-5xl mx-auto">
      <div className="border-t border-gray-100" />
    </div>
  );
}
