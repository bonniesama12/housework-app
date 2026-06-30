-- 家务打卡系统 · Supabase Schema
-- 在 Supabase Dashboard → SQL Editor 中执行此脚本

CREATE TABLE IF NOT EXISTS houses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  wife_name TEXT NOT NULL,
  wife_password TEXT NOT NULL,
  reminder_enabled INTEGER DEFAULT 1,
  reminder_hour INTEGER DEFAULT 9,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  house_id TEXT NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('husband', 'wife')),
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(house_id, name)
);

CREATE TABLE IF NOT EXISTS debts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  house_id TEXT NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  amount REAL NOT NULL DEFAULT 1,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'acknowledged', 'paid')),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by TEXT
);

CREATE TABLE IF NOT EXISTS monthly_stats (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  house_id TEXT NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  base_obligation INTEGER DEFAULT 4,
  completed_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'met', 'unmet')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(house_id, year, month)
);

CREATE TABLE IF NOT EXISTS check_ins (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  house_id TEXT NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES members(id),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  day INTEGER NOT NULL,
  action_type TEXT DEFAULT 'check_in' CHECK(action_type IN ('check_in', 'revoke')),
  performed_by TEXT REFERENCES members(id),
  ip_address TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reminder_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  house_id TEXT NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  sent_to TEXT NOT NULL,
  reminder_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_members_house ON members(house_id);
CREATE INDEX IF NOT EXISTS idx_debts_house ON debts(house_id);
CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(house_id, status);
CREATE INDEX IF NOT EXISTS idx_checkins_house_ym ON check_ins(house_id, year, month);
CREATE INDEX IF NOT EXISTS idx_monthly_house_ym ON monthly_stats(house_id, year, month);

-- Row Level Security（RLS）- 必须开启才能保护数据
ALTER TABLE houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_logs ENABLE ROW LEVEL SECURITY;

-- 策略：同一 house_id 下的人可以读写自己家的数据
CREATE POLICY "household_access" ON houses
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "household_access_members" ON members
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "household_access_debts" ON debts
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "household_access_monthly" ON monthly_stats
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "household_access_checkins" ON check_ins
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "household_access_reminders" ON reminder_logs
  FOR ALL USING (true) WITH CHECK (true);
