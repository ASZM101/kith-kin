# Notes

## MVP Stages
1. **Interactive Virtual Pet ("Kith"):** A shared virtual pet inspired by My Boo whose happiness and hunger stats decay over time unless fed and petted by both connected users using earned activity coins.
2. **Shared Pairing & Connection System:** Users create accounts and generate a unique 6-character connection code to link dashboards with a partner, friend, or relative.
3. **Shared Activity Dashboard:** Real-time summary displaying daily streak counts, combined question answer histories, virtual pet stats, and joint game logs.
4. **Category-Based Question Bank:** Daily icebreaker questions filtered by relationship type (Romantic, Friendship, Family) and depth levels (Casual, Deep, Philosophical).

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
- Backend: Elysia (TypeScript) REST API (for managing user creation, code-matching logic, pet state, streak calculations)
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
- [My Boo and similar games](https://myboovirtualpet.fandom.com/wiki/List_of_My_Boo-like_games)

## API notes
### Auth
- POST /login, formdata: username and password, return session token (jwt)
- POST /logout, invalidates session token

### App
all requests authenticated using bearer auth, http header `Authorization: Bearer <jwt>`
- GET /question, randomly picks a question and returns it
- POST /question, formdata: question, answer, returns success or fail, if success, then it also increments user's coin count by 5
- GET /info, returns info about the pets (gets the pet happiness number), and the user's current coin count
- GET /history?page=<page>&count=<count> paginates and returns question history
- POST /spend: decreases user's coin count by given amount and increases pet happiness by that amount

## Assets
- [ ] Kith (pet)
    - [x] Multiple color options (rainbow, 6 options, finish all states for one entire color first)
    - [ ] Emotional states
        - [x] Extremely happy (replace `happy.svg`)
        - [ ] Somewhat content
        - [ ] Neutral (replace `neutral.svg`)
        - [ ] A bit sad (replace `sad.svg`)
        - [ ] Depressed
    - [ ] Activity states (for each color)
        - [ ] About to be fed (feeding option selected; replace `hungry.svg`)
        - [ ] Actively eating (after food dragged over to pet)
        - [ ] Being petted (click and hold down mouse while somewhere on pet, drag mouse while holding down, pet can only be petted if no other activity option selected)
        - [ ] Showering (shower option selected)
- [ ] Top status bar (replace current)
    - [ ] Heart icon (numerical total = level of care pet receives from both paired accounts combined; replace `heart.svg`)
    - [ ] Coin icon (numerical total = activity points earned from answering prompts async; replace `coin.svg`)
    - [ ] Fire icon (numerical total = streak count; replace `streak.svg`)
- [ ] Bottom menu bar
    - [ ] Small Kith icon (customize pet)
    - [ ] Plate icon (feed pate)
    - [ ] Sponge icon (shower pet)
- [ ] Food options (replace `food.svg`)
- [ ] Logo: default Kith? (red, extremely happy; replace `logo.svg`)