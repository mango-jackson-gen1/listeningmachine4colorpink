// =============================================================================
// SPEECH -> VISUALS: Control p5.js with your voice! (no Python needed)
// =============================================================================
// Uses the Web Speech API (Chrome/Edge) for voice recognition.
// Mirrors the Python OSC examples — all three message types:
//   /speech/text   -> displays transcribed text
//   /speech/color  -> detects color names, changes background
//   /speech/number -> detects numbers, draws circles
//
// To run: serve with a local server, open in Chrome, click "Start Listening"
//   cd class_4/p5-speech && python3 -m http.server 8000
//   open http://localhost:8000
// =============================================================================

let recognition;
let listening = false;

// -- state matching the Python examples --
let displayText = "say something...";
let bgColor, targetColor;
let displayNumber = 0;
let circleSize = 0;
let pulseAmt = 0;

// -- color lookup (loaded dynamically from xkcd.json — 954 colors!) --
let COLORS = {};

// -- number words (same as Python version) --
const NUMBER_WORDS = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

let btnListen;
let statusMsg = "Click 'Start Listening' to begin";
let lastColorName = "";

function preload() {
  // load the 954 xkcd colors and build the lookup table
  let data = loadJSON("xkcd.json");
  // loadJSON returns the object directly — parse in setup once ready
  window._xkcdData = data;
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);

  // build COLORS lookup from xkcd.json: { "cloudy blue": [172, 194, 217], ... }
  if (window._xkcdData && window._xkcdData.colors) {
    for (let entry of window._xkcdData.colors) {
      let hex = entry.hex;
      let r = parseInt(hex.slice(1, 3), 16);
      let g = parseInt(hex.slice(3, 5), 16);
      let b = parseInt(hex.slice(5, 7), 16);
      COLORS[entry.color] = [r, g, b];
    }
    console.log(`Loaded ${Object.keys(COLORS).length} colors from xkcd.json`);
  }

  bgColor = color(30);
  targetColor = color(30);

  btnListen = createButton("Start Listening");
  btnListen.position(20, 20);
  btnListen.mousePressed(toggleListening);

  // set up Web Speech API
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    statusMsg = "Speech Recognition not supported — use Chrome or Edge";
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onresult = (event) => {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    processSpeech(transcript);
  };

  recognition.onerror = (event) => {
    console.log("Speech error:", event.error);
    if (event.error === "not-allowed") {
      statusMsg = "Microphone access denied — check browser permissions";
    }
  };

  recognition.onend = () => {
    if (listening) recognition.start();
  };
}

// -- Process speech (mirrors Python send_osc_from_speech) --
function processSpeech(text) {
  text = text.trim().toLowerCase();

  // Example 1: display the full transcription (/speech/text)
  displayText = text;
  console.log(`[speech/text] '${text}'`);

  // Example 2: detect colors and change background (/speech/color)
  // find the longest matching color name to avoid partial matches
  let bestMatch = "";
  for (let colorName in COLORS) {
    if (text.includes(colorName) && colorName.length > bestMatch.length) {
      bestMatch = colorName;
    }
  }
  if (bestMatch) {
    let rgb = COLORS[bestMatch];
    targetColor = color(rgb[0], rgb[1], rgb[2]);
    lastColorName = bestMatch;
    pulseAmt = 1;
    console.log(`[speech/color] ${rgb} (${bestMatch})`);
  }

  // Example 3: detect numbers (/speech/number)
  for (let word in NUMBER_WORDS) {
    if (text.includes(word)) {
      displayNumber = NUMBER_WORDS[word];
      circleSize = displayNumber * 40;
      pulseAmt = 1;
      console.log(`[speech/number] ${displayNumber}`);
    }
  }

  // also check for digit characters (e.g. "5")
  let digitMatch = text.match(/\b(\d+)\b/);
  if (digitMatch) {
    let n = parseInt(digitMatch[1]);
    if (n >= 1 && n <= 10) {
      displayNumber = n;
      circleSize = displayNumber * 40;
      pulseAmt = 1;
      console.log(`[speech/number] ${displayNumber}`);
    }
  }
}

function toggleListening() {
  if (!recognition) return;
  if (listening) {
    recognition.stop();
    listening = false;
    btnListen.html("Start Listening");
    statusMsg = "Stopped listening";
  } else {
    recognition.start();
    listening = true;
    btnListen.html("Stop Listening");
    statusMsg = "Listening...";
  }
}

function draw() {
  // smoothly lerp background toward target color
  bgColor = lerpColor(bgColor, targetColor, 0.05);
  background(bgColor);

  let cx = width / 2;
  let cy = height / 2;

  // draw concentric circles based on the number (/speech/number)
  pulseAmt *= 0.95;
  noFill();
  stroke(255, 80);
  strokeWeight(2);
  for (let i = 0; i < displayNumber; i++) {
    let diameter = circleSize - i * 30 + pulseAmt * 20;
    if (diameter > 0) {
      ellipse(cx, cy - 20, diameter, diameter);
    }
  }

  // display the spoken text (/speech/text)
  noStroke();
  fill(255);
  textSize(32);
  text(displayText, cx, cy + circleSize / 2 + 60);

  // show the number big in the corner
  textSize(120);
  fill(255, 40);
  text(displayNumber, width - 100, 120);

  // show detected color name
  if (lastColorName) {
    textSize(18);
    fill(255, 150);
    text("color: " + lastColorName, width - 100, 200);
  }

  // status bar at bottom
  fill(255, 100);
  textSize(14);
  text(statusMsg, cx, height - 30);

  // listening indicator (pulsing red dot)
  if (listening) {
    fill(255, 60, 60, 150 + sin(frameCount * 0.1) * 100);
    noStroke();
    ellipse(width - 30, 30, 16);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
