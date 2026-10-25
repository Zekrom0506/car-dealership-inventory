import { describe, expect, it } from 'vitest'
import { formatInr } from './formatInr'

describe('formatInr', () => {
  it.each([
    [9_999, '₹9,999'], // small price: only a thousands comma
    [1_00_000, '₹1,00,000'], // one lakh
    [7_50_000, '₹7,50,000'],
    [1_20_00_000, '₹1,20,00,000'], // one crore twenty lakh
    [2_147_483_647, '₹2,14,74,83,647'], // largest price the API allows
  ])('formats %i as %s (Indian digit grouping, no paise)', (rupees, expected) => {
    expect(formatInr(rupees)).toBe(expected)
  })
})
