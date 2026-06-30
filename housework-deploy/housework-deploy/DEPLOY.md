# 部署指南

## 第一步：创建 Supabase 数据库

1. 访问 https://supabase.com 注册并创建免费项目
2. 进入项目 → SQL Editor → 粘贴 `supabase-schema.sql` 并执行
3. 进入项目设置 → API，复制：
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` secret → `SUPABASE_SERVICE_ROLE_KEY`

## 第二步：配置环境变量

复制 `.env.local.example` 为 `.env.local`，填入 Supabase 的三个 key 和一个随机 JWT_SECRET。

## 第三步：本地开发（可选）

在本地运行：
```bash
npm install
npm run dev
```
（需要自行解决 node 环境问题，或等部署到 Vercel 自动安装）

## 第四步：部署到 Vercel

1. 把 `housework-app` 文件夹上传到 GitHub 仓库
2. 访问 https://vercel.com，用 GitHub 登录
3. Import 项目 → 选择仓库
4. 在 Vercel 项目设置 → Environment Variables 中添加：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
5. Deploy

## 第五步：老公加入家

部署完成后，老婆注册家，系统会生成家的 ID。把这个 ID 发给老公，老公通过"加入家"加入。

## 债务机制说明

- **老婆添加债务**：老婆在"债务"Tab 添加债（来自哪月、欠几次、备注）
- **待确认状态**：债务添加后显示在老公首页醒目位置
- **老公确认**：老公点击"我认可" → 债务正式生效
- **自动还款**：老公每打卡一次，按 FIFO 顺序自动从最老的债务中扣除
- **老婆豁免**：老婆可在债务列表中直接豁免任意一笔债务
- **超额打卡**：当月完成超过4次，超出部分结转下月基础次数
