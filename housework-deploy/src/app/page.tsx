'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Mode = 'login' | 'register' | 'join'
type Role = 'wife' | 'husband' | ''

export default function Home() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [role, setRole] = useState<Role>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)

  // 登录
  const [loginName, setLoginName] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // 创建家（老婆）
  const [houseName, setHouseName] = useState('')
  const [wifeName, setWifeName] = useState('')
  const [wifePassword, setWifePassword] = useState('')

  // 加入家（老公）
  const [houseId, setHouseId] = useState('')
  const [husbandName, setHusbandName] = useState('')
  const [husbandPassword, setHusbandPassword] = useState('')
  const [registeredHouseId, setRegisteredHouseId] = useState('')

  function triggerShake() {
    setShake(true)
    setTimeout(() => setShake(false), 400)
  }

  async function handleLogin() {
    if (!loginName || !loginPassword) { setError('请填写昵称和密码'); triggerShake(); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', name: loginName, password: loginPassword })
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || '登录失败'); triggerShake(); return }
    router.push('/dashboard')
  }

  async function handleCreateHouse() {
    if (!houseName || !wifeName || !wifePassword) { setError('请填写完整'); triggerShake(); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register', houseName, wifeName, wifePassword })
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || '创建失败'); triggerShake(); return }
    // 保存 houseId 用于分享
    if (data.house?.id) setRegisteredHouseId(data.house.id)
    router.push('/dashboard')
  }

  async function handleJoinHouse() {
    if (!houseId || !husbandName || !husbandPassword) { setError('请填写完整'); triggerShake(); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'join', houseId, name: husbandName, password: husbandPassword })
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || '加入失败'); triggerShake(); return }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-bg-primary">
      <div className={`w-full max-w-md bg-bg-card rounded-card border border-border p-8 ${shake ? 'shake' : ''}`}>

        {/* 标题 */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏠</div>
          <h1 className="text-xl font-semibold text-text-primary">家庭家务管理系统</h1>
          <p className="text-text-secondary text-sm mt-1">V2.0 · 由老婆大人最终解释</p>
        </div>

        {/* 模式切换 */}
        {mode === 'login' && (
          <>
            {/* 角色选择 */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => { setRole('wife'); setError('') }}
                className={`flex-1 py-3 rounded-btn border-2 transition-all flex flex-col items-center gap-1 ${role === 'wife' ? 'border-accent-blue bg-blue-50 text-accent-blue' : 'border-border text-text-secondary hover:border-accent-blue'}`}
              >
                <span className="text-2xl">👑</span>
                <span className="text-sm font-medium">老婆</span>
              </button>
              <button
                onClick={() => { setRole('husband'); setError('') }}
                className={`flex-1 py-3 rounded-btn border-2 transition-all flex flex-col items-center gap-1 ${role === 'husband' ? 'border-accent-purple bg-purple-50 text-accent-purple' : 'border-border text-text-secondary hover:border-accent-purple'}`}
              >
                <span className="text-2xl">🧑‍💼</span>
                <span className="text-sm font-medium">老公</span>
              </button>
            </div>

            {/* 登录表单 */}
            <div className="space-y-3">
              <input
                type="text"
                placeholder="昵称"
                value={loginName}
                onChange={e => setLoginName(e.target.value)}
                className="w-full px-4 py-3 rounded-btn border border-border bg-bg-primary text-text-primary focus:outline-none focus:border-accent-blue transition-colors"
              />
              <input
                type="password"
                placeholder="密码"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-btn border border-border bg-bg-primary text-text-primary focus:outline-none focus:border-accent-blue transition-colors"
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
              {error && <p className="text-accent-red text-sm text-center">{error}</p>}
              <button
                onClick={handleLogin}
                disabled={loading || !role}
                className="w-full py-3 rounded-btn bg-accent-green text-white font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed btn-ripple"
              >
                {loading ? '登录中...' : '登录'}
              </button>
            </div>

            <div className="mt-4 text-center">
              <button onClick={() => { setMode('register'); setError(''); setRole('wife') }} className="text-sm text-text-secondary hover:text-accent-blue">
                👑 老婆创建新家
              </button>
              <span className="text-text-secondary mx-2">·</span>
              <button onClick={() => { setMode('join'); setError(''); setRole('husband') }} className="text-sm text-text-secondary hover:text-accent-purple">
                🧑‍💼 老公加入已有家
              </button>
            </div>
          </>
        )}

        {/* 创建家（老婆） */}
        {mode === 'register' && (
          <>
            <button onClick={() => setMode('login'); setRegisteredHouseId('')} className="text-sm text-text-secondary hover:text-accent-blue mb-4">← 返回</button>
            {registeredHouseId ? (
              <div className="text-center py-4 space-y-3">
                <div className="text-4xl mb-2">🎉</div>
                <h2 className="text-lg font-semibold text-accent-green">家创建成功！</h2>
                <p className="text-sm text-text-secondary">把以下家ID告诉老公，他就能加入：</p>
                <div className="bg-amber-50 border border-amber-300 rounded-btn px-4 py-3 font-mono text-accent-orange font-bold break-all text-lg">
                  {registeredHouseId}
                </div>
                <button onClick={() => router.push('/dashboard')} className="w-full py-2 rounded-btn bg-accent-green text-white font-medium hover:bg-green-600 btn-ripple">
                  进入管理后台
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold mb-4 text-accent-blue">👑 创建新家（老婆专属）</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="给家起个名字，如：小窝"
                value={houseName}
                onChange={e => setHouseName(e.target.value)}
                className="w-full px-4 py-3 rounded-btn border border-border bg-bg-primary focus:outline-none focus:border-accent-blue"
              />
              <input
                type="text"
                placeholder="你的昵称"
                value={wifeName}
                onChange={e => setWifeName(e.target.value)}
                className="w-full px-4 py-3 rounded-btn border border-border bg-bg-primary focus:outline-none focus:border-accent-blue"
              />
              <input
                type="password"
                placeholder="设置密码（老公凭此登录）"
                value={wifePassword}
                onChange={e => setWifePassword(e.target.value)}
                className="w-full px-4 py-3 rounded-btn border border-border bg-bg-primary focus:outline-none focus:border-accent-blue"
              />
              {error && <p className="text-accent-red text-sm text-center">{error}</p>}
              <button
                onClick={handleCreateHouse}
                disabled={loading}
                className="w-full py-3 rounded-btn bg-accent-blue text-white font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 btn-ripple"
              >
                {loading ? '创建中...' : '创建家庭'}
              </button>
              </div>
              </>
            )}
          </>
        )}

        {/* 加入家（老公） */}
        {mode === 'join' && (
          <>
            <button onClick={() => setMode('login')} className="text-sm text-text-secondary hover:text-accent-blue mb-4">← 返回</button>
            <h2 className="text-lg font-semibold mb-4 text-accent-purple">🧑‍💼 加入已有家庭</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="家ID（问老婆要）"
                value={houseId}
                onChange={e => setHouseId(e.target.value)}
                className="w-full px-4 py-3 rounded-btn border border-border bg-bg-primary focus:outline-none focus:border-accent-purple font-mono text-sm"
              />
              <input
                type="text"
                placeholder="你的昵称"
                value={husbandName}
                onChange={e => setHusbandName(e.target.value)}
                className="w-full px-4 py-3 rounded-btn border border-border bg-bg-primary focus:outline-none focus:border-accent-purple"
              />
              <input
                type="password"
                placeholder="老婆设定的密码"
                value={husbandPassword}
                onChange={e => setHusbandPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-btn border border-border bg-bg-primary focus:outline-none focus:border-accent-purple"
              />
              {error && <p className="text-accent-red text-sm text-center">{error}</p>}
              <button
                onClick={handleJoinHouse}
                disabled={loading}
                className="w-full py-3 rounded-btn bg-accent-purple text-white font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 btn-ripple"
              >
                {loading ? '加入中...' : '加入家庭'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
