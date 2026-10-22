# Notes

## Overview
- LDR dashboard, keeps people connected (daily check-ins, shared responsibilities)
- For anyone who wants to stay emotionally close while physically far apart (couples, best friends, siblings, distant relatives)
- Name idea: Kith & Kin (Kith = friends/chosen family, Kin = relatives; Middle English phrase, according to [Wiktionary](https://en.wiktionary.org/wiki/kith_and_kin))

## Features
- Generates unique code to link accounts (pairs) and sync dashboards
- Daily prompts filtered by relationship type (romantic, friendship, family) and intensity (casual, deep, philosophical), store previously answered questions along with each partner’s answers (group answers by question)
- MVP: Interactive virtual pet ("Our Kith"), inspired by My Boo ([Fandom](https://myboovirtualpet.fandom.com/wiki/My_Boo_(game)), [Apple App Store](https://apps.apple.com/us/app/my-boo-virtual-pet-take-care/id706099830), [Google Play Store](https://play.google.com/store/apps/details?id=com.tapps.virtual.pet.free.myboo&hl=en_US)), shared pet living on dashboard, hunger and happiness decay over time unless both partners feed and pet it using activity coins (earned by answering prompts, as many as they want per day)
- Shared dashboard, shows daily streak counts, combined Q&A histories, pet stats, joint activity logs
- Single-device pass-and-play mode for answering daily prompts ("person 1’s turn, person 2’s turn", for when hanging out in person)

## Implementation
- Frontend: HTML5 Canvas API (for rendering pet animations/states)
- Backend: Elysia.js REST API (for managing user creation, code-matching logic, pet state, streak calculations)
- Data structure: pair objects storing partner IDs (one per person), streak count, pet state (hunger, happiness, coins), question history
- Authorization (not using OAuth, just POST): allow people to use their accounts on different devices
    - Hard code users for proof of concept (no registration yet, pair IDs already generated)
    - Will server or client (bad idea, though can be nice so that server doesn’t have to deal with head operations) handle operations?
    - Notify user when pet is decaying? (need backend)
    - Don’t need to worry about real-time backend (can be async for now)

## Inspirations
- [Angie](http://getangie.com)
- [Waddle](https://www.waddlecouples.com/)
- [Couple360](https://couple360.net/)
