# Panchayat AI — Conversational Civic System

## Product thesis

Panchayat AI is a society operating system for residents who may find digital forms difficult. It should feel as direct as speaking to a trusted society representative while remaining credible for payments, permissions, and administrative decisions.

## Visual direction

“Conversational Civic” combines warm Indian signal colors, broad editorial typography, and code-native motion. The system should feel contemporary and distinctly useful—not like a government portal, generic chatbot, or stock-image SaaS template.

### Color tokens

- Paper: `#F4F0E8` — warm primary canvas
- White: `#FFFDF8` — working surfaces
- Ink: `#211D26` — primary text
- Aubergine: `#2D172D` — trust, navigation, and hero depth
- Saffron: `#FFBD59` — primary attention and active actions
- Vermillion: `#E85D3F` — urgency and editorial emphasis
- Sage: `#B9C8AA` — calm support states

### Typography

- Display and interface: **Outfit**, 400–800
- Editorial emphasis: **Newsreader**, italic only
- Headings stay broad, short, and highly legible.

## Identity

The logo is a code-native wordmark paired with the Phosphor `Waveform` symbol. Do not use generated logo images, 3D mascots, or decorative stock imagery. Product visuals come from typography, spatial composition, icons, canvas motion, and real interface states.

## Layout

- Marketing: cinematic centered hero with interactive kinetic grid and generous chapter spacing.
- Product: compact left navigation and a dense 12-column workspace.
- Assistant: the page itself is the conversation; never place a chat window inside another card.
- Corners remain moderate: 9–18px for controls and surfaces. Pills are reserved for status.

## Interaction

- GSAP handles restrained entrance, scroll reveal, and narrative text motion.
- Buttons use short translation/press feedback; clickable icons are Phosphor only.
- AI replies render progressively and expose audio controls after completion.
- Date entry uses the shared custom calendar rather than browser-native themed controls.
- Respect `prefers-reduced-motion` and maintain 44px minimum touch targets.

## Content and safety

Use plain verbs and explain the next step. AI proposals must state what will happen and require confirmation before writes. Manual workflows remain available for every service.

## Avoid

No generated raster identity, generic robot art, blue AI gradients, excessive pills, glassmorphism everywhere, decorative section numbers, or nested application windows.
