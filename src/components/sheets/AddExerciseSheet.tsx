"use client";

import { useState } from "react";
import { useApp } from "../context";
import { Seg, SheetHead } from "../ui";
import { ExercisePicker } from "./ExercisePicker";
import { apply, useStore } from "@/lib/client/store";
import { programmeAdds, type CustomExerciseDraft } from "@/lib/domain/ops";
import type { Source } from "@/lib/domain/types";

/** Add exercises to the programme without logging a session (US-3.6). */
export function AddExerciseSheet() {
  const { snapshot: s } = useStore();
  const { today, close, toast, go } = useApp();
  const [source, setSource] = useState<Source>("physio");
  const [picked, setPicked] = useState<string[]>([]);
  const [custom, setCustom] = useState<CustomExerciseDraft[]>([]);

  const save = () => {
    const adds = programmeAdds(s, source, picked, custom, today, Date.now());
    apply(adds.map((record) => ({ c: "exercises" as const, record })));
    go("rehab");
    toast(adds.length ? "Programme updated" : "Already in your programme");
  };

  return (
    <>
      <SheetHead title="Add exercise" onClose={close} />
      <div className="sheet-body">
        <div className="field">
          <span className="lbl">Who gave it to you?</span>
          <Seg label="Who gave it to you" value={source} options={[["physio", "Physio"], ["bio", "Biokineticist"]]} onChange={setSource} />
          <p className="small muted" style={{ margin: "8px 2px 0" }}>{source === "physio" ? "Physio exercises are done every day." : "Biokineticist exercises count 3 days a week."}</p>
        </div>
        <ExercisePicker s={s} selected={picked} onToggle={(id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))} custom={custom} onAddCustom={(c) => setCustom((x) => [...x, c])} />
      </div>
      <div className="sheet-foot">
        <button className="pillbtn pill-turf" type="button" onClick={save} disabled={!picked.length && !custom.length}>Add to programme</button>
      </div>
    </>
  );
}
