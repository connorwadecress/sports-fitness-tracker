# Pitchside: user story specification

Oct 2, 2026 · @Dominique

## Overview

Pitchside is a mobile-first web app where a Grade 11 hockey player logs matches, practices, own training, physio and biokineticist sessions, tracks injuries and rehab exercises, and gets a daily summary with suggestions.

| Question | Answer |
| --- | --- |
| Who | A Grade 11 student who plays hockey and is managing an injury |
| What | Sports tracker to improve at hockey and track recovery and rehab |
| Where | Web app, installable on a phone (PWA); mobile first, works on desktop |
| How | Plan activities, calendar, reminders |
| When | Every time an event is logged, plus a check-in and a daily summary each evening |

**Goals**

1. Log any hockey or recovery event in under 60 seconds.
2. Capture how the player feels after every event, including pain and injuries.
3. Show rehab exercises with a picture and count every set done.
4. Give a daily summary with practical suggestions: rest, move more, do rehab.
5. Remind the player about upcoming events, rehab and gaps in logging.

The clickable prototype (Pitchside prototype) is the visual reference for every story below.

## Personas and event types

There is one primary user in version 1: the player. Physio, biokineticist, coach and parent are people the player reports to, not app users yet.

| Persona | Role in v1 | Needs |
| --- | --- | --- |
| Player (primary) | Logs everything, follows rehab, reads suggestions | Quick logging, clear exercise pictures, honest advice on rest |
| Physio | Indirect: prescribes injury exercises | Player can show pain trend and sets done at the next session |
| Biokineticist | Indirect: prescribes strength and recovery exercises | Player can show adherence over weeks |
| Coach or parent | Indirect: told when pain is high | A clear prompt for the player to speak to them |

There are five event types. Each has its own colour and details form.

| Event type | Colour | Details captured | Can give exercises |
| --- | --- | --- | --- |
| Match | Red | Opponent, our score, their score, result (auto), home or away, minutes played | No |
| Practice | Blue | Duration, effort 1–10, focus (skills, fitness, set pieces, game play, goalkeeping) | No |
| Own training | Green | Activity (run, gym, stick work, mobility, cycling, other), duration, effort 1–10 | No |
| Physio | Purple | Injury (existing or new), duration, notes, exercises given | Yes, daily by default |
| Biokineticist | Amber | Duration, notes, exercises given | Yes, 3 days a week by default |

Every event has a date, a time and a status: **planned** (in the future, no feelings yet) or **logged** (happened, with feelings).

## Epic 1: Logging events and feelings

**US-1.1 Start a log** As a player, I want one button to log any event, so that logging is never more than a tap away.

- [ ] A + button sits in the centre of the bottom tab bar on every main screen.
- [ ] Tapping it opens a bottom sheet with the five event types, each with icon, colour and one-line description.
- [ ] Date and time default to now and can be changed.
- [ ] Picking a future date switches the event to planned and shows a note saying so.
- [ ] A progress indicator shows 3 steps (type, details, feelings), or 2 for planned events.

**US-1.2 Log a match** As a player, I want to log the score and result of a match, so that I can track my season.

- [ ] Fields: opponent (text), our score and their score (+/− steppers, minimum 0), home or away, minutes played (0–90).
- [ ] Result shows live as Win (green), Loss (red) or Draw (grey) as the score changes.
- [ ] The saved event title reads "Won 3–1 against Northview".
- [ ] Saving moves on to the feelings step.

**US-1.3 Log a practice** As a player, I want to log team practice, so that I can see my training load.

- [ ] Fields: focus (multi-select chips), duration (30, 45, 60, 75, 90, 120 min), effort slider 1–10 from "Easy" to "Flat out".
- [ ] Defaults: 90 min, effort 6.

**US-1.4 Log own training** As a player, I want to log exercise I do on my own for hockey, so that it counts towards my load.

- [ ] Fields: activity (single-select chips), duration, effort 1–10.
- [ ] Defaults: Run, 30 min, effort 5.

**US-1.5 Log a physio session** As an injured player, I want to log a physio session and the exercises given, so that my rehab is tracked.

- [ ] Fields: injury (pick an active injury or "A new injury" with a name), duration, notes ("What did they say?").
- [ ] Exercises given: pick from a picture library or add a custom one (see Epic 3).
- [ ] On save, picked exercises join the rehab programme with source "physio".
- [ ] Choosing "A new injury" creates an active injury dated to the session.

**US-1.6 Log a biokineticist session** As a player in recovery, I want to log a biokineticist session and the exercises given, so that my strength work is tracked.

- [ ] Same as US-1.5 without the injury field; exercises join the programme with source "bio" at 3 days a week.

**US-1.7 Say how I feel after an event** As a player, I want to be asked how I feel after every logged event, so that I can see how training affects me.

- [ ] Mood slider 0–100 with five labels: Rough (0–19), Low (20–39), Okay (40–59), Good (60–79), Great (80–100).
- [ ] A mood shape animates as the slider moves: spiky and grey-blue when low, smooth and warm amber when high. It is an original design, not Apple's.
- [ ] Energy: Drained, Low, Okay, Good, Buzzing. Soreness: None, Light, Some, Sore, Very sore.
- [ ] Optional note.

**US-1.8 Standalone check-in** As a player, I want to log how I feel without an event, so that rest days still have a mood.

- [ ] "Log how I feel" on the Today card opens only the feelings step.
- [ ] A check-in does not count as training in streaks or load.

**US-1.9 Complete a planned event** As a player, I want to turn a planned event into a logged one, so that I don't type details twice.

- [ ] Planned events for today or earlier show a "Log it" button.
- [ ] It opens the details step prefilled from the plan, then feelings. Saving replaces the planned event.

**US-1.10 View and delete an event**

- [ ] Tapping an event opens its details, feelings and any exercises given.
- [ ] Delete asks for confirmation.

## Epic 2: Injuries

**US-2.1 Report pain or a knock** As a player, I want to report pain while logging, so that injuries are caught early.

- [ ] The feelings step has a switch "Picked up a knock or in pain?".
- [ ] On: body part (left or right ankle, left or right knee, hamstring, groin, lower back, shoulder, wrist or hand, head, other) and pain 0–10.
- [ ] Pain 7 or higher shows: "Stop training, and tell a coach, parent or your physio today."
- [ ] Pain in a body part with no active injury creates one automatically and shows "Now tracking: \<part> injury".

**US-2.2 Follow an injury** As an injured player, I want to see how my injury is improving, so that I stay motivated and can show my physio.

- [ ] Injury card shows name, days since start, number of treatment sessions and a line of logged pain over time ("7/10 down to 3/10").
- [ ] "Mark as recovered" moves it to Past injuries with start and end dates.

## Epic 3: Rehab exercises

**US-3.1 Pick exercises from a picture library** As a player, I want to pick the exercises my physio or biokineticist gave me from pictures, so that I add them quickly and correctly.

- [ ] The library shows each exercise as a card with an illustration, name and default prescription.
- [ ] Multiple exercises can be selected; selected cards are highlighted.
- [ ] Starter library:

| Exercise | Default prescription | Typical source |
| --- | --- | --- |
| Calf raises | 3 × 12 reps | Physio |
| Single-leg balance | 3 × 30 sec each leg | Physio |
| Band ankle turns | 2 × 15 reps | Physio |
| Glute bridge | 3 × 10 reps | Biokineticist |
| Wall sit | 3 × 30 sec hold | Biokineticist |
| Side plank | 2 × 20 sec each side | Biokineticist |

**US-3.2 Add a custom exercise with a photo** As a player, I want to add an exercise that isn't in the library and attach a photo or screenshot, so that I remember exactly how to do it.

- [ ] Fields: name (required), sets, reps or time, optional image.
- [ ] Images are resized to 480 px wide before saving.
- [ ] Without an image, a generic figure is shown.
- [ ] Name missing shows "Give the exercise a name" and focuses the field.

**US-3.3 See how to do an exercise** As a player, I want a large picture and steps for each exercise, so that I do it safely.

- [ ] Detail view: large illustration or photo, prescription, source (physio or biokineticist), numbered how-to steps.
- [ ] Safety line: "Stop and check with your physio if this exercise causes sharp pain."

**US-3.4 Log sets** As a player, I want to tick off each set I do, so that I know how many times I've done my exercises.

- [ ] "Log a set" adds 1 to today's count; "Undo" removes 1, never below 0.
- [ ] Once all prescribed sets are done, the button reads "Log an extra set" and a toast says "\<exercise> done for today".
- [ ] Exercise cards show one dot per prescribed set, filled when done.

**US-3.5 See my consistency** As a player, I want to see how often I've done each exercise, so that I can get stronger and show my physio.

- [ ] Exercise detail shows the last 7 days: full green when all sets done, light green when partly done, empty when none.
- [ ] Rehab screen shows this week's completion as a percentage and a bar.
- [ ] Physio exercises count every day; biokineticist exercises count as "x/3 this week".

**US-3.6 Manage my programme**

- [ ] "Add exercise" on the Rehab screen opens the library without logging a session, with a Physio or Biokineticist switch.
- [ ] "Remove from my programme" hides an exercise but keeps its history.

## Epic 4: Calendar and planning

**US-4.1 See my month** As a player, I want a calendar of everything logged and planned, so that I can see my routine at a glance.

- [ ] Month grid, Monday first, with previous and next month buttons.
- [ ] Each day shows up to 4 dots in the event type colours: filled for logged, hollow for planned.
- [ ] Days with a mood show a small mood shape (average of that day's moods).
- [ ] Today is highlighted; a legend explains colours.

**US-4.2 See a day**

- [ ] Tapping a day lists its events below the grid, in time order.
- [ ] Past days and today show "View daily summary".
- [ ] Empty states: "Nothing planned for this day." or "Nothing logged on this day."

**US-4.3 Plan an event** As a player, I want to plan matches, practices and appointments ahead, so that I get reminders and my week is organised.

- [ ] "Plan event" opens the log flow in planned mode, defaulting to tomorrow at 16:00. "Add" on a future day uses that day.
- [ ] Planned matches ask for the opponent only.
- [ ] Reminder choice: 1 hour before (default), the evening before, or no reminder.
- [ ] Repeat: does not repeat, or every week (creates the next 5 weeks).
- [ ] Saving shows "Added to calendar" and jumps the calendar to that date.

## Epic 5: Reminders

All reminders are on by default and can be switched off one by one under the bell icon on Today.

| Reminder | When it fires | Example message | Tapping opens |
| --- | --- | --- | --- |
| Upcoming event | At the time chosen when planning | "Match against Ridgeway tomorrow at 10:30. Pack your shin guards and mouth guard." | Calendar |
| Rehab sets | Daily at 17:00, only if sets are left | "5 rehab sets left today. About 10 minutes." | Rehab |
| Log after an event | 30 min after a planned event's time | "How did the match go? Log the score while it's fresh." | Log flow, details step |
| Daily summary | Daily at 20:30 | "Your daily summary is ready. Recovery day tomorrow." | Daily summary |
| Gone quiet | After 2 days with nothing logged | "You haven't logged anything in 2 days." | Check-in |

**US-5.1 Get reminded** As a player, I want reminders for things coming up and when I've gone quiet, so that I don't miss sessions or stop logging.

- [ ] Notifications are sent as web push (PWA); the player is asked for permission on first plan or first visit to Reminders.
- [ ] If push is denied, reminders show as in-app banners on next open.
- [ ] No more than 3 notifications per day, and none between 21:30 and 06:30.

**US-5.2 Control reminders**

- [ ] Each reminder type has an on/off switch.
- [ ] Rehab and summary times can be changed.

## Epic 6: Daily summary and suggestions

**US-6.1 Today at a glance** As a player, I want my day summarised on the home screen, so that I know where I stand.

- [ ] Today card shows the average mood shape (or a dashed outline and "How are you feeling?" if none), active minutes, and rehab sets done out of today's target.
- [ ] It shows the top suggestion and a "Daily summary" button.

**US-6.2 Daily summary** As a player, I want an end-of-day summary with suggestions, so that I know whether to rest or do more tomorrow.

- [ ] Shows mood, active minutes, rehab sets, highest pain, up to 4 suggestions and the day's events.
- [ ] Available for any past day from the calendar and Insights.
- [ ] Footer: "Suggestions are general guidance based on what you've logged. Your physio, biokineticist and coach know your body best."

**Suggestion rules (v1, rule based).** Rules are checked in priority order; the summary shows the top 4, the Today card shows the top 1.

| Priority | Rule (trigger) | Suggestion |
| --- | --- | --- |
| 1 | Highest pain today is 6/10 or more | Ease right off; skip hard training tomorrow and tell your physio |
| 2 | A match was logged today | Recovery day tomorrow: light walk, stretch or rest |
| 2 | Training logged 5 or more days in a row | Take a rest day |
| 3 | 150 or more active minutes today (and no streak rule) | Big day, keep tomorrow light |
| 3 | A planned match is 1 or 2 days away | Keep training short and sharp, eat well, sleep early |
| 3 | Average mood today below 35 | A low day: rest and an easy evening; talk to someone you trust if it keeps happening |
| 3 | Nothing logged for 3 days and pain below 6 | It's been quiet: a 20-minute jog or stick-work session |
| 4 | Daily rehab sets not finished | X rehab sets still to do, about N minutes |
| 5 | No training today, no streak, no match tomorrow | Get moving today: a short session or walk counts |
| 6 | All daily rehab sets done | Rehab done for today |
| 9 | None of the above | Balanced day |

Rule inputs: active minutes = duration of practices, own training and sessions, plus minutes played in matches. Check-ins never count as training.

## Epic 7: Insights

**US-7.1 See my progress** As a player, I want to see my trends, so that I can see I'm improving.

- [ ] Headline numbers: win–draw–loss in the last 30 days, training sessions this week, rehab completion this week.
- [ ] Stacked bar chart of active minutes per day for the last 7 days, coloured by event type.
- [ ] Mood shapes for each of the last 7 days.
- [ ] Past summaries: the last 5 days with their top suggestion; tapping opens that summary.

## Screens

Navigation is a bottom tab bar: Today, Calendar, + (log), Rehab, Insights. Logging, event details, exercise details, daily summary and reminders open as bottom sheets.

| Screen | Contents | Stories |
| --- | --- | --- |
| Today | Greeting and date, Today card, planned today, logged today, rehab strip, coming up, bell icon | US-1.9, US-6.1 |
| Log sheet | Step 1 type and time, step 2 details per type, step 3 feelings | US-1.1 to US-1.8, US-2.1 |
| Calendar | Month grid, legend, selected day list, Plan event | US-4.1 to US-4.3 |
| Rehab | Injury cards, weekly completion, physio and biokineticist exercise grids, past injuries | US-2.2, US-3.4 to US-3.6 |
| Exercise detail | Picture, sets today, how-to, last 7 days, log set and undo | US-3.3 to US-3.5 |
| Insights | Headline numbers, minutes chart, mood row, past summaries | US-7.1 |
| Daily summary | Mood, stats, suggestions, events | US-6.2 |
| Reminders | Switches and times per reminder type | US-5.2 |

## Data model

| Entity | Key fields |
| --- | --- |
| Event | id, type (match, practice, exercise, physio, bio), date, time, status (planned, logged), details (per type), feel, reminder (1h, evening, none), repeatGroupId, isCheckIn |
| Match details | opponent, ourScore, theirScore, venue (home, away), minutesPlayed |
| Practice details | durationMin, effort (1–10), focus\[\] |
| Own training details | activity, durationMin, effort (1–10) |
| Physio / bio details | injuryId, durationMin, notes, exerciseIds\[\] |
| Feel | mood (0–100), energy (1–5), soreness (1–5), inPain, bodyPart, pain (0–10), note |
| Injury | id, name, bodyPart, startDate, status (active, recovered), recoveredDate |
| Exercise | id, name, illustrationKey or imageUrl, sets, repsOrTime, daysPerWeek (7 or 3), steps\[\], source (physio, bio), active, injuryId |
| SetLog | exerciseId, date, count |
| ReminderSettings | upcoming, rehab + time, afterEvent, summary + time, quiet + days |

Result (win, loss, draw), active minutes, streaks and suggestions are calculated, not stored.

## Non-functional requirements

- **Platform:** responsive web app installable as a PWA; designed for phones 360–430 px wide.
- **Speed:** a match logged with feelings in under 60 seconds; screens load in under 2 seconds on 4G.
- **Offline:** logging works offline and syncs when back online.
- **Accounts and storage:** sign-in with email; data stored per user in the cloud (the prototype uses browser storage only).
- **Accessibility:** WCAG 2.1 AA contrast, visible keyboard focus, labels on every control, reduced motion respected, light and dark themes.
- **Images:** stored compressed (max 480 px wide, JPEG).

## Safety and privacy

The user is under 18 and logs health information, so these rules apply.

- The app never diagnoses injuries or changes a prescription. All suggestions are general and point back to the physio, biokineticist, coach or a parent.
- Pain 7/10 or more always shows a "stop and tell someone" message.
- No calorie, weight or body-shape tracking.
- Health data is private to the player. No sharing, ads or third-party analytics in v1.
- Parental consent at sign-up if required by local law (for South Africa, check POPIA rules on children's personal information).

## Release plan

1. **Release 1 (core logging):** Epic 1, Epic 2, Today screen, calendar view (US-4.1, US-4.2).
2. **Release 2 (rehab):** Epic 3, Rehab screen, exercise detail.
3. **Release 3 (planning and reminders):** US-4.3, Epic 5.
4. **Release 4 (coaching):** Epic 6, Epic 7.

## Out of scope for v1

- Accounts for physios, biokineticists, coaches or parents.
- Wearable or Apple Health and Google Fit sync.
- AI-written summaries (v1 uses the rules above; an AI layer can be added later).
- Team features, stats per position, video.

## Open questions

- [ ] Field hockey or ice hockey? The prototype assumes field hockey terms (pitch, shin guards).
- [ ] Should the physio be able to see progress directly, for example via a shared read-only link?
- [ ] Is a weekly repeat for practices enough, or are fixtures imported from a club schedule?
- [ ] Should the daily summary appear only in the evening, or update live through the day as it does in the prototype?
- [ ] App name: keep Pitchside or choose another?
