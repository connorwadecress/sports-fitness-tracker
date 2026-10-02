# Requirements traceability

The full business requirements document and user story specification (Oct 2, 2026) are held by the product owner and aren't published in this public repo. This page maps each requirement to where it's built.

| ID | Requirement | Where |
| --- | --- | --- |
| BR-01 | Log a match: opponent, score, result, venue, minutes | `sheets/LogSheet.tsx` (DetailFields), `derive.ts` (`matchResult`, `eventTitle`) |
| BR-02 | Practice and own training with duration and effort | `LogSheet.tsx` |
| BR-03 | Physio and biokineticist sessions with notes | `LogSheet.tsx`, `ops.ts` (`saveLog`) |
| BR-04 | Mood, energy, soreness and pain after each event | `LogSheet.tsx` (FeelFields), `ui.tsx` (`FeelShape`) |
| BR-05 | Standalone check-in | "Log how I feel" on Today; check-ins never count as training |
| BR-06 | Pain creates and tracks an injury, with trend and recovery | `ops.ts` (`injuryFromFeel`), `screens/Rehab.tsx` (InjuryCard) |
| BR-07 | Pain 7/10 or more always says stop and tell someone | `SAFETY_HIGH_PAIN` in `constants.ts`, shown in the log and the summary |
| BR-08 | Exercises from a picture library or custom with a photo | `sheets/ExercisePicker.tsx`, `client/image.ts` (480 px JPEG) |
| BR-09 | Picture, prescription and how-to steps | `sheets/ExerciseSheet.tsx` |
| BR-10 | Count sets per day, weekly adherence | `ExerciseSheet.tsx`, `derive.ts` (`weeklyAdherence`) |
| BR-11 | Calendar of logged and planned events | `screens/Calendar.tsx` |
| BR-12 | Plan future events, weekly repeat (next 5 weeks) | `LogSheet.tsx` (PlanFields), `ops.ts` |
| BR-13 | Complete a planned event without retyping | "Log it" on Today, Calendar and event detail |
| BR-14 | Reminders: upcoming, rehab, after event, summary, gone quiet | `domain/reminders.ts`, `api/cron/reminders`, `components/Banner.tsx` |
| BR-15 | Daily summary with rule-based suggestions | `derive.ts` (`summary`), `sheets/SummarySheet.tsx` |
| BR-16 | Trends: results, load, mood, adherence | `screens/Insights.tsx` |

| NFR | Where |
| --- | --- |
| PWA, phones 360 to 430 px | `app/manifest.ts`, `public/sw.js`, `globals.css` |
| Offline logging and set counting | `client/store.ts` (IndexedDB plus sync queue) |
| WCAG 2.1 AA, focus, labels, reduced motion, light and dark | `globals.css` tokens, focus trap in `SheetHost.tsx`, theme in the account sheet |
| Max 3 notifications a day, none 21:30 to 06:30 | `api/cron/reminders/route.ts`, `inQuietHours()` |
| Images 480 px JPEG | `client/image.ts` |
| Email sign-in, HTTPS, encrypted at rest | `server/auth.ts`, Neon (encrypted at rest), HSTS in `next.config.ts` |
| Export CSV, delete account | `domain/csv.ts`, `api/account` |
| Parental consent | Required checkbox at sign-up, stored as `consent_at` |

## Decisions on the spec's open questions

- **Field or ice hockey:** field hockey terms (pitch, shin guards), as in the prototype.
- **Daily summary timing:** updates live through the day, like the prototype. The push reminder arrives at the chosen evening time.
- **Physio sharing link, club fixture import:** not in v1.
- **Name:** Pitchside.
