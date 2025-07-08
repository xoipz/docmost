import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

// 底部工具栏的全局状态，独立于页面状态
export const globalBottomToolbarAtom = atomWithStorage("globalBottomToolbar", {
  showMultiWindow: false,
  showQuickInputBar: false,
});

// 保持底部工具栏状态与页面头部设置同步的原子
export const syncBottomToolbarAtom = atom(
  (get) => get(globalBottomToolbarAtom),
  (get, set, update: { showMultiWindow?: boolean; showQuickInputBar?: boolean }) => {
    const current = get(globalBottomToolbarAtom);
    const newState = { ...current, ...update };
    
    // 只有在状态真正改变时才更新，避免不必要的重新渲染
    if (
      current.showMultiWindow !== newState.showMultiWindow || 
      current.showQuickInputBar !== newState.showQuickInputBar
    ) {
      set(globalBottomToolbarAtom, newState);
    }
  }
);