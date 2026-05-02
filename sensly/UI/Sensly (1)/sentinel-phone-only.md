# Sentinel: Phone-Only Sensory Monitoring System
## 13-Hour Buildable Scope

---

## Core Premise: Your Phone Already Has The Sensors

**No wearables. No medical devices. Just the phone in your pocket.**

Every smartphone has:
- ✅ **Microphone** → Ambient noise levels (dB)
- ✅ **Accelerometer** → Movement patterns, stimming detection, sleep tracking
- ✅ **Camera** → Visual environment analysis, facial stress detection
- ✅ **Time/Location** → Context awareness

**The Innovation**: Fuse these sensors in real-time to predict sensory overload BEFORE meltdown.

---

## The Three Sensors & What They Detect

### 1. MICROPHONE → Auditory Overload Detection

**What We Measure**:
- Real-time ambient noise level (decibels)
- Sudden loud sounds (doors slamming, alarms)
- Sustained high noise (classroom chatter, cafeteria)
- Frequency analysis (high-pitched sounds are often more triggering)

**How It Predicts Meltdowns**:
- Track child's noise tolerance threshold
- Alert when environment exceeds safe level
- Pattern: "Meltdowns happen 80% of time when exposed to >75dB for >15 minutes"

**Technical Implementation** (Browser APIs):
```javascript
// Web Audio API
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    microphone.connect(analyser);
    
    // Get frequency data
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    
    // Calculate average volume → convert to dB
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    const decibels = 20 * Math.log10(average);
});
```

**Demo Scenarios**:
- Quiet room: 40dB (green, safe)
- Normal conversation: 60dB (yellow, monitor)
- Loud classroom: 75dB (orange, caution)
- Fire alarm: 95dB (red, crisis)

---

### 2. ACCELEROMETER → Movement Pattern & Sleep Analysis

**What We Measure**:
- **Stimming patterns**: Repetitive movements (hand-flapping, rocking, pacing)
- **Agitation**: Increased movement, restlessness
- **Sleep quality**: Movement during night (more movement = poor sleep)
- **Activity level**: Under-stimulated (needs movement) vs over-stimulated (too much)

**How It Predicts Meltdowns**:
- Increased stimming = rising stress
- Poor sleep last night = higher vulnerability today
- Sudden stillness after hyperactivity = shutdown (precursor to meltdown)
- Pattern: "When Miles paces >3 times in 10 minutes, meltdown within 20 min"

**Technical Implementation**:
```javascript
// Accelerometer API
const sensor = new Accelerometer({ frequency: 60 }); // 60 Hz
sensor.addEventListener('reading', () => {
  const { x, y, z } = sensor;
  
  // Calculate movement magnitude
  const magnitude = Math.sqrt(x*x + y*y + z*z);
  
  // Detect patterns:
  // - Repetitive (stimming): regular oscillations
  // - Agitated: high variance
  // - Still: low magnitude sustained
  
  // Track over time for sleep analysis (phone on nightstand)
});
```

**Demo Scenarios**:
- Still (baseline): Low risk
- Repetitive rocking: Elevated risk (self-soothing)
- Erratic movement: High risk (agitation)
- Sleep tracking: "Woke 4 times last night → tired today → higher risk"

---

### 3. CAMERA → Environmental & Facial Analysis

**What We Measure**:

#### A) Environmental Analysis (Passive)
- **Lighting levels**: Too bright (fluorescent) or too dim
- **Visual clutter**: Crowded space vs calm space
- **Colors**: Some kids are triggered by specific colors
- **Movement**: Busy environment (mall) vs quiet (home)

#### B) Facial Expression Detection (Active - Parent Points at Child)
- **Stress indicators**: 
  - Furrowed brow
  - Jaw clenching
  - Eyes squinting (light sensitivity)
  - No eye contact (overwhelm)
- **Early distress signals**:
  - Hands to ears (noise sensitivity)
  - Covering eyes (visual overwhelm)
  - Facial tension

**How It Predicts Meltdowns**:
- Fluorescent lighting (flickering at 60Hz) is major trigger
- Crowded visual scenes = cognitive overload
- Facial stress 5-10 minutes before verbal signs
- Pattern: "Bright lighting + jaw clenching = meltdown in 15 min"

**Technical Implementation**:
```javascript
// Camera access
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    // Option 1: Analyze brightness
    const videoTrack = stream.getVideoTracks()[0];
    const imageCapture = new ImageCapture(videoTrack);
    imageCapture.grabFrame().then(bitmap => {
      // Analyze pixel brightness
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const avgBrightness = calculateBrightness(imageData);
    });
    
    // Option 2: Use Claude Vision API for facial/scene analysis
    // Send frame to Claude: "Describe this child's emotional state and environment"
  });
```

**Demo Scenarios**:
- Home (dim, calm): Green
- Grocery store (bright fluorescent, crowded): Orange
- School cafeteria (loud + bright + crowded): Red
- Facial scan shows: "Stress detected - jaw tension, eyes squinting"

---

## The Risk Score Algorithm (Real-time Fusion)

### Input Sensors (Weighted Scoring)

```javascript
function calculateRiskScore({
  noiseLevel,        // 0-120 dB
  movementPattern,   // 'calm', 'stimming', 'agitated'
  sleepQuality,      // 0-100% (from last night's accelerometer)
  brightness,        // 0-100k lux
  facialStress,      // 0-100 (from camera analysis)
  timeOfDay,         // certain times are harder
  lastMeal,          // minutes since last food
  location,          // 'home', 'school', 'store'
}) {
  let risk = 0;
  
  // Noise contribution (30%)
  if (noiseLevel > childThreshold) {
    risk += ((noiseLevel - childThreshold) / 40) * 30;
  }
  
  // Movement contribution (25%)
  if (movementPattern === 'stimming') risk += 15;
  if (movementPattern === 'agitated') risk += 25;
  
  // Sleep contribution (20%)
  risk += (100 - sleepQuality) * 0.2;
  
  // Environmental contribution (15%)
  if (brightness > childLightThreshold) {
    risk += 15;
  }
  
  // Facial stress (10%)
  risk += facialStress * 0.1;
  
  // Time/context multipliers
  if (timeOfDay >= 15 && timeOfDay <= 18) {
    risk *= 1.2; // End of day is harder
  }
  if (lastMeal > 180) { // 3+ hours
    risk += 10; // Hungry = irritable
  }
  
  return Math.min(100, risk); // Cap at 100
}
```

### Risk Levels & Alerts

- **0-30% (Green)**: Regulated, baseline
  - No alerts
  - Passive monitoring
  
- **31-60% (Yellow)**: Elevated
  - Alert: "Stress building. Monitor closely."
  - Suggestions: "Consider a sensory break soon"
  
- **61-80% (Orange)**: High Risk
  - Alert: "High risk. Intervention recommended."
  - Suggestions: Specific strategies (quiet space, headphones)
  
- **81-100% (Red)**: Critical
  - Alert: "IMMEDIATE INTERVENTION NEEDED"
  - Guided crisis protocol
  - Notify care team

---

## Core Features (13-Hour Build)

### Feature 1: Real-Time Monitoring Dashboard (3 hours)

**Visual Display**:
- Large risk score gauge (0-100%)
- Color-coded (green/yellow/orange/red)
- Live sensor readings:
  - 🔊 Noise: 68 dB
  - 📱 Movement: Elevated
  - 💡 Brightness: 450 lux
  - 😟 Facial stress: Moderate

**Implementation**:
- React component with Recharts gauge
- Real-time updates (1 second refresh)
- Smooth animations (Motion/Framer Motion)
- Responsive design (mobile-first)

---

### Feature 2: Sensor Integration (4 hours)

**Microphone Integration**:
- Request permission
- Continuous monitoring (background)
- Convert audio levels to dB
- Alert on threshold breach

**Accelerometer Integration**:
- Detect movement patterns
- Classify: calm/stimming/agitated
- Sleep tracking mode (overnight)
- Morning sleep quality report

**Camera Integration**:
- On-demand facial scan
- Environmental brightness detection
- Optional: Claude Vision API for facial stress analysis
- Photo log of triggering environments

**Technical Notes**:
- Handle permissions gracefully
- Work offline (local processing)
- Battery optimization (don't drain phone)
- Privacy: data stays local unless parent shares

---

### Feature 3: Smart Alerts & Interventions (2 hours)

**Alert System**:
- Push notifications (PWA)
- Visual alerts (flashing border, sound)
- Escalating urgency
- Snooze option (15 min)

**Intervention Library**:
- Pre-loaded strategies by sensory type:
  - **Auditory**: Headphones, quiet space, white noise
  - **Visual**: Sunglasses, dim lights, reduce clutter
  - **Tactile**: Weighted item, fidget, compression
  - **Movement**: Jump, push wall, rock, swing
  - **Oral**: Chewy snack, drink water, deep breathing

**Guided Intervention**:
- Click "START INTERVENTION"
- Step-by-step guide
- Real-time risk monitoring during intervention
- Success tracking (did it work?)

---

### Feature 4: Pattern Detection & Insights (2 hours)

**Data Logging**:
- Every risk score + sensor readings
- Meltdown events (parent marks)
- Intervention attempts + outcomes
- Environmental context (location, time)

**AI Analysis** (Claude API):
- Weekly pattern report:
  - "Meltdowns correlate with noise >75dB AND poor sleep"
  - "Mornings after bad sleep: 85% higher risk"
  - "Grocery store trips: 70% trigger rate"
- Personalized insights:
  - "Miles' unique trigger: fluorescent lighting"
  - "Best intervention: noise-canceling headphones (9/10 success)"

**Visualizations**:
- Risk score timeline (24 hours, 7 days)
- Trigger frequency chart
- Intervention success rates
- Before/after comparison

---

### Feature 5: Quick-Log & Context (1 hour)

**Fast Manual Input**:
- Big buttons (no typing during crisis)
- 3-tap log:
  1. "Meltdown started"
  2. Trigger category (noise/light/transition/unknown)
  3. Severity (mild/moderate/severe)

**Context Capture**:
- Auto-log: time, location, sensor readings
- Optional photo of environment
- Optional voice note (transcribed)
- Tag people present, activities

**Why This Matters**:
- Sensors don't catch everything
- Parent intuition is valuable
- Combines objective (sensors) + subjective (parent observation)

---

### Feature 6: Parent Dashboard (1 hour)

**Summary Stats**:
- This week: 2 meltdowns prevented, 1 occurred
- Average risk score: 45% (down from 62% last week)
- Sleep quality: 73% average
- Top triggers: Noise (60%), Lighting (30%), Transitions (10%)

**Timeline View**:
- Scroll through day
- See risk score fluctuations
- Tap event for details
- See what interventions were used

**Share with Care Team**:
- Generate PDF report
- Share specific events (link)
- Weekly summary email

---

## The Demo Script (5 Minutes of Magic)

### Setup: The Story (30 seconds)

**Video/Voiceover**:
> "This is Miles. He's 7, autistic, and has sensory processing disorder. His mom Sarah never knows when a meltdown will hit. They're violent, traumatic, and seem to come out of nowhere. But they don't. The signs are there - we just can't see them. Until now."

---

### Act 1: Morning - Sleep Analysis (45 seconds)

**Screen shows**:
- "Last night's sleep quality: 58% (Poor)"
  - Accelerometer detected: 6 wake-ups, restless movement
- Morning alert: "⚠️ Miles had a rough night. Extra support needed today."
- Parent (Sarah) sees this at breakfast
- She marks: "Noted. Will send alert to teacher."

**Narration**:
> "Sentinel tracked Miles' sleep through his phone's accelerometer. Poor sleep = higher vulnerability today. Sarah knows before the day even starts."

---

### Act 2: School - Rising Risk (90 seconds)

**Screen shows live monitoring**:

*9:00 AM - Classroom*
- 🔊 Noise: 65 dB (yellow)
- 📱 Movement: Calm
- 💡 Brightness: 320 lux
- **Risk: 35% (Yellow)**

*9:30 AM - Fire Drill*
- 🔊 Noise: 92 dB → 98 dB (RED ALERT)
- 📱 Movement: Agitated (pacing detected)
- 💡 Brightness: 850 lux (bright hallway)
- **Risk: 68% → 78% (Orange)**

*Alert to teacher*: "⚠️ HIGH RISK - Meltdown likely within 15 min"

*Teacher action*:
- Takes Miles to quiet room
- Offers noise-canceling headphones
- Provides chewy snack

*9:45 AM - Quiet Room*
- 🔊 Noise: 42 dB (quiet)
- 📱 Movement: Gentle rocking (self-soothing)
- **Risk: 78% → 52% → 28% (Green)**

**Big text**: "✅ CRISIS AVERTED"

**Narration**:
> "Sentinel saw it coming. Loud noise plus bright lights plus poor sleep. The teacher intervened before the meltdown. Miles stayed regulated."

---

### Act 3: Afternoon - Camera Analysis (60 seconds)

**Screen shows**:

*3:00 PM - Pickup*
- Parent uses camera to scan Miles' face
- Claude Vision API analyzes: "Facial tension detected. Eyes squinting. Possible light sensitivity."
- Environment scan: "Bright fluorescent lighting, high visual clutter"
- **Risk: 55%**

*Parent decision*:
- Skips grocery store trip (would push risk higher)
- Goes straight home
- Provides sensory break (dim room, weighted blanket)

*3:30 PM - Home*
- **Risk: 22% (Green)**
- Miles playing calmly

**Narration**:
> "Sarah used Sentinel's camera to read what Miles couldn't say. He was close to overwhelm. One more stop would've been too much. Instead, he's happy and calm."

---

### Act 4: Weekly Insights (45 seconds)

**Screen shows dashboard**:

*This Week vs Last Week*
- Meltdowns: 0 vs 4 ⬇️ 100%
- Average risk: 38% vs 67% ⬇️ 43%
- Interventions: 5 successful
- Sleep quality: 71% vs 64% ⬆️

*AI Insights (Claude)*:
> "Pattern detected: Miles' meltdowns correlate strongly with noise >75dB combined with poor sleep (<60% quality). 
> 
> Most effective intervention: Noise-canceling headphones + quiet space (success rate: 90%).
> 
> Recommendation: Prioritize sleep routine. Consider earlier bedtime on school nights."

**Narration**:
> "One week with Sentinel. Zero meltdowns. Sarah finally has the data to understand her son. And the tools to help him."

---

### Act 5: The Emotional Close (30 seconds)

**Parent testimonial** (video or voiceover):
> "For 7 years, I've felt helpless. I couldn't predict it, couldn't stop it. Now I can see what's happening in his nervous system. I can intervene before he's in crisis. Sentinel gave me my power back. And it gave Miles a chance to just be a kid."

**Final screen**:
> **Sentinel**  
> See it before it happens.
> 
> No wearables. No devices. Just your phone.
> 
> *Every family deserves peace.*

---

## 13-Hour Build Timeline

### Hour 0-1: Project Setup
- [ ] Initialize Vite + React + Tailwind
- [ ] Install dependencies:
  - `motion` (animations)
  - `lucide-react` (icons)
  - `recharts` (gauge, charts)
- [ ] Create component structure
- [ ] Set up local storage for data persistence

### Hour 1-2: Risk Score Engine
- [ ] Create risk calculation algorithm
- [ ] Risk score state management
- [ ] Gauge component (0-100%, color-coded)
- [ ] Alert threshold logic

### Hour 2-4: Microphone Integration
- [ ] Request microphone permission
- [ ] Web Audio API setup
- [ ] Calculate dB from audio stream
- [ ] Real-time dB display
- [ ] Threshold alerts (>75dB warning)
- [ ] Noise history chart (last 60 seconds)

### Hour 4-6: Accelerometer Integration
- [ ] Request sensor permission
- [ ] Accelerometer API setup
- [ ] Movement pattern detection:
  - Calm (low variance)
  - Stimming (rhythmic)
  - Agitated (high variance)
- [ ] Display movement status
- [ ] Sleep mode (overnight tracking)
- [ ] Morning sleep quality report

### Hour 6-7: Camera Integration
- [ ] Request camera permission
- [ ] Brightness detection from video stream
- [ ] Optional: Claude Vision API for facial analysis
- [ ] Environmental photo capture
- [ ] Display brightness level

### Hour 7-8: Alert System
- [ ] Alert component (modal/banner)
- [ ] Push notification (PWA)
- [ ] Escalating alerts (yellow/orange/red)
- [ ] Alert history log
- [ ] Snooze functionality

### Hour 8-9: Intervention Library
- [ ] Intervention card components
- [ ] Categorize by sensory type
- [ ] Guided intervention flow
- [ ] Success/failure tracking
- [ ] "Crisis averted" celebration

### Hour 9-10: Dashboard & Insights
- [ ] Timeline view (risk over time)
- [ ] Pattern detection (basic)
- [ ] Claude API integration for insights
- [ ] Weekly summary stats
- [ ] Before/after comparison

### Hour 10-11: Demo Data & Polish
- [ ] Create realistic demo scenario
- [ ] Smooth animations
- [ ] Loading states
- [ ] Error handling
- [ ] Mobile optimization
- [ ] PWA manifest

### Hour 11-12: Testing & Refinement
- [ ] Test all sensor integrations
- [ ] Test risk calculation
- [ ] Test on mobile device
- [ ] Fix critical bugs
- [ ] Performance optimization

### Hour 12-13: Deploy & Submit
- [ ] Deploy to Vercel
- [ ] Record demo video
- [ ] Write submission
- [ ] Submit to hackathon

---

## Technical Stack (Final)

**Frontend**:
- React 18
- Vite (fast dev)
- Tailwind CSS (styling)
- Motion (animations)

**Sensors**:
- Web Audio API (microphone)
- Generic Sensor API (accelerometer)
- MediaDevices API (camera)

**AI**:
- Claude API (pattern analysis, insights, optional facial analysis)

**Storage**:
- LocalStorage (no backend needed for MVP)
- IndexedDB (for larger datasets)

**Deployment**:
- Vercel (static hosting)
- PWA (installable, notifications)

---

## Why This Wins (With Phone-Only Approach)

### ✅ Accessibility
- No expensive hardware ($0 beyond phone you already have)
- Works on any smartphone (Android/iOS via PWA)
- Instant start (download, grant permissions, done)

### ✅ Buildability
- All sensors available via browser APIs
- No external API dependencies (except optional Claude)
- Fully functional offline
- 13 hours is tight but doable

### ✅ Innovation
- Nobody is fusing phone sensors for autism meltdown prediction
- Real-time risk scoring is novel
- Camera for facial stress detection is cutting-edge
- AI insights personalize over time

### ✅ Impact
- 1 in 36 kids = huge market
- Prevents trauma (meltdowns are violent)
- Empowers parents (data → control)
- Measurable outcomes (meltdowns prevented)

### ✅ Demo Quality
- Live, interactive (real sensors working)
- Visual (gauge moving, alerts firing)
- Emotional (crisis averted moment)
- Clear before/after (0 vs 4 meltdowns)

---

## Potential Challenges

### Challenge 1: Browser API Support
**Risk**: Some APIs (Generic Sensor) have limited browser support
**Mitigation**: 
- Fallback to DeviceMotion API (better support)
- Detect capabilities, gracefully degrade
- Focus demo on Chrome (best support)

### Challenge 2: Background Monitoring
**Risk**: Browsers suspend background tabs (battery saving)
**Mitigation**:
- Use PWA with background sync
- Wake Lock API (keep screen on during monitoring)
- Acknowledge limitation: "Keep app open during monitoring"

### Challenge 3: Noise Accuracy
**Risk**: Phone mic placement affects dB reading
**Mitigation**:
- Calibration step (user sets baseline in quiet vs loud room)
- Relative thresholds (not absolute dB)
- Focus on trends, not exact values

### Challenge 4: Privacy
**Risk**: Always-on mic/camera feels invasive
**Mitigation**:
- Clear permissions prompts
- Data stored locally only
- Visual indicator when sensors active
- Easy disable toggle

---

## The Pitch (Revised for Phone-Only)

> "Right now, autism families live in fear of meltdowns. They seem random, but they're not. The signs are there 30 minutes before - we just can't see them.
>
> **Sentinel turns your phone into an early warning system.** The microphone detects overwhelming noise. The accelerometer sees agitation building. The camera reads facial stress. AI fuses it all into a real-time risk score.
>
> When risk hits 80%, parents and teachers get an alert. Intervene early. Prevent the crisis. Zero meltdowns this week vs four last week.
>
> **No wearables. No devices. Just the phone in your pocket.**
>
> 1 in 36 kids has autism. Every family deserves to see it before it happens."

---

## Ready to Build?

This is scoped perfectly for 13 hours:
- ✅ Phone sensors only (no external dependencies)
- ✅ Clear demo scenario (fire drill → intervention → crisis averted)
- ✅ Real innovation (sensor fusion for meltdown prediction)
- ✅ High impact (autism families desperately need this)

**Should I start coding the risk score gauge and microphone integration?**

We'll build in this order:
1. Risk score display (visual foundation)
2. Microphone (easiest sensor, immediate feedback)
3. Accelerometer (movement patterns)
4. Camera (if time allows)
5. Demo scenario with realistic data

**Say "build" and I'll start now.** ⏱️
