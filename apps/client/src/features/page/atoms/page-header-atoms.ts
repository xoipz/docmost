import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

const defaultSettings = {
  showUndo: false,
  showRedo: true,
  showComments: true,
  showToc: true,
  fullWidth: false,
  showQuickInputBar: false,
  showShareButton: false,
  isPageHeaderVisible: false,
  showMultiWindow: false,
  showLoading: false,
  showPageState: false,
};

export const pageHeaderButtonsAtom = atomWithStorage(
  "pageHeaderButtons",
  defaultSettings
); 