---
inclusion: manual
---

# Sensly — Sensory Research & Implementation Guidelines

This steering file contains clinical research findings, schema decisions, privacy rules, and onboarding principles for the Sensly app. Load this file when implementing recommendation logic, user profiles, onboarding flows, privacy-sensitive features, or any AI-generated content shown to users.

---

## Core Principle

**Preferences drive everything. Diagnoses drive nothing.**

The recommendation engine, filtering logic, and all AI-generated content must operate exclusively on preference fields (`noise.max_comfortable_db`, `lighting.sensitivity`, etc.). The `self_reported_diagnoses` field is never passed to recommendation logic, never used in scoring, and never included in LLM prompts.

---

## Sensory Trigger Research by Population

### Autism Spectrum (ASD)
- 70–90% of autistic individuals experience sensory processing differences ([Frontiers in Psychiatry, 2026](https://www.frontiersin.org/journals/psychiatry/articles/10.3389/fpsyt.2026.1771956/full))
- **Noise** is the single most cited trigger. Unpredictable sounds (alarms, PA announcements, crying children) are more distressing than consistent background noise
- **Fluorescent lighting** — flicker, harsh overhead, high-contrast glare are strongly aversive. Dim, diffuse, or natural light preferred
- **Crowding** — density of people, proximity to strangers, inability to maintain personal space
- **Smell** — strong food smells, cleaning products, perfume. Less universal than auditory but highly impactful when present
- **Predictability** — one of 6 core principles determining whether a space is enabling or disabling. Unpredictable changes (construction, rearranged furniture) are disproportionately distressing ([MacLennan et al., PMC10726197](https://pmc.ncbi.nlm.nih.gov/articles/PMC10726197/))
- **Recovery space** — access to a quiet, low-stimulation area to decompress is a key enabler
- NAS Autism Friendly Award evaluates: noise levels, lighting adjustability, clear layout/wayfinding, staff awareness, quiet spaces ([autism.org.uk](https://www.autism.org.uk/what-we-do/autism-know-how/autism-accreditation/autism-friendly-award))

### PTSD
- PTSD locks the nervous system into hyperarousal — the brain continuously scans for threat signals ([Cleveland Clinic](https://my.clevelandclinic.org/health/symptoms/hyperarousal))
- **Sudden loud sounds** — startle response to unexpected noise is measurably heightened. Backfires, alarms, PA announcements, crowd noise spikes ([NIH / PMC2647968](https://pmc.ncbi.nlm.nih.gov/articles/PMC2647968/))
- **Enclosed spaces with no visible exit** — inability to identify escape routes is a core trigger. Narrow corridors, windowless rooms, crowded queues
- **Dark corners, blind spots, overhangs** — reduce situational awareness and prevent threat scanning. The NICoE military PTSD clinic design explicitly eliminated these ([Psychology Today / Sternberg, 2025](https://www.psychologytoday.com/us/blog/creating-wellbeing-wherever-you-are/202508/6-environmental-features-that-may-trigger-ptsd))
- **Crowding** — inability to maintain personal space and monitor surroundings
- **Unpredictability** — chaotic, changing environments with no clear structure
- **Glaring or flickering light** — harsh lighting increases arousal; diffuse, natural light is calming
- Design features that reduce PTSD triggers: open floor plans, glass walls, multiple visible exits, diffuse lighting, acoustic dampening, rounded corners, views to outdoors/nature, low clutter

### ADHD
- People with ADHD report significantly higher sensory sensitivity and avoidance than non-ADHD peers. Underlying mechanism: impaired sensory gating — the brain's ability to suppress irrelevant input ([Edge Foundation, 2025](https://edgefoundation.org/when-your-brain-wont-turn-the-volume-down-adhd-synaptic-pruning-and-sensory-sensitivity/))
- **Background noise / competing conversations** — ambient chatter, music, and noise all compete equally for attention. Open offices, busy cafes, restaurants are particularly challenging ([NIH / PMC4872403](https://pmc.ncbi.nlm.nih.gov/articles/PMC4872403/))
- **Visual clutter** — busy visual environments (cluttered shelves, dense signage, complex layouts) increase cognitive load
- **Unpredictability** — unexpected changes disrupt focus and routine
- **CRITICAL — ADHD is heterogeneous**: includes both sensory-avoiding AND sensory-seeking subtypes. Some individuals perform better with moderate background noise. Never assume direction — capture individual preference via `sensory_seeking.noise` field ([NIH / PMC11585357](https://pmc.ncbi.nlm.nih.gov/articles/PMC11585357/))

### Sensory Processing Disorder (SPD)
- SPD can manifest as hypersensitivity (over-responsive), hyposensitivity (under-responsive), or sensory seeking — and these can vary by modality within the same person ([Child Mind Institute](https://childmind.org/article/sensory-processing-issues-explained))
- Most relevant modalities for venue navigation:
  - **Auditory** — hypersensitivity to noise levels, specific frequencies, sudden sounds
  - **Visual** — sensitivity to brightness, flicker (fluorescent), visual complexity, motion
  - **Olfactory** — strong smells can be overwhelming or physically painful
  - **Tactile** — crowding and incidental contact with strangers
- Meta-analysis: hypersensitivity, visual, auditory, and tactile sensitivities most strongly associated with behavioral/emotional problems; smell/taste showed smaller effects ([NIH / PMC39515075](https://pubmed.ncbi.nlm.nih.gov/39515075/))

### Anxiety Disorders (Agoraphobia, Social Anxiety, GAD)
- Anxiety in public spaces clusters around two core fears: (1) inability to escape if panic occurs, (2) loss of control/predictability
- DSM-5 agoraphobia criteria explicitly list: public transport, open spaces, enclosed spaces, crowds/queues, being outside alone ([NIH / NBK554387](https://www.ncbi.nlm.nih.gov/books/NBK554387/))
- **Crowding** — inability to move freely, proximity to strangers, queues with no clear end
- **Enclosed spaces** — rooms with no windows, narrow corridors, exit not visible
- **Unpredictability** — chaotic environments, unexpected events, unclear layout
- **Noise** — loud, unpredictable noise increases arousal and can precipitate panic
- Sensory over-responsivity in childhood is an early risk factor for anxiety disorders. Relationship is bidirectional: anxiety lowers the threshold for sensory overload ([NIH / PMC6508996](https://pmc.ncbi.nlm.nih.gov/articles/PMC6508996/))

---

## Diagnosis × Place Field Priority Matrix

Use this to weight recommendation scoring. ★★★ = primary filter signal, ★★ = secondary, ★ = minor.

| Place Field | Autism | ADHD | PTSD | SPD | Anxiety |
|---|---|---|---|---|---|
| `noise.avg_db` | ★★★ | ★★★ | ★★★ | ★★★ | ★★ |
| `noise.sudden_sound_risk` | ★★★ | ★★ | ★★★ | ★★★ | ★★ |
| `noise.consistency` | ★★★ | ★★ | ★★★ | ★★ | ★★ |
| `lighting.has_fluorescent` | ★★★ | ★★ | ★ | ★★★ | ★ |
| `lighting.avg_level` | ★★ | ★ | ★★ | ★★ | ★ |
| `crowding.avg_density` | ★★★ | ★★ | ★★★ | ★★ | ★★★ |
| `crowding.has_queues` | ★★ | ★ | ★★ | ★ | ★★★ |
| `smell.avg_intensity` | ★★★ | ★ | ★ | ★★★ | ★ |
| `predictability.avg_score` | ★★★ | ★★ | ★★★ | ★★ | ★★★ |
| `predictability.layout_available` | ★★★ | ★ | ★★ | ★ | ★★ |
| `accessibility.has_visible_exits` | ★ | ★ | ★★★ | ★ | ★★★ |
| `accessibility.has_quiet_zone` | ★★★ | ★★ | ★★ | ★★★ | ★★ |
| `accessibility.outdoor_seating` | ★★ | ★ | ★★ | ★★ | ★★ |
| `time_patterns.quietest_period` | ★★★ | ★★★ | ★★ | ★★★ | ★★ |

**Key observations:**
- Noise (volume + unpredictability) is the universal top signal across all populations
- Predictability is the second most universal signal — often underweighted in existing frameworks
- Exit visibility is PTSD- and anxiety-specific but a hard requirement for those users
- Smell is autism- and SPD-specific but can be a hard disqualifier when present
- ADHD is the most heterogeneous — never assume avoidance, always check `sensory_seeking.noise`

---

## Recommendation Score Logic

Weighted penalty system. Start at 100, deduct for mismatches, add bonuses for positive features.

```
HARD FILTERS (exclude venue entirely if failed):
  - user.noise.max_comfortable_db < place.noise.avg_db  →  exclude
  - user.lighting.sensitivity == "high" AND place.lighting.has_fluorescent == true  →  exclude
  - user.smell.sensitivity == "high" AND place.smell.avg_intensity >= 4  →  exclude

PENALTY SCORING (after hard filters pass, start at 100):

  Noise:
    - avg_db within 5 dB of user threshold  →  -10
    - user dislikes_sudden_sounds AND sudden_sound_risk == "high"  →  -20
    - user dislikes_sudden_sounds AND sudden_sound_risk == "moderate"  →  -10

  Lighting:
    - user dislikes_fluorescent AND place has_fluorescent  →  -15
    - user lighting sensitivity "high" AND avg_level >= 4  →  -10

  Crowding:
    - user max_comfortable_density "low" AND avg_density >= 4  →  -15
    - user needs_personal_space AND personal_space_rating <= 2  →  -10

  Smell:
    - user sensitivity "high" AND avg_intensity >= 3  →  -10
    - user smell triggers overlap with place smell_types  →  -10

  Predictability:
    - user importance "high" AND avg_score <= 2  →  -20
    - user needs_layout_preview AND layout_available == false  →  -5

  Exit/safety:
    - user exit_visibility.important AND has_visible_exits == false  →  -15

BONUSES:
  - user needs recovery_space AND place has_quiet_zone  →  +10
  - user needs_layout_preview AND layout_available  →  +5
  - outdoor_seating AND user needs_personal_space  →  +5
  - kulturecity_certified  →  +5

TIME ADJUSTMENT:
  - If user specifies a time slot, replace avg_db with noise_by_slot[slot] for noise calculations

Final: max(0, 100 - penalties + bonuses)
  >= 80: Good match (green)
  60–79: Moderate match (yellow)
  < 60: Poor match (red)
```

**Rationale:** Predictability and sudden sounds carry higher penalties than consistent-but-loud noise because research shows unpredictability is more distressing than intensity alone.

---

## Privacy Rules (Non-Negotiable)

### Diagnosis data
- `self_reported_diagnoses` stored in a separate table or encrypted column — never bundled with general profile data
- Never exposed via API to other users
- Never included in aggregated venue data or analytics
- **Never sent to the LLM layer** — only preference fields are passed to AI prompts
- On account deletion: hard-delete immediately, not soft-delete
- If companion sharing is ever built (stretch goal): share preferences only, never diagnosis labels
- Row-level security (RLS) in Supabase: users can only read/write their own profile row

### Location data
- **Never store raw location history** — GPS is used in-session only, discarded immediately after use
- Venue check-ins store venue ID + timestamp only — not GPS coordinates
- No movement tracking — no trail of locations over time, ever
- Dwell time detection is on-device only — server receives a boolean "left quickly" event, not coordinates or duration
- On-device processing first for any feature that can be computed locally
- Request "while using the app" location permission only — never "always on"
- Location permission prompt must explain why: "To show nearby venues and measure your current environment"

### What is public (by design)
- Aggregated venue scores — always anonymized, never attributable to an individual
- Venue tags and sensory features — contributed anonymously
- No individual rating is attributable to a specific person in the public UI

---

## Onboarding UX Rules

**Never ask about diagnosis. Ask about experience and preference.**

### What to ask
- "Which of these sounds bothers you most in a café?" (scenario question, not sensitivity scale)
- "What makes a place feel comfortable for you?" (multi-select: quiet, dim lighting, not crowded, predictable layout, visible exits, quiet corner, outdoor seating)
- Visual "comfort dial" from "library quiet" to "busy train station" — captures `max_comfortable_db` without showing dB numbers
- "Do you use any of these?" for comfort tools (headphones, sunglasses, etc.) — optional, skippable

### Structure
- 3 screens maximum
- Screen 1: Noise (dial + sudden sounds toggle)
- Screen 2: "What else matters?" (multi-select)
- Screen 3: Comfort tools (optional, skippable)
- Diagnosis field: separate optional screen, after all preference questions, with explicit privacy copy

### Required copy for diagnosis screen
> "This is completely optional and only used to surface relevant tips for you. It's never shared with other users, never used to filter your results, and you can remove it any time."

### What to avoid
- Never ask "Do you have autism / PTSD / ADHD?"
- Never use abstract sensitivity scales (1–10)
- Never use clinical language in the UI
- Never gate the app behind profile completion — let users explore first

### Behavioral learning
If a user consistently rates fluorescent-lit venues poorly, surface: "It looks like you prefer venues without fluorescent lighting — want to add that to your profile?" Learn from behavior, reduce onboarding friction.

---

## AI Content Rules

When generating any text shown to users (tips, briefings, journal insights, warnings):

- Use plain, warm, non-clinical language — never use diagnostic labels in user-facing copy
- Never say "because you have autism" — say "based on your preferences"
- Trauma-informed framing for all content — avoid language that implies the user is broken or needs fixing
- Contextual tips from diagnosis field use "many people find..." framing, never "you have X so..."
- Weekly journal insights must be observational, not prescriptive: "You tended to leave quickly on Friday evenings" not "You should avoid Fridays"
- Morning briefing must be factual and calm — flag potential issues without alarm language

---

## Existing Frameworks for Reference

**KultureCity Sensory Inclusive® Certification** ([kulturecity.org](https://www.kulturecity.org/sensory-inclusive/))
- 3,000+ certified locations globally, covers autism/PTSD/dementia/Parkinson's
- Requires: staff training, sensory bags, quiet zones, clear signage
- Limitation: binary certified/not certified — no granular sensory load scores
- Sensly's differentiator: continuous, crowdsourced, real-time scores

**NAS Autism Friendly Award** ([autism.org.uk](https://www.autism.org.uk/what-we-do/autism-know-how/autism-accreditation/autism-friendly-award))
- UK-based, retail and public venues
- Criteria: noise management, lighting adjustability, clear layout, staff training, quiet spaces
- Limitation: pass/fail, not a continuous scale


---

## Sensory Reset & Grounding Strategies

Evidence-based calming and regulation strategies organized by sensory modality. Use this when implementing or modifying the Calm screen, intervention suggestions, or any AI-generated calming guidance.

Sources: [Simply Psychology](https://www.simplypsychology.org/emotional-regulation-strategies-for-autistic-adults.html), [NeuroSpark Health](https://neurosparkhealth.com/sensory/nervous-system-regulation), [FLOAAT Center](https://www.floaatcenter.com/blog/sensory-friendly-coping-strategies-for-anxiety), [Myndset Therapeutics](https://www.myndset-therapeutics.com/post/calming-the-storm-20-somatic-resources-to-help-autistic-and-adhd-adults-shift-from-fight-or-flight), [Healthemindset](https://www.healthemindset.com/articles/neurodivergent-nervous-systems-somatic-strategies-for-adhd-and-autism)

### By Sensory Modality

**Auditory**
- Noise-canceling headphones — blocks unpredictable sounds, most effective for autism/SPD/migraine
- White noise or brown noise — masks environmental sounds, helps ADHD focus and reduces startle for PTSD
- Move to quiet space — universal, reduces total sensory load
- Humming or vocal toning — vagal nerve stimulation, self-soothing

**Visual**
- Close eyes — immediate visual input reduction
- Sunglasses — reduces harsh/fluorescent light, especially for autism and migraine
- Find dim lighting — move away from fluorescent sources, seek natural or warm light
- Reduce visual clutter — face a wall, look at a single point, reduce screen brightness

**Tactile / Proprioceptive**
- Deep pressure — firm self-hug, weighted lap pad, compression vest. Organizes sensory pathways, promotes calm alertness. Best for autism/SPD
- Wall push-ups — heavy work that discharges energy and provides proprioceptive input. Best for ADHD/SPD
- Fidget tool — tactile grounding, redirects sensory-seeking behavior. Best for ADHD/anxiety
- Chewy snack or gum — oral proprioceptive input, calming for autism/SPD
- Cold water on wrists or face — vagal nerve reset, rapidly lowers heart rate. Best for PTSD/anxiety/panic

**Vestibular / Movement**
- Gentle walking — discharges fight-or-flight energy, especially for ADHD
- Rocking or swaying — self-soothing vestibular input, common in autism
- Stretching — releases muscle tension from stress response

**Breathing / Regulation**
- Deep belly breathing — 4 seconds in, 6 seconds out. Universal, activates parasympathetic nervous system
- Box breathing — 4 in, 4 hold, 4 out, 4 hold. Structured pattern helps PTSD and anxiety
- Alternate nostril breathing — balances nervous system, improves focus. 2-3 minutes

**Grounding (PTSD / Anxiety specific)**
- 5-4-3-2-1 technique — name 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste. Anchors to present moment, interrupts dissociation and flashback
- Feet on floor — press feet firmly into ground, notice the sensation. Simple, can be done anywhere
- Hold ice or cold object — strong sensory input overrides panic response
- Name your surroundings — "I am in [place], it is [time], I am safe." Reorients after dissociation

**Olfactory**
- Fresh air — step outside or open window. Reduces smell-based triggers
- Familiar calming scent — lavender, peppermint (carry in pocket). Olfactory anchoring

### Personalization Rules

When suggesting strategies to a user:
1. **Match to trigger categories first** — if their triggers include "sound", prioritize auditory strategies
2. **Match to diagnosis second** — PTSD users get grounding techniques, ADHD users get movement-based strategies
3. **Universal strategies always available** — deep breathing, quiet space, fresh air work for everyone
4. **Never suggest strategies that require unavailable tools** — if user doesn't list headphones in comfort_items, don't make it the top suggestion
5. **Limit to 6-8 options** — too many choices increases cognitive load during a crisis
6. **Order by immediacy** — strategies that can be done right now, right here, should appear first
7. **No clinical language** — say "deep pressure" not "proprioceptive input" in user-facing text

### Duration Guidelines

| Strategy | Time needed | Can do anywhere? |
|---|---|---|
| Close eyes | 10 seconds | Yes |
| Deep breathing | 1-2 minutes | Yes |
| 5-4-3-2-1 grounding | 2-3 minutes | Yes |
| Cold water on wrists | 30 seconds | Needs water |
| Fidget tool | Ongoing | Yes (if carrying) |
| Wall push-ups | 1 minute | Needs a wall |
| Walk/stretch | 5 minutes | Needs space |
| Quiet space | 5-15 minutes | Needs access |
| Headphones | Ongoing | Yes (if carrying) |
