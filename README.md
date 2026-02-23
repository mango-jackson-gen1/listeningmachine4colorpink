# Speech-to-Color (p5.js + Web Speech API)

A browser-based sketch that listens to your voice and changes the background color in real time. Say a color name and watch the canvas respond.

## How It Works

### Voice Activity Detection & Speech Recognition

Under the hood this sketch relies entirely on the **Web Speech API** built into Chromium browsers (Chrome / Edge). The browser's audio pipeline handles two jobs that would normally require separate libraries:

1. **VAD (Voice Activity Detection)** — the browser's `SpeechRecognition` engine continuously monitors the microphone stream for speech onset and endpoint. When it detects silence after speech it finalizes a recognition result. Because `continuous` mode is enabled the recognizer automatically segments utterances without the sketch needing to manage audio energy thresholds or silence timers itself.

2. **ASR (Automatic Speech Recognition)** — the captured audio is sent to the browser's cloud-backed speech-to-text service, which returns transcription hypotheses. `interimResults` is turned on so partial transcripts arrive while the user is still speaking, giving the sketch low-latency feedback before the final result is committed.

Both of these happen inside the browser's Web Audio / media stack — no external ASR server, no Python backend, no WebSocket relay. The sketch simply registers an `onresult` callback and receives transcript strings.

### The xkcd Color Dataset

The file `xkcd.json` contains **954 named colors** crowdsourced from several hundred thousand participants in the [xkcd color name survey](https://blog.xkcd.com/2010/05/03/color-survey-results/). Each entry maps a human-readable name (e.g. "dusty rose", "electric lime", "ugly green") to a hex value. On load the sketch parses every entry into an RGB lookup table.

This gives the sketch a much richer vocabulary than the basic CSS color set — users can say things like "cloudy blue", "dark pastel green", or "burnt sienna" and get a match.

### Color Trigger Logic

Each time the Web Speech API fires a transcript (interim or final):

1. The transcript is lowercased and compared against all 954 color names.
2. If multiple names match (e.g. the transcript contains both "blue" and "cloudy blue"), the **longest match wins** to avoid false partial hits.
3. The matched color becomes the new **target color**. The canvas background doesn't snap — it **lerps** smoothly toward the target each frame, producing a gradual crossfade.

The sketch also detects spoken numbers (words like "three" or digits like "5") and draws concentric circles sized by the number, but the primary interaction loop is: **speak a color word → background shifts to that color**.

## Running Locally

Serve the folder with any static server and open in Chrome or Edge:

```
python3 -m http.server 8000
```

Then visit `http://localhost:8000` and click **Start Listening**.
