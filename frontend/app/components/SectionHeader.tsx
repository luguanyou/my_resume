"use client";

import { motion } from "framer-motion";

interface SectionHeaderProps {
  title: string;
  description?: string;
}

export default function SectionHeader({
  title,
  description,
}: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="mb-8"
    >
      <h2 className="text-2xl font-bold text-gray-950 tracking-tight">
        {title}
      </h2>
      <div className="mt-2 w-8 h-0.5 bg-gray-950 rounded-full" />
      {description && (
        <p className="mt-3 text-sm text-gray-500">{description}</p>
      )}
    </motion.div>
  );
}
