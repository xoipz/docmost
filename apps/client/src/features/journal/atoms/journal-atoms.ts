import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export type SpaceViewMode = "normal" | "journal";

export const spaceViewModeAtom = atomWithStorage<SpaceViewMode>(
  "docmost-space-view-mode",
  "normal"
);

// 明确指定atom的读写类型
export const journalSelectedDateAtom = atom<Date | null, [Date | null], void>(
  null,
  (get, set, newValue) => {
    set(journalSelectedDateAtom, newValue);
  }
);

export const journalViewModeAtom = atomWithStorage<"month" | "year">(
  "docmost-journal-view-mode", 
  "month"
);