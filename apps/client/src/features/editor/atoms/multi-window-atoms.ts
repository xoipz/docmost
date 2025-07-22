import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export interface WindowTab {
  id: string;
  title: string;
  url: string;
  isActive: boolean;
  pageId?: string;
  scrollPosition?: number; // 保存页面滚动位置
}

// 多窗口标签状态
export const multiWindowTabsAtom = atomWithStorage<WindowTab[]>("multiWindowTabs", []);

// 当前活跃标签
export const activeTabAtom = atomWithStorage<string | null>("activeTab", null);

// 标签操作原子
export const tabActionsAtom = atom(
  null,
  (get, set, action: { type: string; payload?: any }) => {
    const tabs = get(multiWindowTabsAtom);
    
    switch (action.type) {
      case "ADD_TAB": {
        const { id, title, url, pageId, scrollPosition } = action.payload;
        const existingTab = tabs.find(tab => tab.id === id);
        
        if (existingTab) {
          // 如果标签已存在，激活它并更新滚动位置
          set(activeTabAtom, id);
          set(multiWindowTabsAtom, tabs.map(tab => ({
            ...tab,
            isActive: tab.id === id,
            scrollPosition: tab.id === id ? (scrollPosition ?? tab.scrollPosition) : tab.scrollPosition
          })));
        } else {
          // 添加新标签
          const newTab: WindowTab = {
            id,
            title,
            url,
            isActive: true,
            pageId,
            scrollPosition
          };
          set(multiWindowTabsAtom, [...tabs.map(tab => ({ ...tab, isActive: false })), newTab]);
          set(activeTabAtom, id);
        }
        break;
      }
      
      case "REMOVE_TAB": {
        const tabId = action.payload;
        const newTabs = tabs.filter(tab => tab.id !== tabId);
        
        // 如果删除的是当前活跃标签，激活相邻的标签
        const removedTab = tabs.find(tab => tab.id === tabId);
        if (removedTab?.isActive && newTabs.length > 0) {
          const removedIndex = tabs.findIndex(tab => tab.id === tabId);
          const nextIndex = removedIndex >= newTabs.length ? newTabs.length - 1 : removedIndex;
          
          newTabs[nextIndex].isActive = true;
          set(activeTabAtom, newTabs[nextIndex].id);
        } else if (newTabs.length === 0) {
          set(activeTabAtom, null);
        }
        
        set(multiWindowTabsAtom, newTabs);
        break;
      }
      
      case "ACTIVATE_TAB": {
        const tabId = action.payload;
        if (tabId === null) {
          // 取消所有标签页的激活状态
          set(activeTabAtom, null);
          set(multiWindowTabsAtom, tabs.map(tab => ({
            ...tab,
            isActive: false
          })));
        } else {
          // 激活指定标签页
          set(activeTabAtom, tabId);
          set(multiWindowTabsAtom, tabs.map(tab => ({
            ...tab,
            isActive: tab.id === tabId
          })));
        }
        break;
      }
      
      case "MOVE_TAB": {
        const { fromIndex, toIndex } = action.payload;
        const newTabs = [...tabs];
        const [movedTab] = newTabs.splice(fromIndex, 1);
        newTabs.splice(toIndex, 0, movedTab);
        set(multiWindowTabsAtom, newTabs);
        break;
      }
      
      case "UPDATE_TAB_TITLE": {
        const { tabId, title } = action.payload;
        set(multiWindowTabsAtom, tabs.map(tab => 
          tab.id === tabId ? { ...tab, title } : tab
        ));
        break;
      }
      
      case "UPDATE_SCROLL_POSITION": {
        const { tabId, scrollPosition } = action.payload;
        set(multiWindowTabsAtom, tabs.map(tab => 
          tab.id === tabId ? { ...tab, scrollPosition } : tab
        ));
        break;
      }
    }
  }
);