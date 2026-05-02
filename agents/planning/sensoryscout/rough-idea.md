# Sensly — Raw Idea Capture

> Verbatim from design.md — captured before any refinement.

## The Concept

A crowdsourced sensory environment map that uses your phone's microphone to automatically measure venue noise levels, combined with user ratings on lighting, crowding, smell, and predictability. Think Wheelmap for sensory needs — but the phone does half the work.

**Tagline:** "Know before you go. Your phone listens so you can prepare."

## Target Users
- Autistic individuals
- People with ADHD, PTSD, sensory processing disorder, anxiety disorders, migraine sufferers
- Estimated 300M+ people worldwide who are neurodivergent

## Core Differentiator
The phone auto-measures noise via Web Audio API — no other sensory mapping app does this.
Manual ratings cover: lighting, crowding, smell, predictability.

## Stack (as specified)
- React PWA
- Leaflet + OpenStreetMap tiles (free)
- Nominatim (free reverse geocoding)
- Overpass API (free POI queries)
- Supabase free tier (DB + auth)
- Web Audio API (built-in browser)

## Source
design.md in workspace root
