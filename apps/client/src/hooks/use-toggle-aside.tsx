import { asideStateAtom, defaultOpenTocAtom, userManuallyClosedTocAtom } from "@/components/layouts/global/hooks/atoms/sidebar-atom.ts";
import { useAtom } from "jotai";

const useToggleAside = () => {
  const [asideState, setAsideState] = useAtom(asideStateAtom);
  const [, setDefaultOpenToc] = useAtom(defaultOpenTocAtom);
  const [, setUserManuallyClosedToc] = useAtom(userManuallyClosedTocAtom);

  const toggleAside = (tab: string) => {
    // 检查是否是移动设备
    const isMobileDevice = window.innerWidth < 768;
    
    let newIsAsideOpen;
    if (asideState.tab === tab) {
      newIsAsideOpen = !asideState.isAsideOpen;
      setAsideState({ tab, isAsideOpen: newIsAsideOpen });
    } else {
      newIsAsideOpen = true;
      setAsideState({ tab, isAsideOpen: newIsAsideOpen });
    }

    // 只在非移动设备上保存TOC打开状态
    if (tab === "toc" && !isMobileDevice) {
      setDefaultOpenToc(newIsAsideOpen);
      // 当用户手动关闭TOC时，记录这个状态
      if (!newIsAsideOpen) {
        setUserManuallyClosedToc(true);
      } else {
        // 当用户重新打开TOC时，清除手动关闭的标记
        setUserManuallyClosedToc(false);
      }
    } else {
      // If another tab is opened, toc is no longer "default open"
      if (newIsAsideOpen && !isMobileDevice) { 
        setDefaultOpenToc(false);
      }
    }
  };

  return toggleAside;
};

export default useToggleAside;
