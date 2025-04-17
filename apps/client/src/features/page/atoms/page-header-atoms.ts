import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

const defaultSettings = {
  showUndo: true,
  showRedo: true,
  showComments: true,
  showToc: true,
  fullWidth: false,
  showQuickInputBar: false,
};

export const pageHeaderButtonsAtom = atomWithStorage(
  "pageHeaderButtons",
  defaultSettings
); 