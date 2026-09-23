// A purely client-side mock of a payout wallet. Nothing here talks to a
// real bank or payment processor — it exists so the "withdraw" flow on the
// Earnings page has somewhere to persist that a withdrawal happened, so the
// available balance actually drops to ₦0 afterwards instead of just being a
// button that does nothing.

function cutoffKey(riderId) { return `swifty_withdrawal_cutoff_${riderId}` }
function historyKey(riderId) { return `swifty_withdrawal_history_${riderId}` }

export function getWithdrawalCutoff(riderId) {
  if (!riderId) return 0
  try { return Number(localStorage.getItem(cutoffKey(riderId))) || 0 } catch { return 0 }
}

export function getWithdrawalHistory(riderId) {
  if (!riderId) return []
  try { return JSON.parse(localStorage.getItem(historyKey(riderId)) || '[]') } catch { return [] }
}

/** Records a mock withdrawal and moves the cutoff forward so the available
 * balance (sum of completed trips after the cutoff) resets to 0 until the
 * next completed trip. Returns the new history array. */
export function recordWithdrawal(riderId, { amount, bankName, accountNumber }) {
  if (!riderId) return []
  const now = Date.now()
  const entry = {
    id: `WD-${now.toString(36).toUpperCase()}`,
    amount,
    bankName,
    accountLast4: String(accountNumber || '').slice(-4),
    createdAt: now,
  }
  const history = [entry, ...getWithdrawalHistory(riderId)].slice(0, 20)
  try {
    localStorage.setItem(historyKey(riderId), JSON.stringify(history))
    localStorage.setItem(cutoffKey(riderId), String(now))
  } catch {}
  return history
}
