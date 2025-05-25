import { asideStateAtom, defaultOpenTocAtom } from "@/components/layouts/global/hooks/atoms/sidebar-atom.ts";
import { useAtom } from "jotai";

const useToggleAside = () => {
  const [asideState, setAsideState] = useAtom(asideStateAtom);
  const [, setDefaultOpenToc] = useAtom(defaultOpenTocAtom);

  const toggleAside = (tab: string) => {
    let newIsAsideOpen;
    if (asideState.tab === tab) {
      newIsAsideOpen = !asideState.isAsideOpen;
      setAsideState({ tab, isAsideOpen: newIsAsideOpen });
    } else {
      newIsAsideOpen = true;
      setAsideState({ tab, isAsideOpen: newIsAsideOpen });
    }

    if (tab === "toc") {
      setDefaultOpenToc(newIsAsideOpen);
    } else {
      // If another tab is opened, toc is no longer "default open"
      if (newIsAsideOpen) { 
        setDefaultOpenToc(false);
      }
    }
  };

  return toggleAside;
};

export default useToggleAside;
