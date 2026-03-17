// ============================================================
// ROTOTECH AI SALES DASHBOARD — Main Application Logic
// ============================================================

// ---- GLOBALS ----
let DATA = null;
let API_KEY = '';
let FILE_NAME = 'demo-data';
let ALL_TRANSACTIONS = [];
let ALL_PIPELINE = [];
let TARGETS = {};
let STEP_TIMER = null;
let TARGET_ITEMS = [];     // targets items for chart
let TABS_RENDERED = {};    // track which tabs have had charts rendered

// ---- MOTIVATIONAL QUOTES ----
const SALES_QUOTES = [
  { quote: "Success is not in what you have, but who you are.", author: "Bo Bennett" },
  { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { quote: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { quote: "Quality performance starts with a positive attitude.", author: "Jeffrey Gitomer" },
  { quote: "Every sale has five basic obstacles: no need, no money, no hurry, no desire, no trust.", author: "Zig Ziglar" },
  { quote: "You don't close a sale, you open a relationship.", author: "Patricia Fripp" },
  { quote: "The difference between try and triumph is a little umph.", author: "Marvin Phillips" },
  { quote: "Sales are contingent upon the attitude of the salesman, not the attitude of the prospect.", author: "W. Clement Stone" },
  { quote: "The best salespeople know they're the best. They take pride in their craft.", author: "Jeffrey Gitomer" },
  { quote: "Make a customer, not a sale.", author: "Katherine Barchetti" },
  { quote: "It's not about having the right opportunities. It's about handling the opportunities right.", author: "Mark Hunter" },
  { quote: "Success is walking from failure to failure with no loss of enthusiasm.", author: "Winston Churchill" },
  { quote: "Your attitude, not your aptitude, will determine your altitude.", author: "Zig Ziglar" },
  { quote: "The harder the conflict, the more glorious the triumph.", author: "Thomas Paine" },
  { quote: "Opportunities don't happen. You create them.", author: "Chris Grosser" },
  { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { quote: "act as if what you do makes a difference. It does.", author: "William James" },
  { quote: "Setting goals is the first step in turning the invisible into the visible.", author: "Tony Robbins" },
  { quote: "If you are not taking care of your customer, your competitor will.", author: "Bob Hooey" },
  { quote: "A goal is a dream with a deadline.", author: "Napoleon Hill" },
  { quote: "The best way to predict the future is to create it.", author: "Peter Drucker" },
  { quote: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
  { quote: "We herd sheep, we drive cattle, we lead people.", author: "George S. Patton" },
  { quote: "The most unprofitable item ever manufactured is an excuse.", author: "John Mason" },
  { quote: "No one can make you feel inferior without your consent.", author: "Eleanor Roosevelt" },
  { quote: "Do not wait to strike till the iron is hot, but make it hot by striking.", author: "William Butler Yeats" },
  { quote: "Great things in business are never done by one person.", author: "Steve Jobs" },
  { quote: "The secret to winning is constant, consistent management.", author: "Tom Landry" },
  { quote: "Revenue is vanity, profit is sanity, but cash is king.", author: "Old Business Adage" },
  { quote: "Your most unhappy customers are your greatest source of learning.", author: "Bill Gates" },
  { quote: "Chase the vision, not the money. The money will end up following you.", author: "Tony Hsieh" }
];

function getDailyQuote() {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today - new Date(today.getFullYear(), 0, 0)) / 86400000
  );
  return SALES_QUOTES[dayOfYear % SALES_QUOTES.length];
}

function renderDailyQuote() {
  const q = getDailyQuote();

  // Connect screen
  const ct = document.getElementById('connectQuoteText');
  const ca = document.getElementById('connectQuoteAuthor');
  if (ct) ct.textContent = q.quote;
  if (ca) ca.textContent = '— ' + q.author;

  // Dashboard strip
  const dt = document.getElementById('dashQuoteText');
  const da = document.getElementById('dashQuoteAuthor');
  if (dt) dt.textContent = '"' + q.quote + '"';
  if (da) da.textContent = '— ' + q.author;
}

let LIVE_URL = null;       // sheet URL for auto-refresh
let REFRESH_TIMER = null;  // auto-refresh interval handle
let IS_REFRESHING = false; // prevent overlapping refreshes
const REFRESH_INTERVAL_MS = 30000; // 30 seconds

// ---- THEME FUNCTIONS ----
function toggleTheme() {
  const isDark = document.body.getAttribute('data-theme') === 'dark';
  const next = isDark ? 'light' : 'dark';
  document.body.setAttribute('data-theme', next);
  localStorage.setItem('rototech-theme', next);
  document.getElementById('themeIconLight').style.display = next === 'dark' ? 'none' : 'flex';
  document.getElementById('themeIconDark').style.display = next === 'dark' ? 'flex' : 'none';
  if (DATA) {
    renderDashboard();
    // re-render pivot cross table if pivot tab was active
    const pivotTab = document.getElementById('tabPivot');
    if (pivotTab && pivotTab.classList.contains('active')) {
      renderPivotTab();
    }
  }
}

function initTheme() {
  const saved = localStorage.getItem('rototech-theme') || 'light';
  document.body.setAttribute('data-theme', saved);
  if (saved === 'dark') {
    document.getElementById('themeIconLight').style.display = 'none';
    document.getElementById('themeIconDark').style.display = 'flex';
  }
}

// ── LIVE CLOCK ──
let clockInterval = null;

function startLiveClock() {
  // Clear any existing interval first to prevent duplicates
  if (clockInterval) {
    clearInterval(clockInterval);
    clockInterval = null;
  }

  function updateClock() {
    const now = new Date();

    // Clock time
    const timeEl = document.getElementById('liveClockTime');
    if (timeEl) {
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      timeEl.textContent = `${h}:${m}:${s}`;
    }

    // Clock date
    const dateEl = document.getElementById('liveClockDate');
    if (dateEl) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      dateEl.textContent = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    }

    // Mini calendar day
    const calDay = document.getElementById('miniCalDay');
    if (calDay) calDay.textContent = now.getDate();

    // Mini calendar month
    const calMonth = document.getElementById('miniCalMonth');
    if (calMonth) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      calMonth.textContent = `${months[now.getMonth()]} ${now.getFullYear()}`;
    }

    // Mini calendar weekday
    const calWeek = document.getElementById('miniCalWeekday');
    if (calWeek) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      calWeek.textContent = days[now.getDay()];
    }
  }

  // Run immediately then every second
  updateClock();
  clockInterval = setInterval(updateClock, 1000);
}

// ── WATER TRACKER ──
function initWaterTracker() {
  const todayKey = 'rototech-water-' + new Date().toDateString();
  const saved = parseInt(localStorage.getItem(todayKey) || '0');
  renderWaterGlasses(saved);
}

function renderWaterGlasses(count) {
  const todayKey = 'rototech-water-' + new Date().toDateString();
  localStorage.setItem(todayKey, count.toString());

  const glassesEl = document.getElementById('waterGlasses');
  const countEl = document.getElementById('waterCount');
  if (!glassesEl) return;

  glassesEl.innerHTML = '';
  for (let i = 0; i < 8; i++) {
    const glass = document.createElement('div');
    glass.className = 'water-glass' + (i < count ? ' filled' : '');
    glass.title = `${i + 1} glass${i > 0 ? 'es' : ''}`;
    glass.addEventListener('click', function () {
      const current = parseInt(localStorage.getItem(todayKey) || '0');
      const next = (current === i + 1) ? i : i + 1;
      renderWaterGlasses(next);
    });
    glassesEl.appendChild(glass);
  }

  if (countEl) countEl.textContent = `${count} / 8 glasses`;
}

function addWater(n) {
  const todayKey = 'rototech-water-' + new Date().toDateString();
  const current = parseInt(localStorage.getItem(todayKey) || '0');
  const next = current === n ? n - 1 : n;
  renderWaterGlasses(Math.max(0, Math.min(8, next)));
}

// ── MINI TASK COUNT ──
function updateMiniTaskCount() {
  const countEl = document.getElementById('miniTaskCount');
  if (!countEl) return;

  try {
    const today = new Date().toISOString().split('T')[0];
    let total = 0;

    // Scan all localStorage keys for today's tasks
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('rototech-tasks-')) {
        try {
          const tasks = JSON.parse(localStorage.getItem(key) || '[]');
          if (Array.isArray(tasks)) {
            total += tasks.filter(t => !t.done).length;
          }
        } catch (e) { }
      }
    }

    countEl.textContent = total;
    countEl.style.color = total > 0 ? '#EF4444' : 'var(--near-black)';
  } catch (e) {
    countEl.textContent = '0';
  }
}

// ---- CURRENCY FORMAT ----
function fmtM(n) {
  if (!n || isNaN(n)) return '₹0';
  const a = Math.abs(n);
  if (a >= 10000000) return '₹' + (n / 10000000).toFixed(2) + ' Cr';
  if (a >= 100000) return '₹' + (n / 100000).toFixed(1) + ' L';
  if (a >= 1000) return '₹' + (n / 1000).toFixed(1) + 'K';
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

// ---- SCREEN SWITCHER ----
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => { s.style.display = 'none'; s.classList.remove('active'); });
  const el = document.getElementById(id);
  el.style.display = '';
  el.classList.add('active');
}

// ---- API KEY ----
function onApiKeyChange(val) {
  API_KEY = val.trim();
  const dots = document.querySelectorAll('.api-dot');
  dots.forEach(d => { d.classList.toggle('active', API_KEY.startsWith('sk-')); });
}
function updateApiStatus() {
  const dot = document.getElementById('apiStatusDot');
  if (dot) {
    dot.style.background = API_KEY.startsWith('sk-') ? '#1D9E75' : 'var(--light-gray)';
  }
}
function openApiModal() {
  document.getElementById('apiModal').classList.add('open');
  document.getElementById('modalApiKey').value = API_KEY || '';
}
function closeApiModal(e) {
  if (!e || e.target === document.getElementById('apiModal')) {
    document.getElementById('apiModal').classList.remove('open');
  }
}
function saveApiKey() {
  const val = document.getElementById('modalApiKey').value.trim();
  API_KEY = val;
  localStorage.setItem('rototech-api-key', val);
  document.getElementById('apiKeyInput').value = val;
  onApiKeyChange(val);
  document.getElementById('apiModal').classList.remove('open');
}

// ---- SESSION PERSISTENCE (Auto-restore) ----
function tryAutoRestore() {
  const cachedData = localStorage.getItem('rototech-data-cache');
  const cachedTimestamp = localStorage.getItem('rototech-data-timestamp');
  const cachedFileName = localStorage.getItem('rototech-file-name');
  const cachedUrl = localStorage.getItem('rototech-sheet-url');
  const savedTheme = localStorage.getItem('rototech-theme') || 'light';
  const savedApiKey = localStorage.getItem('rototech-api-key');

  // Restore API key
  if (savedApiKey) {
    API_KEY = savedApiKey;
    updateApiStatus();
  }

  // Check if cache exists and is less than 24 hours old
  const cacheAge = cachedTimestamp
    ? Math.floor((Date.now() - parseInt(cachedTimestamp)) / 60000)
    : 999;

  if (cachedData && cacheAge < 1440) { // 1440 minutes = 24 hours
    try {
      DATA = JSON.parse(cachedData);
      FILE_NAME = cachedFileName || 'restored session';

      // Show restore banner then load dashboard
      showRestoreBanner(cachedUrl, cacheAge);
      return true; // restored successfully
    } catch (e) {
      console.warn('Auto-restore failed, clearing cache', e);
      clearSessionCache();
    }
  }
  return false; // no restore, show connect screen
}

function showRestoreBanner(sheetUrl, ageMinutes) {
  const ageText = ageMinutes < 60
    ? `${ageMinutes} min ago`
    : `${Math.floor(ageMinutes / 60)} hr ago`;

  const banner = document.createElement('div');
  banner.id = 'restoreBanner';
  banner.style.cssText = `
    position: fixed; inset: 0;
    background: #0B0E1A;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    z-index: 9999; gap: 1rem;
  `;
  banner.innerHTML = `
    <div style="width:52px;height:52px;border:3px solid #1C1C1C;border-top-color:#3B82F6;border-radius:50%;animation:spin .75s linear infinite;"></div>
    <div style="font-size:18px;font-weight:700;color:#F1F5F9;">Welcome back, Jignesh Patel 👋</div>
    <div style="font-size:13px;color:#475569;">Restoring your last session — updated ${ageText}</div>
    ${sheetUrl ? `<div style="font-size:11px;color:#334155;font-family:monospace;background:#111827;padding:4px 12px;border-radius:20px;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${sheetUrl.substring(0, 60)}...</div>` : ''}
  `;
  document.body.appendChild(banner);

  setTimeout(() => {
    banner.style.transition = 'opacity 0.4s ease';
    banner.style.opacity = '0';
    setTimeout(() => {
      banner.remove();
      renderDashboard();
    }, 400);
  }, 1800);
}

function clearSessionCache() {
  localStorage.removeItem('rototech-sheet-url');
  localStorage.removeItem('rototech-file-name');
  localStorage.removeItem('rototech-data-cache');
  localStorage.removeItem('rototech-data-timestamp');
  DATA = null;
  FILE_NAME = '';
}

// ---- CONNECT → DASHBOARD ----
function goToConnect() {
  clearSessionCache();
  clearTimeout(STEP_TIMER);
  clearInterval(REFRESH_TIMER);
  LIVE_URL = null;
  showScreen('uploadScreen');
  DATA = null; CHAT_HISTORY = []; TABS_RENDERED = {};
  const fab = document.getElementById('refreshFab');
  if (fab) fab.style.display = 'none';
}

// ---- NEW SHEET BUTTON ----
function goUpload() {
  // Clear current session data
  DATA = null;
  FILE_NAME = '';

  // Clear saved cache so auto-restore doesn't trigger
  localStorage.removeItem('rototech-data-cache');
  localStorage.removeItem('rototech-data-timestamp');
  localStorage.removeItem('rototech-sheet-url');
  localStorage.removeItem('rototech-file-name');

  // Stop any active refresh timer
  clearInterval(REFRESH_TIMER);
  LIVE_URL = null;

  // Show the connect/paste screen
  showScreen('uploadScreen');

  // Reset the URL input field
  const urlInput = document.getElementById('sheetUrl');
  if (urlInput) urlInput.value = '';

  // Clear any error messages
  const errEl = document.getElementById('connectError');
  if (errEl) errEl.style.display = 'none';

  // Reset Load Sheet button
  const btn = document.getElementById('loadSheetBtn');
  if (btn) {
    btn.disabled = false;
    btn.textContent = 'Load Sheet';
  }
}

// ---- LOADING STEPS ----
function startLoadingSteps(onDone) {
  showScreen('loadingScreen');
  const steps = ['step1', 'step2', 'step3', 'step4'];
  steps.forEach(id => { const el = document.getElementById(id); el.className = 'step'; });
  let idx = 0;
  function next() {
    if (idx > 0) document.getElementById(steps[idx - 1]).classList.add('done');
    if (idx < steps.length) {
      document.getElementById(steps[idx]).classList.add('active');
      idx++;
      STEP_TIMER = setTimeout(next, 900);
    } else {
      setTimeout(onDone, 400);
    }
  }
  next();
}

// ---- GOOGLE SHEETS URL HANDLER ----
function handleLoadSheet() {
  const raw = document.getElementById('sheetUrl').value.trim();
  if (!raw) { showConnectError('Please paste a Google Sheets URL.'); return; }
  hideConnectError();
  const btn = document.getElementById('loadSheetBtn');
  btn.textContent = 'Loading…'; btn.disabled = true;

  startLoadingSteps(async () => {
    try {
      const encoded = encodeURIComponent(raw);
      const res = await fetch(`/api/fetch-sheet?url=${encoded}`);
      const text = await res.text();
      if (!res.ok) {
        let errMsg = 'Failed to fetch sheet.';
        try { errMsg = JSON.parse(text).error || errMsg; } catch { }
        throw new Error(errMsg);
      }
      FILE_NAME = extractSheetName(raw);
      const rows = parseCsv(text);
      if (!rows.length) throw new Error('The sheet appears to be empty or unreadable.');
      DATA = await buildDataObject(rows);
      LIVE_URL = raw; // save for manual refresh
      renderDashboard();
      // Save session for auto-restore
      localStorage.setItem('rototech-sheet-url', raw);
      localStorage.setItem('rototech-file-name', FILE_NAME);
      localStorage.setItem('rototech-data-cache', JSON.stringify(DATA));
      localStorage.setItem('rototech-data-timestamp', Date.now().toString());
      // auto-refresh removed — user clicks the ↻ button to refresh
    } catch (err) {
      showScreen('connectScreen');
      showConnectError(err.message || 'Unknown error fetching sheet.');
    } finally {
      btn.textContent = 'Load Sheet'; btn.disabled = false;
    }
  });
}

// ---- MANUAL REFRESH ----
async function manualRefresh() {
  if (!LIVE_URL) return;
  const btn = document.getElementById('refreshFab');
  if (btn) { btn.classList.add('spinning'); btn.disabled = true; }
  await silentRefresh();
  if (btn) { btn.classList.remove('spinning'); btn.disabled = false; }
}

async function silentRefresh() {
  if (!LIVE_URL || IS_REFRESHING || document.getElementById('dashboardScreen').style.display === 'none') return;
  IS_REFRESHING = true;
  updateRefreshIndicator('syncing');
  try {
    const encoded = encodeURIComponent(LIVE_URL);
    const res = await fetch(`/api/fetch-sheet?url=${encoded}`);
    if (!res.ok) { IS_REFRESHING = false; updateRefreshIndicator('error'); return; }
    const text = await res.text();
    const rows = parseCsv(text);
    if (!rows.length) { IS_REFRESHING = false; return; }
    DATA = await buildDataObject(rows);
    ALL_TRANSACTIONS = DATA.recentTransactions || [];
    ALL_PIPELINE = DATA.pipeline || [];
    // Re-render all tab content (no loading screen)
    renderOverview();
    renderTargetsTab();
    renderPivotTab();
    // Re-render visible tab charts
    const activeTab = document.querySelector('.nav-tab.active');
    if (activeTab) {
      const name = activeTab.id.replace('nav', '').toLowerCase();
      renderTabCharts(name);
    }
    updateRefreshIndicator('live');
    console.log('[AutoRefresh] Dashboard updated at', new Date().toLocaleTimeString());
  } catch (e) {
    console.warn('[AutoRefresh] Failed:', e.message);
    updateRefreshIndicator('error');
  }
  IS_REFRESHING = false;
}

// ---- NEW REFRESH BUTTON ----
async function refreshSheet() {
  const savedUrl = localStorage.getItem('rototech-sheet-url');
  if (!savedUrl) {
    alert('No sheet connected. Please paste your Google Sheet link first.');
    goUpload();
    return;
  }

  const btn = document.getElementById('refreshBtn');
  btn.classList.add('refreshing');
  btn.disabled = true;

  try {
    const encoded = encodeURIComponent(savedUrl);
    const res = await fetch(`/api/fetch-sheet?url=${encoded}`);
    if (!res.ok) throw new Error('Failed to fetch sheet.');
    const text = await res.text();
    const rows = parseCsv(text);
    if (!rows.length) throw new Error('No data found in sheet.');

    DATA = await buildDataObject(rows);
    FILE_NAME = extractSheetName(savedUrl);
    LIVE_URL = savedUrl;

    // Save fresh data to localStorage
    localStorage.setItem('rototech-data-cache', JSON.stringify(DATA));
    localStorage.setItem('rototech-data-timestamp', Date.now().toString());

    ALL_TRANSACTIONS = DATA.recentTransactions || [];
    ALL_PIPELINE = DATA.pipeline || [];

    // Re-render dashboard
    renderDashboard();
    showRefreshToast('✅ Dashboard updated with latest data');
  } catch (e) {
    showRefreshToast('❌ Refresh failed: ' + e.message, true);
  } finally {
    btn.classList.remove('refreshing');
    btn.disabled = false;
  }
}

function showRefreshToast(message, isError = false) {
  const existing = document.getElementById('refreshToast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'refreshToast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: ${isError ? '#EF4444' : '#22C55E'};
    color: #fff;
    padding: 10px 20px;
    border-radius: 30px;
    font-size: 13px;
    font-weight: 600;
    font-family: var(--font);
    z-index: 9999;
    box-shadow: 0 4px 20px rgba(0,0,0,0.25);
    animation: toastSlideIn 0.3s ease forwards;
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastSlideOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function updateRefreshIndicator(state) {
  const pill = document.getElementById('fileNamePill');
  if (!pill) return;
  if (state === 'live') pill.style.color = '#1D9E75';
  if (state === 'syncing') pill.style.color = '#F2D94A';
  if (state === 'error') pill.style.color = '#C0392B';
  setTimeout(() => { if (pill) pill.style.color = ''; }, 2000);
}

function handleDemo() {
  FILE_NAME = 'rototech-demo';
  startLoadingSteps(() => {
    DATA = window.DEMO_DATA;
    renderDashboard();
    // Save demo session for auto-restore
    localStorage.setItem('rototech-file-name', 'rototech-demo');
    localStorage.setItem('rototech-data-cache', JSON.stringify(DATA));
    localStorage.setItem('rototech-data-timestamp', Date.now().toString());
    localStorage.removeItem('rototech-sheet-url'); // demo has no sheet URL
  });
}

function showConnectError(msg) {
  const el = document.getElementById('connectError');
  el.textContent = msg; el.style.display = 'block';
}
function hideConnectError() {
  document.getElementById('connectError').style.display = 'none';
}

function extractSheetName(url) {
  try {
    const m = url.match(/spreadsheets\/d\/([^/]+)/);
    return m ? m[1].substring(0, 20) + '…' : 'google-sheet';
  } catch { return 'google-sheet'; }
}

// ---- CSV PARSER ----
function parseCsv(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = parseRow(lines[0]).map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseRow(lines[i]);
    if (vals.every(v => !v.trim())) continue;
    const obj = {};
    headers.forEach((h, j) => { obj[h] = (vals[j] || '').trim(); });
    rows.push(obj);
  }
  return rows;
}

function parseRow(line) {
  const cells = []; let cur = ''; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (c === ',' && !inQ) { cells.push(cur); cur = ''; }
    else cur += c;
  }
  cells.push(cur);
  return cells;
}

// ---- COLUMN MAPPING ----
const COL_MAP = {
  date: ['date', 'invoice', 'order date', 'created', 'bill', 'dated'],
  customer: ['customer', 'client', 'company', 'buyer', 'party', 'firm'],
  plant: ['plant', 'product', 'system', 'item', 'equipment', 'description', 'material', 'goods', 'machine'],
  industry: ['industry', 'sector', 'segment', 'vertical', 'category', 'type'],
  salesperson: ['salesperson', 'sales person', 'rep', 'executive', 'assigned', 'owner', 'sales rep', 'handled', 'employee'],
  region: ['region', 'state', 'location', 'zone', 'territory', 'city', 'area', 'branch'],
  value: ['value', 'amount', 'revenue', 'sale', 'price', 'total', 'qty', 'cost', 'rate', 'gross'],
  stage: ['stage', 'status', 'pipeline', 'deal stage']
};

function mapColumns(headers) {
  const map = {};
  const used = new Set();
  const lowerHeaders = headers.map(h => h.toLowerCase().trim());

  const pick = (...candidates) => {
    // First try exact match
    for (const c of candidates) {
      const idx = lowerHeaders.findIndex(h => h === c.toLowerCase());
      if (idx !== -1 && !used.has(headers[idx])) {
        used.add(headers[idx]);
        return headers[idx];
      }
    }
    // Then try partial match
    for (const c of candidates) {
      const idx = lowerHeaders.findIndex(h => h.includes(c.toLowerCase()));
      if (idx !== -1 && !used.has(headers[idx])) {
        used.add(headers[idx]);
        return headers[idx];
      }
    }
    return null;
  };

  // Assign columns based on ordered priorities
  map.date = pick(...COL_MAP.date);
  map.customer = pick(...COL_MAP.customer);
  map.plant = pick(...COL_MAP.plant);
  map.industry = pick(...COL_MAP.industry);
  map.salesperson = pick(...COL_MAP.salesperson);
  map.region = pick(...COL_MAP.region);
  map.value = pick(...COL_MAP.value);
  map.stage = pick(...COL_MAP.stage);

  return map;
}

function parseValue(str) {
  if (str === null || str === undefined) return 0;
  let s = String(str).trim();
  if (!s || s === '-' || s === 'N/A' || s === 'NA') return 0;
  // Remove currency symbols and text like Rs., INR
  s = s.replace(/(?:Rs\.?|INR|USD|EUR|GBP|₹|\$|€|£)/gi, '').trim();
  // Remove Indian thousand separators (1,23,456) and spaces
  s = s.replace(/,/g, '').replace(/\s+/g, '');
  // Keep only digits, dot, minus
  s = s.replace(/[^\d.\-]/g, '');
  if (!s) return 0;
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

// ---- ROBUST DATE PARSER ----
function parseDate(str) {
  if (!str) return null;
  str = String(str).trim();

  const months = {
    jan:0, feb:1, mar:2, apr:3, may:4, jun:5,
    jul:6, aug:7, sep:8, oct:9, nov:10, dec:11
  };

  // DD MMM YYYY — e.g. "05 Jan 2024" or "5 Jan 2024"
  let m = str.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})$/);
  if (m) {
    const mon = months[m[2].toLowerCase().substring(0,3)];
    if (mon !== undefined) {
      const d = new Date(parseInt(m[3]), mon, parseInt(m[1]));
      if (!isNaN(d.getTime())) return d;
    }
  }

  // MMM DD YYYY — e.g. "Jan 05 2024"
  m = str.match(/^([A-Za-z]{3,9})\s+(\d{1,2})\s+(\d{4})$/);
  if (m) {
    const mon = months[m[1].toLowerCase().substring(0,3)];
    if (mon !== undefined) {
      const d = new Date(parseInt(m[3]), mon, parseInt(m[2]));
      if (!isNaN(d.getTime())) return d;
    }
  }

  // DD/MM/YYYY or DD-MM-YYYY
  m = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (m) {
    const d = new Date(`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`);
    if (!isNaN(d.getTime())) return d;
  }

  // YYYY-MM-DD (ISO)
  m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const d = new Date(parseInt(m[1]), parseInt(m[2])-1, parseInt(m[3]));
    if (!isNaN(d.getTime())) return d;
  }

  // Try native parser as last resort
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d;

  return null;
}

function formatDate(str) {
  const d = parseDate(str);
  if (!d) return str || '—';
  const months = ['Jan','Feb','Mar','Apr','May','Jun',
                  'Jul','Aug','Sep','Oct','Nov','Dec'];
  const day  = String(d.getDate()).padStart(2, '0');
  const mon  = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${mon} ${year}`;
}

// ---- BUILD DATA OBJECT ----
async function buildDataObject(rows) {
  const headers = Object.keys(rows[0]);
  const cm = mapColumns(headers);

  console.log('Column mapping:', cm);
  // Debug: show first 2 rows' value for diagnosis
  if (cm.value) {
    const samples = rows.slice(0, 3).map(r => r[cm.value]);
    console.log('Sample values from "' + cm.value + '" column:', samples);
  } else {
    console.warn('⚠️ No value/amount column found! Headers:', Object.keys(rows[0]));
  }

  const STAGE_VALS = ['lead', 'quote', 'negotiation', 'won', 'lost'];
  const transactions = [], pipeline = [];

  // ALL rows go to transactions (shown in Recent Orders table)
  // Rows with valid stage values ALSO go to pipeline (shown in Pipeline tab)
  rows.forEach(row => {
    const stage = cm.stage ? (row[cm.stage] || '').trim() : '';
    const stageLC = stage.toLowerCase();
    const amount = parseValue(row[cm.value]);
    const txRow = {
      date: formatDate(row[cm.date] || ''),
      customer: row[cm.customer] || 'Unknown',
      plant: row[cm.plant] || 'Unknown',
      industry: row[cm.industry] || 'Unknown',
      salesperson: row[cm.salesperson] || 'Unknown',
      region: row[cm.region] || 'Unknown',
      amount,
      stage: stage
    };
    // Every row goes to transactions
    if (txRow.customer !== 'Unknown' || amount > 0) transactions.push(txRow);
    // Additionally, rows with a valid pipeline stage go to pipeline too
    if (STAGE_VALS.includes(stageLC)) {
      pipeline.push({
        customer: txRow.customer,
        plant: txRow.plant,
        stage: stage.charAt(0).toUpperCase() + stage.slice(1).toLowerCase(),
        value: amount,
        region: txRow.region,
        salesperson: txRow.salesperson
      });
    }
  });

  console.log(`Parsed: ${transactions.length} transactions, ${pipeline.length} pipeline rows`);

  // If API key, try Claude
  if (API_KEY && API_KEY.startsWith('sk-') && transactions.length > 0) {
    try {
      const claudeData = await fetchClaudeData(rows.slice(0, 600), transactions, pipeline);
      if (claudeData) return claudeData;
    } catch (e) { console.warn('Claude API failed, falling back to local:', e.message); }
  }

  return buildLocalData(transactions, pipeline);
}

function buildLocalData(transactions, pipeline) {
  const D = {};
  const sum = arr => arr.reduce((a, b) => a + b, 0);

  const groupCount = (arr, key, valKey) => {
    const m = {};
    arr.forEach(r => {
      const k = r[key] || 'Unknown';
      if (!m[k]) m[k] = { revenue: 0, orders: 0 };
      m[k].revenue += (r[valKey] || 0);
      m[k].orders++;
    });
    return m;
  };

  const topN = (obj, n, nameKey) =>
    Object.entries(obj)
      .filter(([, v]) => v.revenue > 0)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, n)
      .map(([k, v]) => ({ [nameKey]: k, ...v }));

  const totalRevenue = sum(transactions.map(t => t.amount));
  const totalOrders = transactions.length;
  const avgOrderValue = totalOrders ? Math.round(totalRevenue / totalOrders) : 0;

  const byPlant = groupCount(transactions, 'plant', 'amount');
  const byCustomer = groupCount(transactions, 'customer', 'amount');
  const bySales = groupCount(transactions, 'salesperson', 'amount');

  const byRegionMap = {};
  transactions.forEach(t => { byRegionMap[t.region || 'Unknown'] = (byRegionMap[t.region || 'Unknown'] || 0) + t.amount; });
  const byIndustryMap = {};
  transactions.forEach(t => { byIndustryMap[t.industry || 'Unknown'] = (byIndustryMap[t.industry || 'Unknown'] || 0) + t.amount; });

  const topProd = topN(byPlant, 1, 'plant')[0];
  const topCust = topN(byCustomer, 1, 'customer')[0];
  const topSalesp = topN(bySales, 1, 'salesperson')[0];  // fixed: was 'name'
  const topRegion = Object.entries(byRegionMap).filter(([k]) => k && k !== 'Unknown').sort((a, b) => b[1] - a[1])[0];
  const topIndustry = Object.entries(byIndustryMap).filter(([k]) => k && k !== 'Unknown').sort((a, b) => b[1] - a[1])[0];

  D.kpis = {
    totalRevenue, totalOrders, avgOrderValue,
    topPlant: topProd?.plant || '—',
    topCustomer: topCust?.customer || '—',
    topSalesperson: topSalesp?.salesperson || '—',  // fixed: was topSalesp?.name
    topRegion: topRegion?.[0] || '—',
    topIndustry: topIndustry?.[0] || '—'
  };

  // Revenue by month (sorted chronologically)
  const mMap = {};
  transactions.forEach(r => {
    const d = parseDate(r.date);
    if (d && !isNaN(d.getTime())) {
      const months = ['Jan','Feb','Mar','Apr','May','Jun',
                      'Jul','Aug','Sep','Oct','Nov','Dec'];
      const label = `${months[d.getMonth()]} ${d.getFullYear()}`;
      mMap[label] = (mMap[label] || 0) + (r.amount || 0);
    }
  });
  D.revenueByMonth = Object.entries(mMap)
    .map(([label, revenue]) => {
      const d = parseDate('01 ' + label);
      return { label, revenue, _d: d || new Date(label) };
    })
    .sort((a, b) => a._d - b._d)
    .map(({ label, revenue }) => ({ month: label, revenue }));

  D.revenueByPlant = topN(byPlant, 8, 'plant');
  D.revenueBySalesperson = topN(bySales, 8, 'name');
  D.revenueByCustomer = topN(byCustomer, 8, 'customer');

  D.revenueByRegion = Object.entries(byRegionMap)
    .filter(([k]) => k && k !== 'Unknown')
    .sort((a, b) => b[1] - a[1]).slice(0, 7)
    .map(([region, revenue]) => ({ region, revenue, pct: totalRevenue ? +(revenue / totalRevenue * 100).toFixed(1) : 0 }));

  D.revenueByIndustry = Object.entries(byIndustryMap)
    .filter(([k]) => k && k !== 'Unknown')
    .sort((a, b) => b[1] - a[1]).slice(0, 6)
    .map(([industry, revenue]) => ({ industry, revenue, pct: totalRevenue ? +(revenue / totalRevenue * 100).toFixed(1) : 0 }));

  // Customer × Plant matrix
  const cpMap = {};
  transactions.forEach(t => {
    const key = t.customer + '||' + t.plant;
    if (!cpMap[key]) cpMap[key] = { customer: t.customer, plant: t.plant, amount: 0, count: 0 };
    cpMap[key].amount += t.amount;
    cpMap[key].count++;
  });
  D.customerPlantMatrix = Object.values(cpMap).sort((a, b) => b.amount - a.amount).slice(0, 12);

  D.recentTransactions = [...transactions].reverse(); // no row limit
  D.pipeline = pipeline;                               // no row limit

  // YoY
  const yearMap = {};
  transactions.forEach(r => {
    const d = parseDate(r.date);
    if (d && !isNaN(d.getTime())) {
      const y = d.getFullYear();
      yearMap[y] = (yearMap[y] || 0) + (r.amount || 0);
    }
  });
  const years = Object.keys(yearMap).map(y => parseInt(y, 10)).sort((a, b) => a - b);
  const now = new Date();
  const latestYear = years.length ? years[years.length - 1] : now.getFullYear();
  const curYear = latestYear;
  const prevYear = latestYear - 1;
  const curTx = transactions.filter(t => { const d = parseDate(t.date); return d && d.getFullYear() === curYear; });
  const prevTx = transactions.filter(t => { const d = parseDate(t.date); return d && d.getFullYear() === prevYear; });
  const curRev = sum(curTx.map(t => t.amount));
  const prevRev = sum(prevTx.map(t => t.amount));
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const curByMo = {}; const prevByMo = {};
  curTx.forEach(t => { const d = parseDate(t.date); if (d) { const m = MONTHS[d.getMonth()]; curByMo[m] = (curByMo[m] || 0) + t.amount; } });
  prevTx.forEach(t => { const d = parseDate(t.date); if (d) { const m = MONTHS[d.getMonth()]; prevByMo[m] = (prevByMo[m] || 0) + t.amount; } });
  const allMos = [...new Set([...Object.keys(curByMo), ...Object.keys(prevByMo)])].sort((a, b) => MONTHS.indexOf(a) - MONTHS.indexOf(b));

  // YoY by plant (current vs prev year)
  const prevByProd = {};
  prevTx.forEach(t => { prevByProd[t.plant] = (prevByProd[t.plant] || 0) + t.amount; });

  D.yoy = {
    currentYear: curYear, prevYear,
    currentRevenue: curRev, prevRevenue: prevRev,
    currentOrders: curTx.length, prevOrders: prevTx.length,
    currentAvg: curTx.length ? curRev / curTx.length : 0,
    prevAvg: prevTx.length ? prevRev / prevTx.length : 0,
    byMonth: allMos.length ? allMos.map(m => ({ month: m, current: curByMo[m] || 0, prev: prevByMo[m] || 0 }))
      : MONTHS.slice(0, 4).map(m => ({ month: m, current: 0, prev: 0 })),
    byPlant: D.revenueByPlant.slice(0, 6).map(p => ({
      plant: p.plant, current: p.revenue, prev: prevByProd[p.plant] || 0
    }))
  };

  D.insights = {
    summary: `Your sales data shows ${fmtM(totalRevenue)} in total revenue across ${totalOrders} orders. The top plant is "${D.kpis.topPlant}" and the leading customer is "${D.kpis.topCustomer}". ${D.kpis.topSalesperson !== '—' ? D.kpis.topSalesperson + ' is the highest-performing salesperson.' : ''}`,
    bullets: [
      `${D.revenueByPlant.slice(0, 2).map(p => p.plant).join(' and ')} are your top 2 plants by revenue.`,
      D.revenueByRegion[0] ? `${D.revenueByRegion[0].region} is the strongest region, contributing ${D.revenueByRegion[0].pct}% of revenue.` : 'Regional data not available in this sheet.',
      `Average order value is ${fmtM(avgOrderValue)} — pushing for larger deals could significantly boost revenue.`,
      `${pipeline.length} pipeline deals totalling ${fmtM(sum(pipeline.map(p => p.value)))} are currently active.`
    ]
  };

  return D;
}

// ---- DEAL VELOCITY CALCULATION ----
function calcDealVelocity() {
  const pl = DATA.pipeline || [];
  const stages = ['Lead', 'Quote', 'Negotiation', 'Won', 'Lost'];
  const avgDays = { Lead: 5, Quote: 14, Negotiation: 28, Won: 45, Lost: 21 };
  return stages.map(stage => ({
    stage,
    count: pl.filter(d => d.stage === stage).length,
    avgDays: avgDays[stage],
    totalValue: pl.filter(d => d.stage === stage).reduce((a, b) => a + (b.value || 0), 0)
  }));
}

// ---- CUSTOMER HEALTH SCORE CALCULATION ----
function calcCustomerHealth() {
  const txns = DATA.recentTransactions || [];
  const customers = [...new Set(txns.map(r => r.customer))];
  const today = new Date();
  return customers.map(cust => {
    const ct = txns.filter(r => r.customer === cust);
    const totalRev = ct.reduce((a, b) => a + (b.amount || 0), 0);
    const orderCount = ct.length;
    const dates = ct.map(r => new Date(r.date)).filter(d => !isNaN(d));
    const lastOrder = dates.length ? new Date(Math.max(...dates)) : null;
    const daysSince = lastOrder ? Math.floor((today - lastOrder) / 86400000) : 999;
    let score = 0;
    score += Math.min(40, orderCount * 5);
    score += Math.min(30, Math.round(totalRev / 100000) * 3);
    score += daysSince < 30 ? 30 : daysSince < 60 ? 20 : daysSince < 90 ? 10 : daysSince < 180 ? 5 : 0;
    const status = score >= 70 ? 'Healthy' : score >= 40 ? 'At Risk' : 'Dormant';
    const color = score >= 70 ? '#22C55E' : score >= 40 ? '#F59E0B' : '#EF4444';
    return { customer: cust, score, status, color, daysSince, totalRev, orderCount };
  }).sort((a, b) => b.score - a.score);
}

function scoreRing(score, color) {
  const r = 28, circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  return `<svg width="70" height="70" viewBox="0 0 70 70">
    <circle cx="35" cy="35" r="${r}" fill="none" stroke="rgba(128,128,128,0.15)" stroke-width="6"/>
    <circle cx="35" cy="35" r="${r}" fill="none" stroke="${color}" stroke-width="6"
      stroke-dasharray="${fill} ${circ}" stroke-linecap="round"
      transform="rotate(-90 35 35)"/>
    <text x="35" y="40" text-anchor="middle" font-size="16" font-weight="800" fill="${color}">${score}</text>
  </svg>`;
}

// ---- REVENUE FORECASTER ----
function calcRevenueForecast() {
  const byMonth = DATA.revenueByMonth || [];
  if (byMonth.length < 3) return null;
  const last3 = byMonth.slice(-3).map(m => m.revenue);
  const avg = last3.reduce((a, b) => a + b, 0) / 3;
  const trend = (last3[2] - last3[0]) / 2;
  const forecast = Math.max(0, avg + trend);
  const variance = last3.map(v => Math.abs(v - avg));
  const avgVariance = variance.reduce((a, b) => a + b, 0) / 3;
  const confidence = Math.max(40, Math.min(95, Math.round(100 - (avgVariance / avg * 100))));
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const lastMonthName = byMonth[byMonth.length - 1]?.month || '';
  const idx = months.findIndex(m => lastMonthName.startsWith(m));
  const nextMonth = months[(idx + 1) % 12];
  const trendPct = last3[2] ? Math.round(((forecast - last3[2]) / last3[2]) * 100) : 0;
  return { forecast, confidence, trend, avg, last3, nextMonth, trendPct };
}

// ---- SEASONAL PATTERN DETECTOR ----
function calcSeasonalPattern() {
  const txns = DATA.recentTransactions || [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthRev = {};
  txns.forEach(r => {
    const d = new Date(r.date);
    if (!isNaN(d)) {
      const m = months[d.getMonth()];
      monthRev[m] = (monthRev[m] || 0) + (r.amount || 0);
    }
  });
  const vals = months.map(m => monthRev[m] || 0);
  const max = Math.max(...vals);
  const nonZero = vals.filter(v => v > 0);
  const min = nonZero.length ? Math.min(...nonZero) : 0;
  return months.map((m, i) => ({
    month: m,
    revenue: vals[i],
    intensity: max ? vals[i] / max : 0,
    label: vals[i] >= max * 0.8 ? 'Peak' : vals[i] > 0 && vals[i] <= min * 1.2 ? 'Low' : 'Normal'
  }));
}

// ---- SMART FOLLOW-UP LIST ----
function calcFollowUpList() {
  const txns = DATA.recentTransactions || [];
  const today = new Date();
  const customers = [...new Set(txns.map(r => r.customer))];
  return customers.map(cust => {
    const ct = txns.filter(r => r.customer === cust);
    const totalRev = ct.reduce((a, b) => a + (b.amount || 0), 0);
    const dates = ct.map(r => new Date(r.date)).filter(d => !isNaN(d));
    const lastDate = dates.length ? new Date(Math.max(...dates)) : null;
    const daysSince = lastDate ? Math.floor((today - lastDate) / 86400000) : 999;
    const salesperson = ct[ct.length - 1]?.salesperson || '—';
    const lastPlant = ct[ct.length - 1]?.product || '—';
    return { customer: cust, totalRev, daysSince, lastDate, salesperson, lastPlant, orderCount: ct.length };
  }).filter(c => c.daysSince >= 45).sort((a, b) => b.totalRev - a.totalRev);
}

function openWhatsApp(customer, daysSince, lastPlant) {
  const msg = `Hello! This is Jignesh Patel from Rototech Engineering Systems. I wanted to follow up with ${customer} — it has been ${daysSince} days since your last order of ${lastPlant}. We have some exciting updates on our ZLD solutions that might interest you. Would you be available for a quick call this week? Thank you!`;
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

// ---- COMPARISON MODE ----
function populateCompareDropdowns() {
  const type = document.getElementById('compareType').value;
  const txns = DATA.recentTransactions || [];
  const fieldMap = { salesperson: 'salesperson', product: 'product', region: 'region' };
  const values = [...new Set(txns.map(r => r[fieldMap[type]]).filter(Boolean))].sort();
  const opts = values.map(v => `<option value="${v}">${v}</option>`).join('');
  document.getElementById('compareA').innerHTML = opts;
  document.getElementById('compareB').innerHTML = opts;
  if (values.length > 1) document.getElementById('compareB').selectedIndex = 1;
}

function runComparison() {
  const type = document.getElementById('compareType').value;
  const a = document.getElementById('compareA').value;
  const b = document.getElementById('compareB').value;
  if (!a || !b || a === b) {
    document.getElementById('comparisonResult').innerHTML = '<div style="color:var(--mid-gray);font-size:12px;padding:12px;">Select two different items to compare.</div>';
    return;
  }
  const txns = DATA.recentTransactions || [];
  const fieldMap = { salesperson: 'salesperson', product: 'product', region: 'region' };
  const field = fieldMap[type];

  const getStats = name => {
    const rows = txns.filter(r => (r[field] || '') === name);
    const rev = rows.reduce((s, r) => s + (r.amount || 0), 0);
    const orders = rows.length;
    return {
      name, rev, orders,
      avg: orders ? Math.round(rev / orders) : 0,
      customers: [...new Set(rows.map(r => r.customer))].length
    };
  };

  const sA = getStats(a), sB = getStats(b);

  const row = (label, vA, vB, fmtFn) => {
    const aWins = vA >= vB;
    return `<div style="display:grid;grid-template-columns:1fr auto 1fr;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--cream2);">
      <div style="text-align:right;font-size:15px;font-weight:700;color:${aWins ? 'var(--near-black)' : 'var(--light-gray)'}">${fmtFn(vA)} ${aWins && vA !== vB ? '🏆' : ''}</div>
      <div style="font-size:10px;color:var(--mid-gray);text-transform:uppercase;letter-spacing:.06em;text-align:center;white-space:nowrap;">${label}</div>
      <div style="text-align:left;font-size:15px;font-weight:700;color:${!aWins ? 'var(--near-black)' : 'var(--light-gray)'}">${!aWins && vA !== vB ? '🏆' : ''} ${fmtFn(vB)}</div>
    </div>`;
  };

  document.getElementById('comparisonResult').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr auto 1fr;margin-bottom:8px;gap:12px;">
      <div style="font-size:16px;font-weight:800;color:#3B82F6;text-align:right;">${a}</div>
      <div></div>
      <div style="font-size:16px;font-weight:800;color:#7C3AED;text-align:left;">${b}</div>
    </div>
    ${row('Revenue', sA.rev, sB.rev, fmtM)}
    ${row('Orders', sA.orders, sB.orders, v => v)}
    ${row('Avg Value', sA.avg, sB.avg, fmtM)}
    ${row('Customers', sA.customers, sB.customers, v => v)}`;
}

function openCustomerNote(name) {
  const key = 'rototech-note-' + name.replace(/\s+/g, '_');
  document.getElementById('noteModalTitle').textContent = '📝 ' + name;
  document.getElementById('noteTextarea').value = localStorage.getItem(key) || '';
  document.getElementById('noteTextarea').dataset.key = key;
  document.getElementById('noteModal').style.display = 'flex';
}

function saveCustomerNote() {
  const ta = document.getElementById('noteTextarea');
  localStorage.setItem(ta.dataset.key, ta.value.trim());
  document.getElementById('noteModal').style.display = 'none';
}

// ---- CLAUDE API DATA FETCH ----
async function fetchClaudeData(rows) {
  const schema = `{"kpis":{"totalRevenue":0,"totalOrders":0,"avgOrderValue":0,"topPlant":"","topIndustry":"","topCustomer":"","topSalesperson":"","topRegion":""},"revenueByMonth":[{"month":"Jan 2024","revenue":0}],"revenueByPlant":[{"plant":"","revenue":0,"orders":0}],"revenueBySalesperson":[{"name":"","revenue":0,"orders":0}],"revenueByRegion":[{"region":"","revenue":0,"pct":0}],"revenueByIndustry":[{"industry":"","revenue":0,"pct":0}],"revenueByCustomer":[{"customer":"","revenue":0,"orders":0}],"customerPlantMatrix":[{"customer":"","plant":"","amount":0,"count":0}],"recentTransactions":[{"date":"","customer":"","plant":"","industry":"","salesperson":"","region":"","amount":0}],"pipeline":[{"customer":"","plant":"","stage":"","value":0,"region":"","salesperson":""}],"insights":{"summary":"","bullets":[""]},"yoy":{"currentYear":0,"prevYear":0,"currentRevenue":0,"prevRevenue":0,"currentOrders":0,"prevOrders":0,"currentAvg":0,"prevAvg":0,"byMonth":[{"month":"","current":0,"prev":0}],"byPlant":[{"plant":"","current":0,"prev":0}]}}`;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514', max_tokens: 8192,
      system: 'You are a sales data analyst for Rototech Engineering Systems. Analyse CSV rows. Return ONLY valid JSON matching the schema exactly, no markdown.',
      messages: [{ role: 'user', content: `Return ONLY JSON matching: ${schema}\n\nDATA: ${JSON.stringify(rows)}` }]
    })
  });
  if (!res.ok) throw new Error(`Claude API error ${res.status}`);
  const json = await res.json();
  const raw = (json.content?.[0]?.text || '').replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(raw);
}

// ---- RENDER DASHBOARD ----
function renderDashboard() {
  TABS_RENDERED = {};
  showScreen('dashboardScreen');
  document.getElementById('fileNamePill').textContent = FILE_NAME;
  // Show refresh FAB only when a live sheet is loaded
  const fab = document.getElementById('refreshFab');
  if (fab) fab.style.display = LIVE_URL ? 'flex' : 'none';

  ALL_TRANSACTIONS = DATA.recentTransactions || [];
  ALL_PIPELINE = DATA.pipeline || [];

  renderOverview();
  renderTargetsTab();
  renderPivotTab();
  renderIntelligence();
  renderDailyQuote();

  // Start with overview tab (it's already visible so charts render correctly)
  switchTab('overview', document.getElementById('navOverview'));
}

// ---- TAB SWITCH ----
// Charts are lazily rendered per-tab to avoid the hidden-canvas Chart.js bug
function switchTab(name, el) {
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  if (el) el.classList.add('active');

  const capName = name.charAt(0).toUpperCase() + name.slice(1);
  const tab = document.getElementById('tab' + capName);
  if (tab) {
    tab.classList.add('active');
    tab.classList.remove('fade-in');
    void tab.offsetWidth;
    tab.classList.add('fade-in');
  }

  // Render (or re-render) charts for this tab now that it's visible
  if (DATA) renderTabCharts(name);
}

function renderTabCharts(name) {
  if (name === 'overview') {
    renderOverviewCharts();
  } else if (name === 'targets') {
    if (TARGET_ITEMS.length) renderTargetCharts(TARGET_ITEMS);
  } else if (name === 'tasks') {
    if (typeof initCalendar === 'function') {
      if (!TABS_RENDERED.tasks) {
        initCalendar();              // first visit: full init + task list
        TABS_RENDERED.tasks = true;
      } else {
        renderCalendar();            // subsequent visits: refresh dots/selection
      }
    }
  } else if (name === 'pivot') {
    renderPivotTabCharts();
  } else if (name === 'intelligence') {
    renderIntelligence();
  }
}

// ==== PIVOT TAB ====
function renderPivotTab() {
  if (!ALL_TRANSACTIONS.length) {
    document.getElementById('pivotContentState').style.display = 'none';
    document.getElementById('pivotEmptyState').style.display = 'block';
    return;
  }
  document.getElementById('pivotEmptyState').style.display = 'none';
  document.getElementById('pivotContentState').style.display = '';

  const TX = ALL_TRANSACTIONS;
  const sum = arr => arr.reduce((a, b) => a + b, 0);

  // Grouping helper
  const groupData = (key) => {
    const m = {};
    TX.forEach(t => {
      const k = t[key] || 'Unknown';
      if (!m[k]) m[k] = { revenue: 0, count: 0 };
      m[k].revenue += t.amount || 0;
      m[k].count++;
    });
    return Object.entries(m).map(([k, v]) => ({ name: k, ...v })).sort((a, b) => b.revenue - a.revenue);
  };

  // Pre-calculated grouped data
  const byPlant = groupData('plant');
  const byRep = groupData('salesperson');
  const byRegion = groupData('region');
  const byIndustry = groupData('industry');

  // Get theme-aware colors
  const isDark = document.body.getAttribute('data-theme') === 'dark';
  const { ACCENT, DARK } = getChartColors();
  const lightColors = { accent: '#F2D94A', dark: '#1A1A1A' };
  const cAccent = isDark ? '#7C3AED' : lightColors.accent;
  const cDark = isDark ? '#06B6D4' : lightColors.dark;

  // Pre-built Cards
  // Card 1: Orders by Plant
  const plantOrderCount = [...byPlant].sort((a, b) => b.count - a.count).slice(0, 6);
  renderHBar('pivotPlantCount', plantOrderCount.map(d => shorten(d.name)), plantOrderCount.map(d => d.count), {
    colors: plantOrderCount.map((_, i) => i === 0 ? cAccent : cDark),
    yFmt: v => v
  });

  // Card 2: Revenue by Plant
  const plantRev = byPlant.slice(0, 6);
  renderHBar('pivotPlantRev', plantRev.map(d => shorten(d.name)), plantRev.map(d => d.revenue), {
    colors: plantRev.map((_, i) => i === 0 ? cAccent : cDark),
  });

  // Card 3: Revenue by Salesperson
  const repRev = byRep.slice(0, 6);
  renderVBar('pivotSalesRev', repRev.map(d => d.name.split(' ')[0]), repRev.map(d => d.revenue), {
    colors: repRev.map(() => cDark)
  });

  // Card 4: Orders by Region (Donut)
  const regOrders = [...byRegion].sort((a, b) => b.count - a.count).slice(0, 6);
  const totalRegObj = regOrders.reduce((a, b) => a + b.count, 0);
  const DOT_COLORS = isDark
    ? ['#7C3AED', '#06B6D4', '#A855F7', '#22D3EE', '#5B21B6', '#0891B2']
    : ['#1A1A1A', '#F2D94A', '#888', '#BBB', '#444', '#DDD'];

  const lg = document.getElementById('pivotRegionLegend');
  if (lg) {
    lg.innerHTML = regOrders.slice(0, 4).map((d, i) => `
      <div class="ind-row">
        <span class="ind-dot" style="background:${DOT_COLORS[i]}"></span>
        <span class="ind-name">${d.name}</span>
        <span class="ind-pct" style="color:var(--text-body)">${d.count}</span>
      </div>`).join('');
  }
  makeChart('pivotRegionDonut', {
    type: 'doughnut',
    data: { labels: regOrders.map(d => d.name), datasets: [{ data: regOrders.map(d => d.count), backgroundColor: DOT_COLORS, borderWidth: 0 }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw} orders` } } } }
  });

  // Card 5: Avg Order Value by Plant
  const plantAvg = byPlant.slice(0, 6).map(d => ({ name: d.name, avg: d.revenue / d.count }));
  renderHBar('pivotAvgPlant', plantAvg.map(d => shorten(d.name)), plantAvg.map(d => d.avg), {
    colors: plantAvg.map(() => cAccent),
    tickColor: 'rgba(255,255,255,.6)'
  });

  // Card 6: Revenue by Industry
  const indRev = byIndustry.slice(0, 6);
  const INF_COLORS = isDark
    ? ['#7C3AED', '#06B6D4', '#A855F7', '#22D3EE', '#5B21B6']
    : ['#1A1A1A', '#F2D94A', '#888', '#BBB', '#444'];
  renderVBar('pivotIndustryRev', indRev.map(d => shorten(d.name)), indRev.map(d => d.revenue), {
    colors: indRev.map((_, i) => INF_COLORS[i % INF_COLORS.length])
  });

  // CROSS TABLE (Plant x Region)
  const crossMap = {};
  const plants = new Set();
  const regions = new Set();
  const isDarkCross = document.body.getAttribute('data-theme') === 'dark';

  TX.forEach(t => {
    const p = t.plant || 'Unknown';
    const r = t.region || 'Unknown';
    plants.add(p); regions.add(r);
    const k = p + '|' + r;
    crossMap[k] = (crossMap[k] || 0) + (t.amount || 0);
  });

  const plantArr = Array.from(plants).sort();
  const regArr = Array.from(regions).sort();

  const thead = document.getElementById('pivotCrossHead');
  const thStyle = isDarkCross
    ? `background:#0D1526;color:#475569;border-bottom:1px solid rgba(124,58,237,0.2);letter-spacing:.08em;`
    : `background:#FDFCF0;text-transform:uppercase;font-size:11px;color:var(--mid-gray);`;
  const totalThStyle = isDarkCross
    ? `background:rgba(124,58,237,0.15);color:#A855F7;border-left:1px solid rgba(124,58,237,0.3);`
    : `font-weight:700;color:var(--text-main);`;
  thead.innerHTML = `<tr style="${thStyle}">
      <th style="text-align:left">Plant</th>
      ${regArr.map(r => `<th>${r}</th>`).join('')}
      <th style="${totalThStyle}">Total</th>
  </tr>`;

  const tbody = document.getElementById('pivotCrossBody');
  tbody.innerHTML = plantArr.map(p => {
    let rowTotal = 0;
    let maxVal = -1;
    const cells = regArr.map(r => {
      const val = crossMap[p + '|' + r] || 0;
      rowTotal += val;
      if (val > maxVal) maxVal = val;
      return { bg: '', text: val > 0 ? fmtM(val) : '—', val };
    });

    const cellHtml = cells.map(c => {
      const isHighest = c.val > 0 && c.val === maxVal;
      let cellStyle = 'class="amount-cell"';
      if (isHighest) {
        if (isDarkCross) {
          cellStyle += ' style="background:linear-gradient(135deg, rgba(124,58,237,0.35), rgba(6,182,212,0.25));color:#22D3EE;border:1px solid rgba(6,182,212,0.4);font-weight:700;text-shadow:0 0 10px rgba(6,182,212,0.6);"';
        } else {
          cellStyle += ' style="background:#FFFBE6;color:#1A1A1A;font-weight:700;"';
        }
      } else {
        cellStyle += isDarkCross ? ' style="color:#CBD5E1;"' : '';
      }
      return `<td ${cellStyle}>
              <span style="${c.val === 0 ? 'color:var(--light-gray)' : (isDarkCross ? 'color:#CBD5E1' : '')}">${c.text}</span>
          </td>`;
    }).join('');

    const totalTdStyle = isDarkCross
      ? 'style="font-weight:700;background:rgba(124,58,237,0.08);color:#A855F7;border-left:1px solid rgba(124,58,237,0.2);"'
      : 'style="font-weight:700;background:#FDFCF0;"';

    const noteKeyP = 'rototech-note-' + (p || '').replace(/\s+/g, '_');
    const hasNoteP = !!localStorage.getItem(noteKeyP);

    return `<tr>
          <td style="font-weight:500;cursor:pointer;" onclick="openCustomerNote('${p}')" title="Click to add note">${p}${hasNoteP ? '<span style="font-size:10px">📝</span>' : ''}</td>
          ${cellHtml}
          <td class="amount-cell" ${totalTdStyle}>${fmtM(rowTotal)}</td>
      </tr>`;
  }).join('');
}

function getPivotData() {
  const txns = DATA.recentTransactions || [];
  const from = document.getElementById('pivotDateFrom')?.value;
  const to = document.getElementById('pivotDateTo')?.value;

  if (!from && !to) return txns;

  return txns.filter(r => {
    const d = new Date(r.date);
    if (isNaN(d)) return true;
    if (from && d < new Date(from)) return false;
    if (to && d > new Date(to)) return false;
    return true;
  });
}

function showPivotFilterInfo(total, filtered) {
  const el = document.getElementById('pivotFilterInfo');
  if (!el) return;
  const from = document.getElementById('pivotDateFrom')?.value;
  const to = document.getElementById('pivotDateTo')?.value;
  if (from || to) {
    el.style.display = 'flex';
    el.innerHTML = `
      <span style="font-size:11px;color:var(--mid-gray);">
        📅 Showing <strong style="color:var(--near-black)">${filtered}</strong> of ${total} rows
        ${from ? `from <strong>${from}</strong>` : ''}
        ${to ? `to <strong>${to}</strong>` : ''}
      </span>`;
  } else {
    el.style.display = 'none';
  }
}

function clearPivotDates() {
  const f = document.getElementById('pivotDateFrom');
  const t = document.getElementById('pivotDateTo');
  if (f) f.value = '';
  if (t) t.value = '';
  highlightActivePivotFilters();
}

function highlightActivePivotFilters() {
  const from = document.getElementById('pivotDateFrom')?.value;
  const to = document.getElementById('pivotDateTo')?.value;
  const clearBtn = document.querySelector('[onclick="clearPivotDates()"]');
  if (clearBtn) {
    clearBtn.style.borderColor = (from || to) ? 'var(--near-black)' : 'var(--cream2)';
    clearBtn.style.color = (from || to) ? 'var(--near-black)' : 'var(--mid-gray)';
    clearBtn.style.fontWeight = (from || to) ? '600' : '400';
  }
}

function runPivotBuilder() {
  const cWrap = document.getElementById('pivotResultChartWrap');
  const sumWrap = document.getElementById('pivotSummaryTableWrap');

  if (!DATA) {
    if (cWrap) cWrap.style.display = 'none';
    if (sumWrap) sumWrap.innerHTML = '<div style="padding:20px;text-align:center;color:var(--mid-gray)">Load a Google Sheet first</div>';
    return;
  }

  const rowDim = document.getElementById('pivotRowDim').value;
  const colDim = document.getElementById('pivotColDim').value;

  const valSel = document.getElementById('pivotValueMetric');
  const valMet = valSel.value;
  const valLabel = valSel.options[valSel.selectedIndex].text;

  const chartT = document.getElementById('pivotChartType').value;

  if (!rowDim) return;

  // If column dimension is selected (not "None"), run cross pivot
  if (colDim && colDim !== '') {
    runCrossPivotBuilder(rowDim, colDim, valMet, valLabel);
    if (cWrap) cWrap.style.display = 'none';
    return;
  }

  // Otherwise continue with simple pivot (existing behavior)
  // 1. Data Source - use getPivotData() for date filtering
  let TX = getPivotData();
  const totalTxns = (DATA.recentTransactions || []).length;
  showPivotFilterInfo(totalTxns, TX.length);

  const pipelineStages = ['Lead', 'Quote', 'Negotiation', 'Won', 'Lost'];
  TX = TX.filter(t => {
    const s = (t.stage || '').charAt(0).toUpperCase() + (t.stage || '').slice(1).toLowerCase();
    return !pipelineStages.includes(s);
  });

  // 2. Map Row dimensions
  const mapField = {
    'plant': 'product',
    'customer': 'customer',
    'industry': 'industry',
    'salesperson': 'salesperson',
    'region': 'region',
    'stage': 'stage'
  };
  const selectedRowField = mapField[rowDim] || rowDim;

  // 3. Grouping logic
  const groups = {};
  TX.forEach(row => {
    // Treat plant and product as the same thing
    let val = row[selectedRowField];
    if (selectedRowField === 'product') {
      val = row.product || row.plant;
    }

    const key = val || 'Unknown';
    if (!groups[key]) groups[key] = { rows: [], total: 0, count: 0, customers: new Set() };
    groups[key].rows.push(row);
    groups[key].total += (row.amount || 0); // Assuming amount translates to Value
    groups[key].count += 1;
    if (row.customer) groups[key].customers.add(row.customer);
  });

  // 4. Calculate metric and prepare array
  const rowArr = Object.entries(groups).map(([label, group]) => {
    let metric = 0;
    if (valMet === 'sum_value') metric = group.total;
    else if (valMet === 'count_orders') metric = group.count;
    else if (valMet === 'avg_value') metric = group.count ? group.total / group.count : 0;
    else if (valMet === 'unique_customers') metric = new Set(group.rows.map(r => r.customer)).size;
    else if (valMet === 'all_customers') metric = group.rows.length;

    return { name: label, metric: metric };
  });

  rowArr.sort((a, b) => b.metric - a.metric);
  const totalMetric = rowArr.reduce((a, b) => a + b.metric, 0);

  // 5. Render summary table
  const isMoney = ['sum_value', 'avg_value'].includes(valMet);
  const formatter = isMoney ? fmtM : (n => n.toString());

  const getFmt = (val) => {
    if (val === 0) return '—';
    return formatter(val);
  };

  if (rowArr.length === 0) {
    if (sumWrap) sumWrap.innerHTML = '<div style="padding:20px;text-align:center;color:var(--mid-gray)">No data available</div>';
    if (cWrap) { cWrap.style.display = 'none'; destroyChart('pivotResultChart'); }
    return;
  }

  const tbodyStr = rowArr.map(r => {
    const noteKeyR = 'rototech-note-' + (r.name || '').replace(/\s+/g, '_');
    const hasNoteR = !!localStorage.getItem(noteKeyR);
    return `
      <tr>
          <td style="font-weight:500;cursor:pointer;" onclick="openCustomerNote('${r.name}')" title="Click to add note">${r.name}${hasNoteR ? '<span style="font-size:10px">📝</span>' : ''}</td>
          <td class="amount-cell">${getFmt(r.metric)}</td>
          <td class="amount-cell" style="color:var(--mid-gray)">${totalMetric ? (r.metric / totalMetric * 100).toFixed(1) + '%' : '0%'}</td>
      </tr>
  `}).join('');

  if (sumWrap) {
    sumWrap.innerHTML = `
          <table class="data-table">
              <thead><tr><th>${rowDim.charAt(0).toUpperCase() + rowDim.slice(1)}</th><th class="amount-cell">${valLabel}</th><th class="amount-cell">% of Total</th></tr></thead>
              <tbody>
                  ${tbodyStr}
                  <tr style="font-weight:700;background:#FDFCF0">
                      <td>Total</td><td class="amount-cell">${getFmt(totalMetric)}</td><td class="amount-cell">100%</td>
                  </tr>
              </tbody>
          </table>
      `;
  }

  // 6. Render Chart
  const isTableOnly = chartT === 'tableOnly';
  const canvasEl = document.getElementById('pivotResultChart');
  if (!canvasEl) return; // skip chart silently

  if (isTableOnly) {
    if (cWrap) cWrap.style.display = 'none';
    destroyChart('pivotResultChart');
  } else {
    if (cWrap) cWrap.style.display = 'block';
    let labels = rowArr.slice(0, 10).map(r => shorten(r.name));
    let data = rowArr.slice(0, 10).map(r => r.metric);

    const tooltipsCb = (ctx => ` ${ctx.label}: ${ctx.raw === 0 ? '—' : formatter(ctx.raw)}`);

    destroyChart('pivotResultChart');

    if (chartT === 'bar') {
      const isDark = document.body.getAttribute('data-theme') === 'dark';
      const cAccent = isDark ? '#7C3AED' : '#F2D94A';
      const cDark = isDark ? '#06B6D4' : '#1A1A1A';
      makeChart('pivotResultChart', {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: labels.map((_, i) => i === 0 ? cAccent : cDark),
            borderRadius: 4
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: tooltipsCb } } },
          scales: {
            y: { grid: { color: isDark ? 'rgba(124,58,237,0.08)' : 'rgba(26,26,26,.06)' }, ticks: { color: isDark ? '#64748B' : '#888888', callback: (v => formatter(v)) } },
            x: { grid: { display: false }, ticks: { color: isDark ? '#64748B' : '#888888' } }
          }
        }
      });
    } else if (chartT === 'horizontalBar') {
      const isDark = document.body.getAttribute('data-theme') === 'dark';
      const cAccent = isDark ? '#7C3AED' : '#F2D94A';
      const cDark = isDark ? '#06B6D4' : '#1A1A1A';
      makeChart('pivotResultChart', {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: labels.map((_, i) => i === 0 ? cAccent : cDark),
            borderRadius: 4
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: tooltipsCb } } },
          scales: {
            x: { grid: { color: isDark ? 'rgba(124,58,237,0.08)' : 'rgba(26,26,26,.06)' }, ticks: { color: isDark ? '#64748B' : '#888888', callback: (v => formatter(v)) } },
            y: { grid: { display: false }, ticks: { color: isDark ? '#64748B' : '#888888' } }
          }
        }
      });
    } else if (chartT === 'donut') {
      const isDark = document.body.getAttribute('data-theme') === 'dark';
      const D_COLORS = isDark
        ? ['#7C3AED', '#06B6D4', '#A855F7', '#22D3EE', '#5B21B6', '#0891B2', '#8B5CF6']
        : ['#1A1A1A', '#F2D94A', '#888', '#BBB', '#444', '#DDD', '#EFEFEF'];
      makeChart('pivotResultChart', {
        type: 'doughnut',
        data: { labels: rowArr.slice(0, 6).map(r => r.name), datasets: [{ data: rowArr.slice(0, 6).map(r => r.metric), backgroundColor: D_COLORS, borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: tooltipsCb } } } }
      });
    }
  }
}

function calcPivotMetric(rows, metric) {
  if (!rows.length) return 0;
  if (metric === 'sum_value') return rows.reduce((a, b) => a + (b.amount || 0), 0);
  if (metric === 'count_orders') return rows.length;
  if (metric === 'avg_value') return Math.round(rows.reduce((a, b) => a + (b.amount || 0), 0) / rows.length);
  if (metric === 'unique_customers') return new Set(rows.map(r => r.customer)).size;
  if (metric === 'all_customers') return rows.length;
  return 0;
}

function formatPivotMetric(val, metric) {
  const isMoney = ['sum_value', 'avg_value'].includes(metric);
  return isMoney ? fmtM(val) : val.toString();
}

function runCrossPivotBuilder(rowDim, colDim, valMet, valLabel) {
  const sumWrap = document.getElementById('pivotSummaryTableWrap');

  // Use getPivotData() for date filtering
  let TX = getPivotData();
  const totalTxns = (DATA.recentTransactions || []).length;
  showPivotFilterInfo(totalTxns, TX.length);

  const pipelineStages = ['Lead', 'Quote', 'Negotiation', 'Won', 'Lost'];
  TX = TX.filter(t => {
    const s = (t.stage || '').charAt(0).toUpperCase() + (t.stage || '').slice(1).toLowerCase();
    return !pipelineStages.includes(s);
  });

  // Map field names
  const mapField = {
    'plant': 'product',
    'customer': 'customer',
    'industry': 'industry',
    'salesperson': 'salesperson',
    'region': 'region',
    'stage': 'stage'
  };
  const rowField = mapField[rowDim] || rowDim;
  const colField = mapField[colDim] || colDim;

  // Get unique row and column values
  const rowVals = [...new Set(TX.map(r => r[rowField] || r[rowField === 'product' ? 'plant' : rowField]).filter(Boolean))].sort();
  const colVals = [...new Set(TX.map(r => r[colField] || r[colField === 'product' ? 'plant' : colField]).filter(Boolean))].sort();

  // Build matrix
  const matrix = rowVals.map(rv => {
    const rowTxns = TX.filter(r => {
      const val = rowField === 'product' ? (r.product || r.plant) : r[rowField];
      return val === rv;
    });
    const cells = colVals.map(cv => {
      const cellTxns = rowTxns.filter(r => {
        const val = colField === 'product' ? (r.product || r.plant) : r[colField];
        return val === cv;
      });
      return cellTxns.length ? calcPivotMetric(cellTxns, valMet) : null;
    });
    const rowTotal = calcPivotMetric(rowTxns, valMet);
    return { rowVal: rv, cells, rowTotal };
  });

  // Grand total
  const grandTotal = matrix.reduce((a, b) => a + b.rowTotal, 0);

  // Render cross table
  let html = `
    <div style="overflow-x:auto;margin-top:16px;">
    <table style="width:100%;border-collapse:collapse;font-size:12px;">
      <thead>
        <tr>
          <th style="padding:8px 12px;text-align:left;background:var(--cream);color:var(--mid-gray);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;border-bottom:1px solid var(--cream2);white-space:nowrap;">${rowDim.toUpperCase()}</th>
          ${colVals.map(cv => `<th style="padding:8px 12px;text-align:right;background:var(--cream);color:var(--mid-gray);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;border-bottom:1px solid var(--cream2);white-space:nowrap;">${cv}</th>`).join('')}
          <th style="padding:8px 12px;text-align:right;background:var(--cream2);color:var(--near-black);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;border-bottom:1px solid var(--cream2);white-space:nowrap;">TOTAL</th>
        </tr>
      </thead>
      <tbody>`;

  matrix.forEach(row => {
    const rowMax = Math.max(...row.cells.filter(v => v !== null));
    html += `<tr>`;
    html += `<td style="padding:8px 12px;font-weight:600;color:var(--near-black);border-bottom:1px solid var(--cream2);white-space:nowrap;">${row.rowVal}</td>`;

    row.cells.forEach(val => {
      const isHighest = val !== null && val === rowMax;
      const isDarkMode = document.body.getAttribute('data-theme') === 'dark';
      const highlightBg = isDarkMode
        ? 'linear-gradient(135deg,rgba(124,58,237,0.35),rgba(6,182,212,0.25))'
        : '#F2D94A';
      const highlightColor = isDarkMode ? '#22D3EE' : '#1A1A1A';

      html += `<td style="padding:8px 12px;text-align:right;border-bottom:1px solid var(--cream2);
            ${isHighest ? `background:${highlightBg};color:${highlightColor};font-weight:700;border-radius:4px;` : 'color:var(--near-black);'}
            font-family:var(--mono);">
            ${val !== null ? formatPivotMetric(val, valMet) : '<span style="color:var(--light-gray)">—</span>'}
          </td>`;
    });

    const pct = grandTotal ? Math.round(row.rowTotal / grandTotal * 100) : 0;
    html += `<td style="padding:8px 12px;text-align:right;border-bottom:1px solid var(--cream2);background:var(--cream2);font-weight:700;font-family:var(--mono);color:var(--near-black);">
        ${formatPivotMetric(row.rowTotal, valMet)} <span style="font-size:10px;color:var(--mid-gray);font-weight:400;">${pct}%</span>
      </td>`;
    html += `</tr>`;
  });

  // Grand total row
  html += `<tr>
    <td style="padding:8px 12px;font-weight:700;font-size:11px;color:var(--mid-gray);text-transform:uppercase;letter-spacing:.06em;border-top:2px solid var(--cream2);">TOTAL</td>`;

  colVals.forEach((cv) => {
    const colTotal = calcPivotMetric(TX.filter(r => {
      const val = colField === 'product' ? (r.product || r.plant) : r[colField];
      return val === cv;
    }), valMet);
    html += `<td style="padding:8px 12px;text-align:right;font-weight:700;font-family:var(--mono);color:var(--near-black);border-top:2px solid var(--cream2);">${formatPivotMetric(colTotal, valMet)}</td>`;
  });

  html += `<td style="padding:8px 12px;text-align:right;font-weight:800;font-family:var(--mono);color:var(--near-black);background:var(--cream2);border-top:2px solid var(--cream2);">${formatPivotMetric(grandTotal, valMet)}</td>`;
  html += `</tr></tbody></table></div>`;

  if (sumWrap) sumWrap.innerHTML = html;
}

function renderPivotTabCharts() {
  // Re-render when tab is selected, but not if empty state is active
  if (!ALL_TRANSACTIONS.length) return;

  // We just call renderPivotTab which handles rendering everything dynamically on demand
  renderPivotTab();

  // Also trigger a builder run to refresh that chart if needed
  if (document.getElementById('pivotResultChartWrap').style.display !== 'none') {
    runPivotBuilder();
  }
}

// ---- OVERVIEW TAB ----
function renderOverview() {
  const K = DATA.kpis || {};

  // KPI cards into kpiCardsRow
  const kpiDefs = [
    { icon: '📦', v: (K.totalOrders || 0).toLocaleString('en-IN'), l: 'Total Orders' },
    { icon: '💰', v: fmtM(K.totalRevenue || 0), l: 'Total Revenue' },
    { icon: '📈', v: fmtM(K.avgOrderValue || 0), l: 'Avg Order Value' },
    { icon: '🏆', v: K.topCustomer || '—', l: 'Top Customer' },
  ];

  document.getElementById('kpiCardsRow').innerHTML = kpiDefs.map(kpi => `
    <div class="kpi-stat-card">
      <div class="kpi-stat-icon">${kpi.icon}</div>
      <div class="kpi-stat-val">${kpi.v}</div>
      <div class="kpi-stat-lbl">${kpi.l}</div>
    </div>`).join('');

  document.getElementById('trendSubtitle').textContent = (DATA.revenueByMonth?.length || 0) + ' months of data';

  // Pipeline Progress bars (by plant revenue %)
  const progEl = document.getElementById('pipelineProgress');
  const prods = (DATA.revenueByPlant || []).slice(0, 6);
  const maxRev = prods[0]?.revenue || 1;
  const fills = ['#F2D94A', '#1A1A1A', '#AAAAAA', '#F2D94A', '#1A1A1A', '#AAAAAA'];
  progEl.innerHTML = prods.length ? prods.map((p, i) => {
    const pct = Math.max(8, Math.round(p.revenue / maxRev * 100));
    return `<div class="progress-row">
      <span class="progress-label" title="${p.plant}">${shorten(p.plant, 9)}</span>
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%;background:${fills[i]}"></div></div>
      <span class="progress-pct">${pct}%</span>
    </div>`;
  }).join('') : '<p style="font-size:12px;color:var(--light-gray)">No plant data found</p>';

  // Transactions table
  populateTxFilters();
  applyTxFilter();

  // Customer × Plant matrix
  const cpBody = document.getElementById('cpBody');
  const cpRows = DATA.customerPlantMatrix || [];
  cpBody.innerHTML = cpRows.length
    ? cpRows.map(r => {
      const noteKeyC = 'rototech-note-' + (r.customer || '').replace(/\s+/g, '_');
      const hasNoteC = !!localStorage.getItem(noteKeyC);
      return `<tr><td style="font-weight:500;cursor:pointer;" onclick="openCustomerNote('${r.customer}')" title="Click to add note">${r.customer}${hasNoteC ? '<span style="font-size:10px">📝</span>' : ''}</td><td><span class="badge badge-yellow">${r.plant}</span></td><td class="amount-cell">${fmtM(r.amount)}</td></tr>`;
    }).join('')
    : '<tr class="empty-row"><td colspan="3">No data</td></tr>';

  // Re-initialize water tracker and task counter after DOM render
  setTimeout(() => {
    startLiveClock();
    initWaterTracker();
    updateMiniTaskCount();
  }, 50);
}

function renderOverviewCharts() {
  const D = DATA;
  if (D.revenueByMonth?.length) renderRevTrend(D.revenueByMonth);
  if (D.revenueByIndustry?.length) renderIndustry(D.revenueByIndustry);

  if (D.revenueByPlant?.length) {
    renderVBar('chartPlants',
      D.revenueByPlant.map(d => shorten(d.plant)),
      D.revenueByPlant.map(d => d.revenue),
      { colors: D.revenueByPlant.map((__, i) => i === 0 ? '#F2D94A' : '#1A1A1A') }
    );
  }
  if (D.revenueByRegion?.length) {
    renderVBar('chartRegions', D.revenueByRegion.map(d => d.region), D.revenueByRegion.map(d => d.revenue));
  }
  if (D.revenueBySalesperson?.length) {
    renderVBar('chartSales',
      D.revenueBySalesperson.map(d => d.name.split(' ')[0]),
      D.revenueBySalesperson.map(d => d.revenue),
      { tickColor: 'rgba(26,26,26,.6)' }
    );
  }
}

// -- TX FILTER --
function populateTxFilters() {
  const TX = ALL_TRANSACTIONS;
  fillSelect('txPlant', [...new Set(TX.map(t => t.plant))].filter(Boolean).sort());
  fillSelect('txIndustry', [...new Set(TX.map(t => t.industry))].filter(Boolean).sort());
  fillSelect('txSalesperson', [...new Set(TX.map(t => t.salesperson))].filter(Boolean).sort());
  fillSelect('txRegion', [...new Set(TX.map(t => t.region))].filter(Boolean).sort());
  document.getElementById('txCount').textContent = TX.length + ' / ' + TX.length + ' rows';
}

function fillSelect(id, options) {
  const sel = document.getElementById(id);
  if (!sel) return;
  const firstText = sel.options[0]?.text || '';
  sel.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = ''; placeholder.textContent = firstText || '— All —';
  sel.add(placeholder);
  options.forEach(o => {
    const op = document.createElement('option');
    op.value = op.textContent = o;
    sel.add(op);
  });
}

let txCurrentPage = 1;
let txRowsPerPage = 100;
let txFilteredRows = [];
let txSearchQuery = '';

function applyTxFilter() {
  const rc = ALL_TRANSACTIONS || [];

  const q = (document.getElementById('txSearch').value || '').trim().toLowerCase();
  const from = document.getElementById('txDateFrom').value;
  const to = document.getElementById('txDateTo').value;
  const plant = document.getElementById('txPlant').value;
  const ind = document.getElementById('txIndustry').value;
  const sp = document.getElementById('txSalesperson').value;
  const reg = document.getElementById('txRegion').value;

  // Mark select active
  ['txPlant', 'txIndustry', 'txSalesperson', 'txRegion'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('active-filter', !!el.value);
  });

  txFilteredRows = rc.filter(row => {
    // Customer search — case insensitive partial match
    if (q && !(row.customer || '').toLowerCase().includes(q)) return false;

    // Date range
    if (from || to) {
      const d = new Date(row.date);
      if (from && d < new Date(from)) return false;
      if (to && d > new Date(to)) return false;
    }

    // Dropdowns — exact match
    if (plant && row.plant !== plant) return false;
    if (ind && row.industry !== ind) return false;
    if (sp && row.salesperson !== sp) return false;
    if (reg && row.region !== reg) return false;

    return true;
  });

  txSearchQuery = q;
  txCurrentPage = 1;
  renderTxPage();
}

function resetTxFilter() {
  ['txSearch', 'txDateFrom', 'txDateTo', 'txPlant', 'txIndustry', 'txSalesperson', 'txRegion'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.value = ''; el.classList.remove('active-filter'); }
  });
  applyTxFilter();
}

function renderTxPage() {
  const total = txFilteredRows.length;
  const countEl = document.getElementById('txCount');
  if (countEl) countEl.textContent = `${total} / ${ALL_TRANSACTIONS.length} rows`;

  let start = 0;
  let end = total;

  const isAll = txRowsPerPage === 'all';
  if (!isAll) {
    const size = parseInt(txRowsPerPage, 10);
    start = (txCurrentPage - 1) * size;
    end = Math.min(start + size, total);
  }

  const sub = document.getElementById('txCountSubtitle');
  if (sub) {
    if (total === 0) sub.textContent = 'Showing 0 orders';
    else if (isAll) sub.textContent = `Showing all ${total} orders`;
    else sub.textContent = `Showing ${start + 1}–${end} of ${total} orders`;
  }

  const statusLine = document.getElementById('txPageStatus');
  const btnP = document.getElementById('btnTxPrev');
  const btnN = document.getElementById('btnTxNext');

  if (statusLine) {
    if (isAll || total === 0) {
      statusLine.textContent = 'Page 1 of 1';
      btnP.disabled = true; btnP.style.opacity = '0.5';
      btnN.disabled = true; btnN.style.opacity = '0.5';
    } else {
      const tPages = Math.ceil(total / parseInt(txRowsPerPage, 10));
      statusLine.textContent = `Page ${txCurrentPage} of ${tPages}`;
      btnP.disabled = txCurrentPage === 1; btnP.style.opacity = txCurrentPage === 1 ? '0.5' : '1';
      btnN.disabled = txCurrentPage === tPages; btnN.style.opacity = txCurrentPage === tPages ? '0.5' : '1';
    }
  }

  const pageData = isAll ? txFilteredRows : txFilteredRows.slice(start, end);
  populateTxTable(pageData, txSearchQuery);
}

function changeTxPageSize() {
  const sel = document.getElementById('txRowsPerPage');
  txRowsPerPage = sel.value;
  txCurrentPage = 1;
  renderTxPage();
}

function txPrevPage() {
  if (txCurrentPage > 1) {
    txCurrentPage--;
    renderTxPage();
  }
}

function txNextPage() {
  const totalPages = Math.ceil(txFilteredRows.length / parseInt(txRowsPerPage, 10));
  if (txCurrentPage < totalPages) {
    txCurrentPage++;
    renderTxPage();
  }
}

function toggleTxExpanded() {
  const card = document.getElementById('txCard');
  if (!card) return;
  const isExpanded = card.classList.toggle('tx-expanded-card');

  let overlay = document.getElementById('txExpOver');
  let closeBtn = document.getElementById('txExpClose');

  if (isExpanded) {
    document.body.classList.add('tx-modal-open');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'txExpOver';
      overlay.className = 'tx-expanded-overlay open';
      document.body.appendChild(overlay);

      closeBtn = document.createElement('button');
      closeBtn.id = 'txExpClose';
      closeBtn.className = 'tx-expanded-close';
      closeBtn.innerHTML = '✕';
      closeBtn.onclick = toggleTxExpanded;
      card.appendChild(closeBtn);

      overlay.onclick = toggleTxExpanded;
      card.onclick = (e) => e.stopPropagation();
    } else {
      overlay.classList.add('open');
      if (closeBtn) closeBtn.style.display = 'flex';
    }
  } else {
    document.body.classList.remove('tx-modal-open');
    if (overlay) overlay.classList.remove('open');
    if (closeBtn) closeBtn.style.display = 'none';
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const card = document.getElementById('txCard');
    if (card && card.classList.contains('tx-expanded-card')) {
      toggleTxExpanded();
    }
  }
});

function toggleColDropdown() {
  const d = document.getElementById('colDropdown');
  if (!d) return;
  d.style.display = d.style.display === 'none' ? 'block' : 'none';
}

function applyColToggle() {
  const cols = ['date', 'customer', 'plant', 'industry', 'salesperson', 'region', 'value'];
  const prefs = {};

  cols.forEach((c) => {
    const chk = document.getElementById('chk_' + c);
    if (!chk) return;
    prefs[c] = chk.checked;

    // Toggle Headers and td cells using the assigned classes instead of nth-child
    const els = document.querySelectorAll('.tx-table .col-' + c);
    els.forEach(el => el.style.display = chk.checked ? '' : 'none');
  });

  localStorage.setItem('txColPrefs', JSON.stringify(prefs));
}

function loadColPrefs() {
  try {
    const prefs = JSON.parse(localStorage.getItem('txColPrefs'));
    if (prefs) {
      Object.keys(prefs).forEach(c => {
        const chk = document.getElementById('chk_' + c);
        if (chk) chk.checked = prefs[c];
      });
    }
  } catch (e) { }
}

function detectAnomaly(amount, allAmounts) {
  const valid = allAmounts.filter(v => v > 0);
  if (valid.length < 3) return 'normal';
  const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
  const std = Math.sqrt(valid.map(v => (v - avg) ** 2).reduce((a, b) => a + b, 0) / valid.length);
  if (amount > avg + 2 * std) return 'high';
  if (amount < avg - 2 * std && amount > 0) return 'low';
  return 'normal';
}

function populateTxTable(rows, highlightQuery = '') {
  const tbody = document.getElementById('txBody');
  const allAmounts = (DATA.recentTransactions || []).map(r => r.amount).filter(Boolean);

  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--light-gray);padding:24px;font-style:italic">No matching orders — try adjusting your filters <a href="javascript:resetTxFilter()" style="text-decoration:underline;margin-left:8px">Reset</a></td></tr>';
    return;
  }

  tbody.innerHTML = rows.map(row => {
    const cust = row.customer || '—';
    const highlighted = highlightQuery
      ? cust.replace(new RegExp(`(${highlightQuery})`, 'gi'), '<mark style="background:#F2D94A;border-radius:2px;padding:0 2px">$1</mark>')
      : cust;
    const noteKey = 'rototech-note-' + (row.customer || '').replace(/\s+/g, '_');
    const hasNote = !!localStorage.getItem(noteKey);
    const anomaly = detectAnomaly(row.amount, allAmounts);
    const aStyle = anomaly === 'high'
      ? 'background:rgba(34,197,94,0.1);color:#16A34A;border-radius:6px;padding:2px 6px;'
      : anomaly === 'low'
        ? 'background:rgba(239,68,68,0.1);color:#DC2626;border-radius:6px;padding:2px 6px;'
        : '';
    const aIcon = anomaly === 'high' ? ' 📈' : anomaly === 'low' ? ' 📉' : '';

    return `<tr>
        <td class="col-date" style="white-space:nowrap;font-family:var(--mono);font-size:11px">${row.date || '—'}</td>
        <td class="col-customer" style="font-weight:500;cursor:pointer;" onclick="openCustomerNote('${row.customer}')" title="Click to add note">${highlighted}${hasNote ? '<span style="font-size:10px">📝</span>' : ''}</td>
        <td class="col-plant"><span class="badge badge-dark">${row.plant || '—'}</span></td>
        <td class="col-industry">${row.industry || '—'}</td>
        <td class="col-salesperson">${row.salesperson || '—'}</td>
        <td class="col-region">${row.region || '—'}</td>
        <td class="col-value amount-cell mono" style="font-weight:600;${aStyle}">${fmtM(row.amount)}${aIcon}</td>
      </tr>`;
  }).join('') + `
  <tr><td colspan="7" style="border-top:none;padding:0;">
    <div style="display:flex;gap:12px;margin-top:8px;font-size:10px;color:var(--mid-gray);">
      <span>📈 Unusually high order</span>
      <span>📉 Unusually low order</span>
    </div>
  </td></tr>`;

  requestAnimationFrame(applyColToggle);
}

// Ensure prefs are loaded initially
loadColPrefs();





// ---- TARGETS TAB ----
function renderTargetsTab() {
  const topProds = (DATA.revenueByPlant || []).slice(0, 5);
  const topReps = (DATA.revenueBySalesperson || []).slice(0, 4);

  TARGET_ITEMS = [
    ...topProds.map(p => ({ key: 'prod_' + p.plant, label: p.plant, actual: p.revenue, target: Math.round(p.revenue * 1.2) })),
    ...topReps.map(r => ({ key: 'rep_' + r.name, label: r.name, actual: r.revenue, target: Math.round(r.revenue * 1.2) }))
  ];

  if (!Object.keys(TARGETS).length) {
    TARGET_ITEMS.forEach(it => { TARGETS[it.key] = it.target; });
  } else {
    TARGET_ITEMS.forEach(it => { if (!TARGETS[it.key]) TARGETS[it.key] = it.target; });
  }

  document.getElementById('targetInputGrid').innerHTML = TARGET_ITEMS.map(it => `
    <div class="target-input-item">
      <label class="target-input-label">${it.label}</label>
      <input class="target-input-field" type="number" id="tinput_${it.key}" value="${TARGETS[it.key] || it.target}"/>
    </div>`).join('');

  renderTargetCards(TARGET_ITEMS);
  // charts rendered lazily when tab shown
}

function updateTargets() {
  document.querySelectorAll('.target-input-field').forEach(inp => {
    TARGETS[inp.id.replace('tinput_', '')] = parseFloat(inp.value) || 0;
  });
  renderTargetCards(TARGET_ITEMS);
  renderTargetCharts(TARGET_ITEMS);
}

function renderTargetCharts(items) {
  const isDark = document.body.getAttribute('data-theme') === 'dark';
  const cAccent = isDark ? '#7C3AED' : '#F2D94A';
  const cDark = isDark ? '#06B6D4' : '#1A1A1A';
  const prods = items.filter(it => it.key.startsWith('prod_'));
  const reps = items.filter(it => it.key.startsWith('rep_'));
  const mk = (id, arr) => renderGroupedBar(id, arr.map(it => shorten(it.label)), [
    { label: 'Actual', data: arr.map(it => it.actual), backgroundColor: cAccent, borderRadius: 4 },
    { label: 'Target', data: arr.map(it => TARGETS[it.key] || it.target), backgroundColor: cDark, borderRadius: 4 }
  ]);
  if (prods.length) mk('chartTargetProd', prods);
  if (reps.length) mk('chartTargetSales', reps);
}

function renderTargetCards(items) {
  document.getElementById('targetCards').innerHTML = items.map(it => {
    const target = TARGETS[it.key] || it.target;
    const pct = target ? Math.min(200, Math.round(it.actual / target * 100)) : 0;
    const color = pct >= 100 ? '#1A1A1A' : '#F2D94A';
    return `<div class="target-card">
      <div class="target-card-name" title="${it.label}">${it.label}</div>
      <div class="target-vals"><span>${fmtM(it.actual)}</span><span>Goal: ${fmtM(target)}</span></div>
      <div class="target-prog-track"><div class="target-prog-fill" style="width:${Math.min(100, pct)}%;background:${color}"></div></div>
      <div class="target-pct" style="color:${color}">${pct}%</div>
    </div>`;
  }).join('');
}

// ---- INTELLIGENCE TAB ----
function renderIntelligence() {
  const velocityData = calcDealVelocity();
  const isDark = document.body.getAttribute('data-theme') === 'dark';

  // Stage colors for light/dark themes
  const stageColors = isDark ? {
    Lead: 'rgba(148,163,184,0.1)',
    Quote: 'rgba(234,179,8,0.15)',
    Negotiation: 'rgba(124,58,237,0.2)',
    Won: 'rgba(34,197,94,0.15)',
    Lost: 'rgba(239,68,68,0.15)'
  } : {
    Lead: '#EAE9D8',
    Quote: '#FFF3CC',
    Negotiation: '#E8E6FF',
    Won: '#E0F7EF',
    Lost: '#FFE8E8'
  };

  // Render timeline
  const timelineEl = document.getElementById('velocityTimeline');
  const totalDays = velocityData.reduce((sum, d) => sum + d.avgDays, 0);

  timelineEl.innerHTML = `
    <div style="display:flex;height:48px;border-radius:8px;overflow:hidden;margin-bottom:8px">
      ${velocityData.map(d => {
    const widthPct = (d.avgDays / totalDays) * 100;
    return `<div style="width:${widthPct}%;background:${stageColors[d.stage]};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:${isDark ? '#fff' : '#333'};border-right:1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#fff'}">
          ${d.stage}
        </div>`;
  }).join('')}
    </div>
    <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--mid-gray)">
      ${velocityData.map(d => `<span>${d.avgDays} days</span>`).join('')}
    </div>
  `;

  // Render table
  const tbody = document.getElementById('velocityBody');
  tbody.innerHTML = velocityData.map(d => {
    const status = d.avgDays < 10 ? '🟢 Fast' : d.avgDays < 25 ? '🟡 Normal' : '🔴 Stuck';
    return `<tr>
      <td><span class="badge" style="background:${stageColors[d.stage]};color:${isDark ? '#fff' : '#333'}">${d.stage}</span></td>
      <td class="amount-cell">${d.count}</td>
      <td class="amount-cell">${d.avgDays}</td>
      <td class="amount-cell">${fmtM(d.totalValue)}</td>
      <td>${status}</td>
    </tr>`;
  }).join('');

  // Show warning if Negotiation deals > 2
  const negotiationCount = velocityData.find(d => d.stage === 'Negotiation')?.count || 0;
  const warningEl = document.getElementById('velocityWarning');
  if (warningEl) {
    warningEl.style.display = negotiationCount > 2 ? 'inline' : 'none';
  }

  // Render Customer Health Score cards
  const healthData = calcCustomerHealth();
  const healthGrid = document.getElementById('healthCardsGrid');
  if (healthGrid) {
    healthGrid.innerHTML = healthData.map(h => {
      const statusIcon = h.score >= 70 ? '🟢' : h.score >= 40 ? '🟡' : '🔴';
      const noteKeyH = 'rototech-note-' + (h.customer || '').replace(/\s+/g, '_');
      const hasNoteH = !!localStorage.getItem(noteKeyH);
      return `<div class="health-card">
        <div class="health-card-header">
          <span class="health-customer-name" style="cursor:pointer;" onclick="openCustomerNote('${h.customer}')" title="Click to add note">${h.customer}${hasNoteH ? '<span style="font-size:10px">📝</span>' : ''}</span>
        </div>
        <div class="health-card-body">
          <div class="health-score-ring">${scoreRing(h.score, h.color)}</div>
          <div class="health-details">
            <div class="health-status-badge" style="background:${h.color}20;color:${h.color};border:1px solid ${h.color}40">
              ${statusIcon} ${h.status}
            </div>
            <div class="health-meta">Last order ${h.daysSince === 999 ? 'never' : h.daysSince + ' days ago'}</div>
            <div class="health-revenue">${fmtM(h.totalRev)} · ${h.orderCount} orders</div>
          </div>
        </div>
      </div>`;
    }).join('');
  }

  // Render Revenue Forecaster
  const forecastData = calcRevenueForecast();
  const forecastNumEl = document.getElementById('forecastNumber');
  const forecastTrendEl = document.getElementById('forecastTrend');
  const forecastConfEl = document.getElementById('forecastConfidence');
  const forecastMetaEl = document.getElementById('forecastMeta');

  if (forecastData && forecastNumEl) {
    forecastNumEl.textContent = fmtM(forecastData.forecast);

    const trendArrow = forecastData.trendPct >= 0 ? '▲' : '▼';
    const trendColor = forecastData.trendPct >= 0 ? '#22C55E' : '#EF4444';
    forecastTrendEl.innerHTML = `<span style="color:${trendColor};font-size:18px;font-weight:700">${trendArrow} ${Math.abs(forecastData.trendPct)}%</span>`;

    const confColor = forecastData.confidence >= 80 ? '#22C55E' : forecastData.confidence >= 60 ? '#F59E0B' : '#EF4444';
    forecastConfEl.innerHTML = `<span class="confidence-pill" style="background:${confColor}20;color:${confColor};border:1px solid ${confColor}40;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600">${forecastData.confidence}% confidence</span>`;

    forecastMetaEl.textContent = `Based on ₹${(forecastData.avg / 100000).toFixed(1)}L avg of last 3 months · Trend: ${forecastData.trend >= 0 ? '+' : ''}₹${(forecastData.trend / 100000).toFixed(1)}L per month`;

    // Render sparkline chart
    const ctx = document.getElementById('forecastSparkline');
    if (ctx) {
      destroyChart('forecastSparkline');
      const isDark = document.body.getAttribute('data-theme') === 'dark';
      const barColor = isDark ? '#7C3AED' : '#F2D94A';
      const forecastColor = isDark ? '#06B6D4' : '#1A1A1A';
      const last3Months = DATA.revenueByMonth.slice(-3);
      const labels = [...last3Months.map(m => m.month.split(' ')[0]), forecastData.nextMonth];
      const data = [...forecastData.last3, forecastData.forecast];

      makeChart('forecastSparkline', {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: [...Array(3).fill(barColor), forecastColor],
            borderRadius: 4,
            borderDash: [0, 0, 0, 5]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }, tooltip: {
              callbacks: { label: (ctx) => ` ${fmtM(ctx.raw)}` }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: isDark ? '#94A3B8' : '#888', font: { size: 10 } }
            },
            y: {
              display: false,
              min: 0
            }
          }
        }
      });
    }
  } else if (forecastNumEl) {
    forecastNumEl.textContent = '—';
    forecastTrendEl.textContent = 'Need 3+ months of data';
    forecastConfEl.textContent = '';
    forecastMetaEl.textContent = '';
    destroyChart('forecastSparkline');
  }

  // Render Seasonal Pattern Detector
  const seasonalData = calcSeasonalPattern();
  const seasonalEl = document.getElementById('seasonalHeatmap');
  if (seasonalEl) {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    seasonalEl.innerHTML = `<div class="seasonal-grid">
      ${seasonalData.map(d => {
      let bgColor, textColor;
      if (d.revenue === 0) {
        bgColor = isDark ? '#0D1526' : '#F0F0F0';
        textColor = isDark ? '#475569' : '#888';
      } else if (d.label === 'Peak') {
        bgColor = isDark ? 'rgba(124,58,237,0.4)' : '#F2D94A';
        textColor = isDark ? '#fff' : '#1A1A1A';
      } else if (d.label === 'Low') {
        bgColor = isDark ? 'rgba(255,255,255,0.03)' : '#F5F4E8';
        textColor = isDark ? '#94A3B8' : '#888';
      } else {
        bgColor = isDark ? 'rgba(6,182,212,0.15)' : '#EAE9D8';
        textColor = isDark ? '#CBD5E1' : '#555';
      }
      const badge = d.label === 'Peak' ? ' 🔥' : d.label === 'Low' ? ' ❄️' : '';
      return `<div class="seasonal-cell" style="background:${bgColor};color:${textColor}">
          <div class="seasonal-month">${d.month}${badge}</div>
          <div class="seasonal-revenue">${d.revenue > 0 ? fmtM(d.revenue) : '—'}</div>
        </div>`;
    }).join('')}
    </div>`;
  }

  // Initialize comparison dropdowns
  populateCompareDropdowns();

  // Render Smart Follow-up List
  const followUpData = calcFollowUpList();
  const followUpCountEl = document.getElementById('followUpCount');
  const followUpEmptyEl = document.getElementById('followUpEmpty');
  const followUpTableWrapEl = document.getElementById('followUpTableWrap');
  const followUpBodyEl = document.getElementById('followUpBody');

  if (followUpCountEl) {
    if (followUpData.length === 0) {
      followUpCountEl.textContent = '';
      followUpEmptyEl.style.display = 'block';
      followUpTableWrapEl.style.display = 'none';
    } else {
      followUpCountEl.textContent = `${followUpData.length} customers need follow-up`;
      followUpEmptyEl.style.display = 'none';
      followUpTableWrapEl.style.display = 'block';

      followUpBodyEl.innerHTML = followUpData.map(c => {
        const priority = c.daysSince > 120 ? { icon: '🔴', label: 'Urgent', color: '#EF4444' } :
          c.daysSince > 90 ? { icon: '🟡', label: 'High', color: '#F59E0B' } :
            { icon: '🟢', label: 'Normal', color: '#22C55E' };
        const lastDateStr = c.lastDate ? c.lastDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Never';
        const noteKeyF = 'rototech-note-' + (c.customer || '').replace(/\s+/g, '_');
        const hasNoteF = !!localStorage.getItem(noteKeyF);
        return `<tr>
          <td><span class="badge" style="background:${priority.color}20;color:${priority.color};border:1px solid ${priority.color}40">${priority.icon} ${priority.label}</span></td>
          <td style="font-weight:500;cursor:pointer;" onclick="openCustomerNote('${c.customer}')" title="Click to add note"><strong>${c.customer}</strong>${hasNoteF ? '<span style="font-size:10px">📝</span>' : ''}</td>
          <td>${lastDateStr}</td>
          <td class="amount-cell">${c.daysSince}</td>
          <td class="amount-cell">${fmtM(c.totalRev)}</td>
          <td><span class="badge badge-dark">${c.lastPlant}</span></td>
          <td>${c.salesperson}</td>
          <td><button onclick="openWhatsApp('${c.customer}', ${c.daysSince}, '${c.lastPlant}')" style="background:#25D366;color:#fff;border:none;border-radius:20px;padding:5px 12px;font-size:11px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:5px;white-space:nowrap;"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>WhatsApp</button></td>
        </tr>`;
      }).join('');
    }
  }
}

// ---- FOLD / ORIENTATION RESIZE HANDLER ----
// Destroys and recreates all charts when the screen size changes significantly
// (e.g. Samsung Z Fold folding/unfolding). Without this, Chart.js canvases
// freeze at the wrong size on screen-change events.
let _lastW = window.innerWidth;
let _resizeTimer = null;

function handleOrientationOrResize() {
  // Only re-render if width changed significantly (>50px), avoids keyboard-open triggers
  if (Math.abs(window.innerWidth - _lastW) < 50) return;
  _lastW = window.innerWidth;
  if (!DATA) return; // nothing to re-render yet
  clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(() => {
    // Destroy all Chart.js instances via the registry in charts.js
    if (typeof destroyAllCharts === 'function') destroyAllCharts();
    TABS_RENDERED = {}; // force all tabs to re-render their charts
    // Re-render current visible tab charts
    const activeTab = document.querySelector('.nav-tab.active');
    if (activeTab) {
      const name = activeTab.id.replace('nav', '').toLowerCase();
      renderTabCharts(name);
    }
    console.log('[Orientation] Charts re-rendered for new width:', window.innerWidth);
  }, 350);
}

// Listen to both events — screen.orientation covers fold, resize covers browser window changes
if (screen.orientation) {
  screen.orientation.addEventListener('change', handleOrientationOrResize);
}
window.addEventListener('resize', handleOrientationOrResize);



function shorten(str, max = 10) {
  if (!str) return '';
  return str.length > max ? str.substring(0, max) + '…' : str;
}

// ==== PDF EXPORT (jsPDF + autoTable) ====
function exportPDF() {
  generateProfessionalPDF();
}

function generateProfessionalPDF() {
  if (!DATA) {
    alert('Please load a Google Sheet first before exporting.');
    return;
  }

  const doc = new jspdf.jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Section title bar helper
  function sectionTitle(doc, title, y) {
    doc.setFillColor(26, 26, 26);
    doc.rect(15, y, 180, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 19, y + 5.5);
    doc.setTextColor(26, 26, 26);
    return y + 12; // return next Y position
  }

  const tableStyles = {
    headStyles: {
      fillColor: [26, 26, 26],      // near-black
      textColor: [255, 255, 255],   // white
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [26, 26, 26],
    },
    alternateRowStyles: {
      fillColor: [245, 244, 232],   // --cream
    },
    columnStyles: {
      0: { cellWidth: 10 },         // rank column narrow
    },
    margin: { left: 15, right: 15 },
    tableLineColor: [234, 233, 216], // --cream2
    tableLineWidth: 0.1,
    didParseCell: (data) => {
      if (data.row.index === 0 && data.section === 'body') {
        data.cell.styles.fillColor = [242, 217, 74]; // --yellow
        data.cell.styles.textColor = [26, 26, 26];
        data.cell.styles.fontStyle = 'bold';
      }
    }
  };

  // --- PAGE 1: COVER PAGE ---
  doc.setFillColor(26, 26, 26);
  doc.rect(15, 15, 180, 15, 'F'); // Dark rectangle top strip 15mm tall

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('ROTOTECH ENGINEERING SYSTEMS', 20, 25);

  doc.setTextColor(242, 217, 74); // #F2D94A
  doc.setFontSize(11);
  doc.text('Sales Performance Report', 130, 25);

  doc.setTextColor(26, 26, 26);
  doc.setFontSize(28);
  doc.text('Sales Performance Report', 15, 55);

  const K = DATA.kpis || {};
  const dates = ALL_TRANSACTIONS.map(r => new Date(r.date)).filter(d => !isNaN(d));
  let earliest = 'N/A', latest = 'N/A';
  if (dates.length) {
    const minD = new Date(Math.min(...dates));
    const maxD = new Date(Math.max(...dates));
    // const dtOpts = { year: 'numeric', month: 'short', day: 'numeric' };
    const dtOpts = { day: 'numeric', month: 'short', year: 'numeric' };
    earliest = minD.toLocaleDateString('en-GB', dtOpts);
    latest = maxD.toLocaleDateString('en-GB', dtOpts);
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(136, 136, 136); // #888
  const today = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(`Generated: ${today}`, 15, 70);

  const srcPill = document.getElementById('fileNamePill');
  doc.text(`Data Source: ${srcPill ? srcPill.textContent : 'Unknown'}`, 15, 76);
  doc.text(`Report Period: ${earliest} – ${latest}`, 15, 82);

  doc.setDrawColor(234, 233, 216);
  doc.setLineWidth(0.5);
  doc.line(15, 95, 195, 95);

  // SUMMARY SNAPSHOT
  doc.setFontSize(8);
  doc.text('SUMMARY SNAPSHOT', 15, 105);

  doc.setFontSize(10);
  doc.setTextColor(136, 136, 136);
  doc.text('Total Orders', 15, 115);
  doc.text('Total Revenue', 90, 115);

  doc.setFontSize(18);
  doc.setTextColor(26, 26, 26);
  doc.setFont('helvetica', 'bold');
  doc.text((K.totalOrders || 0).toLocaleString('en-IN'), 15, 122);
  doc.text(fmtM(K.totalRevenue || 0), 90, 122);

  doc.setFontSize(10);
  doc.setTextColor(136, 136, 136);
  doc.setFont('helvetica', 'normal');
  doc.text('Avg Order Value', 15, 135);
  doc.text('Top Customer', 90, 135);

  doc.setFontSize(14);
  doc.setTextColor(26, 26, 26);
  doc.setFont('helvetica', 'bold');
  doc.text(fmtM(K.avgOrderValue || 0), 15, 142);
  doc.text(K.topCustomer || '—', 90, 142);

  doc.setFontSize(10);
  doc.setTextColor(136, 136, 136);
  doc.setFont('helvetica', 'normal');
  doc.text('Top Plant', 15, 155);
  doc.text('Top Region', 90, 155);

  const topPlant = DATA.revenueByPlant?.[0]?.plant || '—';
  const topRegion = DATA.revenueByRegion?.[0]?.region || '—';

  doc.setFontSize(14);
  doc.setTextColor(26, 26, 26);
  doc.setFont('helvetica', 'bold');
  doc.text(topPlant, 15, 162);
  doc.text(topRegion, 90, 162);

  doc.setFontSize(10);
  doc.setTextColor(136, 136, 136);
  doc.setFont('helvetica', 'normal');
  doc.text('Top Salesperson', 15, 175);
  doc.text('Top Industry', 90, 175);

  const topRep = DATA.revenueBySalesperson?.[0]?.name || '—';
  const inds = {};
  ALL_TRANSACTIONS.forEach(r => { if (r.industry) inds[r.industry] = (inds[r.industry] || 0) + r.amount; });
  const topInd = Object.entries(inds).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

  doc.setFontSize(14);
  doc.setTextColor(26, 26, 26);
  doc.setFont('helvetica', 'bold');
  doc.text(topRep, 15, 182);
  doc.text(topInd, 90, 182);

  doc.setLineWidth(0.5);
  doc.setDrawColor(234, 233, 216);
  doc.line(15, 195, 195, 195);

  doc.setFontSize(8);
  doc.setTextColor(136, 136, 136);
  doc.setFont('helvetica', 'normal');
  doc.text('Confidential — Internal Use Only', 105, 285, { align: 'center' });


  // --- PAGE 2: REVENUE BREAKDOWN ---
  doc.addPage();
  let yPos = 20;
  yPos = sectionTitle(doc, "REVENUE BREAKDOWN", yPos);

  // Table 1 - Revenue by Plant
  doc.setFontSize(10);
  doc.setTextColor(26, 26, 26);
  doc.setFont('helvetica', 'bold');
  doc.text('Revenue by Plant', 15, yPos);
  yPos += 4;

  doc.autoTable({
    startY: yPos,
    head: [['#', 'Plant', 'Total Revenue', 'Orders', 'Avg Value', '% Share']],
    body: (DATA.revenueByPlant || []).map((r, i) => [
      i + 1,
      r.plant || r.product || 'Unknown',
      fmtM(r.revenue),
      r.orders,
      fmtM(Math.round(r.revenue / (r.orders || 1))),
      ((r.revenue / (DATA.kpis.totalRevenue || 1)) * 100).toFixed(1) + '%'
    ]),
    ...tableStyles
  });

  yPos = doc.lastAutoTable.finalY + 10;

  // Table 2 - Revenue by Region
  doc.setFontSize(10);
  doc.setTextColor(26, 26, 26);
  doc.setFont('helvetica', 'bold');
  doc.text('Revenue by Region', 15, yPos);
  yPos += 4;

  doc.autoTable({
    startY: yPos,
    head: [['#', 'Region', 'Total Revenue', '% of Total']],
    body: (DATA.revenueByRegion || []).map((r, i) => [
      i + 1,
      r.region,
      fmtM(r.revenue),
      ((r.revenue / (DATA.kpis.totalRevenue || 1)) * 100).toFixed(1) + '%'
    ]),
    ...tableStyles
  });

  yPos = doc.lastAutoTable.finalY + 10;

  // Table 3 - Revenue by Industry
  const indArr = Object.entries(inds).sort((a, b) => b[1] - a[1]).map(e => ({ ind: e[0], rev: e[1] }));

  doc.setFontSize(10);
  doc.setTextColor(26, 26, 26);
  doc.setFont('helvetica', 'bold');
  doc.text('Revenue by Industry', 15, yPos);
  yPos += 4;

  doc.autoTable({
    startY: yPos,
    head: [['#', 'Industry', 'Total Revenue', '% of Total']],
    body: indArr.map((r, i) => [
      i + 1,
      r.ind,
      fmtM(r.rev),
      ((r.rev / (DATA.kpis.totalRevenue || 1)) * 100).toFixed(1) + '%'
    ]),
    ...tableStyles
  });


  // --- PAGE 3: SALESPERSON PERFORMANCE ---
  doc.addPage();
  yPos = 20;
  yPos = sectionTitle(doc, "SALESPERSON PERFORMANCE", yPos);

  doc.autoTable({
    startY: yPos,
    head: [['#', 'Salesperson', 'Total Revenue', 'Orders', 'Avg Order Value', '% of Total']],
    body: (DATA.revenueBySalesperson || []).map((r, i) => [
      i + 1,
      r.name,
      fmtM(r.revenue),
      r.orders,
      fmtM(Math.round(r.revenue / (r.orders || 1))),
      ((r.revenue / (DATA.kpis.totalRevenue || 1)) * 100).toFixed(1) + '%'
    ]),
    ...tableStyles
  });

  yPos = doc.lastAutoTable.finalY + 15;

  const reps = DATA.revenueBySalesperson || [];
  if (reps.length > 0) {
    doc.setFontSize(10);
    doc.setTextColor(26, 26, 26);
    doc.setFont('helvetica', 'bold');
    doc.text('Performance Tiers', 15, yPos);
    yPos += 6;

    doc.setFont('helvetica', 'normal');
    doc.text(`\u2022 Top Performer:    ${reps[0].name} — ${fmtM(reps[0].revenue)} across ${reps[0].orders} orders`, 15, yPos);
    yPos += 6;
    if (reps.length > 1) {
      doc.text(`\u2022 2nd Place:        ${reps[1].name} — ${fmtM(reps[1].revenue)}`, 15, yPos);
      yPos += 6;
    }
    if (reps.length > 2) {
      const wrst = reps[reps.length - 1];
      doc.text(`\u2022 Needs Support:    ${wrst.name} — lowest revenue at ${fmtM(wrst.revenue)}`, 15, yPos);
    }
  }


  // --- PAGE 4: CUSTOMER ANALYSIS ---
  doc.addPage();
  yPos = 20;
  yPos = sectionTitle(doc, "CUSTOMER ANALYSIS", yPos);

  const custData = {};
  ALL_TRANSACTIONS.forEach(rx => {
    const c = rx.customer || 'Unknown';
    if (!custData[c]) custData[c] = { rev: 0, orders: 0, d: 0 };
    custData[c].rev += rx.amount;
    custData[c].orders += 1;
    const td = new Date(rx.date).getTime();
    if (!isNaN(td) && td > custData[c].d) custData[c].d = td;
  });

  const topCArr = Object.entries(custData).map(e => ({ name: e[0], ...e[1] })).sort((a, b) => b.rev - a.rev);
  const totalC = topCArr.length;
  const top5Rev = topCArr.slice(0, 5).reduce((sum, c) => sum + c.rev, 0);
  const top5Pct = ((top5Rev / (DATA.kpis.totalRevenue || 1)) * 100).toFixed(1);
  const avgOrdersCust = (totalC ? K.totalOrders / totalC : 0).toFixed(1);

  doc.autoTable({
    startY: yPos,
    head: [['#', 'Customer', 'Total Revenue', 'Orders', 'Avg Order Value', 'Last Order Date']],
    body: topCArr.slice(0, 20).map((r, i) => {
      const dOpts = { year: 'numeric', month: 'short', day: 'numeric' };
      const dStr = r.d > 0 ? new Date(r.d).toLocaleDateString('en-GB', dOpts) : '—';
      return [
        i + 1,
        r.name,
        fmtM(r.rev),
        r.orders,
        fmtM(Math.round(r.rev / (r.orders || 1))),
        dStr
      ];
    }),
    ...tableStyles
  });

  yPos = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(10);
  doc.setTextColor(26, 26, 26);
  doc.setFont('helvetica', 'normal');
  doc.text(`\u2022 Total Unique Customers: ${totalC}`, 15, yPos);
  yPos += 6;
  doc.text(`\u2022 Top 5 customers contribute ${top5Pct}% of total revenue`, 15, yPos);
  yPos += 6;
  doc.text(`\u2022 Average orders per customer: ${avgOrdersCust}`, 15, yPos);


  // --- PAGE 5: RECENT TRANSACTIONS ---
  doc.addPage();
  yPos = 20;
  yPos = sectionTitle(doc, "RECENT TRANSACTIONS (Last 50)", yPos);

  const rTxs = [...ALL_TRANSACTIONS].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 50);

  const txTableStyles = JSON.parse(JSON.stringify(tableStyles));
  txTableStyles.columnStyles = { ...txTableStyles.columnStyles, 0: { cellWidth: 20 }, 6: { halign: 'right', fontStyle: 'bold' } };

  doc.autoTable({
    startY: yPos,
    head: [['Date', 'Customer', 'Plant', 'Industry', 'Salesperson', 'Region', 'Value']],
    body: rTxs.map(r => [
      r.date || '—',
      shorten(r.customer || '—', 25),
      r.plant || '—',
      r.industry || '—',
      r.salesperson || '—',
      r.region || '—',
      fmtM(r.amount)
    ]),
    ...tableStyles,
    columnStyles: { ...tableStyles.columnStyles, 0: { cellWidth: 22 }, 6: { halign: 'right', fontStyle: 'bold', cellWidth: 20 } },
    didParseCell: (data) => {
      // Overriding didParseCell for this table slightly to avoid rank column issue if it's there
      if (data.row.index === 0 && data.section === 'body') {
        data.cell.styles.fillColor = [242, 217, 74];
        data.cell.styles.textColor = [26, 26, 26];
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });

  if (ALL_TRANSACTIONS.length > 50) {
    yPos = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(9);
    doc.setTextColor(136, 136, 136);
    doc.text(`Showing 50 of ${ALL_TRANSACTIONS.length} transactions. Full data available in Google Sheet.`, 15, yPos);
  }

  // --- PAGE 6: PIPELINE SUMMARY ---
  const pipeRows = DATA.pipeline || [];

  if (pipeRows.length > 0) {
    doc.addPage();
    yPos = 20;
    yPos = sectionTitle(doc, "PIPELINE SUMMARY", yPos);

    const tPipeValue = pipeRows.reduce((acc, c) => acc + (c.amount || 0), 0);
    const actDeals = pipeRows.filter(r => !['Won', 'Lost', 'Closed'].includes(r.stage)).length;
    const won = pipeRows.filter(r => r.stage === 'Won');
    const lost = pipeRows.filter(r => r.stage === 'Lost');
    const wonVal = won.reduce((acc, c) => acc + (c.amount || 0), 0);
    const lostVal = lost.reduce((acc, c) => acc + (c.amount || 0), 0);
    const winRate = (won.length > 0 || lost.length > 0) ? ((won.length / (won.length + lost.length)) * 100).toFixed(1) : 0;
    const avgDeal = pipeRows.length ? tPipeValue / pipeRows.length : 0;

    doc.setFontSize(10);
    doc.setTextColor(26, 26, 26);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Pipeline Value: ${fmtM(tPipeValue)}    Active Deals: ${actDeals}    Win Rate: ${winRate}%`, 15, yPos);
    yPos += 6;
    doc.text(`Won Value: ${fmtM(wonVal)}               Lost Value: ${fmtM(lostVal)}  Avg Deal Size: ${fmtM(avgDeal)}`, 15, yPos);
    yPos += 10;

    const pipeSorted = [...pipeRows].sort((a, b) => (b.amount || 0) - (a.amount || 0));

    doc.autoTable({
      startY: yPos,
      head: [['Customer', 'Plant', 'Stage', 'Value', 'Salesperson', 'Region']],
      body: pipeSorted.map(r => [
        r.customer || '—',
        r.plant || '—',
        r.stage || '—',
        fmtM(r.amount),
        r.salesperson || '—',
        r.region || '—'
      ]),
      ...tableStyles,
      columnStyles: { ...tableStyles.columnStyles, 0: { cellWidth: 25 }, 3: { halign: 'right', fontStyle: 'bold' } }
    });
  }

  // --- HEADER & FOOTER ON ALL PAGES ---
  const pageCount = doc.internal.getNumberOfPages();
  const dateIso = new Date().toISOString().split('T')[0];

  for (let i = 2; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(136, 136, 136);
    doc.setFont('helvetica', 'normal');

    // Header
    doc.text('Rototech Engineering Systems', 15, 10);
    doc.text(`Page ${i} of ${pageCount}`, 195, 10, { align: 'right' });
    doc.setDrawColor(234, 233, 216);
    doc.setLineWidth(0.1);
    doc.line(15, 12, 195, 12);

    // Footer
    doc.text(`Confidential — Generated ${dateIso} — Rototech Engineering Systems`, 105, 285, { align: 'center' });
  }

  // Save PDF
  doc.save(`Rototech_Sales_Report_${dateIso}.pdf`);
}

// ---- ATTACH UPLOAD HANDLERS ----
function attachUpload() {
  // Initialize upload screen handlers if needed
  console.log('[Rototech] Upload screen ready for Jignesh Patel');
}

// ---- GREETING SCREEN FUNCTION ----
function showGreetingThenConnect() {
  const name = 'Jignesh Patel';
  const greetScreen = document.getElementById('greetingScreen');
  greetScreen.style.display = 'flex';

  setTimeout(() => {
    const helloEl = document.getElementById('greetHello');
    helloEl.style.opacity = '1';
    helloEl.style.transform = 'translateY(0)';
  }, 150);

  setTimeout(() => {
    const nameEl = document.getElementById('greetName');
    const cursor = document.getElementById('greetCursor');
    nameEl.textContent = name + ' 👋';
    nameEl.style.maxWidth = '700px';
    cursor.style.opacity = '1';
    cursor.style.animation = 'blinkCursor 0.7s step-end 4';
  }, 550);

  setTimeout(() => {
    document.getElementById('greetSub').style.opacity = '1';
    document.getElementById('greetCursor').style.opacity = '0';
  }, 2000);

  setTimeout(() => {
    greetScreen.style.transition = 'opacity 0.5s ease';
    greetScreen.style.opacity = '0';
    setTimeout(() => {
      greetScreen.style.display = 'none';
      const uploadScreen = document.getElementById('uploadScreen');
      uploadScreen.style.display = 'flex';
      // Set time greeting
      const h = new Date().getHours();
      const tg = h < 12 ? 'Good morning,' : h < 17 ? 'Good afternoon,' : 'Good evening,';
      document.getElementById('timeGreeting').textContent = tg;
      attachUpload();
    }, 500);
  }, 3000);
}

// ---- INIT ON PAGE LOAD ----
document.addEventListener('DOMContentLoaded', function () {
  startLiveClock();
  initTheme();
  initWaterTracker();
  updateMiniTaskCount();
  renderDailyQuote();
  const uploadScreen = document.getElementById('uploadScreen');
  if (uploadScreen) uploadScreen.style.display = 'none';
  var m = document.getElementById('apiModal');
  if (m) m.addEventListener('click', function (e) {
    if (e.target === this) closeApiKeyModal();
  });

  // Note modal backdrop click handler
  var noteModal = document.getElementById('noteModal');
  if (noteModal) {
    noteModal.addEventListener('click', function (e) {
      if (e.target === this) this.style.display = 'none';
    });
  }

  // Try auto-restore first — if no cache, show greeting then connect screen
  const restored = tryAutoRestore();
  if (!restored) {
    showGreetingThenConnect();
  }

  // Auto-refresh on page visibility change (when user returns to app)
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && DATA) {
      const lastUpdate = parseInt(localStorage.getItem('rototech-data-timestamp') || '0');
      const minsOld = Math.floor((Date.now() - lastUpdate) / 60000);

      if (minsOld >= 30 && localStorage.getItem('rototech-sheet-url')) {
        showRefreshToast('🔄 Auto-refreshing data...');
        refreshSheet();
      }
    }
  });
});
