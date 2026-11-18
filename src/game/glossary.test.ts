import { describe, expect, it } from 'vitest'
import { splitTerms } from './glossary'

const ids = (t: string) => splitTerms(t).flatMap((p) => ('id' in p ? [p.id] : []))

describe('glossary matching', () => {
  it('prefers the longer term (Cat XL over XL)', () => {
    expect(ids('ซื้อ Cat XL')).toEqual(['catXL'])
    expect(ids('เพิ่ม retention ของ XL')).toEqual(['retention', 'xl'])
  })
  it('marks each term once and keeps the text intact', () => {
    const t = 'Loss Ratio สูง แต่ Loss Ratio ดีกว่าคู่แข่ง'
    expect(ids(t)).toEqual(['lossRatio'])
    expect(splitTerms(t).map((p) => p.text).join('')).toBe(t)
  })
  it('does not match inside other words', () => {
    expect(ids('PageShell Paid Loss')).toEqual(['paidLoss'])
    expect(ids('กระจายไปทรัพย์สินและ PA')).toEqual(['pa'])
  })
  it('matches Thai terms', () => {
    expect(ids('2+ และ 3+ ราคาประหยัด')).toEqual(['motorClass'])
    expect(ids('ปลอดภัยขึ้น แต่เสียเบี้ยประกันภัยต่อ')).toEqual(['reinsurance'])
  })
})
