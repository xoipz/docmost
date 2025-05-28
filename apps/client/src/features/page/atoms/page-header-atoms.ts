import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

const defaultSettings = {
  showUndo: false,
  showRedo: false,
  showComments: false,
  showToc: true,
  fullWidth: false,
  showQuickInputBar: false,
  showHideHeaderButton: true,
  showKeyboardStatus: false,
  showShareButton: false,
};

export const pageHeaderButtonsAtom = atomWithStorage(
  "pageHeaderButtons",
  defaultSettings
); 