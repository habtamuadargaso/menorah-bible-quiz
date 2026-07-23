export const SOUND_STORAGE_KEY = "menorah-bible-quiz-sound";
// Mission 6 Part 3: music and sound effects used to share one on/off flag
// (SOUND_STORAGE_KEY) with no volume control at all. These are new,
// separate preferences layered on top — isSoundEnabled/setSoundEnabled
// keep their exact original meaning and behavior (the master SFX toggle
// components/SoundToggle.tsx already uses), nothing existing breaks.
const MUSIC_STORAGE_KEY = "menorah-bible-quiz-music";
const SFX_VOLUME_KEY = "menorah-bible-quiz-sfx-volume";
const MUSIC_VOLUME_KEY = "menorah-bible-quiz-music-volume";

let audioContext: AudioContext | null = null;
let musicTimer: number | null = null;
let musicGain: GainNode | null = null;
let musicOn = false;
let step = 0;
let musicAudio: HTMLAudioElement | null = null;

const MUSIC_SRC = "/audio/quiz-quest.mp3";

// Web Audio fallback. The app first tries the uploaded MP3 in /public/audio.
// If the browser blocks or cannot play it, this generated loop keeps the game
// feeling alive without any external files.
const melody = [392, 494, 587, 659, 784, 659, 587, 494, 440, 523, 659, 740, 880, 740, 659, 523];
const harmony = [196, 247, 294, 330, 392, 330, 294, 247];
const bass = [98, 98, 110, 110, 131, 131, 123, 123];

function isBrowser() {
  return typeof window !== "undefined";
}

function getContext() {
  if (!isBrowser()) return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!audioContext) audioContext = new AudioCtx();
  if (audioContext.state === "suspended") void audioContext.resume();
  return audioContext;
}

export function isSoundEnabled() {
  if (!isBrowser()) return true;
  try {
    return window.localStorage.getItem(SOUND_STORAGE_KEY) !== "0";
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled: boolean) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(SOUND_STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    // ignore storage errors
  }
  if (enabled) startGameMusic();
  else stopGameMusic();
}

export function isMusicEnabled() {
  if (!isBrowser()) return true;
  try {
    return window.localStorage.getItem(MUSIC_STORAGE_KEY) !== "0";
  } catch {
    return true;
  }
}

export function setMusicEnabled(enabled: boolean) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(MUSIC_STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    // ignore
  }
  if (enabled) startGameMusic();
  else stopGameMusic();
}

function clampVolume(v: number): number {
  return Math.min(1, Math.max(0, v));
}

export function getSfxVolume(): number {
  if (!isBrowser()) return 1;
  try {
    const raw = window.localStorage.getItem(SFX_VOLUME_KEY);
    return raw === null ? 1 : clampVolume(Number(raw));
  } catch {
    return 1;
  }
}

export function setSfxVolume(volume: number) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(SFX_VOLUME_KEY, String(clampVolume(volume)));
  } catch {
    // ignore
  }
}

export function getMusicVolume(): number {
  if (!isBrowser()) return 0.28;
  try {
    const raw = window.localStorage.getItem(MUSIC_VOLUME_KEY);
    return raw === null ? 0.28 : clampVolume(Number(raw));
  } catch {
    return 0.28;
  }
}

export function setMusicVolume(volume: number) {
  if (!isBrowser()) return;
  const clamped = clampVolume(volume);
  try {
    window.localStorage.setItem(MUSIC_VOLUME_KEY, String(clamped));
  } catch {
    // ignore
  }
  if (musicAudio) musicAudio.volume = clamped;
  if (musicGain) musicGain.gain.value = 0.025 * (clamped / 0.28 || 1);
}

function tone(frequency: number, duration = 0.18, type: OscillatorType = "sine", volume = 0.05, delay = 0) {
  if (!isSoundEnabled()) return;
  const ctx = getContext();
  if (!ctx) return;
  const scaledVolume = volume * getSfxVolume();
  if (scaledVolume <= 0) return;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(scaledVolume, ctx.currentTime + delay + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(ctx.currentTime + delay);
  oscillator.stop(ctx.currentTime + delay + duration + 0.03);
}

function noiseHit(duration = 0.06, volume = 0.02, delay = 0) {
  if (!isSoundEnabled()) return;
  const ctx = getContext();
  if (!ctx) return;
  const scaledVolume = volume * getSfxVolume();
  if (scaledVolume <= 0) return;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  const gain = ctx.createGain();
  src.buffer = buffer;
  gain.gain.setValueAtTime(scaledVolume, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);
  src.connect(gain);
  gain.connect(ctx.destination);
  src.start(ctx.currentTime + delay);
}

export function playCorrectSound() {
  tone(523, 0.09, "triangle", 0.06, 0);
  tone(659, 0.1, "triangle", 0.06, 0.08);
  tone(784, 0.16, "triangle", 0.075, 0.16);
  tone(1046, 0.14, "sine", 0.045, 0.24);
}

export function playWrongSound() {
  tone(220, 0.13, "sawtooth", 0.035, 0);
  tone(165, 0.16, "sawtooth", 0.03, 0.1);
  noiseHit(0.07, 0.018, 0.02);
}

export function playTimeoutSound() {
  tone(330, 0.1, "square", 0.04, 0);
  tone(247, 0.12, "square", 0.035, 0.1);
  tone(196, 0.16, "square", 0.03, 0.22);
}

export function playFinishSound() {
  tone(392, 0.1, "triangle", 0.055, 0);
  tone(494, 0.1, "triangle", 0.055, 0.08);
  tone(587, 0.1, "triangle", 0.055, 0.16);
  tone(784, 0.16, "triangle", 0.07, 0.24);
  tone(1046, 0.28, "sine", 0.06, 0.38);
}

/** Mission 6 Part 3 addition — a distinct, bigger fanfare than
 * playFinishSound (which is used for "quiz complete" regardless of
 * outcome). This is specifically for "you won." */
export function playVictorySound() {
  tone(523, 0.1, "triangle", 0.06, 0);
  tone(659, 0.1, "triangle", 0.06, 0.1);
  tone(784, 0.1, "triangle", 0.065, 0.2);
  tone(1046, 0.12, "triangle", 0.07, 0.3);
  tone(1318, 0.3, "sine", 0.08, 0.4);
}

/** Mission 6 Part 3 addition — a gentle "better luck next time," not a
 * harsh failure buzz, since this fires for every non-winner in a game
 * meant for families and church groups. */
export function playDefeatSound() {
  tone(392, 0.14, "sine", 0.045, 0);
  tone(330, 0.16, "sine", 0.04, 0.14);
  tone(294, 0.24, "sine", 0.035, 0.3);
}

/** Mission 6 Part 3 addition — a short, low-key UI click for buttons that
 * genuinely benefit from audible confirmation (answer selection, primary
 * CTAs) — deliberately not wired to every button in the app, which would
 * get noisy fast. */
export function playButtonClick() {
  tone(880, 0.035, "sine", 0.02, 0);
}

/** Mission 6 Part 3 addition — the "time is running out" warning tick,
 * meant to be called once as a timer crosses its low-time threshold (e.g.
 * <=5s remaining), not once per second. */
export function playCountdownTick() {
  tone(660, 0.06, "square", 0.03, 0);
}

function playMusicStep() {
  if (!musicOn || !isSoundEnabled() || !isMusicEnabled()) return;
  const ctx = getContext();
  if (!ctx) return;

  if (!musicGain) {
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.025 * (getMusicVolume() / 0.28 || 1);
    musicGain.connect(ctx.destination);
  }

  const now = ctx.currentTime;

  const melodyOsc = ctx.createOscillator();
  const melodyGain = ctx.createGain();
  melodyOsc.type = step % 4 === 0 ? "square" : "triangle";
  melodyOsc.frequency.value = melody[step % melody.length];
  melodyGain.gain.setValueAtTime(0.0001, now);
  melodyGain.gain.exponentialRampToValueAtTime(0.055, now + 0.018);
  melodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);
  melodyOsc.connect(melodyGain);
  melodyGain.connect(musicGain);
  melodyOsc.start(now);
  melodyOsc.stop(now + 0.29);

  if (step % 2 === 0) {
    const harmonyOsc = ctx.createOscillator();
    const harmonyGain = ctx.createGain();
    harmonyOsc.type = "triangle";
    harmonyOsc.frequency.value = harmony[Math.floor(step / 2) % harmony.length];
    harmonyGain.gain.setValueAtTime(0.0001, now);
    harmonyGain.gain.exponentialRampToValueAtTime(0.026, now + 0.02);
    harmonyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
    harmonyOsc.connect(harmonyGain);
    harmonyGain.connect(musicGain);
    harmonyOsc.start(now);
    harmonyOsc.stop(now + 0.35);
  }

  if (step % 4 === 0) {
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = "sine";
    bassOsc.frequency.value = bass[Math.floor(step / 4) % bass.length];
    bassGain.gain.setValueAtTime(0.0001, now);
    bassGain.gain.exponentialRampToValueAtTime(0.05, now + 0.02);
    bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);
    bassOsc.connect(bassGain);
    bassGain.connect(musicGain);
    bassOsc.start(now);
    bassOsc.stop(now + 0.52);
  }

  if (step % 4 === 2) noiseHit(0.035, 0.006);
  step += 1;
}

function startGeneratedFallbackMusic() {
  if (!isBrowser() || !isSoundEnabled() || !isMusicEnabled() || musicTimer !== null) return;
  playMusicStep();
  musicTimer = window.setInterval(playMusicStep, 300);
}

export function startGameMusic() {
  if (!isBrowser() || !isSoundEnabled() || !isMusicEnabled() || musicOn) return;
  musicOn = true;

  if (!musicAudio) {
    musicAudio = new Audio(MUSIC_SRC);
    musicAudio.loop = true;
    musicAudio.volume = getMusicVolume();
    musicAudio.preload = "auto";
  }

  musicAudio.currentTime = musicAudio.currentTime || 0;
  const playPromise = musicAudio.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {
      startGeneratedFallbackMusic();
    });
  }
}

export function stopGameMusic() {
  musicOn = false;
  if (musicAudio) {
    musicAudio.pause();
  }
  if (musicTimer !== null) {
    window.clearInterval(musicTimer);
    musicTimer = null;
  }
  if (musicGain) {
    try {
      musicGain.disconnect();
    } catch {
      // ignore
    }
    musicGain = null;
  }
}
