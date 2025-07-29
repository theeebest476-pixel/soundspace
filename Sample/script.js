const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

let currentInstrument = "piano";
let mediaDest = audioCtx.createMediaStreamDestination();
let recorder = null;
let audioChunks = [];

document.getElementById("instrument").addEventListener("change", e => {
  currentInstrument = e.target.value;
});

const keyFreq = {
  a: 261.63,
  s: 293.66,
  d: 329.63,
  f: 349.23,
  g: 392.00,
  h: 440.00,
  j: 493.88,
  k: 523.25
};

document.addEventListener("keydown", e => {
  const key = e.key.toLowerCase();
  if (keyFreq[key]) {
    playSound(key);
    showVisual(key);
  }
});

function playSound(key) {
  if (currentInstrument === "piano") playPiano(keyFreq[key]);
  else if (currentInstrument === "drums") playDrum(key);
}

function playPiano(freq) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.value = freq;

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.connect(mediaDest);

  gain.gain.setValueAtTime(1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1);

  osc.start();
  osc.stop(audioCtx.currentTime + 1);
}

function playDrum(key) {
  const bufferSize = audioCtx.sampleRate;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-3 * i / bufferSize);
  }

  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;

  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1000, audioCtx.currentTime);

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  gain.connect(mediaDest);

  noise.start();
}

function showVisual(key) {
  const el = document.getElementById(key);
  if (!el) return;
  el.classList.add("active");
  setTimeout(() => el.classList.remove("active"), 150);
}

function startRecording() {
  recorder = new MediaRecorder(mediaDest.stream);
  audioChunks = [];
  recorder.ondataavailable = e => audioChunks.push(e.data);
  recorder.onstop = () => {
    const blob = new Blob(audioChunks);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "recording.webm";
    a.click();
  };
  recorder.start();
  console.log("Recording started");
}

function stopRecording() {
  if (recorder && recorder.state === "recording") {
    recorder.stop();
    console.log("Recording stopped");
  }
}
