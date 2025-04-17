import { atomWithWebStorage } from "@/lib/jotai-helper.ts";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const mobileSidebarAtom = atom<boolean>(false);

export const desktopSidebarAtom = atomWithWebStorage<boolean>(
  "showSidebar",
  true,
);

export const desktopAsideAtom = atom<boolean>(false);

type AsideStateType = {
  tab: string;
  isAsideOpen: boolean;
};

export const asideStateAtom = atom({
  tab: "",
  isAsideOpen: false,
});

export const sidebarWidthAtom = atomWithWebStorage<number>('sidebarWidth', 300);

export const defaultOpenTocAtom = atom(false);


// 侧边栏宽度变量
export const sidebarWidthsAtom = atom({
  leftWidth: 0,
  rightWidth: 0,
});