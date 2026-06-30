# 部署检查清单

## 本地 npm install 状态
- 状态：npm 已成功调用，正在下载所有依赖包
- 问题：大量包 cache miss，下载极慢（约 152 秒/包）
- 路径问题已解决：使用干净路径 C:\housework-app 规避中文路径编码问题
- 方案：直接部署到 Vercel，不等本地 npm 完成

## Vercel 部署步骤
1. 将 C:\housework-app 目录内容上传/部署到 Vercel
2. Vercel 自动运行 npm install（服务端，网络更快）
3. 配置环境变量：
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - JWT_SECRET

## 代码已就绪
- package.json：Next.js 14 + Supabase 依赖完整
- db.ts：Supabase 客户端层
- auth.ts：JWT 认证
- API 路由：auth, dashboard, check-in, exempt, history, debts
- 前端页面：登录、注册、仪表盘
- SPEC.md、DEPLOY.md 均已创建

## 待确认
- [ ] Supabase 项目是否已创建
- [ ] 数据库表是否已创建（supabase-schema.sql）
- [ ] 环境变量是否已配置在 Vercel
