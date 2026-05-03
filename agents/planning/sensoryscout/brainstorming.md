# Sensly — Brainstorming Archive

> Consolidated from early brainstorming docs. These are historical — the final decisions are in `rough-idea.md`, `detailed-design.md`, and `ui-integration-plan.md`.

---

## Hackathon Ideas by Track

Early ideation across all 4 hackathon tracks (Creative Studio, Intellectual Pursuit, Industrial, Human-Centered Design). ~100 ideas were generated. The team chose the Human-Centered Design track with a sensory monitoring app.

Source: `hackathon-ideas.md`

---

## App Naming

Extensive naming exploration (~150+ candidates). Final decision: **Sensly**.

Key finalists considered:
- **Sensly** (winner) — "sense + -ly", modern app convention, instantly communicates function
- **Senzo** — short, punchy, tech-forward
- **Aurora** — beautiful metaphor but likely taken
- **Sentinel** — strong early-warning connotation, used as working title during concept phase

Source: `app-names.md`, `expanded-names.md`, `marketable-names.md`

---

## Early Concept: "Sentinel" — Predictive Meltdown Prevention

Before settling on the crowdsourced venue mapping approach, the team explored a more ambitious concept: a multi-source data fusion system that combines phone sensors, wearables (Apple Watch), and medical devices (CGM) to predict autism meltdowns.

Key ideas that carried forward into Sensly:
- Phone mic for ambient noise measurement (became the core differentiator)
- Risk score algorithm (became the Dashboard risk gauge)
- Intervention library (became the Calm screen)
- Pattern detection from sensor history (became the learning engine Edge Function)
- Care team sharing (became the companion mode stretch goal)

Ideas that were descoped:
- Wearable integration (Apple Watch heart rate)
- Medical device integration (CGM blood sugar)
- Facial stress detection via camera
- Background monitoring (battery/privacy concerns)

The phone-only approach was chosen for hackathon feasibility — all the innovation with zero hardware dependencies.

Source: `sensory-medical-concept.md`, `sentinel-phone-only.md`

---

## Deep Analysis

Detailed analysis of the sensory monitoring concept, competitive landscape, and technical feasibility. Key findings:
- No existing app combines auto-measured noise with crowdsourced sensory ratings
- 300M+ neurodivergent people worldwide as target audience
- Zero-cost API stack is viable (OpenStreetMap, Nominatim, Overpass, Supabase free tier)

Source: `deep-analysis.md`
