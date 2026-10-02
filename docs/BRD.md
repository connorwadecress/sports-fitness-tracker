# Pitchside: business requirements document

Oct 2, 2026 · @Dominique

## Executive summary

Pitchside is a mobile-first web app that puts a hockey player's matches, training, injuries and rehab in one place and turns that data into daily advice on when to rest and when to do more. Version 1 serves one user, a Grade 11 hockey player, and is delivered in 4 releases. Detailed behaviour lives in the companion doc, Pitchside: user story specification.

## Business problem

A student athlete recovering from injury tracks their sport and recovery in scattered places, so important things get missed.

- **Information is fragmented.** Scores, practice times, physio notes and exercise sheets sit across WhatsApp, paper handouts, memory and a general calendar.
- **Rehab is hard to stick to.** Paper exercise sheets get lost, it's unclear how to do an exercise days later, and nobody counts the sets actually done.
- **No link between load, feeling and pain.** Without a record, the player can't tell whether a busy week caused a flare-up or whether they're ready to play.
- **Generic fitness apps don't fit.** Step and calorie apps don't know about hockey matches, physio appointments or prescribed exercises.

The result is slower recovery, a higher chance of re-injury, and less useful conversations with the physio and biokineticist.

## Objectives and success metrics

Success is measured over the first 8 weeks of use after Release 4.

| Objective | Metric | Target |
| --- | --- | --- |
| One place for all hockey and recovery activity | Matches, practices and sessions logged out of those that happened | 90% or more |
| Fast, low-effort logging | Median time to log a match including feelings | Under 60 seconds |
| Better rehab adherence | Prescribed rehab sets completed per week | 80% or more |
| Understand how the body responds | Logged events with a feelings check-in | 85% or more |
| Act on advice | Days the daily summary is opened | 5 or more per week |
| Stay on track | Gaps of 3 or more days with nothing logged | No more than 1 per month |
| Useful for the care team | Physio sessions where the player shows the app's pain trend or rehab history | Most sessions (self-reported) |

## Scope

**In scope (v1)**

- Logging five event types: match, practice, own training, physio, biokineticist.
- A feelings check-in after each event, plus standalone check-ins.
- Injury tracking with pain over time.
- Rehab exercise programme with pictures or photos and set counting.
- Calendar with planned and logged events, including weekly repeats.
- Reminders: upcoming events, rehab, logging after events, daily summary, inactivity.
- Rule-based daily summary with suggestions, and an insights screen.
- Installable web app (PWA) with email sign-in and cloud storage.

**Out of scope (v1)**

- Accounts or dashboards for physios, biokineticists, coaches or parents.
- Wearable, Apple Health or Google Fit integration.
- AI-generated summaries.
- Team, club or multi-sport features; video analysis.
- Nutrition, calorie, weight or body-shape tracking.

## Stakeholders

| Stakeholder | Interest | Involvement |
| --- | --- | --- |
| Player (product owner and user) | Recover, play better, stay organised | Owns requirements, tests every release, signs off |
| Parent or guardian | Child's safety and data privacy | Gives consent, reviews safety rules |
| Physio | Patient follows the treatment plan | Reviews the exercise library and pain wording |
| Biokineticist | Strength programme is followed | Reviews strength exercises and 3-days-a-week default |
| Coach | Player is available and fit | Informed when pain is high; no app access |
| Developer | Builds and runs the app | Delivers releases, hosting, support |

## Business requirements

Priority uses MoSCoW: Must have, Should have, Could have. Each requirement traces to stories in the user story specification.

| ID | Requirement | Priority | User stories |
| --- | --- | --- | --- |
| BR-01 | The player can log a match with opponent, score, result, venue and minutes played. | Must | US-1.1, US-1.2 |
| BR-02 | The player can log team practice and own training with duration and effort. | Must | US-1.3, US-1.4 |
| BR-03 | The player can log physio and biokineticist sessions with notes. | Must | US-1.5, US-1.6 |
| BR-04 | After each logged event the player records mood, energy, soreness and any pain. | Must | US-1.7 |
| BR-05 | The player can record a mood check-in without an event. | Should | US-1.8 |
| BR-06 | Reported pain creates and tracks an injury, with pain trend and recovery date. | Must | US-2.1, US-2.2 |
| BR-07 | High pain (7/10 or more) always prompts the player to stop and tell a trusted adult or physio. | Must | US-2.1 |
| BR-08 | Exercises given by the physio or biokineticist are added from a picture library or as custom exercises with a photo. | Must | US-1.5, US-3.1, US-3.2 |
| BR-09 | Each exercise shows a picture, prescription and how-to steps. | Must | US-3.3 |
| BR-10 | The player counts sets done per day and sees weekly adherence. | Must | US-3.4, US-3.5 |
| BR-11 | The player sees all logged and planned events on a calendar. | Must | US-4.1, US-4.2 |
| BR-12 | The player can plan future events, with optional weekly repeat. | Should | US-4.3 |
| BR-13 | Planned events can be completed without retyping details. | Should | US-1.9 |
| BR-14 | The app sends reminders for upcoming events, rehab, logging after events, the daily summary and inactivity. | Should | US-5.1, US-5.2 |
| BR-15 | The app produces a daily summary with suggestions to rest, move more or finish rehab. | Must | US-6.1, US-6.2 |
| BR-16 | The player sees trends: results, training load, mood and rehab adherence. | Could | US-7.1 |

## Non-functional requirements

| ID | Area | Requirement |
| --- | --- | --- |
| NFR-01 | Platform | Responsive web app, installable as a PWA, built for phones 360–430 px wide and usable on desktop. |
| NFR-02 | Performance | Screens load in under 2 seconds on 4G; logging a match with feelings takes under 60 seconds. |
| NFR-03 | Offline | Logging and set counting work offline and sync when back online. |
| NFR-04 | Availability | 99% monthly uptime is enough for a single-user v1. |
| NFR-05 | Accessibility | WCAG 2.1 AA contrast, labelled controls, keyboard focus, reduced motion, light and dark themes. |
| NFR-06 | Notifications | Web push with in-app fallback; at most 3 per day; none from 21:30 to 06:30. |
| NFR-07 | Storage | Images compressed to 480 px wide JPEG; data backed up daily. |
| NFR-08 | Security | Email sign-in, HTTPS only, data encrypted at rest. |

## Data and compliance requirements

The user is a minor and the app holds health information, which is special personal information under South Africa's Protection of Personal Information Act (POPIA).

- **Consent:** a parent or guardian gives consent at sign-up; the requirement should be confirmed against POPIA rules for children's data.
- **Minimal data:** only data needed for the features above; no location, contacts, weight or calorie data.
- **No sharing:** no ads, data sales or third-party analytics. Any future sharing with a physio needs the player's explicit action.
- **Control:** the player can export all data (CSV) and delete the account and all data.
- **Not a medical device:** the app gives general guidance only, never diagnoses or changes a prescription, and says so in the daily summary.

## Assumptions

- The sport is field hockey (to be confirmed).
- The player has a smartphone with a modern browser that supports web push.
- The physio and biokineticist are happy for their exercises to be photographed or recorded in the app.
- One user in v1; no multi-user or club features needed.

## Constraints

- Budget is minimal, so hosting should fit a free or low-cost tier.
- The developer's time is limited around school, so releases are small and sequential.
- Web push on iPhone works only when the app is added to the home screen.

## Dependencies

- Hosting and database provider (for example Supabase or Vercel).
- Web push service and browser support.
- Exercise illustrations: drawn in-house or licensed, never copied from other apps.

## Risks

| Risk | Impact | Likelihood | Mitigation |
| --- | --- | --- | --- |
| Player stops logging after a few weeks | High | Medium | Fast logging, inactivity nudges, check-ins, visible progress |
| Suggestions read as medical advice | High | Low | Conservative rules, clear disclaimer, high pain always points to a person |
| Reminders feel annoying and get switched off | Medium | Medium | Daily cap, quiet hours, per-type switches |
| Health data of a minor is exposed | High | Low | Consent, encryption, no third parties, export and delete |
| iPhone push notifications don't arrive | Medium | Medium | Home-screen install prompt and in-app banner fallback |
| Exercise pictures are unclear or wrong | Medium | Low | Physio reviews library; custom photo option |

## Delivery phases

Each release is used for at least 1 week before the next starts. Dates are to be set by the player and developer.

1. **Release 1, core logging:** BR-01 to BR-07, BR-11. Gate: every event type can be logged with feelings on a phone.
2. **Release 2, rehab:** BR-08 to BR-10. Gate: physio confirms the exercise pictures and wording.
3. **Release 3, planning and reminders:** BR-12 to BR-14. Gate: reminders arrive on the player's phone for a full week.
4. **Release 4, coaching:** BR-15, BR-16. Gate: the player agrees the suggestions make sense for 7 days in a row.

## Costs

Approximate monthly running costs for one user:

| Item | Approximate cost |
| --- | --- |
| Hosting and database (free tier) | R0 |
| Domain name (optional) | About R20 per month |
| Web push | R0 |

Build effort is the developer's own time; no paid licences are needed if illustrations are made in-house.

## Sign-off

| Role | Name | Decision | Date |
| --- | --- | --- | --- |
| Player (product owner) |  |  |  |
| Parent or guardian |  |  |  |
| Developer |  |  |  |
