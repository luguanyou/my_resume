"use client";

import { motion } from "framer-motion";
import SectionHeader from "./SectionHeader";

export interface EducationItem {
  id: string;
  school: string;
  degree: string;
  major: string;
  period: string;
  highlights: string[];
}

interface EducationSectionProps {
  items?: EducationItem[];
}

const DEFAULT_ITEMS: EducationItem[] = [
  {
    id: "edu-1",
    school: "扬州大学",
    degree: "硕士",
    major: "计算机技术",
    period: "2017 — 2020",
    highlights: [
      "主修机器学习与分布式系统",
      "研究方向：自然语言处理与知识图谱",
      "毕业论文获优秀论文奖",
    ],
  },
  {
    id: "edu-2",
    school: "扬州大学",
    degree: "本科",
    major: "软件工程",
    period: "2013 — 2017",
    highlights: ["专业排名前 10%", "主修数据结构、算法与软件工程"],
  },
];

const DEGREE_STYLE: Record<string, string> = {
  硕士: "bg-blue-50 text-blue-700 border-blue-200",
  本科: "bg-green-50 text-green-700 border-green-200",
  博士: "bg-purple-50 text-purple-700 border-purple-200",
  专科: "bg-gray-50 text-gray-600 border-gray-200",
};

function getDegreeStyle(degree: string): string {
  return DEGREE_STYLE[degree] ?? "bg-gray-50 text-gray-600 border-gray-200";
}

export default function EducationSection({
  items = DEFAULT_ITEMS,
}: EducationSectionProps) {
  return (
    <section className="w-full px-4 sm:px-8 md:px-12 lg:px-20 max-w-5xl mx-auto">
      <SectionHeader title="教育经历" />

      <div className="flex flex-col gap-4">
        {items.map((edu, index) => (
          <motion.div
            key={edu.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="flex flex-col sm:flex-row gap-4 p-5 rounded-xl border border-gray-200 bg-white"
          >
            {/* 左侧：时间轴竖线 */}
            <div className="hidden sm:flex flex-col items-center pt-1">
              <div className="w-2 h-2 rounded-full bg-gray-950 flex-shrink-0" />
              {index < items.length - 1 && (
                <div className="w-px flex-1 bg-gray-200 mt-1.5" />
              )}
            </div>

            {/* 右侧：内容 */}
            <div className="flex-1 min-w-0">
              {/* 顶部：学校 + 学历徽章 */}
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="font-bold text-gray-950 text-base leading-snug">
                  {edu.school}
                </h3>
                <span
                  className={`text-xs px-2 py-0.5 rounded-md border font-medium ${getDegreeStyle(edu.degree)}`}
                >
                  {edu.degree}
                </span>
              </div>

              {/* 专业 + 时间 */}
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className="text-sm text-gray-600">{edu.major}</span>
                <span className="font-mono text-xs text-gray-400">
                  {edu.period}
                </span>
              </div>

              {/* 亮点列表 */}
              {edu.highlights.length > 0 && (
                <ul className="flex flex-col gap-1.5">
                  {edu.highlights.map((h, i) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-600">
                      <span className="text-gray-400 font-mono flex-shrink-0">
                        ›
                      </span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
