# ── Stage 1: 依赖安装阶段 ──────────────────────────────────────────────
FROM node:20-alpine AS deps
# 增加 libc6-compat 解决某些 Node 模块的 Alpine 兼容性问题
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 利用 Docker 缓存，只有 package.json 变更时才重新安装依赖
COPY package.json package-lock.json ./
# 优化：添加 npm 淘宝镜像源（国内加速，可选，如果不需要可删）
RUN npm config set registry https://registry.npmmirror.com/
RUN npm ci

# ── Stage 2: 编译构建阶段 ──────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 构建时注入环境变量（API_BASE_URL 在容器内通过后端服务名访问）
ARG API_BASE_URL=http://backend:8000
ENV API_BASE_URL=$API_BASE_URL

# 执行 Next.js 独立模式构建
RUN npm run build

# ── Stage 3: 生产运行阶段 ──────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
# 禁用 Next.js 的遥测，减少网络请求
ENV NEXT_TELEMETRY_DISABLED=1

# 仅复制生产所需文件，大幅减小镜像体积
COPY --from=builder /app/public ./public
# .next/standalone 包含了运行所需的所有最小依赖
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 以非 root 用户运行，提升安全性
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

EXPOSE 3000

# Next.js standalone 模式入口文件
CMD ["node", "server.js"]
