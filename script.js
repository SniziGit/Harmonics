// DOM Elements
const numberButtons = document.getElementById('number-buttons');
const sequenceDisplay = document.getElementById('sequenceDisplay');
const speedSlider = document.getElementById('speedSlider');
const loopCheckbox = document.getElementById('loop');
const playBtn = document.getElementById('play');
const stopBtn = document.getElementById('stop');
const clearBtn = document.getElementById('clear');
const randomBtn = document.getElementById('random');
const statusEl = document.getElementById('status');

// State
let sequence = [];
let isPlaying = false;
let stopRequested = false;
let currentAudio = null;
const audioCache = new Map(); // Use Map for better performance

// UI Helpers
function updateSequenceDisplay(highlightIndex = -1) {
  if (!sequence.length) {
    sequenceDisplay.textContent = 'None';
    return;
  }
  sequenceDisplay.innerHTML = sequence.map((n, i) => {
    if (i === highlightIndex) return `<strong>${n}</strong>`;
    return `${n}`;
  }).join(' → ');
}

function updateStatus(msg) {
  if (statusEl) statusEl.textContent = msg;
  else console.log('status:', msg);
}

// Audio File Mapping - now using standardized file names
function getAudioPath(note) {
  // MP3 files: 1,2,3,5,7,8,9,10,11,12
  // WAV files: 4,6,13-48
  const mp3Notes = [1, 2, 3, 5, 7, 8, 9, 10, 11, 12];
  const extension = mp3Notes.includes(note) ? 'mp3' : 'wav';
  return `sounds/note${note}.${extension}`;
}

// Simple Audio Loading
async function loadAudio(note) {
  if (audioCache.has(note)) {
    return audioCache.get(note);
  }
  
  const audio = new Audio();
  const path = getAudioPath(note);
  
  try {
    audio.src = path;
    await audio.load();
    audioCache.set(note, audio);
    console.log(`✓ Loaded audio for note ${note}: ${path}`);
    return audio;
  } catch (error) {
    console.error(`✗ Failed to load audio for note ${note}: ${path}`, error);
    return null;
  }
}

// Play single note
async function playNote(note, speed = 1) {
  const audio = await loadAudio(note);
  if (!audio) {
    updateStatus(`⚠️ Could not load note ${note}`);
    return false;
  }
  
  try {
    const clone = audio.cloneNode();
    clone.playbackRate = speed;
    
    // Add error handling for play()
    const playPromise = clone.play();
    if (playPromise !== undefined) {
      await playPromise;
    }
    
    return clone;
  } catch (error) {
    console.error(`Failed to play note ${note}:`, error);
    updateStatus(`⚠️ Could not play note ${note}`);
    return false;
  }
}

// Create Number Buttons
for (let i = 1; i <= 48; i++) {
  const btn = document.createElement('button');
  btn.textContent = i;
  btn.type = 'button';
  btn.addEventListener('click', () => {
    sequence.push(i);
    updateSequenceDisplay();
    // Preview the note when added (with error handling)
    playNote(i).catch(() => {});
  });
  numberButtons.appendChild(btn);
}

// Sequence Utilities
function randomizeSequence() {
  sequence = [];
  const count = Math.floor(Math.random() * 8) + 3; // 3..10 notes
  for (let i = 0; i < count; i++) {
    const randNum = Math.floor(Math.random() * 48) + 1;
    sequence.push(randNum);
  }
  updateSequenceDisplay();
}


// Main Playback Logic
async function playSequence() {
  if (sequence.length === 0) {
    updateStatus('No sequence to play.');
    return;
  }
  
  if (isPlaying) return;
  
  isPlaying = true;
  stopRequested = false;
  updateStatus('▶️ Playing sequence...');

  try {
    do {
      for (let i = 0; i < sequence.length; i++) {
        if (stopRequested) break;
        
        const note = sequence[i];
        const speed = parseFloat(speedSlider.value) || 1;
        
        updateStatus(`Playing ${note} (${i + 1}/${sequence.length})`);
        updateSequenceDisplay(i);
        
        try {
          const audioClone = await playNote(note, speed);
          
          if (audioClone) {
            console.log(`Starting note ${note}, duration: ${audioClone.duration}, speed: ${speed}`);
            
            // Wait for audio to finish with fallback
            await Promise.race([
              new Promise(resolve => {
                const onEnded = () => {
                  console.log(`Note ${note} ended naturally`);
                  resolve();
                };
                audioClone.addEventListener('ended', onEnded, { once: true });
                
                // Also check if audio is very short
                if (audioClone.duration && audioClone.duration < 0.1) {
                  console.log(`Note ${note} is very short (${audioClone.duration}s), resolving immediately`);
                  setTimeout(resolve, 100);
                }
              }),
              new Promise(resolve => {
                setTimeout(() => {
                  console.log(`Note ${note} timeout after 3s`);
                  resolve();
                }, 3000 / speed);
              })
            ]);
            
            // Clean up the audio element
            try {
              audioClone.pause();
              audioClone.currentTime = 0;
            } catch (e) {
              console.log(`Cleanup error for note ${note}:`, e);
            }
          }
        } catch (noteError) {
          console.error(`Error playing note ${note}:`, noteError);
          // Continue to next note instead of crashing
          continue;
        }
      }
    } while (loopCheckbox.checked && !stopRequested);
  } catch (error) {
    console.error('Playback error:', error);
    updateStatus('⚠️ Playback error occurred');
  } finally {
    isPlaying = false;
    stopRequested = false;
    updateSequenceDisplay(-1);
    updateStatus('Playback finished.');
  }
}

// Event Listeners
playBtn.addEventListener('click', () => {
  if (!isPlaying) playSequence();
});

stopBtn.addEventListener('click', () => {
  stopRequested = true;
  updateStatus('🛑 Stop requested.');
});

clearBtn.addEventListener('click', () => {
  sequence = [];
  updateSequenceDisplay();
  updateStatus('🧽 Sequence cleared.');
});

randomBtn.addEventListener('click', () => {
  // Stop any playing sequence first
  if (isPlaying) {
    stopRequested = true;
  }
  randomizeSequence();
  updateStatus('🎲 Random sequence created.');
});

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
  const tag = (e.target && e.target.tagName) || '';
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  
  if (e.code === 'Space') {
    e.preventDefault();
    if (!isPlaying) playBtn.click();
    else stopBtn.click();
  } else if (e.code === 'Escape') {
    stopBtn.click();
  }
});

// Initialize
updateStatus('Ready to create music! 🎵');
