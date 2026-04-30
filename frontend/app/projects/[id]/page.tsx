import { fetchProjectDetail } from "@/lib/api";
import { notFound } from "next/navigation";
import { ProjectDetailClient } from "./ProjectDetailClient";

// 禁用静态生成，确保每次动态获取最新数据
export const dynamic = "force-dynamic";

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const resolvedParams = await params;
  const projectId = resolvedParams.id;
  
  const project = await fetchProjectDetail(projectId);

  if (!project) {
    notFound();
  }

  return <ProjectDetailClient project={project} />;
}
