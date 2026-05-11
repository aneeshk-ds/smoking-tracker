// Opens a browser print window with a formatted monthly report.
// The user can Save as PDF from the print dialog — no extra library needed.

import { formatCurrency } from './format'

export function openPrintReport({ month, stats, settings, triggers, locations, trend }) {
  const currency = settings?.currency ?? 'INR'
  const totalSmoked = stats.totalSmoked ?? 0
  const totalSpent = stats.totalSpent ?? 0
  const avgPerDay = stats.avgPerDay ?? 0
  const moneySaved = stats.moneySaved ?? 0
  const goal = settings?.goal ?? 'awareness'
  const dailyTarget = settings?.dailyTarget ?? null

  const triggerRows = triggers?.length
    ? triggers.map((t) => `<tr><td>${t.label}</td><td>${t.count}</td></tr>`).join('')
    : '<tr><td colspan="2" style="color:#666">None logged</td></tr>'

  const locationRows = locations?.length
    ? locations.map((l) => `<tr><td>${l.label}</td><td>${l.count}</td></tr>`).join('')
    : '<tr><td colspan="2" style="color:#666">None logged</td></tr>'

  const trendRows = trend?.length
    ? trend.map((d) => `<tr><td>${d.date}</td><td>${d.count}</td><td>${formatCurrency(d.spent, currency)}</td></tr>`).join('')
    : '<tr><td colspan="3" style="color:#666">No data</td></tr>'

  const projection1 = formatCurrency((stats.dailyCost ?? 0) * 365, currency)
  const projection5 = formatCurrency((stats.dailyCost ?? 0) * 365 * 5, currency)
  const projection10 = formatCurrency((stats.dailyCost ?? 0) * 365 * 10, currency)

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Smoking Tracker — ${month}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      line-height: 1.6;
      color: #111;
      background: #fff;
      padding: 48px;
      max-width: 700px;
      margin: 0 auto;
    }

    h1 { font-size: 22px; font-weight: 500; margin-bottom: 4px; letter-spacing: -0.5px; }
    h2 { font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 2px;
         color: #555; margin: 32px 0 12px; border-bottom: 1px solid #e0e0e0; padding-bottom: 6px; }

    .subtitle { color: #666; font-size: 11px; margin-bottom: 32px; }
    .accent { color: #00a870; }

    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 8px; }
    .stat-box { border: 1px solid #e8e8e8; border-radius: 8px; padding: 12px; }
    .stat-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; color: #888; margin-bottom: 4px; }
    .stat-value { font-size: 20px; font-weight: 400; }
    .stat-value.danger { color: #cc2244; }
    .stat-value.positive { color: #00a870; }

    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { text-align: left; padding: 6px 8px; background: #f5f5f5; border-bottom: 1px solid #e0e0e0; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
    td { padding: 5px 8px; border-bottom: 1px solid #f0f0f0; }

    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }

    .projection-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .proj-box { border: 1px solid #ffd0d8; border-radius: 8px; padding: 12px; text-align: center; background: #fff8f9; }
    .proj-yr { font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px; color: #888; margin-bottom: 4px; }
    .proj-val { font-size: 16px; color: #cc2244; }

    footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e0e0e0;
             font-size: 9px; color: #aaa; text-align: center; }

    @media print {
      body { padding: 32px; }
      @page { margin: 1cm; }
    }
  </style>
</head>
<body>
  <h1>Smoking Tracker</h1>
  <p class="subtitle">${month} · Goal: <strong>${goal}</strong>${dailyTarget ? ` · Target: ${dailyTarget}/day` : ''}</p>

  <h2>Summary</h2>
  <div class="summary-grid">
    <div class="stat-box">
      <div class="stat-label">Total</div>
      <div class="stat-value">${totalSmoked}</div>
      <div style="font-size:10px;color:#888">cigarettes</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Avg / day</div>
      <div class="stat-value">${avgPerDay}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Spent</div>
      <div class="stat-value danger">${formatCurrency(totalSpent, currency)}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Saved</div>
      <div class="stat-value positive">${formatCurrency(moneySaved, currency)}</div>
    </div>
  </div>

  <h2>Daily Log</h2>
  <table>
    <thead><tr><th>Date</th><th>Count</th><th>Spent</th></tr></thead>
    <tbody>${trendRows}</tbody>
  </table>

  <h2>Patterns</h2>
  <div class="two-col">
    <div>
      <table>
        <thead><tr><th>Trigger</th><th>Count</th></tr></thead>
        <tbody>${triggerRows}</tbody>
      </table>
    </div>
    <div>
      <table>
        <thead><tr><th>Location</th><th>Count</th></tr></thead>
        <tbody>${locationRows}</tbody>
      </table>
    </div>
  </div>

  <h2>Cost Projection (at current rate)</h2>
  <div class="projection-grid">
    <div class="proj-box"><div class="proj-yr">1 year</div><div class="proj-val">${projection1}</div></div>
    <div class="proj-box"><div class="proj-yr">5 years</div><div class="proj-val">${projection5}</div></div>
    <div class="proj-box"><div class="proj-yr">10 years</div><div class="proj-val">${projection10}</div></div>
  </div>

  <footer>Generated by Smoking Tracker · ${new Date().toLocaleDateString()} · All data stays on your device.</footer>

  <script>window.onload = () => window.print()</script>
</body>
</html>`

  const w = window.open('', '_blank')
  if (w) {
    w.document.write(html)
    w.document.close()
  }
}
