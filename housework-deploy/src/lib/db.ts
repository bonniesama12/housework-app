import { createClient, SupabaseClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

let supabase: SupabaseClient
let adminClient: SupabaseClient

function getSupabase(): SupabaseClient {
  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseKey)
  }
  return supabase
}

function getAdmin(): SupabaseClient {
  if (!adminClient) {
    adminClient = createClient(supabaseUrl, serviceKey)
  }
  return adminClient
}

// ─── Schema Init ──────────────────────────────────────────────────────────────

// ─── Auth ──────────────────────────────────────────────────────────────────

export async function createHouse(name: string, wifeName: string, wifePassword: string) {
  const db = getAdmin()
  const houseId = uuidv4()
  const wifeId = uuidv4()
  const hashed = bcrypt.hashSync(wifePassword, 10)

  const { error } = await db.from('houses').insert({
    id: houseId,
    name,
    wife_name: wifeName,
    wife_password: hashed,
  })
  if (error) throw new Error(`createHouse: ${error.message}`)

  const { error: memberErr } = await db.from('members').insert({
    id: wifeId,
    house_id: houseId,
    name: wifeName,
    role: 'wife',
    password: hashed,
  })
  if (memberErr) throw new Error(`createHouse members: ${memberErr.message}`)

  return {
    house: { id: houseId, name, wifeName },
    wife: { id: wifeId, name: wifeName, role: 'wife' }
  }
}

export async function joinHouse(houseId: string, name: string, password: string) {
  const db = getSupabase()
  const { data: house } = await db.from('houses').select('*').eq('id', houseId).single()
  if (!house) return { error: '家不存在' }

  const { data: existing } = await db.from('members')
    .select('*').eq('house_id', houseId).eq('name', name).single()
  if (existing) return { error: '该昵称已被使用' }

  const memberId = uuidv4()
  const { error: memberErr } = await db.from('members').insert({
    id: memberId,
    house_id: houseId,
    name,
    role: 'husband',
    password: bcrypt.hashSync(password, 10),
  })
  if (memberErr) return { error: memberErr.message }

  return { member: { id: memberId, name, role: 'husband', houseId } }
}

export async function login(name: string, password: string) {
  const db = getSupabase()
  const { data: member } = await db.from('members')
    .select('*, houses!inner(id, name)')
    .eq('name', name)
    .single()

  if (!member) return { error: '用户不存在' }
  if (!bcrypt.compareSync(password, member.password)) return { error: '密码错误' }

  return {
    member: { id: member.id, name: member.name, role: member.role, houseId: member.house_id },
    house: { id: (member.houses as any).id, name: (member.houses as any).name }
  }
}

// ─── Monthly Stats ──────────────────────────────────────────────────────────

export async function getOrCreateMonthlyStats(houseId: string, year: number, month: number) {
  const db = getSupabase()

  const { data: existing } = await db.from('monthly_stats')
    .select('*').eq('house_id', houseId).eq('year', year).eq('month', month).single()

  if (existing) return existing

  const id = uuidv4()
  const { data: inserted } = await db.from('monthly_stats').insert({
    id, house_id: houseId, year, month,
    base_obligation: 4,
    completed_count: 0,
    status: 'pending',
  }).select().single()

  return inserted
}

export async function getRequiredCount(houseId: string, year: number, month: number): Promise<number> {
  const db = getSupabase()
  const stats = await getOrCreateMonthlyStats(houseId, year, month)

  // 当月基础4次
  let base = stats.base_obligation

  // 未还清的 acknowledged 债务
  const { data: debts } = await db.from('debts')
    .select('*').eq('house_id', houseId).eq('status', 'acknowledged')
    .order('created_at', { ascending: true })

  const totalDebt = debts?.reduce((sum, d) => sum + d.amount, 0) ?? 0
  return base + totalDebt
}

// ─── Debts ─────────────────────────────────────────────────────────────────

export async function addDebt(houseId: string, year: number, month: number, amount: number, reason: string) {
  const db = getSupabase()
  const id = uuidv4()
  const { error } = await db.from('debts').insert({
    id, house_id: houseId, year, month, amount, status: 'pending', reason
  })
  if (error) return { error: error.message }
  return { success: true, id }
}

export async function getDebts(houseId: string) {
  const db = getSupabase()
  const { data, error } = await db.from('debts')
    .select('*').eq('house_id', houseId)
    .order('year', { ascending: false }).order('month', { ascending: false })
  if (error) return { error: error.message }
  return { debts: data }
}

export async function getPendingDebts(houseId: string) {
  const db = getSupabase()
  const { data } = await db.from('debts')
    .select('*').eq('house_id', houseId).eq('status', 'pending')
    .order('created_at', { ascending: true })
  return data ?? []
}

export async function acknowledgeDebt(debtId: string, acknowledgedBy: string) {
  const db = getSupabase()
  const { error } = await db.from('debts').update({
    status: 'acknowledged',
    acknowledged_at: new Date().toISOString(),
    acknowledged_by: acknowledgedBy,
  }).eq('id', debtId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function payDebt(debtId: string, amount: number) {
  const db = getSupabase()
  const { data: debt } = await db.from('debts').select('*').eq('id', debtId).single()
  if (!debt) return { error: '债务不存在' }

  const remaining = debt.amount - amount
  if (remaining <= 0) {
    const { error } = await db.from('debts').update({ status: 'paid', amount: 0 }).eq('id', debtId)
    return { success: true, remaining: 0 }
  } else {
    const { error } = await db.from('debts').update({ amount: remaining }).eq('id', debtId)
    return { success: true, remaining }
  }
}

// ─── Check-ins ─────────────────────────────────────────────────────────────

export async function getCheckIns(houseId: string, year: number, month: number) {
  const db = getSupabase()
  const { data, error } = await db.from('check_ins')
    .select('*').eq('house_id', houseId).eq('year', year).eq('month', month)
    .eq('action_type', 'check_in')
    .order('day', { ascending: true })
  if (error) return []
  return data ?? []
}

export async function getCheckInsMap(houseId: string, year: number, month: number) {
  const checkIns = await getCheckIns(houseId, year, month)
  const map: Record<number, string> = {}
  checkIns.forEach(c => { map[c.day] = c.id })
  return map
}

export async function checkIn(houseId: string, memberId: string, year: number, month: number, day: number, ip: string) {
  const db = getSupabase()

  // 防刷：检查当天是否已有打卡
  const { data: existing } = await db.from('check_ins')
    .select('*').eq('house_id', houseId).eq('year', year).eq('month', month)
    .eq('day', day).eq('action_type', 'check_in').single()
  if (existing) return { error: '今日已打卡' }

  const id = uuidv4()
  await db.from('check_ins').insert({
    id, house_id: houseId, member_id: memberId, year, month, day,
    action_type: 'check_in', performed_by: memberId, ip_address: ip,
  })

  // 更新月度统计
  const stats = await getOrCreateMonthlyStats(houseId, year, month)
  await db.from('monthly_stats').update({
    completed_count: (stats.completed_count || 0) + 1,
    status: 'pending',
  }).eq('id', stats.id)

  // 尝试按 FIFO 顺序还款（先还最老的 acknowledged 债务）
  const { data: debts } = await db.from('debts')
    .select('*').eq('house_id', houseId).eq('status', 'acknowledged')
    .order('created_at', { ascending: true })

  if (debts && debts.length > 0) {
    // 用这次打卡还债
    let remaining = 1
    for (const debt of debts) {
      if (remaining <= 0) break
      const used = Math.min(remaining, debt.amount)
      await payDebt(debt.id, used)
      remaining -= used
    }
  }

  return { success: true }
}

export async function revokeCheckIn(checkInId: string, performedBy: string, reason: string, ip: string) {
  const db = getSupabase()
  const { data: checkIn } = await db.from('check_ins').select('*').eq('id', checkInId).single()
  if (!checkIn) return { error: '打卡记录不存在' }

  await db.from('check_ins').insert({
    id: uuidv4(), house_id: checkIn.house_id, member_id: checkIn.member_id,
    year: checkIn.year, month: checkIn.month, day: checkIn.day,
    action_type: 'revoke', performed_by: performedBy, reason, ip_address: ip,
  })

  // 扣减完成次数
  const stats = await getOrCreateMonthlyStats(checkIn.house_id, checkIn.year, checkIn.month)
  await db.from('monthly_stats').update({
    completed_count: Math.max(0, (stats.completed_count || 1) - 1),
  }).eq('id', stats.id)

  return { success: true }
}

// ─── Dashboard ─────────────────────────────────────────────────────────────

export async function getDashboardData(houseId: string, year: number, month: number, memberId: string) {
  const stats = await getOrCreateMonthlyStats(houseId, year, month)
  const checkIns = await getCheckIns(houseId, year, month)
  const required = await getRequiredCount(houseId, year, month)
  const pendingDebts = await getPendingDebts(houseId)
  const { debts } = await getDebts(houseId)

  // 获取老婆信息用于判断角色
  const db = getSupabase()
  const { data: member } = await db.from('members').select('*').eq('id', memberId).single()
  const isWife = member?.role === 'wife'

  // 获取节假日
  const holidays = getHolidays(year)

  return {
    stats,
    holidays,
    required,
    completed: stats.completed_count ?? 0,
    checkIns: checkIns.map(c => c.day),
    pendingDebts,   // 待确认债务
    allDebts: debts ?? [],  // 所有债务记录
    isWife,
    member: member ? { id: member.id, name: member.name, role: member.role } : null,
  }
}

// ─── History ───────────────────────────────────────────────────────────────

export async function getHistory(houseId: string, page: number = 1, limit: number = 20) {
  const db = getSupabase()
  const offset = (page - 1) * limit

  const { data: rows, error } = await db.from('check_ins')
    .select('*, member_name:members!member_id(name), performed_by_name:members!performed_by(name)')
    .eq('house_id', houseId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return { rows: [], total: 0, page, limit }

  const { count } = await db.from('check_ins').select('*', { count: 'exact', head: true })
    .eq('house_id', houseId)

  return { rows: rows ?? [], total: count ?? 0, page, limit }
}

// ─── Holidays ──────────────────────────────────────────────────────────────

const holidayCache: Record<string, { holidays: Record<string, any>; updatedAt: number }> = {}

const CHINA_HOLIDAYS: Record<string, any[]> = {
  2026: [
    { date: '2026-01-01', name: '元旦', type: 'holiday' },
    { date: '2026-01-28', name: '除夕', type: 'holiday' },
    { date: '2026-01-29', name: '春节', type: 'holiday' },
    { date: '2026-01-30', name: '春节', type: 'holiday' },
    { date: '2026-01-31', name: '春节', type: 'holiday' },
    { date: '2026-02-01', name: '春节', type: 'holiday' },
    { date: '2026-02-02', name: '春节', type: 'holiday' },
    { date: '2026-02-03', name: '春节', type: 'holiday' },
    { date: '2026-02-04', name: '节后调休', type: 'workday' },
    { date: '2026-02-05', name: '节后调休', type: 'workday' },
    { date: '2026-04-04', name: '清明', type: 'holiday' },
    { date: '2026-04-05', name: '清明', type: 'holiday' },
    { date: '2026-04-06', name: '清明', type: 'holiday' },
    { date: '2026-05-01', name: '劳动节', type: 'holiday' },
    { date: '2026-05-02', name: '劳动节', type: 'holiday' },
    { date: '2026-05-03', name: '劳动节', type: 'holiday' },
    { date: '2026-05-04', name: '劳动节', type: 'holiday' },
    { date: '2026-05-05', name: '劳动节', type: 'holiday' },
    { date: '2026-06-20', name: '端午', type: 'holiday' },
    { date: '2026-06-21', name: '端午', type: 'holiday' },
    { date: '2026-06-22', name: '端午', type: 'holiday' },
    { date: '2026-09-27', name: '中秋', type: 'holiday' },
    { date: '2026-10-01', name: '国庆', type: 'holiday' },
    { date: '2026-10-02', name: '国庆', type: 'holiday' },
    { date: '2026-10-03', name: '国庆', type: 'holiday' },
    { date: '2026-10-04', name: '国庆', type: 'holiday' },
    { date: '2026-10-05', name: '国庆', type: 'holiday' },
    { date: '2026-10-06', name: '国庆', type: 'holiday' },
    { date: '2026-10-07', name: '国庆', type: 'holiday' },
    { date: '2026-10-08', name: '国庆调休', type: 'workday' },
    { date: '2026-10-09', name: '节后调休', type: 'workday' },
  ],
}

export function getHolidays(year: number): Record<string, any> {
  const key = String(year)
  if (!CHINA_HOLIDAYS[key]) return {}
  const map: Record<string, any> = {}
  CHINA_HOLIDAYS[key].forEach(h => { map[h.date] = h })
  return map
}
