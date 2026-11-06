// PAYOUTS_DISABLED (2026-11-06): emergency lock.
// The previous handler trusted game data from a publicly writable Firebase database,
// so anyone could fake a finished game and get paid from the escrow wallet.
// The original code is in git history (commit 737b02b). Do not restore it as-is.
export default function handler(req, res) {
  return res.status(503).json({ error: "Payouts are temporarily disabled" });
}
