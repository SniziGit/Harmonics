// Demo functionality
const demoButtons = document.getElementById('demo-buttons');
const demoSequenceDisplay = document.getElementById('demo-sequence-display');
const demoPlayBtn = document.getElementById('demo-play');
const demoClearBtn = document.getElementById('demo-clear');
const demoRandomBtn = document.getElementById('demo-random');
const buyFullAccessBtn = document.getElementById('buy-full-access');

let demoSequence = [];
let isDemoPlaying = false;
let currentDemoAudio = null;
const demoAudioCache = {};

// Initialize demo buttons 1-12
for (let i = 1; i <= 12; i++) {
  const btn = document.createElement('button');
  btn.textContent = i;
  btn.type = 'button';
  btn.addEventListener('click', () => {
    if (demoSequence.length < 12) {
      demoSequence.push(i);
      btn.classList.add('selected');
      updateDemoSequenceDisplay();
    }
  });
  demoButtons.appendChild(btn);
}

// Demo sequence display
function updateDemoSequenceDisplay() {
  if (!demoSequence.length) {
    demoSequenceDisplay.textContent = 'Click numbers to start';
    return;
  }
  
  if (demoSequence.length === 12) {
    demoSequenceDisplay.textContent = demoSequence.join(' - ') + ' (Max)';
  } else {
    demoSequenceDisplay.textContent = demoSequence.join(' - ');
  }
}

// Demo audio helpers
function getDemoAudio(note) {
  if (!demoAudioCache[note]) {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = `sounds/Harmonicsfinal ${note}.wav`;
    demoAudioCache[note] = audio;
  }
  return demoAudioCache[note];
}

function makeDemoPlayableAudio(note, playbackRate = 1) {
  const base = getDemoAudio(note);
  const audio = base.cloneNode(true);
  audio.playbackRate = playbackRate;
  return audio;
}

function waitDemoNearEnd(audio, buffer = 0.15, timeout = 10000) {
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

// Demo playback
async function playDemoSequence() {
  if (demoSequence.length === 0) {
    alert('Please click some numbers first!');
    return;
  }
  if (isDemoPlaying) return;
  
  isDemoPlaying = true;
  demoPlayBtn.textContent = 'Playing...';
  demoPlayBtn.disabled = true;

  try {
    for (let i = 0; i < demoSequence.length; i++) {
      const note = demoSequence[i];
      const audio = makeDemoPlayableAudio(note, 1);
      currentDemoAudio = audio;

      const p = audio.play();
      if (p && typeof p.catch === 'function') {
        p.catch(err => {
          console.warn(`Demo audio.play() rejected for note ${note}:`, err);
        });
      }

      // Highlight current button
      const buttons = demoButtons.querySelectorAll('button');
      buttons.forEach(btn => btn.classList.remove('playing'));
      buttons[note - 1].classList.add('playing');

      await waitDemoNearEnd(audio, 0.12);
      
      try { audio.pause(); audio.currentTime = 0; } catch (e) { /* ignore */ }
      currentDemoAudio = null;
    }
  } finally {
    isDemoPlaying = false;
    demoPlayBtn.textContent = 'Play Sequence';
    demoPlayBtn.disabled = false;
    
    // Remove playing class
    const buttons = demoButtons.querySelectorAll('button');
    buttons.forEach(btn => btn.classList.remove('playing'));
  }
}

// Demo controls
demoPlayBtn.addEventListener('click', playDemoSequence);

demoClearBtn.addEventListener('click', () => {
  demoSequence = [];
  updateDemoSequenceDisplay();
  
  // Remove selected classes
  const buttons = demoButtons.querySelectorAll('button');
  buttons.forEach(btn => btn.classList.remove('selected'));
});

demoRandomBtn.addEventListener('click', () => {
  demoSequence = [];
  const count = Math.floor(Math.random() * 6) + 4; // 4-9 numbers
  
  // Clear existing selections
  const buttons = demoButtons.querySelectorAll('button');
  buttons.forEach(btn => btn.classList.remove('selected'));
  
  for (let i = 0; i < count; i++) {
    const randNum = Math.floor(Math.random() * 12) + 1;
    demoSequence.push(randNum);
    buttons[randNum - 1].classList.add('selected');
  }
  
  updateDemoSequenceDisplay();
});

// Stripe integration
buyFullAccessBtn.addEventListener('click', async () => {
  try {
    const response = await fetch('/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId: 'price_1Oxxxx...' // Replace with actual Stripe price ID
      }),
    });

    const session = await response.json();
    
    // Redirect to Stripe Checkout
    const stripe = Stripe('pk_test_xxxx'); // Replace with actual Stripe publishable key
    await stripe.redirectToCheckout({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    alert('Unable to process payment. Please try again later.');
  }
});

// Video play button
const videoPlaceholder = document.querySelector('.video-placeholder');
if (videoPlaceholder) {
  videoPlaceholder.addEventListener('click', () => {
    // Replace with actual video embed
    alert('Video player would open here. Add your video URL or embed code.');
  });
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Header scroll effect
let lastScroll = 0;
const header = document.querySelector('.site-header');

window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset;
  
  if (currentScroll > 100) {
    header.style.background = 'rgba(255, 233, 209, 0.95)';
    header.style.boxShadow = '0 4px 20px rgba(35, 22, 15, 0.1)';
  } else {
    header.style.background = 'rgba(255, 233, 209, 0.85)';
    header.style.boxShadow = 'none';
  }
  
  lastScroll = currentScroll;
});

// Add playing styles
const playingStyles = document.createElement('style');
playingStyles.textContent = `
  .demo-buttons button.playing {
    background: linear-gradient(120deg, var(--brand), var(--brand-2));
    color: white;
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(103, 78, 167, 0.4);
  }
`;
document.head.appendChild(playingStyles);

// Intersection Observer for animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.feature-card, .pricing-card, .future-item').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(el);
});

// Parallax effect for hero particles
const heroParticles = document.querySelector('.hero-particles');
if (heroParticles) {
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallax = scrolled * 0.5;
    heroParticles.style.transform = `translateY(${parallax}px)`;
  });
}

// Add hover sound effects (optional enhancement)
document.querySelectorAll('.btn').forEach(button => {
  button.addEventListener('mouseenter', () => {
    // Create a subtle hover sound
    const hoverSound = new Audio();
    hoverSound.volume = 0.1;
    // hoverSound.src = 'sounds/hover.mp3'; // Add hover sound if available
  });
});

// Keyboard shortcuts for demo
document.addEventListener('keydown', (e) => {
  // Number keys 1-9 for demo
  if (e.key >= '1' && e.key <= '9') {
    const num = parseInt(e.key);
    if (num <= 12) {
      const button = demoButtons.children[num - 1];
      if (button) button.click();
    }
  }
  
  // Space to play demo
  if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT') {
    e.preventDefault();
    if (!isDemoPlaying) {
      demoPlayBtn.click();
    }
  }
  
  // Escape to clear demo
  if (e.code === 'Escape' && document.activeElement.tagName !== 'INPUT') {
    demoClearBtn.click();
  }
});

console.log('Harmonics landing page loaded successfully!');
