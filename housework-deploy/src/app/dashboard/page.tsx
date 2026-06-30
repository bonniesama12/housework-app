'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Calendar from '@/components/Calendar'

interface Debt {
  id: string
  year: number
  month: number
  amount: number
  status: 'pending' | 'acknowledged' | 'paid'
  reason: string
  created_at: string
  acknowledged_at: string | null
}

interface DashboardData {
  stats: any
  required: number
  completed: number
  checkIns: number[]
  pendingDebts: Debt[]
  allDebts: Debt[]
  isWife: boolean
  member: { id: string; name: string; role: string }
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [tab, setTab] = useState<'calendar' | 'debts' | 'history'>('calendar')
  const [loading, setLoading] = useState(false)
  const [checkInMap, setCheckInMap] = useState<Record<number, string>>({})

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/dashboard?year=${year}&month=${month}`)
    if (res.status === 401) { router.push('/'); return }
    const json = await res.json()
    setData(json)
    // 获取打卡ID映射（老婆撤销用）
    if (json.isWife) {
      const mapRes = await fetch(`/api/check-in?year=${year}&month=${month}`)
      const mapJson = await mapRes.json()
      const m: Record<number, string> = {}
      mapJson.checkIns?.forEach((c: any) => { m[c.day] = c.id })
      setCheckInMap(m)
    }
  }, [year, month, router])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleCheckIn(day: number) {
    setLoading(true)
    const res = await fetch('/api/check-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year, month, day })
    })
    const json = await res.json()
    setLoading(false)
    if (res.ok) {
      await fetchData()
    } else {
      alert(json.error)
    }
  }

  async function handleRevoke(day: number, checkInId: string) {
    const reason = prompt('撤销原因（可选）')
    const res = await fetch('/api/check-in', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkInId, reason: reason || '' })
    })
    if (res.ok) await fetchData()
    else alert((await res.json()).error)
  }

  async function handleAcknowledge(debtId: string) {
    const res = await fetch('/api/debts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ debtId })
    })
    if (res.ok) await fetchData()
    else alert((await res.json()).error)
  }

  async function handleLogout() {
    await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'logout' }) })
    router.push('/')
  }

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) } else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) } else setMonth(m => m + 1)
  }

  if (!data) return <div className="min-h-screen flex items-center justify-center text-text-secondary">加载中...</div>

  const { stats, required, completed, checkIns, pendingDebts, allDebts, isWife, member } = data
  const remaining = Math.max(0, required - completed)
  const progress = required > 0 ? Math.min(100, Math.round((completed / required) * 100)) : 100
  const isMet = completed >= required
  const hasPendingDebts = pendingDebts.length > 0

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* 顶部栏 */}
      <header className="bg-bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-text-primary">
              {isWife ? '👑 老婆监督台' : '🏠 家务打卡'}
            </h1>
            <p className="text-xs text-text-secondary">{member?.name} · {MONTH_NAMES[month - 1]}{year}年</p>
          </div>
          <div className="flex items-center gap-2">
            {isWife && (
              <button onClick={() => setTab('debts')} className="text-sm px-3 py-1 rounded-btn border border-border text-text-secondary hover:border-blue-300 transition-colors">
                债务
              </button>
            )}
            <button onClick={handleLogout} className="text-sm text-text-secondary hover:text-red-500 px-3 py-1">退出</button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* ── 待确认债务区（老公视角） ── */}
        {!isWife && hasPendingDebts && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-card p-4">
            <h2 className="font-semibold text-amber-700 mb-3 flex items-center gap-2">
              ⚠️ 待你确认的债务
            </h2>
            <div className="space-y-2 mb-4">
              {pendingDebts.map(debt => (
                <div key={debt.id} className="flex items-center justify-between bg-white rounded-btn p-3 border border-amber-200">
                  <div>
                    <span className="font-mono font-bold text-amber-600">{debt.amount} 次</span>
                    <span className="text-sm text-text-secondary ml-2">欠自 {debt.year}年{debt.month}月</span>
                    {debt.reason && <span className="text-xs text-text-secondary ml-2">（{debt.reason}）</span>}
                  </div>
                  <button
                    onClick={() => handleAcknowledge(debt.id)}
                    className="px-4 py-1.5 rounded-btn bg-amber-400 text-amber-900 text-sm font-medium hover:bg-amber-500 btn-ripple"
                  >
                    我认可
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-amber-600">点击"我认可"表示你确认这笔债务，将从你的应完成任务中扣除</p>
          </div>
        )}

        {/* ── 任务看板 ── */}
        <div className="bg-bg-card rounded-card border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-text-primary">本月任务</h2>
            <span className={`text-xs px-2 py-0.5 rounded-tag font-medium ${isMet ? 'bg-green-100 text-accent-green' : 'bg-orange-100 text-accent-orange'}`}>
              {isMet ? '✓ 已达标' : '进行中'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 bg-bg-primary rounded-btn">
              <div className={`text-3xl font-mono font-bold ${isMet ? 'text-accent-green' : 'text-accent-orange'}`}>{completed}</div>
              <div className="text-xs text-text-secondary mt-1">已完成</div>
            </div>
            <div className="text-center p-3 bg-bg-primary rounded-btn">
              <div className="text-3xl font-mono font-bold text-text-primary">{required}</div>
              <div className="text-xs text-text-secondary mt-1">应完成</div>
            </div>
            <div className="text-center p-3 bg-bg-primary rounded-btn">
              <div className={`text-3xl font-mono font-bold ${remaining > 0 ? 'text-accent-red' : 'text-accent-green'}`}>{remaining}</div>
              <div className="text-xs text-text-secondary mt-1">剩余</div>
            </div>
          </div>

          {/* 老婆端：未还债务概览 */}
          {isWife && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-amber-50 rounded-btn border border-amber-200">
                <div className="text-accent-orange font-mono font-bold">{pendingDebts.length}</div>
                <div className="text-xs text-text-secondary">待确认债务</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-btn border border-blue-200">
                <div className="text-accent-blue font-mono font-bold">
                  {allDebts.filter(d => d.status === 'acknowledged').reduce((s, d) => s + d.amount, 0).toFixed(1)}
                </div>
                <div className="text-xs text-text-secondary">未还清债务</div>
              </div>
            </div>
          )}

          {/* 进度条 */}
          <div className="w-full h-2 bg-bg-primary rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${isMet ? 'bg-accent-green' : 'bg-gradient-to-r from-accent-green to-accent-orange'}`}
              style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between text-xs text-text-secondary mt-1">
            <span>{progress}%</span>
            <span>基础4次 · 当月需还债{allDebts.filter(d => d.status === 'acknowledged').reduce((s, d) => s + d.amount, 0).toFixed(1)}次</span>
          </div>
        </div>

        {/* ── Tab 切换 ── */}
        <div className="flex gap-2">
          {['calendar', 'debts', 'history'].map(t => (
            <button key={t} onClick={() => setTab(t as any)}
              className={`px-4 py-2 rounded-btn text-sm font-medium transition-colors ${tab === t ? 'bg-accent-blue text-white' : 'bg-bg-card border border-border text-text-secondary'}`}>
              {t === 'calendar' ? '日历' : t === 'debts' ? '债务' : '历史'}
            </button>
          ))}
        </div>

        {/* ── 日历 ── */}
        {tab === 'calendar' && (
          <>
            <div className="flex items-center justify-between">
              <button onClick={prevMonth} className="p-2 rounded-btn border border-border hover:border-blue-300 hover:text-blue-500 transition-colors">‹</button>
              <h3 className="font-semibold text-text-primary">{year}年 {MONTH_NAMES[month - 1]}</h3>
              <button onClick={nextMonth} className="p-2 rounded-btn border border-border hover:border-blue-300 hover:text-blue-500 transition-colors">›</button>
            </div>

            <Calendar
              year={year} month={month}
              checkedDays={checkIns}
              holidays={data.holidays || {}}
              onCheckIn={handleCheckIn}
              isWife={isWife}
              onRevokeCheckIn={isWife ? (day, id) => handleRevoke(day, id) : undefined}
              checkInMap={checkInMap}
            />

            {!isWife && <p className="text-center text-sm text-text-secondary">点击日期打卡 · 已打卡日再次点击无效</p>}
            {isWife && <p className="text-center text-sm text-text-secondary">点击已打卡日期撤销</p>}
          </>
        )}

        {/* ── 债务管理（老婆） ── */}
        {tab === 'debts' && isWife && <DebtManagePanel allDebts={allDebts} onUpdate={fetchData} />}

        {/* ── 历史记录 ── */}
        {tab === 'history' && <HistoryPanel />}
      </main>
    </div>
  )
}

const MONTH_NAMES = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

// ── Debt Management Panel ──────────────────────────────────────────────────

function DebtManagePanel({ allDebts, onUpdate }: { allDebts: Debt[]; onUpdate: () => void }) {
  const [showAdd, setShowAdd] = useState(false)
  const [debtYear, setDebtYear] = useState(new Date().getFullYear())
  const [debtMonth, setDebtMonth] = useState(new Date().getMonth() + 1)
  const [debtAmount, setDebtAmount] = useState(1)
  const [debtReason, setDebtReason] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleAddDebt() {
    setSaving(true)
    const res = await fetch('/api/debts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year: debtYear, month: debtMonth, amount: debtAmount, reason: debtReason })
    })
    setSaving(false)
    if (res.ok) {
      setShowAdd(false)
      setDebtAmount(1)
      setDebtReason('')
      onUpdate()
    } else {
      alert((await res.json()).error)
    }
  }

  async function handleExempt(debtId: string) {
    if (!confirm('确定豁免这笔债务吗？豁免后不可恢复。')) return
    const res = await fetch('/api/exempt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ debtId })
    })
    if (res.ok) onUpdate()
    else alert((await res.json()).error)
  }

  const pending = allDebts.filter(d => d.status === 'pending')
  const acknowledged = allDebts.filter(d => d.status === 'acknowledged')
  const paid = allDebts.filter(d => d.status === 'paid')

  return (
    <div className="space-y-4">
      {/* 添加债务按钮 */}
      <button onClick={() => setShowAdd(true)}
        className="w-full py-3 rounded-btn bg-accent-blue text-white font-medium hover:bg-blue-600 btn-ripple">
        ＋ 添加债务
      </button>

      {/* 添加债务表单 */}
      {showAdd && (
        <div className="bg-bg-card rounded-card border border-border p-4 space-y-3">
          <h3 className="font-semibold text-text-primary">添加债务</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-text-secondary">欠债年份</label>
              <input type="number" value={debtYear} onChange={e => setDebtYear(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-btn border border-border bg-bg-primary text-sm" />
            </div>
            <div>
              <label className="text-xs text-text-secondary">欠债月份</label>
              <input type="number" min="1" max="12" value={debtMonth} onChange={e => setDebtMonth(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-btn border border-border bg-bg-primary text-sm" />
            </div>
            <div>
              <label className="text-xs text-text-secondary">欠几次</label>
              <input type="number" min="0.5" step="0.5" value={debtAmount} onChange={e => setDebtAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-btn border border-border bg-bg-primary text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs text-text-secondary">备注（可选）</label>
            <input type="text" value={debtReason} onChange={e => setDebtReason(e.target.value)}
              placeholder="如：3月出差未完成"
              className="w-full px-3 py-2 rounded-btn border border-border bg-bg-primary text-sm" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-2 rounded-btn border border-border text-text-secondary hover:bg-bg-primary">取消</button>
            <button onClick={handleAddDebt} disabled={saving}
              className="flex-1 py-2 rounded-btn bg-accent-blue text-white hover:bg-blue-600 btn-ripple">
              {saving ? '保存中...' : '确认添加'}
            </button>
          </div>
        </div>
      )}

      {/* 待确认 */}
      {pending.length > 0 && (
        <DebtSection title="待老公确认" debts={pending} type="pending" onExempt={handleExempt} />
      )}

      {/* 未还清 */}
      {acknowledged.length > 0 && (
        <DebtSection title="已生效债务（未还清）" debts={acknowledged} type="acknowledged" onExempt={handleExempt} />
      )}

      {/* 已还清 / 已豁免 */}
      {paid.length > 0 && (
        <DebtSection title="已结清" debts={paid} type="paid" onExempt={handleExempt} />
      )}

      {allDebts.length === 0 && (
        <div className="text-center text-text-secondary py-8">暂无债务记录</div>
      )}
    </div>
  )
}

function DebtSection({ title, debts, type, onExempt }: { title: string; debts: Debt[]; type: string; onExempt: (id: string) => void }) {
  const borderColors: Record<string, string> = {
    pending: 'border-amber-300',
    acknowledged: 'border-blue-200',
    paid: 'border-green-200',
  }
  const bgColors: Record<string, string> = {
    pending: 'bg-amber-50',
    acknowledged: 'bg-blue-50',
    paid: 'bg-green-50',
  }

  return (
    <div className="bg-bg-card rounded-card border border-border overflow-hidden">
      <div className={`px-4 py-2 text-sm font-medium ${bgColors[type]} border-b ${borderColors[type]}`}>{title}</div>
      <div className="divide-y divide-border">
        {debts.map(debt => (
          <div key={debt.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <span className="font-mono font-bold text-text-primary">{debt.amount} 次</span>
              <span className="text-sm text-text-secondary ml-2">{debt.year}年{debt.month}月</span>
              {debt.reason && <span className="text-xs text-text-secondary ml-2">({debt.reason})</span>}
              <div className="text-xs text-text-secondary mt-0.5">
                添加于 {new Date(debt.created_at).toLocaleDateString('zh-CN')}
                {debt.acknowledged_at && ` · 老公确认于 ${new Date(debt.acknowledged_at).toLocaleDateString('zh-CN')}`}
              </div>
            </div>
            {type !== 'paid' && (
              <button onClick={() => onExempt(debt.id)}
                className="text-xs text-accent-blue hover:text-blue-700 px-2 py-1 rounded border border-blue-200 hover:bg-blue-50">
                豁免
              </button>
            )}
            {type === 'paid' && <span className="text-xs text-text-secondary">已结清</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── History Panel ──────────────────────────────────────────────────────────

function HistoryPanel() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/history').then(r => r.json()).then(j => { setRows(j.rows || []); setLoading(false) })
  }, [])

  if (loading) return <div className="text-center text-text-secondary py-8">加载中...</div>
  if (!rows.length) return <div className="text-center text-text-secondary py-8">暂无记录</div>

  return (
    <div className="bg-bg-card rounded-card border border-border overflow-hidden">
      <div className="divide-y divide-border">
        {rows.map((r: any) => (
          <div key={r.id} className={`flex items-center justify-between px-4 py-3 ${r.action_type === 'revoke' ? 'bg-red-50' : 'bg-bg-primary'}`}>
            <div>
              <span className={`text-sm font-medium ${r.action_type === 'revoke' ? 'text-accent-red' : 'text-accent-green'}`}>
                {r.action_type === 'check_in' ? '✓ 打卡' : '↩ 撤销'}
              </span>
              <span className="text-xs text-text-secondary ml-2">{r.year}/{r.month}/{r.day}</span>
            </div>
            <div className="text-xs text-text-secondary">
              {r.member_name} · {new Date(r.created_at).toLocaleString('zh-CN')}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
