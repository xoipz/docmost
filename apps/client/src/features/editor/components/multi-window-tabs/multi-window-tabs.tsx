import React, { useCallback, useRef, useEffect } from "react";
import { ActionIcon, Group, Text, ScrollArea, Box } from "@mantine/core";
import { useAtom, useAtomValue } from "jotai";
import { 
  IconX,
  IconPlus,
  IconChevronLeft,
  IconChevronRight
} from "@tabler/icons-react";
import { multiWindowTabsAtom, tabActionsAtom, WindowTab } from "@/features/editor/atoms/multi-window-atoms";
import { useTranslation } from "react-i18next";
import classes from "./multi-window-tabs.module.css";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { extractPageSlugId } from "@/lib";
import { queryClient } from "@/main.tsx";
import { IPage } from "@/features/page/types/page.types.ts";
import { globalBottomToolbarAtom } from "@/features/editor/atoms/bottom-toolbar-atoms";

export function MultiWindowTabs() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pageSlug } = useParams();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const tabs = useAtomValue(multiWindowTabsAtom);
  const [, dispatchTabAction] = useAtom(tabActionsAtom);
  const bottomToolbar = useAtomValue(globalBottomToolbarAtom);

  // 动态设置CSS变量来计算多窗口标签栏位置
  useEffect(() => {
    // 简化逻辑：直接根据全局设置状态来决定高度
    const quickInputBarHeight = bottomToolbar.showQuickInputBar ? "48px" : "0px";
    document.documentElement.style.setProperty("--quick-input-bar-height", quickInputBarHeight);
  }, [bottomToolbar.showQuickInputBar]);

  // 鼠标滚轮水平滚动
  useEffect(() => {
    const scrollAreaElement = scrollAreaRef.current;
    if (!scrollAreaElement) return;

    const handleWheel = (e: WheelEvent) => {
      // 查找ScrollArea的viewport元素，尝试多种可能的选择器
      let viewport = scrollAreaElement.querySelector('[data-scroll-area-viewport]') as HTMLElement;
      
      if (!viewport) {
        // 备选方案：查找第一个可滚动的子元素
        viewport = scrollAreaElement.querySelector('.mantine-ScrollArea-viewport') as HTMLElement;
      }
      
      if (!viewport) {
        // 最后备选：查找scrollArea本身的第一个div子元素
        viewport = scrollAreaElement.querySelector('div') as HTMLElement;
      }
      
      if (!viewport) return;

      const { scrollLeft, scrollWidth, clientWidth } = viewport;
      const maxScrollLeft = scrollWidth - clientWidth;
      
      // 只有当内容宽度超过容器宽度时才启用水平滚动
      if (maxScrollLeft > 0) {
        e.preventDefault();
        e.stopPropagation();
        
        // 将垂直滚动转换为水平滚动，滚动速度可以调整
        const scrollAmount = e.deltaY * 0.5; // 降低滚动速度
        const newScrollLeft = Math.max(0, Math.min(maxScrollLeft, scrollLeft + scrollAmount));
        
        viewport.scrollLeft = newScrollLeft;
      }
    };

    scrollAreaElement.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      scrollAreaElement.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const handleTabClick = useCallback((tab: WindowTab) => {
    // 在切换到其他标签前，保存当前页面的滚动位置
    const currentActiveTab = tabs.find(t => t.isActive);
    if (currentActiveTab && currentActiveTab.id !== tab.id) {
      const scrollY = window.scrollY;
      dispatchTabAction({ 
        type: "UPDATE_SCROLL_POSITION", 
        payload: { tabId: currentActiveTab.id, scrollPosition: scrollY } 
      });
    }
    
    dispatchTabAction({ type: "ACTIVATE_TAB", payload: tab.id });
    navigate(tab.url);
    
    // 在导航完成后恢复目标标签的滚动位置
    setTimeout(() => {
      if (tab.scrollPosition !== undefined) {
        window.scrollTo(0, tab.scrollPosition);
      }
    }, 100); // 给页面一些时间加载
  }, [tabs, dispatchTabAction, navigate]);

  const handleTabClose = useCallback((e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    dispatchTabAction({ type: "REMOVE_TAB", payload: tabId });
  }, [dispatchTabAction]);

  const handleMoveLeft = useCallback((e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    const tabIndex = tabs.findIndex(tab => tab.id === tabId);
    if (tabIndex > 0) {
      dispatchTabAction({ 
        type: "MOVE_TAB", 
        payload: { fromIndex: tabIndex, toIndex: tabIndex - 1 } 
      });
    }
  }, [tabs, dispatchTabAction]);

  const handleMoveRight = useCallback((e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    const tabIndex = tabs.findIndex(tab => tab.id === tabId);
    if (tabIndex < tabs.length - 1) {
      dispatchTabAction({ 
        type: "MOVE_TAB", 
        payload: { fromIndex: tabIndex, toIndex: tabIndex + 1 } 
      });
    }
  }, [tabs, dispatchTabAction]);

  const handleAddCurrentPage = useCallback(() => {
    if (pageSlug) {
      const slugId = extractPageSlugId(pageSlug);
      
      // 获取页面数据和真实标题
      const getPageData = () => {
        // 首先尝试从浏览器标签页标题获取
        const browserTitle = document.title;
        console.log("浏览器标题:", browserTitle);
        
        if (browserTitle && browserTitle !== "Docmost") {
          // 移除常见的应用名称后缀
          let cleanTitle = browserTitle;
          
          cleanTitle = cleanTitle.trim();
          
          if (cleanTitle && cleanTitle.length > 0) {
            console.log("清理后的标题:", cleanTitle);
            return { title: cleanTitle };
          }
        }
        
        // 备选方案：尝试从页面缓存数据获取
        try {
          const pageData = queryClient.getQueryData(["page", slugId]) as IPage;
          if (pageData?.title) {
            console.log("从缓存获取标题:", pageData.title);
            return { title: pageData.title };
          }
        } catch (e) {
          console.log("缓存获取失败:", e);
        }
        
        // 最后备选：尝试从URL路径获取有意义的名称
        const pathParts = window.location.pathname.split('/');
        const lastPart = pathParts[pathParts.length - 1];
        if (lastPart && lastPart !== pageSlug) {
          // 如果URL最后一部分包含有意义的内容，使用它
          const decodedPart = decodeURIComponent(lastPart);
          console.log("从URL获取:", decodedPart);
          return { title: decodedPart };
        }
        
        console.log("使用默认标题");
        return { title: "未命名页面" };
      };

      const { title } = getPageData();
      const url = window.location.pathname;
      const currentScrollPosition = window.scrollY; // 获取当前滚动位置
      
      // 添加当前页面到标签栏，使用真实标题和当前滚动位置
      dispatchTabAction({
        type: "ADD_TAB",
        payload: {
          id: slugId || pageSlug,
          title: title,
          url,
          pageId: slugId,
          scrollPosition: currentScrollPosition // 保存当前滚动位置
        }
      });
    }
  }, [pageSlug, dispatchTabAction]);

  if (tabs.length === 0) {
    return (
      <Box className={classes.multiWindowContainer}>
        <Group gap={0} className={classes.tabsContainer}>
          <Box style={{ flex: 1 }} />
          <ActionIcon
            variant="subtle"
            size="sm"
            onClick={handleAddCurrentPage}
            className={classes.newTabButton}
            title={t("Add current page to tabs")}
          >
            <IconPlus size={14} />
          </ActionIcon>
        </Group>
      </Box>
    );
  }

  return (
    <Box className={classes.multiWindowContainer}>
      <Group gap={0} className={classes.tabsContainer}>
        <ScrollArea
          scrollbarSize={6}
          className={classes.scrollArea}
          viewportRef={scrollAreaRef}
          type="scroll"
          scrollHideDelay={500}
        >
          <Group gap={2} className={classes.tabsGroup} wrap="nowrap">
            {tabs.map((tab, index) => (
              <Box
                key={tab.id}
                className={`${classes.tab} ${tab.isActive ? classes.activeTab : ""}`}
                onClick={() => handleTabClick(tab)}
              >
                <Text 
                  size="xs" 
                  className={classes.tabText}
                  truncate
                  title={tab.title}
                >
                  {tab.title}
                </Text>
                <div className={classes.tabButtons}>
                  <ActionIcon
                    variant="transparent"
                    size="xs"
                    onClick={(e) => handleMoveLeft(e, tab.id)}
                    className={classes.tabButton}
                    title={t("Move left")}
                    disabled={index === 0}
                  >
                    <IconChevronLeft size={10} />
                  </ActionIcon>
                  <ActionIcon
                    variant="transparent"
                    size="xs"
                    onClick={(e) => handleMoveRight(e, tab.id)}
                    className={classes.tabButton}
                    title={t("Move right")}
                    disabled={index === tabs.length - 1}
                  >
                    <IconChevronRight size={10} />
                  </ActionIcon>
                  <ActionIcon
                    variant="transparent"
                    size="xs"
                    onClick={(e) => handleTabClose(e, tab.id)}
                    className={classes.closeButton}
                    title={t("Close tab")}
                  >
                    <IconX size={10} />
                  </ActionIcon>
                </div>
              </Box>
            ))}
          </Group>
        </ScrollArea>

        <ActionIcon
          variant="subtle"
          size="sm"
          onClick={handleAddCurrentPage}
          className={classes.newTabButton}
          title={t("Add current page to tabs")}
        >
          <IconPlus size={14} />
        </ActionIcon>
      </Group>
    </Box>
  );
}