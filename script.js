const numberButtons = document.getElementById('number-buttons');
const sequenceDisplay = document.getElementById('sequenceDisplay');
const speedSlider = document.getElementById('speedSlider');
const loopCheckbox = document.getElementById('loop');
const playBtn = document.getElementById('play');
const stopBtn = document.getElementById('stop');
const clearBtn = document.getElementById('clear');
const randomBtn = document.getElementById('random');
const statusEl = document.getElementById('status'); // optional, if present

let sequence = [];
let isPlaying = false;
let stopRequested = false;
let currentAudio = null;
const audioCache = {}; // base audio elements for each note (used for cloning)

/* ---------- UI helpers ---------- */
function updateSequenceDisplay(highlightIndex = -1) {
  if (!sequence.length) {
    sequenceDisplay.textContent = 'None';
    return;
  }
  // show arrows and optionally highlight the current index
  sequenceDisplay.innerHTML = sequence.map((n, i) => {
    if (i === highlightIndex) return `<strong>${n}</strong>`;
    return `${n}`;
  }).join(' → ');
}

function updateStatus(msg) {
  if (statusEl) statusEl.textContent = msg;
  else console.log('status:', msg);
}

/* ---------- Buttons 1..48 ---------- */
for (let i = 1; i <= 48; i++) {
  const btn = document.createElement('button');
  btn.textContent = i;
  btn.type = 'button';
  btn.addEventListener('click', () => {
    sequence.push(i);
    updateSequenceDisplay();
  });
  numberButtons.appendChild(btn);
}

/* ---------- Sequence utilities ---------- */
function randomizeSequence() {
  sequence = [];
  const count = Math.floor(Math.random() * 8) + 3; // 3..10
  for (let i = 0; i < count; i++) {
    const randNum = Math.floor(Math.random() * 20) + 1;
    sequence.push(randNum);
  }
  updateSequenceDisplay();
}

/* ---------- Audio helpers ---------- */
function getBaseAudio(note) {
  // Keep a base element per note to help the browser cache the resource.
  if (!audioCache[note]) {
    // Try wav extensions with the specific naming pattern
    const possiblePaths = [
      `sounds/Harmonicsfinal ${note}.wav`,
      `sounds/Harmonicsfinal ${note} .wav`,
      `sounds/${note}.wav`
    ];
    
    // Create audio element and try each path until one works
    const a = new Audio();
    a.preload = 'auto';
    
    // Try each path sequentially
    for (const path of possiblePaths) {
      try {
        a.src = path;
        a.load();
        // If this doesn't throw an error, we'll use this path
        break;
      } catch (e) {
        console.warn(`Failed to load ${path}:`, e);
        continue;
      }
    }
    
    audioCache[note] = a;
  }
  return audioCache[note];
}

function makePlayableAudio(note, playbackRate = 1) {
  // cloneNode(true) gives us a fresh <audio> element we can control independently
  const base = getBaseAudio(note);
  const audio = base.cloneNode(true);
  audio.playbackRate = playbackRate;
  return audio;
}

function waitNearEnd(audio, buffer = 0.15, timeout = 15000) {
  // Resolve when audio is near its end (duration - currentTime <= buffer),
  // or after 'ended' or on error; uses a timeout fallback.
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

    // fallback timeout so we never hang
    const timer = setTimeout(safeResolve, timeout);

    // if metadata already available, trigger check
    if (!isNaN(audio.duration) && audio.duration > 0) onLoaded();
  });
}

/* ---------- Playback logic ---------- */
async function playSequence() {
  if (sequence.length === 0) {
    updateStatus('No sequence to play.');
    return;
  }
  if (isPlaying) return; // avoid double-play
  isPlaying = true;
  stopRequested = false;
  updateStatus('▶️ Playing sequence...');

  try {
    do {
      for (let i = 0; i < sequence.length; i++) {
        if (stopRequested) break;
        const note = sequence[i];
        const speed = parseFloat(speedSlider.value) || 1;
        const audio = makePlayableAudio(note, speed);
        currentAudio = audio;

        // try to play (may return a promise)
        const p = audio.play();
        if (p && typeof p.catch === 'function') {
          p.catch(err => {
            // Playback may fail without a user gesture in some browsers — log
            console.warn(`audio.play() rejected for note ${note}:`, err);
            updateStatus(`⚠️ Failed to play ${note}`);
          });
        }

        updateStatus(`Playing ${note} (${i + 1}/${sequence.length})`);
        updateSequenceDisplay(i);

        // Wait until near end or stop requested
        await Promise.race([
          waitNearEnd(audio, 0.12),
          (async () => {
            while (!stopRequested) {
              await new Promise(r => setTimeout(r, 120));
            }
          })()
        ]);

        // stop/cleanup this audio instance
        try { audio.pause(); audio.currentTime = 0; } catch (e) { /* ignore */ }
        currentAudio = null;
      }
    } while (loopCheckbox.checked && !stopRequested);
  } finally {
    isPlaying = false;
    stopRequested = false;
    currentAudio = null;
    updateSequenceDisplay(-1);
    updateStatus('Playback finished.');
  }
}

/* ---------- Controls ---------- */
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
  updateStatus('🛑 Stop requested.');
});

clearBtn.addEventListener('click', () => {
  sequence = [];
  updateSequenceDisplay();
  updateStatus('🧽 Sequence cleared.');
});

randomBtn.addEventListener('click', () => {
  randomizeSequence();
  updateStatus('🎲 Random sequence created.');
});

/* keyboard shortcuts (space = play/pause start, Esc = stop) */
document.addEventListener('keydown', (e) => {
  const tag = (e.target && e.target.tagName) || '';
  if (tag === 'INPUT' || tag === 'TEXTAREA') return; // ignore typing
  if (e.code === 'Space') {
    e.preventDefault();
    if (!isPlaying) playBtn.click();
    else stopBtn.click();
  } else if (e.code === 'Escape') {
    stopBtn.click();
  }
});
