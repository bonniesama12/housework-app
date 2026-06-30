import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDashboardData } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))

  const data = await getDashboardData(session.houseId, year, month, session.id)
  return NextResponse.json(data)
}
