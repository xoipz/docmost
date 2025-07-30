import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export type SpaceViewMode = "normal" | "journal";

// 为每个space存储独立的viewMode
export const createSpaceViewModeAtom = (spaceId: string) => 
  atomWithStorage<SpaceViewMode>(
    `docmost-space-view-mode-${spaceId}`,
    "normal"
  );

// 保留全局的默认atom作为兜底
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

export const journalViewModeAtom = atomWithStorage<"month" | "year" | "decade">(
  "docmost-journal-view-mode", 
  "month"
);