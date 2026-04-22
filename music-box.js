// Enhanced Music Box JavaScript
const numberButtons = document.getElementById('number-buttons');
const sequenceDisplay = document.getElementById('sequenceDisplay');
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');
const loopCheckbox = document.getElementById('loop');
const playBtn = document.getElementById('play');
const stopBtn = document.getElementById('stop');
const clearBtn = document.getElementById('clear');
const randomBtn = document.getElementById('random');
const saveBtn = document.getElementById('save');
const loadBtn = document.getElementById('load');
const statusEl = document.getElementById('status');
const savedSections = document.getElementById('savedSequences');
const sequenceList = document.getElementById('sequenceList');

// Share functionality
const exportSequenceBtn = document.getElementById('exportSequence');
const copySequenceBtn = document.getElementById('copySequence');
const shareSocialBtn = document.getElementById('shareSocial');
const shareResult = document.getElementById('shareResult');
const shareLink = document.getElementById('shareLink');
const copyLinkBtn = document.getElementById('copyLink');

let sequence = [];
let isPlaying = false;
let stopRequested = false;
let currentAudio = null;
let savedSequences = [];
const audioCache = {};

// Initialize buttons 1-48
for (let i = 1; i <= 48; i++) {
  const btn = document.createElement('button');
  btn.textContent = i;
  btn.type = 'button';
  btn.addEventListener('click', () => {
    if (sequence.length < 48) {
      sequence.push(i);
      btn.classList.add('selected');
      updateSequenceDisplay();
      updateStatus(`Added note ${i} to sequence`, 'info');
    }
  });
  numberButtons.appendChild(btn);
}

// UI helpers
function updateSequenceDisplay(highlightIndex = -1) {
  if (!sequence.length) {
    sequenceDisplay.textContent = 'None';
    return;
  }
  
  // Show sequence with highlighting
  sequenceDisplay.innerHTML = sequence.map((n, i) => {
    if (i === highlightIndex) return `<strong>${n}</strong>`;
    return `${n}`;
  }).join(' ');
}

function updateStatus(msg, type = 'normal') {
  if (statusEl) {
    statusEl.textContent = msg;
    statusEl.className = 'status';
    if (type !== 'normal') {
      statusEl.classList.add(type);
    }
  }
  console.log('status:', msg);
}

// Speed and volume controls
speedSlider.addEventListener('input', () => {
  speedValue.textContent = `${parseFloat(speedSlider.value).toFixed(2)}x`;
});

volumeSlider.addEventListener('input', () => {
  volumeValue.textContent = `${Math.round(volumeSlider.value * 100)}%`;
});

// Sequence utilities
function randomizeSequence() {
  sequence = [];
  const count = Math.floor(Math.random() * 16) + 8; // 8-24 numbers
  
  // Clear selections
  const buttons = numberButtons.querySelectorAll('button');
  buttons.forEach(btn => btn.classList.remove('selected'));
  
  for (let i = 0; i < count; i++) {
    const randNum = Math.floor(Math.random() * 48) + 1;
    sequence.push(randNum);
    buttons[randNum - 1].classList.add('selected');
  }
  
  updateSequenceDisplay();
  updateStatus(`Created random sequence with ${count} notes`, 'success');
}

// Audio helpers with volume control
function getBaseAudio(note) {
  if (!audioCache[note]) {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = `sounds/Harmonicsfinal ${note}.wav`;
    audioCache[note] = audio;
  }
  return audioCache[note];
}

function makePlayableAudio(note, playbackRate = 1, volume = 0.7) {
  const base = getBaseAudio(note);
  const audio = base.cloneNode(true);
  audio.playbackRate = playbackRate;
  audio.volume = volume;
  return audio;
}

function waitNearEnd(audio, buffer = 0.15, timeout = 15000) {
  return new Promise(resolve => {
    let done = false;
    const safeResolve = () => { if (!done) { done = true; cleanup(); resolve(); } };
    const cleanup = () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      clearTimeout(timer);
    };

    const onLoaded = () => {
      if (!isNaN(audio.duration) && audio.duration > 0) {
        if (audio.duration - audio.currentTime <= buffer) safeResolve();
      }
    };
    const onTime = () => {
      if (!isNaN(audio.duration) && (audio.duration - audio.currentTime <= buffer)) safeResolve();
    };
    const onEnded = () => safeResolve();
    const onError = () => safeResolve();

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    const timer = setTimeout(safeResolve, timeout);

    if (!isNaN(audio.duration) && audio.duration > 0) onLoaded();
  });
}

// Playback logic
async function playSequence() {
  if (sequence.length === 0) {
    updateStatus('No sequence to play.', 'error');
    return;
  }
  if (isPlaying) return;
  
  isPlaying = true;
  stopRequested = false;
  playBtn.textContent = 'Playing...';
  playBtn.disabled = true;
  updateStatus('Playing sequence...', 'info');

  try {
    do {
      for (let i = 0; i < sequence.length; i++) {
        if (stopRequested) break;
        
        const note = sequence[i];
        const speed = parseFloat(speedSlider.value) || 1;
        const volume = parseFloat(volumeSlider.value) || 0.7;
        const audio = makePlayableAudio(note, speed, volume);
        currentAudio = audio;

        // Highlight current button
        const buttons = numberButtons.querySelectorAll('button');
        buttons.forEach(btn => btn.classList.remove('playing'));
        buttons[note - 1].classList.add('playing');

        const p = audio.play();
        if (p && typeof p.catch === 'function') {
          p.catch(err => {
            console.warn(`audio.play() rejected for note ${note}:`, err);
            updateStatus(`Failed to play note ${note}`, 'error');
          });
        }

        updateStatus(`Playing note ${note} (${i + 1}/${sequence.length})`);
        updateSequenceDisplay(i);

        await Promise.race([
          waitNearEnd(audio, 0.12),
          (async () => {
            while (!stopRequested) {
              await new Promise(r => setTimeout(r, 120));
            }
          })()
        ]);

        try { audio.pause(); audio.currentTime = 0; } catch (e) { /* ignore */ }
        currentAudio = null;
        
        // Remove playing class
        buttons[note - 1].classList.remove('playing');
      }
    } while (loopCheckbox.checked && !stopRequested);
  } finally {
    isPlaying = false;
    stopRequested = false;
    currentAudio = null;
    playBtn.textContent = 'Play';
    playBtn.disabled = false;
    updateSequenceDisplay(-1);
    updateStatus('Playback finished.', 'success');
  }
}

// Control event listeners
playBtn.addEventListener('click', () => {
  if (!isPlaying) playSequence();
});

stopBtn.addEventListener('click', () => {
  stopRequested = true;
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch (e) { /* ignore */ }
  }
  updateStatus('Stop requested.', 'info');
});

clearBtn.addEventListener('click', () => {
  sequence = [];
  updateSequenceDisplay();
  
  // Clear selections
  const buttons = numberButtons.querySelectorAll('button');
  buttons.forEach(btn => {
    btn.classList.remove('selected', 'playing');
  });
  
  updateStatus('Sequence cleared.', 'success');
});

randomBtn.addEventListener('click', randomizeSequence);

// Save and Load functionality
saveBtn.addEventListener('click', () => {
  if (sequence.length === 0) {
    updateStatus('No sequence to save.', 'error');
    return;
  }
  
  const name = prompt('Enter a name for this sequence:');
  if (!name) return;
  
  const sequenceData = {
    id: Date.now(),
    name: name,
    sequence: [...sequence],
    timestamp: new Date().toISOString()
  };
  
  savedSequences.push(sequenceData);
  localStorage.setItem('harmonicsSequences', JSON.stringify(savedSequences));
  
  updateStatus(`Sequence "${name}" saved!`, 'success');
  updateSavedSequencesList();
});

loadBtn.addEventListener('click', () => {
  savedSections.style.display = savedSections.style.display === 'none' ? 'block' : 'none';
  if (savedSequences.length === 0) {
    updateStatus('No saved sequences found.', 'info');
  }
});

function updateSavedSequencesList() {
  sequenceList.innerHTML = '';
  
  savedSequences.forEach(seq => {
    const item = document.createElement('div');
    item.className = 'sequence-item';
    item.innerHTML = `
      <div>
        <div class="sequence-name">${seq.name}</div>
        <div class="sequence-data">${seq.sequence.slice(0, 8).join('-')}${seq.sequence.length > 8 ? '...' : ''}</div>
      </div>
      <div class="sequence-actions">
        <button class="btn btn-small btn-primary" onclick="loadSequence(${seq.id})">Load</button>
        <button class="btn btn-small btn-ghost" onclick="deleteSequence(${seq.id})">Delete</button>
      </div>
    `;
    sequenceList.appendChild(item);
  });
}

function loadSequence(id) {
  const seq = savedSequences.find(s => s.id === id);
  if (!seq) return;
  
  sequence = [...seq.sequence];
  updateSequenceDisplay();
  
  // Update button selections
  const buttons = numberButtons.querySelectorAll('button');
  buttons.forEach(btn => btn.classList.remove('selected'));
  sequence.forEach(note => {
    if (note <= 48) buttons[note - 1].classList.add('selected');
  });
  
  updateStatus(`Loaded sequence "${seq.name}"`, 'success');
  savedSections.style.display = 'none';
}

function deleteSequence(id) {
  if (!confirm('Delete this sequence?')) return;
  
  savedSequences = savedSequences.filter(s => s.id !== id);
  localStorage.setItem('harmonicsSequences', JSON.stringify(savedSequences));
  updateSavedSequencesList();
  updateStatus('Sequence deleted.', 'success');
}

// Load saved sequences from localStorage
function loadSavedSequences() {
  const saved = localStorage.getItem('harmonicsSequences');
  if (saved) {
    try {
      savedSequences = JSON.parse(saved);
      updateSavedSequencesList();
    } catch (e) {
      console.error('Failed to load saved sequences:', e);
      savedSequences = [];
    }
  }
}

// Share functionality
exportSequenceBtn.addEventListener('click', () => {
  if (sequence.length === 0) {
    updateStatus('No sequence to export.', 'error');
    return;
  }
  
  const sequenceString = sequence.join(',');
  const baseUrl = window.location.origin + window.location.pathname;
  const exportUrl = `${baseUrl}?seq=${sequenceString}`;
  
  shareLink.textContent = exportUrl;
  shareResult.style.display = 'block';
  updateStatus('Sequence exported! Copy the link below.', 'success');
});

copySequenceBtn.addEventListener('click', () => {
  if (sequence.length === 0) {
    updateStatus('No sequence to copy.', 'error');
    return;
  }
  
  const sequenceString = sequence.join(',');
  navigator.clipboard.writeText(sequenceString).then(() => {
    updateStatus('Sequence copied to clipboard!', 'success');
  }).catch(() => {
    updateStatus('Failed to copy sequence.', 'error');
  });
});

shareSocialBtn.addEventListener('click', () => {
  if (sequence.length === 0) {
    updateStatus('No sequence to share.', 'error');
    return;
  }
  
  const text = `Check out my Harmonics sequence: ${sequence.join('-')} created with Harmonics Music Box!`;
  const url = window.location.href;
  
  if (navigator.share) {
    navigator.share({
      title: 'My Harmonics Sequence',
      text: text,
      url: url
    });
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(`${text} ${url}`).then(() => {
      updateStatus('Share text copied to clipboard!', 'success');
    });
  }
});

copyLinkBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(shareLink.textContent).then(() => {
    updateStatus('Link copied to clipboard!', 'success');
  }).catch(() => {
    updateStatus('Failed to copy link.', 'error');
  });
});

// Load sequence from URL parameter
function loadSequenceFromURL() {
  const params = new URLSearchParams(window.location.search);
  const seqParam = params.get('seq');
  
  if (seqParam) {
    try {
      const loadedSequence = seqParam.split(',').map(n => parseInt(n)).filter(n => !isNaN(n) && n >= 1 && n <= 48);
      if (loadedSequence.length > 0) {
        sequence = loadedSequence;
        updateSequenceDisplay();
        
        // Update button selections
        const buttons = numberButtons.querySelectorAll('button');
        buttons.forEach(btn => btn.classList.remove('selected'));
        sequence.forEach(note => {
          if (note <= 48) buttons[note - 1].classList.add('selected');
        });
        
        updateStatus('Sequence loaded from link!', 'success');
      }
    } catch (e) {
      console.error('Failed to load sequence from URL:', e);
    }
  }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  const tag = (e.target && e.target.tagName) || '';
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  
  // Number keys 1-9 for quick note selection
  if (e.key >= '1' && e.key <= '9') {
    const num = parseInt(e.key);
    if (num <= 48) {
      const button = numberButtons.children[num - 1];
      if (button) button.click();
    }
  }
  
  // Space to play/stop
  if (e.code === 'Space') {
    e.preventDefault();
    if (!isPlaying) playBtn.click();
    else stopBtn.click();
  }
  
  // Escape to stop
  if (e.code === 'Escape') {
    stopBtn.click();
  }
  
  // C to clear
  if (e.key === 'c' || e.key === 'C') {
    clearBtn.click();
  }
  
  // R to randomize
  if (e.key === 'r' || e.key === 'R') {
    randomBtn.click();
  }
  
  // S to save
  if (e.key === 's' || e.key === 'S') {
    e.preventDefault();
    saveBtn.click();
  }
  
  // L to load
  if (e.key === 'l' || e.key === 'L') {
    loadBtn.click();
  }
});

// Show keyboard hints
let keyboardHintTimeout;
function showKeyboardHint() {
  const hint = document.createElement('div');
  hint.className = 'keyboard-hint';
  hint.innerHTML = `
    <strong>Keyboard Shortcuts:</strong><br>
    1-9: Add notes | Space: Play/Stop | Esc: Stop<br>
    C: Clear | R: Random | S: Save | L: Load
  `;
  document.body.appendChild(hint);
  
  setTimeout(() => hint.classList.add('show'), 100);
  
  clearTimeout(keyboardHintTimeout);
  keyboardHintTimeout = setTimeout(() => {
    hint.classList.remove('show');
    setTimeout(() => hint.remove(), 300);
  }, 3000);
}

// Show hint on first visit
if (!localStorage.getItem('harmonicsKeyboardHintShown')) {
  setTimeout(showKeyboardHint, 2000);
  localStorage.setItem('harmonicsKeyboardHintShown', 'true');
}

// Initialize
loadSavedSequences();
loadSequenceFromURL();

// Make functions globally accessible
window.loadSequence = loadSequence;
window.deleteSequence = deleteSequence;

console.log('Enhanced Music Box loaded successfully!');
