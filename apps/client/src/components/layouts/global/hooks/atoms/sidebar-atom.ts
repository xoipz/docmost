import { atomWithWebStorage } from "@/lib/jotai-helper.ts";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const mobileSidebarAtom = atom<boolean>(false);

export const desktopSidebarAtom = atomWithWebStorage<boolean>(
  "showSidebar",
  true,
);

// 导航栏收缩状态原子 - 用于记忆导航栏是否收缩
export const navigationCollapsedAtom = atomWithWebStorage<boolean>(
  "navigationCollapsed",
  false,
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

export const defaultOpenTocAtom = atomWithWebStorage<boolean>('defaultOpenToc', false);

// 跟踪用户是否手动关闭过TOC
export const userManuallyClosedTocAtom = atomWithWebStorage<boolean>('userManuallyClosedToc', false);

// 控制header的显示/隐藏状态，默认为显示
export const headerVisibleAtom = atomWithWebStorage<boolean>('headerVisible', true);

// 侧边栏宽度变量
export const sidebarWidthsAtom = atom({
  leftWidth: 0,
  rightWidth: 0,
});