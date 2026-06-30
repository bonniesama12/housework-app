import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getHistory } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  const result = await getHistory(session.houseId, page, limit)
  return NextResponse.json(result)
}
