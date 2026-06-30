import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { checkIn, revokeCheckIn, getCheckIns, getCheckInsMap } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))

  const checkIns = await getCheckIns(session.houseId, year, month)
  const checkInMap = await getCheckInsMap(session.houseId, year, month)
  return NextResponse.json({ checkIns, checkInMap })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const body = await req.json()
  const { year, month, day } = body
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || ''

  const result = await checkIn(session.houseId, session.id, year, month, day, ip)
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: '未登录' }, { status: 401 })
  if (session.role !== 'wife') return NextResponse.json({ error: '只有老婆可以撤销打卡' }, { status: 403 })

  const body = await req.json()
  const { checkInId, reason } = body
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || ''

  const result = await revokeCheckIn(checkInId, session.id, reason || '', ip)
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ success: true })
}
