"use client";

import { useState } from "react";
import { useApp, type SheetSpec } from "../context";
import { Chip, FeelShape, Seg, SheetHead, Switch, Tile } from "../ui";
import { ExercisePicker } from "./ExercisePicker";
import { apply, getState, useStore } from "@/lib/client/store";
import { enablePush, wantsPushPrompt } from "@/lib/client/push";
import { ACTIVITIES, BODY_PARTS, DURATIONS, ENERGY, PRACTICE_FOCUS, SAFETY_HIGH_PAIN, SORENESS, TYPES, TYPE_KEYS, moodLabel } from "@/lib/domain/constants";
import { addDays, parts } from "@/lib/domain/dates";
import { activeInjuries, matchResult } from "@/lib/domain/derive";
import { blankFeel, defaultDetails, saveLog, type LogDraft } from "@/lib/domain/ops";
import type { EventType, PitchEvent } from "@/lib/domain/types";

type Spec = Extract<SheetSpec, { kind: "log" }>;

function initialDraft(spec: Spec, today: string, time: string): { draft: LogDraft; step: number } {
  const s = getState().snapshot;
  const base: LogDraft = {
    type: spec.type ?? null, date: spec.date ?? today, time, planned: false, checkIn: false,
    details: spec.type ? defaultDetails(spec.type, s) : {}, custom: [], feel: blankFeel(s), reminder: "1h", repeatWeekly: false,
  };
  if (spec.completeId) {
    const e = s.events.find((x) => x.id === spec.completeId);
    if (e?.type) {
      return { draft: { ...base, id: e.id, type: e.type, date: e.date, time: e.time, details: { ...defaultDetails(e.type, s), ...stripEmpty(e.details) } }, step: 2 };
    }
  }
  if (spec.mode === "checkin") return { draft: { ...base, checkIn: true }, step: 3 };
  if (spec.mode === "plan") {
    const date = !spec.date || spec.date <= today ? addDays(today, 1) : spec.date;
    return { draft: { ...base, planned: true, date, time: "16:00" }, step: 1 };
  }
  return { draft: { ...base, planned: base.date > today }, step: spec.type ? 2 : 1 };
}

const stripEmpty = (d: PitchEvent["details"]) => Object.fromEntries(Object.entries(d).filter(([, v]) => v !== undefined && v !== ""));

export function LogSheet({ spec }: { spec: Spec }) {
  const { today, now, close, toast, setCalendar } = useApp();
  const { snapshot: s, meta } = useStore();
  const [init] = useState(() => initialDraft(spec, today, now.time));
  const [d, setD] = useState<LogDraft>(init.draft);
  const [step, setStep] = useState(init.step);
  const [error, setError] = useState("");
  const fromPlan = !!init.draft.id;

  const set = (patch: Partial<LogDraft>) => setD((x) => ({ ...x, ...patch }));
  const setDetails = (patch: LogDraft["details"]) => setD((x) => ({ ...x, details: { ...x.details, ...patch } }));
  const setFeel = (patch: Partial<LogDraft["feel"]>) => setD((x) => ({ ...x, feel: { ...x.feel, ...patch } }));
  const totalSteps = d.planned ? 2 : 3;

  const pickType = (t: EventType) => set({ type: t, details: defaultDetails(t, s) });

  const save = () => {
    if (d.type === "physio" && d.details.injuryId === "new" && !d.planned && !d.details.newInjuryName?.trim()) {
      setStep(2); setError("Give the injury a name"); return;
    }
    const askPush = d.planned && meta.mode === "account" && wantsPushPrompt();
    const res = saveLog(s, d, today);
    apply(res.puts);
    close();
    if (d.checkIn) toast("Check-in saved");
    else if (d.planned) {
      toast("Added to calendar");
      const p = parts(d.date);
      setCalendar({ y: p.y, m: p.m, sel: d.date });
    } else toast(`${TYPES[d.type!].label} saved`);
    if (res.newInjury && !d.planned) toast(`Now tracking: ${res.newInjury.name}`, 2300);
    if (askPush) void enablePush(); // first plan: ask for notification permission (US-5.1)
  };

  let title: string, body: React.ReactNode, foot: React.ReactNode;
  if (step === 1) {
    title = d.planned ? "Plan an event" : "What are you logging?";
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
    body = <><Progress n={totalSteps} at={2} />{d.planned ? <PlanFields d={d} set={set} setDetails={setDetails} /> : <DetailFields d={d} set={set} setDetails={setDetails} error={error} clearError={() => setError("")} />}</>;
    foot = d.planned
      ? <button className="pillbtn pill-turf" type="button" onClick={save}>Save to calendar</button>
      : <button className="pillbtn pill-turf" type="button" onClick={() => {
          if (d.type === "physio" && d.details.injuryId === "new" && !d.details.newInjuryName?.trim()) { setError("Give the injury a name"); return; }
          setStep(3);
        }}>Next</button>;
  } else {
    title = d.checkIn ? "Check in" : "How are you feeling?";
    body = <>{!d.checkIn && <Progress n={3} at={3} />}<FeelFields d={d} setFeel={setFeel} /></>;
    foot = <button className="pillbtn pill-turf" type="button" onClick={save}>Save</button>;
  }

  const canBack = step > 1 && !d.checkIn && !(fromPlan && step === 2);
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
          <label htmlFor="opp">Opponent</label>
          <input id="opp" className="inp" value={d.details.opponent ?? ""} placeholder="e.g. Ridgeway" onChange={(e) => setDetails({ opponent: e.target.value })} />
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

function DetailFields({ d, set, setDetails, error, clearError }: FieldProps & { error: string; clearError: () => void }) {
  const { snapshot: s } = useStore();
  const det = d.details;
  const t = d.type!;

  if (t === "match") {
    const r = matchResult({ details: det } as PitchEvent);
    const [label, color] = r === "win" ? ["Win", "var(--good)"] : r === "loss" ? ["Loss", "var(--care)"] : ["Draw", "var(--muted)"];
    const step = (k: "ourScore" | "theirScore", n: number) => setDetails({ [k]: Math.max(0, (det[k] ?? 0) + n) });
    return (
      <>
        <div className="field">
          <label htmlFor="opp">Opponent</label>
          <input id="opp" className="inp" value={det.opponent ?? ""} placeholder="Who did you play?" onChange={(e) => setDetails({ opponent: e.target.value })} />
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
          <input id="mins" className="inp" type="number" inputMode="numeric" min={0} max={90} value={det.minutesPlayed ?? 0}
            onChange={(e) => setDetails({ minutesPlayed: Math.min(90, Math.max(0, parseInt(e.target.value) || 0)) })} />
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
          <input id="rpe" type="range" min={1} max={10} value={det.effort ?? 5} onChange={(e) => setDetails({ effort: +e.target.value })} aria-valuetext={`${det.effort} out of 10`} />
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
            <select id="injsel" className="inp" value={det.injuryId ?? "new"} onChange={(e) => { setDetails({ injuryId: e.target.value }); clearError(); }}>
              {inj.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              <option value="new">A new injury</option>
            </select>
          </div>
          {det.injuryId === "new" && (
            <>
              <div className="field">
                <label htmlFor="newinj">Name it</label>
                <input id="newinj" className="inp" placeholder="e.g. Right hamstring strain" value={det.newInjuryName ?? ""} aria-invalid={!!error}
                  onChange={(e) => { setDetails({ newInjuryName: e.target.value }); clearError(); }} autoFocus={!!error} />
                {error && <p className="error">{error}</p>}
              </div>
              <div className="field">
                <label htmlFor="newpart">Where is it?</label>
                <select id="newpart" className="inp" value={det.newInjuryPart ?? ""} onChange={(e) => setDetails({ newInjuryPart: e.target.value })}>
                  <option value="">Not sure, use where I say it hurts</option>
                  {BODY_PARTS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
            </>
          )}
        </>
      )}
      <div className="field">
        <span className="lbl">How long?</span>
        <div className="chips">{[30, 45, 60, 90].map((m) => <Chip key={m} on={det.durationMin === m} onClick={() => setDetails({ durationMin: m })}>{m} min</Chip>)}</div>
      </div>
      <div className="field">
        <label htmlFor="note">What did they say?</label>
        <textarea id="note" className="inp" placeholder={t === "physio" ? "e.g. No running for a week, ice twice a day" : "e.g. Focus on hip strength"} value={det.notes ?? ""} onChange={(e) => setDetails({ notes: e.target.value })} />
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
  return (
    <>
      <div className="feelstage">
        <FeelShape mood={f.mood} size={170} />
        <div className="lab" aria-hidden="true">{moodLabel(f.mood)}</div>
      </div>
      <input type="range" min={0} max={100} value={f.mood} aria-label="How you feel, from rough to great" aria-valuetext={moodLabel(f.mood)} onChange={(e) => setFeel({ mood: +e.target.value })} />
      <div className="scale" aria-hidden="true"><span>Rough</span><span>Great</span></div>
      <div className="field">
        <span className="lbl">Energy</span>
        <div className="chips">{ENERGY.map((l, i) => <Chip key={l} on={f.energy === i + 1} onClick={() => setFeel({ energy: i + 1 })}>{l}</Chip>)}</div>
      </div>
      <div className="field">
        <span className="lbl">Muscle soreness</span>
        <div className="chips">{SORENESS.map((l, i) => <Chip key={l} on={f.soreness === i + 1} onClick={() => setFeel({ soreness: i + 1 })}>{l}</Chip>)}</div>
      </div>
      <div className="toggle">
        <div><b>Picked up a knock or in pain?</b><small>Track it so your physio can see how it&apos;s going</small></div>
        <Switch on={f.inPain} label="Picked up a knock or in pain" onChange={(v) => setFeel({ inPain: v, pain: v && !f.pain ? 3 : f.pain })} />
      </div>
      {f.inPain && (
        <>
          <div className="field">
            <label htmlFor="part">Where?</label>
            <select id="part" className="inp" value={f.bodyPart} onChange={(e) => setFeel({ bodyPart: e.target.value })}>
              {BODY_PARTS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="pain">Pain <span className="muted" style={{ fontWeight: 500 }}>{f.pain}/10</span></label>
            <input id="pain" type="range" min={0} max={10} value={f.pain} aria-valuetext={`${f.pain} out of 10`} onChange={(e) => setFeel({ pain: +e.target.value })} />
            <div className="scale" aria-hidden="true"><span>None</span><span>Worst</span></div>
          </div>
          {f.pain >= 7 && <div className="hint care" role="alert">{SAFETY_HIGH_PAIN}</div>}
        </>
      )}
      <div className="field">
        <label htmlFor="fnote">Anything else?</label>
        <textarea id="fnote" className="inp" placeholder="Optional note" value={f.note} onChange={(e) => setFeel({ note: e.target.value })} />
      </div>
    </>
  );
}
