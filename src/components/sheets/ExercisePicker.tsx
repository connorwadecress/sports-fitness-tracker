"use client";

import { useRef, useState } from "react";
import { useApp } from "../context";
import { Illustration } from "../ui";
import { shrinkImage } from "@/lib/client/image";
import { LIBRARY } from "@/lib/domain/constants";
import { uid, type CustomExerciseDraft } from "@/lib/domain/ops";
import type { Snapshot } from "@/lib/domain/types";

/** Picture library plus "something else" with an optional photo (US-3.1, US-3.2). */
export function ExercisePicker({ s, selected, onToggle, custom, onAddCustom }: {
  s: Snapshot;
  selected: string[];
  onToggle: (id: string) => void;
  custom: CustomExerciseDraft[];
  onAddCustom: (c: CustomExerciseDraft) => void;
}) {
  const { toast } = useApp();
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const library = [
    ...LIBRARY.map((l) => ({ id: l.key, name: l.name, illustrationKey: l.key, sets: l.sets, repsOrTime: l.repsOrTime, imageUrl: undefined as string | undefined })),
    ...s.exercises.filter((x) => !LIBRARY.some((l) => l.key === x.id)),
  ];

  const add = async () => {
    const n = name.trim();
    if (!n) { setError("Give the exercise a name"); nameRef.current?.focus(); return; }
    setBusy(true);
    let imageUrl: string | undefined;
    if (file) {
      try { imageUrl = await shrinkImage(file); } catch { toast("Couldn't read that image"); }
    }
    onAddCustom({ id: `c${uid()}`, name: n, sets: Math.min(10, Math.max(1, parseInt(sets) || 3)), repsOrTime: reps.trim() || "10 reps", imageUrl });
    setName(""); setReps(""); setSets("3"); setFile(null); setError(""); setBusy(false);
    toast("Exercise added");
  };

  return (
    <>
      <div className="pickgrid">
        {library.map((x) => (
          <button key={x.id} type="button" className="pick" aria-pressed={selected.includes(x.id)} onClick={() => onToggle(x.id)}>
            <Illustration ex={x} />
            {x.name}
            <span className="muted" style={{ display: "block", fontWeight: 500, fontSize: 12 }}>{x.sets} × {x.repsOrTime}</span>
          </button>
        ))}
        {custom.map((c) => (
          <div key={c.id} className="pick" aria-pressed="true">
            <Illustration ex={{ ...c, illustrationKey: "custom" }} />
            {c.name}
            <span className="muted" style={{ display: "block", fontWeight: 500, fontSize: 12 }}>{c.sets} × {c.repsOrTime}</span>
          </div>
        ))}
      </div>
      <div className="panel" style={{ marginTop: 10, padding: 12 }}>
        <span className="lbl">Something else?</span>
        <label className="sr-only" htmlFor="cname">Exercise name</label>
        <input ref={nameRef} id="cname" className="inp" maxLength={60} placeholder="Exercise name" value={name} aria-invalid={!!error} aria-describedby={error ? "cname-err" : undefined}
          onChange={(e) => { setName(e.target.value); if (error) setError(""); }} style={{ marginBottom: error ? 0 : 8 }} />
        {error && <p className="error" id="cname-err" style={{ marginBottom: 8 }}>{error}</p>}
        <div className="two" style={{ marginBottom: 8 }}>
          <input className="inp" type="number" inputMode="numeric" min={1} max={10} value={sets} onChange={(e) => setSets(e.target.value)} aria-label="Sets" />
          <input className="inp" placeholder="10 reps" value={reps} onChange={(e) => setReps(e.target.value)} aria-label="Reps or time" />
        </div>
        <label className="pillbtn pill-ghost" style={{ display: "block", textAlign: "center", marginBottom: 8, cursor: "pointer", lineHeight: "22px" }}>
          {file ? `Photo: ${file.name}` : "Add a photo or screenshot"}
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <button type="button" className="pillbtn pill-turf" style={{ width: "100%" }} onClick={add} disabled={busy}>Add exercise</button>
      </div>
    </>
  );
}
