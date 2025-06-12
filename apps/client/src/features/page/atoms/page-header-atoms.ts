import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

const defaultSettings = {
  showUndo: false,
  showRedo: true,
  showComments: true,
  showToc: true,
  fullWidth: false,
  showQuickInputBar: false,
  showHideHeaderButton: true,
  showKeyboardStatus: false,
  showShareButton: false,
  isPageHeaderVisible: false,
};

export const pageHeaderButtonsAtom = atomWithStorage(
  "pageHeaderButtons",
  defaultSettings
); 