import { NextRequest, NextResponse } from 'next/server'
import { createHouse, joinHouse, login } from '@/lib/db'
import { createSession, setSessionCookie, clearSessionCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body

    if (action === 'register') {
      const { houseName, wifeName, wifePassword } = body
      if (!houseName || !wifeName || !wifePassword) {
        return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
      }
      const { house, wife } = await createHouse(houseName, wifeName, wifePassword)
      const token = await createSession({
        id: wife.id, name: wife.name, role: wife.role,
        houseId: house.id, houseName: house.name,
      })
      const headers = setSessionCookie(token)
      return NextResponse.json({ success: true, member: wife, house }, { headers })
    }

    if (action === 'join') {
      const { houseId, name, password } = body
      const result = await joinHouse(houseId, name, password)
      if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 })
      const token = await createSession({
        id: result.member.id, name: result.member.name, role: result.member.role,
        houseId: result.member.houseId, houseName: '',
      })
      const headers = setSessionCookie(token)
      return NextResponse.json({ success: true, member: result.member }, { headers })
    }

    if (action === 'login') {
      const { name, password } = body
      const result = await login(name, password)
      if ('error' in result) return NextResponse.json({ error: result.error }, { status: 401 })
      const token = await createSession({
        id: result.member.id, name: result.member.name, role: result.member.role,
        houseId: result.member.houseId, houseName: result.house.name,
      })
      const headers = setSessionCookie(token)
      return NextResponse.json({ success: true, member: result.member, house: result.house }, { headers })
    }

    if (action === 'logout') {
      const headers = clearSessionCookie()
      return NextResponse.json({ success: true }, { headers })
    }

    return NextResponse.json({ error: '未知操作' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
