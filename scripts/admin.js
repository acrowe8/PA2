document.addEventListener('DOMContentLoaded', () => {
  // --- Auth guard ---
  const currentAdmin = (function () {
    try { return localStorage.getItem('currentAdminEmail') || ''; } catch (e) { return ''; }
  })();
  if (!currentAdmin) {
    window.location.href = './adminSignin.html';
    return;
  }

  const adminWelcomeName = document.getElementById('adminWelcomeName');
  if (adminWelcomeName) adminWelcomeName.textContent = currentAdmin.split('@')[0] || 'Admin';

  const reportsMessageEl = document.getElementById('reportsMessage');
  const report1UpdatedEl = document.getElementById('report1LastUpdated');
  const report2UpdatedEl = document.getElementById('report2LastUpdated');

  const signOutBtn = document.getElementById('adminSignOutBtn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', () => {
      try { localStorage.removeItem('currentAdminEmail'); } catch (e) {}
      window.location.href = './adminSignin.html';
    });
  }

  // --- Data access: financial transactions ---
  // We will read from a canonical key 'financialTransactions' which aggregates student authorizations.
  // Each transaction: { id, studentEmail, instrument, amount, currency, at }
  function loadTransactions() {
    try { return JSON.parse(localStorage.getItem('financialTransactions') || '[]'); } catch (e) { return []; }
  }

  function formatUsd(value) {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  }

  function percent(n, d) {
    if (!d) return '0%';
    return (Math.round((n / d) * 1000) / 10) + '%';
  }

  function byInstrumentReport(transactions) {
    const byInstrument = new Map();
    let total = 0;
    for (const t of transactions) {
      const key = (t.instrument || 'Unknown').trim();
      const amt = Number(t.amount) || 0;
      total += amt;
      byInstrument.set(key, (byInstrument.get(key) || 0) + amt);
    }
    const rows = Array.from(byInstrument.entries())
      .map(([instrument, amount]) => ({ instrument, amount, pct: total ? amount / total : 0 }))
      .sort((a, b) => b.amount - a.amount);

    // Determine smallest set reaching >=50% revenue
    let running = 0;
    const highlight = [];
    for (const r of rows) {
      if (total > 0 && running / total >= 0.5) break;
      highlight.push(r.instrument);
      running += r.amount;
    }
    return { total, rows, highlight };
  }

  function byStudentReport(transactions) {
    const byStudent = new Map();
    let total = 0;
    for (const t of transactions) {
      const key = (t.studentEmail || 'Unknown').trim();
      const amt = Number(t.amount) || 0;
      total += amt;
      byStudent.set(key, (byStudent.get(key) || 0) + amt);
    }
    const rows = Array.from(byStudent.entries())
      .map(([studentEmail, amount]) => ({ studentEmail, amount, pct: total ? amount / total : 0 }))
      .sort((a, b) => b.amount - a.amount);

    // Determine smallest set reaching >=50% revenue
    let running = 0;
    const highlight = [];
    for (const r of rows) {
      if (total > 0 && running / total >= 0.5) break;
      highlight.push(r.studentEmail);
      running += r.amount;
    }
    return { total, rows, highlight };
  }

  function renderInstrumentReport() {
    const container = document.getElementById('reportInstrumentSummary');
    const highlightsEl = document.getElementById('reportInstrumentHighlights');
    if (!container || !highlightsEl) return;

    const tx = loadTransactions();
    const { total, rows, highlight } = byInstrumentReport(tx);

    container.innerHTML = '';
    const list = document.createElement('div');
    list.className = 'stack';

    rows.forEach((r) => {
      const line = document.createElement('div');
      line.className = 'inline';
      const label = document.createElement('div');
      label.textContent = r.instrument;
      const barShell = document.createElement('div');
      barShell.style.flex = '1';
      barShell.style.background = 'color-mix(in oklab, var(--color-surface), #fff 3%)';
      barShell.style.border = '1px solid var(--color-border)';
      barShell.style.borderRadius = '10px';
      barShell.style.overflow = 'hidden';
      const bar = document.createElement('div');
      bar.style.height = '10px';
      bar.style.width = (r.pct * 100).toFixed(1) + '%';
      bar.style.background = 'linear-gradient(90deg, var(--color-primary), var(--color-accent))';
      barShell.appendChild(bar);
      const val = document.createElement('div');
      val.className = 'muted';
      val.textContent = `${formatUsd(r.amount)} • ${percent(r.amount, total)}`;
      line.appendChild(label);
      line.appendChild(barShell);
      line.appendChild(val);
      list.appendChild(line);
    });

    container.appendChild(list);

    // Highlights: which instruments make up 50% revenue
    highlightsEl.innerHTML = '';
    const hTitle = document.createElement('div');
    hTitle.className = 'muted';
    hTitle.textContent = 'Instruments making up 50% of revenue:';
    const hList = document.createElement('div');
    hList.className = 'inline';
    highlight.forEach((name) => {
      const tag = document.createElement('span');
      tag.textContent = name;
      tag.style.padding = '0.2rem 0.5rem';
      tag.style.border = '1px solid var(--color-border)';
      tag.style.borderRadius = '999px';
      tag.style.background = 'color-mix(in oklab, var(--color-surface), #fff 3%)';
      hList.appendChild(tag);
    });
    highlightsEl.appendChild(hTitle);
    highlightsEl.appendChild(hList);

    if (report1UpdatedEl) report1UpdatedEl.textContent = `Updated ${new Date().toLocaleString()}`;
  }

  function renderStudentReport() {
    const container = document.getElementById('reportStudentSummary');
    const highlightsEl = document.getElementById('reportStudentHighlights');
    if (!container || !highlightsEl) return;

    const tx = loadTransactions();
    const { total, rows, highlight } = byStudentReport(tx);

    container.innerHTML = '';
    const list = document.createElement('div');
    list.className = 'stack';

    rows.forEach((r) => {
      const line = document.createElement('div');
      line.className = 'inline';
      const label = document.createElement('div');
      label.textContent = r.studentEmail;
      const barShell = document.createElement('div');
      barShell.style.flex = '1';
      barShell.style.background = 'color-mix(in oklab, var(--color-surface), #fff 3%)';
      barShell.style.border = '1px solid var(--color-border)';
      barShell.style.borderRadius = '10px';
      barShell.style.overflow = 'hidden';
      const bar = document.createElement('div');
      bar.style.height = '10px';
      bar.style.width = (r.pct * 100).toFixed(1) + '%';
      bar.style.background = 'linear-gradient(90deg, var(--color-primary), var(--color-accent))';
      barShell.appendChild(bar);
      const val = document.createElement('div');
      val.className = 'muted';
      val.textContent = `${formatUsd(r.amount)} • ${percent(r.amount, total)}`;
      line.appendChild(label);
      line.appendChild(barShell);
      line.appendChild(val);
      list.appendChild(line);
    });

    container.appendChild(list);

    // Highlights: smallest set of students contributing 50%
    highlightsEl.innerHTML = '';
    const hTitle = document.createElement('div');
    hTitle.className = 'muted';
    hTitle.textContent = 'Smallest set of students contributing 50% of revenue:';
    const hList = document.createElement('div');
    hList.className = 'inline';
    highlight.forEach((email) => {
      const tag = document.createElement('span');
      tag.textContent = email;
      tag.style.padding = '0.2rem 0.5rem';
      tag.style.border = '1px solid var(--color-border)';
      tag.style.borderRadius = '999px';
      tag.style.background = 'color-mix(in oklab, var(--color-surface), #fff 3%)';
      hList.appendChild(tag);
    });
    highlightsEl.appendChild(hTitle);
    highlightsEl.appendChild(hList);

    if (report2UpdatedEl) report2UpdatedEl.textContent = `Updated ${new Date().toLocaleString()}`;
  }

  function refreshReports() {
    if (reportsMessageEl) reportsMessageEl.textContent = 'Refreshing…';
    renderInstrumentReport();
    renderStudentReport();
    if (reportsMessageEl) setTimeout(() => { reportsMessageEl.textContent = 'Up to date.'; }, 300);
  }

  const refreshBtn = document.getElementById('refreshReportsBtn');
  if (refreshBtn) refreshBtn.addEventListener('click', refreshReports);

  // Real-time-ish updates: listen to storage events
  window.addEventListener('storage', (e) => {
    if (e && e.key === 'financialTransactions') {
      refreshReports();
    }
  });

  // initial load
  refreshReports();
});
