'use client'

import { useState, useEffect } from 'react'

interface Holiday { date: string; name: string; type: 'holiday' | 'workday' }

interface CalendarProps {
  year: number
  month: number
  checkedDays: number[]
  holidays: Record<string, Holiday>
  onCheckIn: (day: number) => void
  isWife: boolean
  onRevokeCheckIn?: (day: number, checkInId: string) => void
  checkInMap?: Record<number, string>
}

const MONTH_NAMES = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
const DAY_NAMES = ['日', '一', '二', '三', '四', '五', '六']

export default function Calendar({
  year, month, checkedDays, holidays, onCheckIn, isWife, onRevokeCheckIn, checkInMap = {}
}: CalendarProps) {
  const today = new Date()
  const todayYear = today.getFullYear()
  const todayMonth = today.getMonth() + 1
  const todayDay = today.getDate()

  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  function isToday(day: number) {
    return year === todayYear && month === todayMonth && day === todayDay
  }

  function isPast(day: number) {
    if (year < todayYear) return true
    if (year === todayYear && month < todayMonth) return true
    if (year === todayYear && month === todayMonth && day < todayDay) return true
    return false
  }

  function getHolidayKey(day: number) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  function getHoliday(day: number) {
    return holidays[getHolidayKey(day)]
  }

  function handleDayClick(day: number) {
    if (checkedDays.includes(day)) {
      // 已打卡 → 老婆可以撤销，老公不可撤销
      if (isWife && onRevokeCheckIn && checkInMap[day]) {
        onRevokeCheckIn(day, checkInMap[day])
      }
      return
    }
    // 未打卡
    onCheckIn(day)
  }

  function getCellClass(day: number) {
    const holiday = getHoliday(day)
    const checked = checkedDays.includes(day)
    const past = isPast(day)
    const todayCell = isToday(day)

    let base = 'day-cell relative flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all '
    if (checked) {
      base += 'bg-accent-green/10 border-2 border-accent-green '
    } else if (holiday?.type === 'holiday') {
      base += 'bg-holiday-bg/50 border border-holiday-bg '
    } else if (past && !todayCell) {
      base += 'bg-red-50/50 border border-red-100 '
    } else {
      base += 'bg-bg-card border border-border hover:border-accent-green '
    }
    if (todayCell) base += 'ring-2 ring-accent-blue ring-offset-1 '
    if (!checked && !isToday(day) && !isPast(day)) base += 'opacity-40 cursor-default '
    return base
  }

  return (
    <div className="bg-bg-card rounded-card border border-border p-4">
      {/* 星期标题 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-xs text-text-secondary py-1 font-medium">{d}</div>
        ))}
      </div>

      {/* 日期格子 */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} />
          const holiday = getHoliday(day)
          const checked = checkedDays.includes(day)
          const todayCell = isToday(day)

          return (
            <div
              key={day}
              className={getCellClass(day)}
              onClick={() => handleDayClick(day)}
            >
              <span className={`text-sm font-mono font-medium ${checked ? 'text-accent-green' : todayCell ? 'text-accent-blue font-bold' : 'text-text-primary'}`}>
                {day}
              </span>

              {/* 打卡打钩 */}
              {checked && (
                <div className="check-pop absolute inset-0 flex items-center justify-center">
                  <span className="text-accent-green text-lg font-bold">✓</span>
                </div>
              )}

              {/* 节假日标签 */}
              {holiday && !checked && (
                <span className={`absolute top-0.5 right-0.5 text-[9px] px-0.5 rounded font-medium ${holiday.type === 'holiday' ? 'bg-holiday-bg text-holiday-text' : 'bg-red-100 text-red-600'}`}>
                  {holiday.type === 'holiday' ? '休' : '班'}
                </span>
              )}

              {/* 今天标识 */}
              {todayCell && !checked && (
                <span className="absolute bottom-0.5 text-[8px] text-accent-blue font-medium">今</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
