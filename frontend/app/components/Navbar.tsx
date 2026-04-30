"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
}

// 联系邮箱——修改此处即可同步更新导航栏和移动端菜单
const CONTACT_EMAIL = "your@email.com";

const NAV_ITEMS: NavItem[] = [
  // { label: "关于", href: "/#about" },
  { label: "AI 对话", href: "/#chat" },
  { label: "工作经历", href: "/#experience" },
  { label: "教育经历", href: "/#education" },
  { label: "项目案例", href: "/#projects" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // 滚动时加边框阴影
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 锚点平滑跳转
  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    const isHash = href.startsWith("/#") || href.startsWith("#");
    if (!isHash) return;

    const hash = href.substring(href.indexOf("#"));

    if (pathname === "/") {
      e.preventDefault();
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      setMenuOpen(false);
    } else {
      // 如果不在首页，就让 Next.js 的 Link 默认行为来处理跳转
      setMenuOpen(false);
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm"
            : "bg-transparent"
        }`}
      >
        <nav className="max-w-5xl mx-auto px-4 sm:px-8 md:px-12 lg:px-20 h-14 flex items-center justify-between">
          {/* Logo / 名字 */}
          <Link
            href="/#about"
            onClick={(e) => handleNav(e, "/#about")}
            className="font-mono text-sm font-bold text-gray-950 tracking-tight hover:opacity-70 transition-opacity"
          >
            <span className="text-gray-400 mr-1">~/</span>guanyou
          </Link>

          {/* 桌面导航链接 */}
          <ul className="hidden sm:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={(e) => handleNav(e, item.href)}
                  className="px-3 py-1.5 rounded-md text-sm text-gray-500 hover:text-gray-950 hover:bg-gray-100 transition-all duration-150"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* 桌面右侧：联系按钮 */}
          {/* <div className="hidden sm:flex items-center gap-2">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="px-3.5 py-1.5 rounded-lg text-sm font-medium bg-gray-950 text-white hover:bg-gray-700 transition-colors"
            >
              联系我
            </a>
          </div> */}

          {/* 移动端汉堡按钮 */}
          <button
            className="sm:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "关闭菜单" : "打开菜单"}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </nav>
      </header>

      {/* 移动端下拉菜单 */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="fixed top-14 inset-x-0 z-40 bg-white border-b border-gray-200 shadow-lg sm:hidden"
          >
            <ul className="flex flex-col px-4 py-3 gap-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={(e) => handleNav(e, item.href)}
                    className="block px-3 py-2.5 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-950 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li className="pt-2 border-t border-gray-100 mt-1">
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="block px-3 py-2.5 rounded-md text-sm font-medium text-gray-950 hover:bg-gray-100 transition-colors"
                >
                  联系我 →
                </a>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 占位高度，防止内容被遮挡 */}
      <div className="h-14" />
    </>
  );
}
