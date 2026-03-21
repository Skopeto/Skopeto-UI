import type { CheckResult } from '@/types/api'

/**
 * Determine the overall status from check results
 * Priority: error > offline > unhealthy > healthy
 */
export function getOverallStatus(checkResults: CheckResult[] | undefined): 'healthy' | 'unhealthy' | 'offline' | 'error' {
  if (!checkResults || checkResults.length === 0) {
    return 'offline'
  }

  const hasError = checkResults.some(check => check.status === 'error')
  if (hasError) return 'error'

  const hasOffline = checkResults.some(check => check.status === 'offline')
  if (hasOffline) return 'offline'

  const hasUnhealthy = checkResults.some(check => check.status === 'unhealthy')
  if (hasUnhealthy) return 'unhealthy'

  return 'healthy'
}

/**
 * Get the most recent checked_at timestamp from check results
 */
export function getLatestCheckedAt(checkResults: CheckResult[] | undefined): string | undefined {
  if (!checkResults || checkResults.length === 0) {
    return undefined
  }

  return checkResults.reduce((latest, check) => {
    if (!latest) return check.checked_at
    return new Date(check.checked_at) > new Date(latest) ? check.checked_at : latest
  }, checkResults[0]?.checked_at)
}

/**
 * Format uptime from check results (uptime is stored as seconds in the new format)
 */
export function getUptimeString(checkResults: CheckResult[] | undefined): string {
  // Find any check that has uptime data (they should all have the same uptime)
  const checkWithUptime = checkResults?.find(check => check.uptime !== undefined && check.uptime > 0)

  if (!checkWithUptime || !checkWithUptime.uptime) {
    return 'N/A'
  }

  const totalSeconds = checkWithUptime.uptime
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)

  const parts: string[] = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0 && days === 0) parts.push(`${minutes}m`)

  return parts.length > 0 ? parts.join(' ') : '< 1m'
}

/**
 * Format a check value with its unit
 */
export function formatCheckValue(value: number, unit: string): string {
  const formattedValue = Number(value).toFixed(1)
  return unit ? `${formattedValue}${unit}` : formattedValue
}

/**
 * Determine if a check value represents a percentage (for progress bar display)
 */
export function isPercentageCheck(unit: string): boolean {
  return unit === '%'
}

/**
 * Get color class based on percentage value (for progress bars)
 */
export function getUsageColorClass(value: number): string {
  if (value >= 80) return 'bg-red-500'
  if (value >= 60) return 'bg-yellow-500'
  return 'bg-green-500'
}
