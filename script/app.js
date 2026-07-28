function getFirstDayOfYear(year) {
  return new Date(year, 0, 1).getDay();
}

const repoInput = document.getElementById('repo');
const yearSelect = document.getElementById('selYear');
const graphEl = document.getElementById('graph');
const monthsEl = document.getElementById('months');
const sDays = document.getElementById('sDays');
const sCommits = document.getElementById('sCommits');
const sPeriod = document.getElementById('sPeriod');
const clearBtn = document.getElementById('clearBtn');
const fillBtn = document.getElementById('fillBtn');
const fillPercent = document.getElementById('fillPercent');
const pushBtn = document.getElementById('pushBtn');
const rollbackBtn = document.getElementById('rollbackBtn');
const statusBar = document.getElementById('statusBar');
const swatches = document.querySelectorAll('.swatch');

let selectedLevel = 4;
let isDragging = false;

const LEVEL_COLORS = ['#21262d','#0D4429','#016C31','#26A641','#39D353'];

(function initYearSelect() {
  for (let y = 2028; y >= 2015; y--) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    yearSelect.appendChild(opt);
  }
  yearSelect.value = 2026;
})();

function getLastDayOfYear(year) {
  return new Date(year, 11, 31);
}

function getNumberOfWeeks(year) {
  const firstDay = new Date(year, 0, 1);
  const lastDay = new Date(year, 11, 31);
  const msBetween = lastDay - firstDay;
  const daysBetween = msBetween / (1000 * 60 * 60 * 24);
  return Math.ceil((daysBetween + getFirstDayOfYear(year) + 1) / 7);
}

function updateStats() {
  let commits = 0;
  let paintedDays = 0;
  let minDate = null, maxDate = null;

  document.querySelectorAll('.cell').forEach(cell => {
    const level = parseInt(cell.dataset.level || '0', 10);
    commits += level;
    if (level > 0) {
      paintedDays++;
      const d = new Date(cell.dataset.date);
      if (!minDate || d < minDate) minDate = d;
      if (!maxDate || d > maxDate) maxDate = d;
    }
  });

  sCommits.textContent = commits;
  sDays.textContent = paintedDays;

  if (minDate && maxDate) {
    const opts = { month: 'short', day: 'numeric', year: 'numeric' };
    sPeriod.textContent = `${minDate.toLocaleDateString('en-US', opts)} \u2013 ${maxDate.toLocaleDateString('en-US', opts)}`;
  } else {
    sPeriod.textContent = '\u2014';
  }
}

function positionMonthLabels(year) {
  monthsEl.innerHTML = '';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const firstDayOffset = getFirstDayOfYear(year);

  months.forEach((month, index) => {
    const firstDayOfMonth = new Date(year, index, 1);
    const daysSinceJan1 = Math.floor((firstDayOfMonth - new Date(year, 0, 1)) / (24 * 60 * 60 * 1000));
    let colPos = Math.floor((daysSinceJan1 + firstDayOffset) / 7);
    if (index === 0) colPos = 0;

    const lbl = document.createElement('span');
    lbl.textContent = month;
    lbl.style.gridColumn = colPos + 1;
    monthsEl.appendChild(lbl);
  });
}

function buildCalendar(year) {
  graphEl.innerHTML = '';
  positionMonthLabels(year);

  const numWeeks = getNumberOfWeeks(year);
  const firstDayOffset = getFirstDayOfYear(year);

  graphEl.style.gridTemplateColumns = `repeat(${numWeeks}, 13px)`;
  monthsEl.style.gridTemplateColumns = `repeat(${numWeeks}, 13px)`;

  for (let week = 0; week < numWeeks; week++) {
    for (let day = 0; day < 7; day++) {
      const dayOffset = week * 7 + day - firstDayOffset;
      const date = new Date(year, 0, 1);
      date.setDate(date.getDate() + dayOffset);

      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.date = date.toISOString().slice(0, 10);
      cell.dataset.level = '0';
      cell.style.background = LEVEL_COLORS[0];
      cell.style.gridColumn = week + 1;
      cell.style.gridRow = day === 0 ? 7 : day;

      if (date.getFullYear() !== parseInt(year)) {
        cell.classList.add('out');
      }

      cell.title = date.toDateString();

      cell.addEventListener('mousedown', (e) => {
        isDragging = true;
        updateCell(cell);
        e.preventDefault();
      });

      cell.addEventListener('mouseenter', () => {
        if (isDragging) updateCell(cell);
      });

      graphEl.appendChild(cell);
    }
  }

  updateStats();
  setStatus(`Showing ${year} \u2014 click & drag to paint`);
}

function updateCell(cell) {
  if (cell.classList.contains('out')) return;

  if (selectedLevel === 5) {
    const rnd = Math.floor(Math.random() * 4) + 1;
    cell.dataset.level = rnd;
    cell.style.background = LEVEL_COLORS[rnd];
  } else {
    cell.dataset.level = selectedLevel;
    cell.style.background = LEVEL_COLORS[selectedLevel];
  }
  updateStats();
}

document.addEventListener('mouseup', () => {
  isDragging = false;
});

buildCalendar(parseInt(yearSelect.value));

yearSelect.addEventListener('change', () => {
  buildCalendar(parseInt(yearSelect.value));
});

clearBtn.addEventListener('click', () => {
  buildCalendar(parseInt(yearSelect.value));
});

fillBtn.addEventListener('click', () => {
  let pct = parseFloat(fillPercent.value);
  if (isNaN(pct)) pct = 100;
  pct = Math.min(100, Math.max(0, pct));

  const cells = Array.from(document.querySelectorAll('.cell:not(.out)'));
  const totalToFill = Math.round(cells.length * pct / 100);

  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }

  cells.forEach(c => {
    c.dataset.level = '0';
    c.style.background = LEVEL_COLORS[0];
  });

  for (let i = 0; i < totalToFill; i++) {
    const level = selectedLevel === 5 ? Math.floor(Math.random() * 4) + 1 : selectedLevel;
    cells[i].dataset.level = level;
    cells[i].style.background = LEVEL_COLORS[level];
  }

  updateStats();
  setStatus(`Filled ${totalToFill} cells (${pct}%)`);
});

swatches.forEach(swatch => {
  swatch.addEventListener('click', () => {
    selectedLevel = parseInt(swatch.dataset.level, 10);
    swatches.forEach(s => s.classList.remove('sel'));
    swatch.classList.add('sel');
  });
});

document.addEventListener('keydown', (e) => {
  const key = e.key;
  if (key === 'Escape') {
    buildCalendar(parseInt(yearSelect.value));
    return;
  }
  const num = parseInt(key, 10);
  if (num >= 0 && num <= 5) {
    selectedLevel = num;
    swatches.forEach(s => {
      s.classList.remove('sel');
      if (parseInt(s.dataset.level, 10) === num) s.classList.add('sel');
    });
  }
});

pushBtn.addEventListener('click', () => {
  const url = repoInput.value.trim();
  if (!url) {
    setStatus('Please enter a repository URL', true);
    return;
  }

  let cleanUrl = url;
  if (cleanUrl.endsWith('/')) cleanUrl = cleanUrl.slice(0, -1);
  if (cleanUrl.endsWith('.git')) cleanUrl = cleanUrl.slice(0, -4);

  if (!cleanUrl.match(/^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+$/)) {
    setStatus('Invalid GitHub URL format. Use: https://github.com/username/repo', true);
    return;
  }

  const year = parseInt(yearSelect.value, 10);
  let bash = "#!/bin/bash\n";
  bash += "echo 'GENERATING GITHUB CONTRIBUTION ART...'\n";
  bash += `REPO_URL="${cleanUrl}"\n`;
  bash += "echo \"Using repository: $REPO_URL\"\n\n";
  bash += "REPO_NAME=$(echo $REPO_URL | sed 's/.*github.com\\///g')\n";
  bash += "echo \"Repository name: $REPO_NAME\"\n\n";
  bash += "rm -rf github_painter_tmp\n";
  bash += "mkdir github_painter_tmp\n";
  bash += "cd github_painter_tmp\n";
  bash += "git init\n";
  bash += "git remote add origin \"$REPO_URL\"\n";
  bash += "git pull origin main || git pull origin master || echo \"Repository may be empty or not exist yet\"\n";
  bash += "echo \"Art generated by github-painter\" > README.md\n";
  bash += "git add README.md\n";
  bash += "git commit -m \"Initialize repository for GitHub art\"\n\n";
  bash += "# Creating commits for contribution graph\n";

  const activeCells = Array.from(document.querySelectorAll(".cell:not(.out)"))
    .filter(cell => parseInt(cell.dataset.level || '0', 10) > 0)
    .sort((a, b) => a.dataset.date.localeCompare(b.dataset.date));

  const usedTimestamps = new Set();

  activeCells.forEach(cell => {
    const level = parseInt(cell.dataset.level || '0', 10);
    if (level > 0 && cell.dataset.date) {
      const [y, m, d] = cell.dataset.date.split('-');
      const yearNum = parseInt(y, 10);
      const monthNum = parseInt(m, 10);
      const dayNum = parseInt(d, 10);

      for (let j = 0; j < level; j++) {
        let hour = Math.floor(Math.random() * 8) + 9;
        let minute = Math.floor(Math.random() * 60);
        let second = Math.floor(Math.random() * 60);

        let dateObj = new Date(Date.UTC(yearNum, monthNum - 1, dayNum, hour, minute, second));
        let timeString = dateObj.toISOString();

        while (usedTimestamps.has(timeString)) {
          second = (second + 1) % 60;
          minute = second === 0 ? (minute + 1) % 60 : minute;
          hour = minute === 0 && second === 0 ? (hour + 1) % 24 : hour;
          dateObj = new Date(Date.UTC(yearNum, monthNum - 1, dayNum, hour, minute, second));
          timeString = dateObj.toISOString();
        }

        usedTimestamps.add(timeString);
        bash += `echo '${timeString}' >> foobar.txt\n`;
        bash += `git add foobar.txt\n`;
        bash += `GIT_AUTHOR_DATE='${timeString}' GIT_COMMITTER_DATE='${timeString}' git commit -m 'Update at ${timeString}'\n`;
      }
    }
  });

  bash += "\necho \"Pushing to: $REPO_URL\"\n";
  bash += "git branch -M main\n";
  bash += "git remote -v\n";
  bash += "git push -u origin main --force\n";
  bash += "cd ..\n";
  bash += "rm -rf github_painter_tmp\n";
  bash += "echo 'DONE!'\n";

  const blob = new Blob([bash], { type: 'text/plain' });
  const urlObj = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = urlObj;
  a.download = 'github_painter.sh';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(urlObj);
  document.body.removeChild(a);

  setStatus('Script downloaded!');
});

rollbackBtn.addEventListener('click', () => {
  const url = repoInput.value.trim();
  if (!url) {
    setStatus('Please enter a repository URL', true);
    return;
  }

  let cleanUrl = url;
  if (cleanUrl.endsWith('/')) cleanUrl = cleanUrl.slice(0, -1);
  if (cleanUrl.endsWith('.git')) cleanUrl = cleanUrl.slice(0, -4);

  if (!cleanUrl.match(/^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+$/)) {
    setStatus('Invalid GitHub URL format. Use: https://github.com/username/repo', true);
    return;
  }

  let bash = "#!/bin/bash\n";
  bash += "echo 'UNDOING GITHUB CONTRIBUTION ART...'\n";
  bash += `REPO_URL="${cleanUrl}"\n`;
  bash += "echo \"Using repository: $REPO_URL\"\n\n";
  bash += "rm -rf github_painter_undo_tmp\n";
  bash += "mkdir github_painter_undo_tmp\n";
  bash += "cd github_painter_undo_tmp\n\n";
  bash += "git clone \"$REPO_URL\" .\n";
  bash += "git config user.email \"painter-undo@local\"\n";
  bash += "git config user.name \"Painter Undo\"\n\n";
  bash += "# Find the painter init commit\n";
  bash += 'INIT_COMMIT=$(git log --all --oneline --grep="Initialize repository for GitHub art" --format="%H" | head -1)\n';
  bash += "if [ -n \"$INIT_COMMIT\" ]; then\n";
  bash += '  echo "Found painter init commit: $INIT_COMMIT"\n';
  bash += '  PARENT=$(git rev-parse "$INIT_COMMIT^" 2>/dev/null || echo "")\n';
  bash += "  if [ -n \"$PARENT\" ]; then\n";
  bash += '    git reset --hard "$PARENT"\n';
  bash += '    echo "Restored to commit before painter"\n';
  bash += '    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)\n';
  bash += '    if [ "$CURRENT_BRANCH" != "main" ]; then\n';
  bash += '      git branch -M main\n';
  bash += '    fi\n';
  bash += "  else\n";
  bash += '    git checkout --orphan clean-main\n';
  bash += '    echo "# Clean Repository" > README.md\n';
  bash += '    git add README.md\n';
  bash += '    git commit -m "Initial clean state"\n';
  bash += '    git branch -M main\n';
  bash += '    echo "Created clean initial state (repo was empty before)"\n';
  bash += "  fi\n";
  bash += "else\n";
  bash += '  echo "No painter commits found. Nothing to undo."\n';
  bash += "fi\n\n";
  bash += 'echo "Force pushing to main..."\n';
  bash += "git push -u origin main --force\n";
  bash += "cd ..\n";
  bash += "rm -rf github_painter_undo_tmp\n";
  bash += "echo 'DONE!'\n";
  bash += "echo 'Your repository has been restored to its state before painting.'\n";

  const blob = new Blob([bash], { type: 'text/plain' });
  const urlObj = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = urlObj;
  a.download = 'github_painter_undo.sh';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(urlObj);
  document.body.removeChild(a);

  setStatus('Rollback script downloaded!');
});

function setStatus(msg, isError) {
  if (!statusBar) return;
  statusBar.textContent = msg;
  statusBar.className = 'status-bar';
  if (isError) {
    statusBar.classList.add('err');
  } else {
    statusBar.classList.add('ok');
  }
}