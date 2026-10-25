const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

/** Formats whole rupees with Indian digit grouping, e.g. 750000 → "₹7,50,000". */
export function formatInr(rupees: number): string {
  return inr.format(rupees)
}
