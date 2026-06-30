# 家务打卡系统 SPEC

## 核心角色

- **老婆**：监督、记账、加债、撤销打卡
- **老公**：打卡、确认债务

## 债务机制（核心设计）

### 基本规则
- 每月基础任务：**4次**
- 当月4次**未完成** → 老婆记账，欠1次
- 欠账**先还旧债**，当月4次**先完成基础任务**再还债
- 老公**必须显式确认债务**，系统记录确认时间，防止赖账
- 老婆添加债务时附**月份来源**，双方清楚每笔债来自哪月

### 债务生命周期
```
老婆加债（待确认）→ 老公确认（已生效）→ 老公还款（已还清）
```

### 债务叠加规则
- 老婆可一次性加多笔债（来自不同月份）
- 老公每还清一笔债，系统记录
- 老公每月第一次登录时，系统主动展示当前所有未确认债务

## 数据模型

### houses（家）
- id, name, wife_name, wife_password, created_at

### members（成员）
- id, house_id, name, role (husband/wife), password, created_at

### debts（债务）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | UUID |
| house_id | TEXT | 关联家 |
| year | INTEGER | 债务来源年 |
| month | INTEGER | 债务来源月（哪月欠的） |
| amount | REAL | 欠几次（支持0.5） |
| status | TEXT | pending / acknowledged / paid |
| reason | TEXT | 老婆备注 |
| created_at | TEXT | 老婆加债时间 |
| acknowledged_at | TEXT | 老公确认时间（null=未确认） |

### monthly_stats（月度统计）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | UUID |
| house_id | TEXT | 关联家 |
| year | INTEGER | 年 |
| month | INTEGER | 月 |
| base_obligation | INTEGER | 基础任务数（固定4） |
| completed_count | INTEGER | 当月已完成次数 |
| status | TEXT | pending / met / unmet |

### check_ins（打卡记录）
- id, house_id, member_id, year, month, day, action_type (check_in/revoke), performed_by, reason, ip_address, created_at

### reminder_logs（提醒日志）
- id, house_id, sent_to, reminder_type, sent_at

## API 设计

### 认证
- POST /api/auth/register - 老婆注册家
- POST /api/auth/join - 老公加入家
- POST /api/auth/login - 登录
- POST /api/auth/logout - 登出

### 打卡
- GET /api/dashboard - 获取当月数据（含债务信息）
- POST /api/check-in - 打卡
- DELETE /api/check-in - 撤销打卡（老婆）

### 债务（老婆权限）
- GET /api/debts - 获取所有债务记录
- POST /api/debts - 老婆添加债务
- PATCH /api/debts/:id/acknowledge - 老公确认债务

### 历史
- GET /api/history - 打卡历史

## 打卡逻辑（还款顺序）

```
打卡时按以下顺序分配这次打卡：
1. 先完成当月基础4次（base_obligation）
2. 再按 FIFO 顺序还旧债（最老的债先还）
3. 超额打卡结转到下月（作为下月的基础次数）
```

## 节假日

- 节假日数据通过外部 API 获取（HolidayAPI）
- 每月初自动更新当月节假日
- 节假日/调休日在日历上高亮显示

## 部署方案

- 前端：Vercel（Next.js）
- 数据库：Supabase 免费层（PostgreSQL）
- 域名：Vercel 自动分配的免费域名

## 豁免

- 老婆可为老公豁免债务（直接销账）
- 豁免记录永久保存

## UI 页面

### 老公视角
- 首页：登录
- 仪表盘：日历打卡 + 债务确认区（待确认债务醒目展示）
- 打卡历史

### 老婆视角
- 首页：登录
- 仪表盘：监督视图（查看老公打卡进度）
- 债务管理：添加债务、查看所有债务
- 历史记录
- 撤销打卡
