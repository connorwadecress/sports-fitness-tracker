"use client";

import { useRef, useState } from "react";
import { useApp, type SheetSpec } from "../context";
import { Chip, FeelShape, Seg, SheetHead, Switch, Tile } from "../ui";
import { ExercisePicker } from "./ExercisePicker";
import { apply, getState, useStore } from "@/lib/client/store";
import { enablePush, wantsPushPrompt } from "@/lib/client/push";
import { ACTIVITIES, BODY_PARTS, DURATIONS, ENERGY, PRACTICE_FOCUS, SAFETY_HIGH_PAIN, SORENESS, TYPES, TYPE_KEYS, moodLabel } from "@/lib/domain/constants";
import { addDays, parts } from "@/lib/domain/dates";
import { activeInjuries, eventsOn, matchResult } from "@/lib/domain/derive";
import { blankFeel, defaultDetails, feelIsSet, saveLog, type LogDraft } from "@/lib/domain/ops";
import type { EventType, PitchEvent, Snapshot } from "@/lib/domain/types";

type Spec = Extract<SheetSpec, { kind: "log" }>;
type Mode = "new" | "complete" | "edit";

const stripEmpty = (d: PitchEvent["details"]) => Object.fromEntries(Object.entries(d).filter(([, v]) => v !== undefined && v !== ""));

/** Draft from an existing event, for completing a plan or editing one. */
function fromEvent(e: PitchEvent, base: LogDraft, s: Snapshot): LogDraft {
  const feel = e.feel ? { ...base.feel, ...e.feel } : base.feel;
  if (e.isCheckIn || !e.type) return { ...base, id: e.id, checkIn: true, date: e.date, time: e.time, feel };
  return {
    ...base, id: e.id, type: e.type, date: e.date, time: e.time, planned: e.status === "planned",
    reminder: e.status === "planned" ? e.reminder : "1h", details: { ...defaultDetails(e.type, s), ...stripEmpty(e.details) }, feel,
  };
}

function initialDraft(spec: Spec, today: string, time: string): { draft: LogDraft; step: number; mode: Mode } {
  const s = getState().snapshot;
  const base: LogDraft = {
    type: spec.type ?? null, date: spec.date ?? today, time, planned: false, checkIn: false,
    details: spec.type ? defaultDetails(spec.type, s) : {}, custom: [], feel: blankFeel(s), reminder: "1h", repeatWeekly: false,
  };
  const existing = s.events.find((x) => x.id === (spec.editId ?? spec.completeId));
  if (existing && spec.editId) {
    const d = fromEvent(existing, base, s);
    return { draft: d, step: d.checkIn ? 3 : 1, mode: "edit" };
  }
  if (existing?.type && spec.completeId) {
    return { draft: { ...fromEvent(existing, base, s), planned: false, feel: base.feel }, step: 2, mode: "complete" };
  }
  if (spec.mode === "checkin") {
    // One check-in per day: reopen today's instead of adding another.
    const todays = eventsOn(s, today, false).filter((e) => e.isCheckIn).pop();
    if (todays) return { draft: fromEvent(todays, base, s), step: 3, mode: "edit" };
    return { draft: { ...base, checkIn: true }, step: 3, mode: "new" };
  }
  if (spec.mode === "plan") {
    const date = !spec.date || spec.date <= today ? addDays(today, 1) : spec.date;
    return { draft: { ...base, planned: true, date, time: "16:00" }, step: 1, mode: "new" };
  }
  return { draft: { ...base, planned: base.date > today }, step: spec.type ? 2 : 1, mode: "new" };
}

/** Problems on the details step, or "" when it's fine. */
function detailsError(d: LogDraft): string {
  if (d.planned || d.checkIn) return "";
  if (d.type === "physio" && d.details.injuryId === "new" && !d.details.newInjuryName?.trim()) return "Give the injury a name";
  if (d.type === "match" && d.details.minutesText !== undefined) {
    const raw = d.details.minutesText.trim(), n = Number(raw);
    if (raw === "" || !Number.isInteger(n) || n < 0 || n > 90) return "Enter the minutes you played, from 0 to 90";
  }
  return "";
}

export function LogSheet({ spec }: { spec: Spec }) {
  const { today, now, close, toast, setCalendar } = useApp();
  const { snapshot: s, meta } = useStore();
  const [init] = useState(() => initialDraft(spec, today, now.time));
  const [d, setD] = useState<LogDraft>(init.draft);
  const [step, setStep] = useState(init.step);
  const [error, setError] = useState("");
  const saving = useRef(false);
  const { mode } = init;

  const set = (patch: Partial<LogDraft>) => setD((x) => ({ ...x, ...patch }));
  const setDetails = (patch: LogDraft["details"]) => { setD((x) => ({ ...x, details: { ...x.details, ...patch } })); setError(""); };
  const setFeel = (patch: Partial<LogDraft["feel"]>) => setD((x) => ({ ...x, feel: { ...x.feel, ...patch } }));
  const totalSteps = d.planned ? 2 : 3;

  const pickType = (t: EventType) => set({ type: t, details: t === d.type ? d.details : defaultDetails(t, s) });

  const save = (skipFeel = false) => {
    if (saving.current) return; // a double tap must not save twice
    const err = detailsError(d);
    if (err) { setStep(2); setError(err); return; }
    saving.current = true;
    const askPush = d.planned && meta.mode === "account" && wantsPushPrompt();
    const res = saveLog(s, skipFeel ? { ...d, feel: blankFeel(s) } : d, today);
    apply(res.puts);
    close();
    const edited = mode === "edit";
    if (d.checkIn) toast(edited ? "Check-in updated" : "Check-in saved");
    else if (d.planned) {
      toast(edited ? "Plan updated" : "Added to calendar");
      const p = parts(d.date);
      setCalendar({ y: p.y, m: p.m, sel: d.date });
    } else toast(`${TYPES[d.type!].label} ${edited ? "updated" : "saved"}`);
    if (res.newInjury && !d.planned) toast(`Now tracking: ${res.newInjury.name}`, 2300);
    if (askPush) void enablePush(); // first plan: ask for notification permission (US-5.1)
  };

  const next = () => {
    const err = detailsError(d);
    if (err) { setError(err); return; }
    setStep(3);
  };

  let title: string, body: React.ReactNode, foot: React.ReactNode;
  if (step === 1) {
    title = mode === "edit" ? `Edit ${d.type ? TYPES[d.type].label.toLowerCase() : "event"}` : d.planned ? "Plan an event" : "What are you logging?";
    body = (
      <>
        <Progress n={totalSteps} at={1} />
        <div className="typegrid" role="group" aria-label="Event type">
          {TYPE_KEYS.map((k, i) => (
            <button key={k} type="button" className={`typebtn${i === 4 ? " wide" : ""}`} aria-pressed={d.type === k} onClick={() => pickType(k)}>
              <Tile type={k} />
              <span style={{ display: "block" }}><b>{TYPES[k].label}</b><span className="d">{TYPES[k].blurb}</span></span>
            </button>
          ))}
        </div>
        <div className="field">
          <span className="lbl" id="when-lbl">When</span>
          <div className="two" role="group" aria-labelledby="when-lbl">
            <input className="inp" type="date" value={d.date} aria-label="Date" onChange={(e) => e.target.value && set({ date: e.target.value, planned: e.target.value > today })} />
            <input className="inp" type="time" value={d.time} aria-label="Time" onChange={(e) => e.target.value && set({ time: e.target.value })} />
          </div>
          {d.planned && <p className="small muted" style={{ margin: "8px 2px 0" }}>This is in the future, so it will be saved as a planned event with a reminder.</p>}
        </div>
      </>
    );
    foot = <button className="pillbtn pill-turf" type="button" disabled={!d.type} onClick={() => setStep(2)}>Next</button>;
  } else if (step === 2) {
    title = TYPES[d.type!].label + (d.planned ? " (planned)" : "");
    body = <><Progress n={totalSteps} at={2} />{d.planned ? <PlanFields d={d} set={set} setDetails={setDetails} /> : <DetailFields d={d} set={set} setDetails={setDetails} error={error} />}</>;
    foot = d.planned
      ? <button className="pillbtn pill-turf" type="button" onClick={() => save()}>{mode === "edit" ? "Save changes" : "Save to calendar"}</button>
      : <button className="pillbtn pill-turf" type="button" onClick={next}>Next</button>;
  } else {
    title = d.checkIn ? (mode === "edit" ? "Update today's check-in" : "Check in") : "How are you feeling?";
    body = <>{!d.checkIn && <Progress n={3} at={3} />}<FeelFields d={d} setFeel={setFeel} /></>;
    foot = d.checkIn
      ? <button className="pillbtn pill-turf" type="button" disabled={!feelIsSet(d.feel)} onClick={() => save()}>{mode === "edit" ? "Update" : "Save"}</button>
      : <>
          <button className="pillbtn pill-ghost" type="button" onClick={() => save(true)}>Skip</button>
          <button className="pillbtn pill-turf" type="button" onClick={() => save()}>{mode === "edit" ? "Save changes" : "Save"}</button>
        </>;
  }

  const canBack = step > 1 && !d.checkIn && !(mode === "complete" && step === 2);
  return (
    <>
      <SheetHead title={title} onBack={canBack ? () => setStep(step - 1) : undefined} onClose={close} />
      <div className="sheet-body">{body}</div>
      <div className="sheet-foot">{foot}</div>
    </>
  );
}

function Progress({ n, at }: { n: number; at: number }) {
  return (
    <div className="progress" role="img" aria-label={`Step ${at} of ${n}`}>
      {Array.from({ length: n }, (_, i) => <i key={i} className={i < at ? "on" : ""} />)}
    </div>
  );
}

interface FieldProps {
  d: LogDraft;
  set: (p: Partial<LogDraft>) => void;
  setDetails: (p: LogDraft["details"]) => void;
}

function PlanFields({ d, set, setDetails }: FieldProps) {
  return (
    <>
      {d.type === "match" && (
        <div className="field">
          <label htmlFor="opp">Opponent <span className="muted" style={{ fontWeight: 500 }}>(optional)</span></label>
          <input id="opp" className="inp" aria-label="Opponent" maxLength={60} value={d.details.opponent ?? ""} placeholder="Who are you playing? e.g. Ridgeway" onChange={(e) => setDetails({ opponent: e.target.value })} />
        </div>
      )}
      <div className="field">
        <span className="lbl">Remind me</span>
        <div className="chips">
          {([["1h", "1 hour before"], ["evening", "The evening before"], ["none", "No reminder"]] as const).map(([k, l]) => <Chip key={k} on={d.reminder === k} onClick={() => set({ reminder: k })}>{l}</Chip>)}
        </div>
      </div>
      {!d.id && (
        <div className="field">
          <span className="lbl">Repeat</span>
          <div className="chips">
            <Chip on={!d.repeatWeekly} onClick={() => set({ repeatWeekly: false })}>Does not repeat</Chip>
            <Chip on={d.repeatWeekly} onClick={() => set({ repeatWeekly: true })}>Every week</Chip>
          </div>
          {d.repeatWeekly && <p className="small muted" style={{ margin: "8px 2px 0" }}>Adds the same time for the next 5 weeks too.</p>}
        </div>
      )}
      <div className="hint">After it happens, you&apos;ll get a nudge to log how it went.</div>
    </>
  );
}

function DetailFields({ d, set, setDetails, error }: FieldProps & { error: string }) {
  const { snapshot: s } = useStore();
  const det = d.details;
  const t = d.type!;

  if (t === "match") {
    const r = matchResult({ details: det } as PitchEvent);
    const [label, color] = r === "win" ? ["Win", "var(--good)"] : r === "loss" ? ["Loss", "var(--care)"] : ["Draw", "var(--muted)"];
    const step = (k: "ourScore" | "theirScore", n: number) => setDetails({ [k]: Math.max(0, (det[k] ?? 0) + n) });
    const minutesValue = det.minutesText ?? String(det.minutesPlayed ?? 0);
    return (
      <>
        <div className="field">
          <label htmlFor="opp">Opponent</label>
          <input id="opp" className="inp" aria-label="Opponent" maxLength={60} value={det.opponent ?? ""} placeholder="Who did you play?" onChange={(e) => setDetails({ opponent: e.target.value })} />
        </div>
        <div className="score">
          <div className="side">
            <small>Us</small><div className="num" aria-live="polite" aria-label={`Our score ${det.ourScore}`}>{det.ourScore}</div>
            <div className="stepper"><button type="button" aria-label="Remove a goal for us" onClick={() => step("ourScore", -1)}>−</button><button type="button" aria-label="Add a goal for us" onClick={() => step("ourScore", 1)}>+</button></div>
          </div>
          <div className="result" style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }} aria-live="polite">{label}</div>
          <div className="side">
            <small>Them</small><div className="num" aria-live="polite" aria-label={`Their score ${det.theirScore}`}>{det.theirScore}</div>
            <div className="stepper"><button type="button" aria-label="Remove a goal for them" onClick={() => step("theirScore", -1)}>−</button><button type="button" aria-label="Add a goal for them" onClick={() => step("theirScore", 1)}>+</button></div>
          </div>
        </div>
        <div className="field">
          <span className="lbl">Venue</span>
          <Seg label="Venue" value={det.venue ?? "home"} options={[["home", "Home"], ["away", "Away"]]} onChange={(v) => setDetails({ venue: v })} />
        </div>
        <div className="field">
          <label htmlFor="mins">Minutes you played</label>
          <input id="mins" className="inp" type="number" inputMode="numeric" min={0} max={90} step={1} aria-label="Minutes you played, 0 to 90"
            aria-invalid={!!error} aria-describedby={error ? "mins-err" : undefined} value={minutesValue}
            onChange={(e) => {
              const raw = e.target.value, n = Number(raw);
              const ok = raw.trim() !== "" && Number.isInteger(n) && n >= 0 && n <= 90;
              setDetails(ok ? { minutesText: raw, minutesPlayed: n } : { minutesText: raw });
            }} />
          {error && <p className="error" id="mins-err" role="alert">{error}</p>}
        </div>
      </>
    );
  }

  if (t === "practice" || t === "exercise") {
    const isPractice = t === "practice";
    const opts = isPractice ? PRACTICE_FOCUS : ACTIVITIES;
    return (
      <>
        <div className="field">
          <span className="lbl">{isPractice ? "Focus" : "What did you do?"}</span>
          <div className="chips">
            {opts.map((k) => {
              const on = isPractice ? (det.focus ?? []).includes(k) : det.activity === k;
              const toggle = () => isPractice
                ? setDetails({ focus: on ? det.focus!.filter((x) => x !== k) : [...(det.focus ?? []), k] })
                : setDetails({ activity: k });
              return <Chip key={k} on={on} onClick={toggle}>{k}</Chip>;
            })}
          </div>
        </div>
        <div className="field">
          <span className="lbl">How long?</span>
          <div className="chips">{DURATIONS.map((m) => <Chip key={m} on={det.durationMin === m} onClick={() => setDetails({ durationMin: m })}>{m} min</Chip>)}</div>
        </div>
        <div className="field">
          <label htmlFor="rpe">How hard was it? <span className="muted" style={{ fontWeight: 500 }}>{det.effort}/10</span></label>
          <input id="rpe" type="range" min={1} max={10} value={det.effort ?? 5} aria-label="Effort, 1 (easy) to 10 (flat out)" aria-valuetext={`${det.effort} out of 10`} onChange={(e) => setDetails({ effort: +e.target.value })} />
          <div className="scale" aria-hidden="true"><span>Easy</span><span>Flat out</span></div>
        </div>
      </>
    );
  }

  const inj = activeInjuries(s);
  const toggleRx = (id: string) => {
    const cur = det.exerciseIds ?? [];
    setDetails({ exerciseIds: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] });
  };
  return (
    <>
      {t === "physio" && (
        <>
          <div className="field">
            <label htmlFor="injsel">Which injury?</label>
            <select id="injsel" className="inp" aria-label="Which injury?" value={det.injuryId ?? "new"} onChange={(e) => setDetails({ injuryId: e.target.value })}>
              {inj.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              <option value="new">A new injury</option>
            </select>
          </div>
          {det.injuryId === "new" && (
            <>
              <div className="field">
                <label htmlFor="newinj">Name it</label>
                <input id="newinj" className="inp" aria-label="Injury name" maxLength={60} placeholder="e.g. Right hamstring strain" value={det.newInjuryName ?? ""}
                  aria-invalid={!!error} aria-describedby={error ? "newinj-err" : undefined} autoFocus={!!error}
                  onChange={(e) => setDetails({ newInjuryName: e.target.value })} />
                {error && <p className="error" id="newinj-err" role="alert">{error}</p>}
              </div>
              <div className="field">
                <label htmlFor="newpart">Where is it?</label>
                <select id="newpart" className="inp" aria-label="Where is the injury?" value={det.newInjuryPart ?? ""} onChange={(e) => setDetails({ newInjuryPart: e.target.value })}>
                  <option value="">Not sure, use where I say it hurts</option>
                  {BODY_PARTS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
            </>
          )}
        </>
      )}
      {t === "bio" && inj.length > 0 && (
        <div className="field">
          <label htmlFor="bioinj">Is this for an injury?</label>
          <select id="bioinj" className="inp" aria-label="Is this for an injury?" value={det.injuryId ?? ""} onChange={(e) => setDetails({ injuryId: e.target.value || undefined })}>
            <option value="">No, general strength and recovery</option>
            {inj.map((i) => <option key={i.id} value={i.id}>Yes: {i.name}</option>)}
          </select>
        </div>
      )}
      <div className="field">
        <span className="lbl">How long?</span>
        <div className="chips">{[30, 45, 60, 90].map((m) => <Chip key={m} on={det.durationMin === m} onClick={() => setDetails({ durationMin: m })}>{m} min</Chip>)}</div>
      </div>
      <div className="field">
        <label htmlFor="note">What did they say?</label>
        <textarea id="note" className="inp" aria-label="What did they say?" maxLength={2000} placeholder={t === "physio" ? "e.g. No running for a week, ice twice a day" : "e.g. Focus on hip strength"} value={det.notes ?? ""} onChange={(e) => setDetails({ notes: e.target.value })} />
      </div>
      <div className="field">
        <span className="lbl">Exercises they gave you</span>
        <ExercisePicker s={s} selected={det.exerciseIds ?? []} onToggle={toggleRx} custom={d.custom} onAddCustom={(c) => set({ custom: [...d.custom, c] })} />
      </div>
    </>
  );
}

function FeelFields({ d, setFeel }: { d: LogDraft; setFeel: (p: Partial<LogDraft["feel"]>) => void }) {
  const f = d.feel;
  // Nothing is pre-selected: only what the player sets gets saved.
  const setMood = (v: number) => setFeel({ mood: v });
  return (
    <>
      <div className="feelstage" style={{ color: "var(--muted)" }}>
        <FeelShape mood={f.mood} size={170} />
        <div className="lab" aria-hidden="true" style={{ color: f.mood == null ? "var(--muted)" : undefined }}>{f.mood == null ? "Slide to set" : moodLabel(f.mood)}</div>
      </div>
      <input type="range" min={0} max={100} value={f.mood ?? 50} className={f.mood == null ? "unset" : undefined}
        aria-label="How you feel, from rough to great" aria-valuetext={f.mood == null ? "Not set" : moodLabel(f.mood)}
        onChange={(e) => setMood(+e.target.value)} onPointerUp={(e) => f.mood == null && setMood(+e.currentTarget.value)} />
      <div className="scale" aria-hidden="true"><span>Rough</span><span>Great</span></div>
      <div className="field">
        <span className="lbl" id="energy-lbl">Energy</span>
        <div className="chips" role="group" aria-labelledby="energy-lbl">{ENERGY.map((l, i) => <Chip key={l} on={f.energy === i + 1} onClick={() => setFeel({ energy: f.energy === i + 1 ? 0 : i + 1 })}>{l}</Chip>)}</div>
      </div>
      <div className="field">
        <span className="lbl" id="sore-lbl">Muscle soreness</span>
        <div className="chips" role="group" aria-labelledby="sore-lbl">{SORENESS.map((l, i) => <Chip key={l} on={f.soreness === i + 1} onClick={() => setFeel({ soreness: f.soreness === i + 1 ? 0 : i + 1 })}>{l}</Chip>)}</div>
      </div>
      <div className="toggle" onClick={(e) => { if (!(e.target as HTMLElement).closest(".switch")) setFeel({ inPain: !f.inPain, pain: !f.inPain && !f.pain ? 3 : f.pain }); }}>
        <div><b>Picked up a knock or in pain?</b><small>Track it so your physio can see how it&apos;s going</small></div>
        <Switch on={f.inPain} label="Picked up a knock or in pain" onChange={(v) => setFeel({ inPain: v, pain: v && !f.pain ? 3 : f.pain })} />
      </div>
      {f.inPain && (
        <>
          <div className="field">
            <label htmlFor="part">Where?</label>
            <select id="part" className="inp" aria-label="Where does it hurt?" value={f.bodyPart} onChange={(e) => setFeel({ bodyPart: e.target.value })}>
              {BODY_PARTS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="pain">Pain <span className="muted" style={{ fontWeight: 500 }}>{f.pain}/10</span></label>
            <input id="pain" type="range" min={0} max={10} value={f.pain} aria-label="Pain, 0 to 10" aria-valuetext={`${f.pain} out of 10`} onChange={(e) => setFeel({ pain: +e.target.value })} />
            <div className="scale" aria-hidden="true"><span>None</span><span>Worst</span></div>
          </div>
          {f.pain >= 7 && <div className="hint care" role="alert">{SAFETY_HIGH_PAIN}</div>}
        </>
      )}
      <div className="field">
        <label htmlFor="fnote">Anything else?</label>
        <textarea id="fnote" className="inp" aria-label="Anything else? Optional note" maxLength={1000} placeholder="Optional note" value={f.note} onChange={(e) => setFeel({ note: e.target.value })} />
      </div>
    </>
  );
}
