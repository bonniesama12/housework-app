import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { addDebt, getDebts, acknowledgeDebt } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const { debts, error } = await getDebts(session.houseId)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ debts })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: '未登录' }, { status: 401 })
  if (session.role !== 'wife') return NextResponse.json({ error: '只有老婆可以添加债务' }, { status: 403 })

  const body = await req.json()
  const { year, month, amount, reason } = body

  if (!year || !month || !amount) {
    return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
  }

  const result = await addDebt(session.houseId, year, month, amount, reason || '')
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json({ success: true, id: result.id })
}

// 老公确认债务
export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: '未登录' }, { status: 401 })
  if (session.role !== 'husband') return NextResponse.json({ error: '只有老公可以确认债务' }, { status: 403 })

  const body = await req.json()
  const { debtId } = body

  const result = await acknowledgeDebt(debtId, session.id)
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json({ success: true })
}
