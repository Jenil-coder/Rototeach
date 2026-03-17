// ============================================================
// ROTOTECH — TASKS & CALENDAR  (tasks.js)
// ============================================================

// ---- TASK STORE (localStorage) ----
const TASK_KEY = 'rototech_tasks_v1';

function loadTasks() {
  try { return JSON.parse(localStorage.getItem(TASK_KEY)) || {}; } catch { return {}; }
}
function saveTasks(all) {
  localStorage.setItem(TASK_KEY, JSON.stringify(all));
}

// Helpers
function todayStr() {
  const d = new Date();
  return ymd(d.getFullYear(), d.getMonth() + 1, d.getDate());
}
function ymd(y, m, d) {
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}
function fmtSelDate(str) {
  if (!str) return 'Select a date';
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
}

// ---- STATE ----
let CAL_DATE    = new Date();          // month currently displayed
let SEL_DATE    = todayStr();          // selected date (YYYY-MM-DD)
let TASK_FILTER = 'all';              // 'all' | 'pending' | 'done'

// ---- CALENDAR ----
function initCalendar() {
  renderCalendar();
  selectCalDate(SEL_DATE, false); // render task list for today without re-rendering calendar
}

function calPrev() { CAL_DATE.setMonth(CAL_DATE.getMonth() - 1); renderCalendar(); }
function calNext() { CAL_DATE.setMonth(CAL_DATE.getMonth() + 1); renderCalendar(); }

function renderCalendar() {
  const y    = CAL_DATE.getFullYear();
  const m    = CAL_DATE.getMonth(); // 0-indexed
  const all  = loadTasks();
  const today = todayStr();

  // Title
  document.getElementById('calTitle').textContent =
    CAL_DATE.toLocaleDateString('en-IN', { month:'long', year:'numeric' });

  const firstDay  = new Date(y, m, 1).getDay(); // 0=Sun
  const daysInMo  = new Date(y, m + 1, 0).getDate();
  const daysInPrev = new Date(y, m, 0).getDate();

  const grid = document.getElementById('calDays');
  grid.innerHTML = '';

  const totalCells = Math.ceil((firstDay + daysInMo) / 7) * 7;

  for (let c = 0; c < totalCells; c++) {
    const cell = document.createElement('div');
    cell.className = 'cal-day';

    let dateStr, isOther = false;
    if (c < firstDay) {
      // Previous month days
      const d = daysInPrev - firstDay + c + 1;
      dateStr = ymd(m === 0 ? y - 1 : y, m === 0 ? 12 : m, d);
      isOther = true;
    } else if (c < firstDay + daysInMo) {
      // Current month
      const d = c - firstDay + 1;
      dateStr = ymd(y, m + 1, d);
    } else {
      // Next month days
      const d = c - firstDay - daysInMo + 1;
      dateStr = ymd(m === 11 ? y + 1 : y, m === 11 ? 1 : m + 2, d);
      isOther = true;
    }

    if (isOther) cell.classList.add('other-month');
    if (dateStr === today) cell.classList.add('today');
    if (dateStr === SEL_DATE) cell.classList.add('selected');

    // Day number
    const num = document.createElement('div');
    num.className = 'cal-day-num';
    num.textContent = parseInt(dateStr.split('-')[2]);
    cell.appendChild(num);

    // Dot if this date has pending tasks
    const dateTasks = all[dateStr] || [];
    if (dateTasks.some(t => !t.done)) {
      const dot = document.createElement('div');
      dot.className = 'cal-day-dot';
      cell.appendChild(dot);
    }

    const ds = dateStr; // closure capture
    cell.onclick = () => selectCalDate(ds, true);
    grid.appendChild(cell);
  }
}

function selectCalDate(dateStr, rerenderCal) {
  SEL_DATE = dateStr;
  if (rerenderCal) renderCalendar(); // re-renders to update selected highlight
  document.getElementById('taskDateLabel').textContent = fmtSelDate(dateStr);
  TASK_FILTER = 'all';
  document.querySelectorAll('.task-pill').forEach(p => p.classList.toggle('active', p.dataset.filter === 'all'));
  renderTaskList();
}

// ---- TASKS ----
function addTask() {
  const input = document.getElementById('taskInput');
  const text  = (input.value || '').trim();
  if (!text) { input.focus(); return; }

  const priority = document.getElementById('taskPriority').value;
  const all = loadTasks();
  if (!all[SEL_DATE]) all[SEL_DATE] = [];
  all[SEL_DATE].push({
    id:       Date.now() + Math.random(),
    text,
    priority,
    done:     false,
    created:  new Date().toISOString()
  });
  saveTasks(all);
  input.value = '';
  renderTaskList();
  renderCalendar();     // update dot indicators
  updateTaskBadge();
  updateMiniTaskCount(); // Update mini task counter
}

function toggleTask(dateStr, id) {
  const all = loadTasks();
  const list = all[dateStr] || [];
  const t = list.find(t => t.id === id);
  if (t) t.done = !t.done;
  saveTasks(all);
  renderTaskList();
  renderCalendar();
  updateTaskBadge();
  updateMiniTaskCount(); // Update mini task counter
}

function deleteTask(dateStr, id) {
  const all = loadTasks();
  all[dateStr] = (all[dateStr] || []).filter(t => t.id !== id);
  if (!all[dateStr].length) delete all[dateStr];
  saveTasks(all);
  renderTaskList();
  renderCalendar();
  updateTaskBadge();
  updateMiniTaskCount(); // Update mini task counter
}

function setTaskFilter(filter, el) {
  TASK_FILTER = filter;
  document.querySelectorAll('.task-pill').forEach(p => p.classList.remove('active'));
  if (el) el.classList.add('active');
  renderTaskList();
}

function renderTaskList() {
  const all   = loadTasks();
  const tasks = all[SEL_DATE] || [];
  const filtered = tasks.filter(t => {
    if (TASK_FILTER === 'pending') return !t.done;
    if (TASK_FILTER === 'done')    return t.done;
    return true;
  });

  const pending = tasks.filter(t => !t.done).length;
  const countEl = document.getElementById('taskPendingCount');
  countEl.textContent = pending ? `${pending} pending` : '';

  const list = document.getElementById('taskList');
  if (!filtered.length) {
    list.innerHTML = `<div class="task-empty">
      ${tasks.length ? 'No ' + TASK_FILTER + ' tasks' : 'No tasks for this date'} — add one above!
    </div>`;
    return;
  }

  list.innerHTML = filtered.map(t => `
    <div class="task-item" id="ti_${t.id}">
      <div class="task-cb ${t.done ? 'checked' : ''}" onclick="toggleTask('${SEL_DATE}', ${t.id})"></div>
      <div class="task-text ${t.done ? 'done' : ''}">${escHtml(t.text)}</div>
      <div class="task-meta">
        <span class="badge-pri-${t.priority}">${t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}</span>
      </div>
      <button class="task-del" title="Delete" onclick="deleteTask('${SEL_DATE}', ${t.id})">×</button>
    </div>`).join('');
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ---- NAV BADGE ----
function updateTaskBadge() {
  const all  = loadTasks();
  const total = Object.values(all).flat().filter(t => !t.done).length;
  const badge = document.getElementById('taskBadge');
  if (!badge) return;
  if (total > 0) { badge.textContent = total > 99 ? '99+' : total; badge.style.display = 'inline'; }
  else { badge.style.display = 'none'; }
}

// Initialise on page load (badge reflects persisted tasks immediately)
document.addEventListener('DOMContentLoaded', () => {
  updateTaskBadge();
});
