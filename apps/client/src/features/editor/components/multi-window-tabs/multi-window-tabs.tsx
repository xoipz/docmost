import React, { useCallback, useRef, useEffect, useState } from "react";
import { ActionIcon, Group, Text, ScrollArea, Box } from "@mantine/core";
import { useAtom, useAtomValue } from "jotai";
import { 
  IconX,
  IconPlus
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

// TAG:Bottom - 底部多窗口栏
export function MultiWindowTabs() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pageSlug } = useParams();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const tabs = useAtomValue(multiWindowTabsAtom);
  const [, dispatchTabAction] = useAtom(tabActionsAtom);
  const bottomToolbar = useAtomValue(globalBottomToolbarAtom);

  // 简化的拖拽状态管理
  const [dragState, setDragState] = useState({
    draggedTabId: null as string | null,
    dragOverTabId: null as string | null,
    insertIndex: -1, // 要插入的位置索引
    isDragging: false,
    isReady: false // 是否准备拖拽（长按后）
  });
  
  // 鼠标/触摸事件状态
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [touchState, setTouchState] = useState({
    startPos: null as {x: number, y: number} | null,
    dragElement: null as HTMLElement | null,
    dragOffset: {x: 0, y: 0}
  });

  // 动态设置CSS变量来计算多窗口标签栏位置
  useEffect(() => {
    // 简化逻辑：直接根据全局设置状态来决定高度
    const quickInputBarHeight = bottomToolbar.showQuickInputBar ? "48px" : "0px";
    document.documentElement.style.setProperty("--quick-input-bar-height", quickInputBarHeight);
  }, [bottomToolbar.showQuickInputBar]);

  // 监听页面路由变化，同步标签页激活状态
  useEffect(() => {
    const currentUrl = window.location.pathname;
    const matchingTab = tabs.find(tab => tab.url === currentUrl);
    
    if (matchingTab && !matchingTab.isActive) {
      // 找到匹配的标签页但不是激活状态，激活它
      dispatchTabAction({ type: "ACTIVATE_TAB", payload: matchingTab.id });
    } else if (!matchingTab && tabs.some(tab => tab.isActive)) {
      // 当前页面不在标签页中，取消所有标签页的激活状态
      dispatchTabAction({ 
        type: "ACTIVATE_TAB", 
        payload: null // 取消激活所有标签页
      });
    }
  }, [pageSlug, tabs, dispatchTabAction]);

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
    // 如果正在拖拽，阻止点击
    if (dragState.isDragging || dragState.isReady) {
      return;
    }
    
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
    }, 100);
  }, [tabs, dispatchTabAction, navigate, dragState]);

  const handleTabClose = useCallback((e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    dispatchTabAction({ type: "REMOVE_TAB", payload: tabId });
  }, [dispatchTabAction]);

  // 清理拖拽状态
  const clearDragState = useCallback(() => {
    setDragState({
      draggedTabId: null,
      dragOverTabId: null,
      insertIndex: -1,
      isDragging: false,
      isReady: false
    });
    setTouchState({
      startPos: null,
      dragElement: null,
      dragOffset: {x: 0, y: 0}
    });
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
    document.body.style.overflow = '';
  }, [pressTimer]);

  // 计算插入位置
  const calculateInsertIndex = useCallback((clientX: number, clientY: number) => {
    const tabElements = Array.from(document.querySelectorAll('[data-tab-id]'));
    
    for (let i = 0; i < tabElements.length; i++) {
      const element = tabElements[i] as HTMLElement;
      const rect = element.getBoundingClientRect();
      const tabId = element.getAttribute('data-tab-id');
      
      if (tabId === dragState.draggedTabId) continue; // 跳过被拖拽的标签
      
      if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
        const centerX = rect.left + rect.width / 2;
        const tabIndex = tabs.findIndex(tab => tab.id === tabId);
        return clientX < centerX ? tabIndex : tabIndex + 1;
      }
    }
    
    return tabs.length; // 拖拽到最后
  }, [dragState.draggedTabId, tabs]);

  // 统一的按下处理（鼠标和触摸）
  const handlePressStart = useCallback((e: React.MouseEvent | React.TouchEvent, tabId: string) => {
    if (dragState.isDragging) return;
    
    // 鼠标事件：只处理左键
    if ('button' in e && e.button !== 0) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const isTouch = 'touches' in e;
    
    if (isTouch) {
      const rect = e.currentTarget.getBoundingClientRect();
      setTouchState({
        startPos: { x: clientX, y: clientY },
        dragElement: e.currentTarget as HTMLElement,
        dragOffset: {
          x: clientX - rect.left,
          y: clientY - rect.top
        }
      });
    }
    
    // 设置长按定时器
    const timer = setTimeout(() => {
      setDragState(prev => ({ ...prev, isReady: true, draggedTabId: tabId }));
    }, isTouch ? 0 : 400); // 触摸立即开始，鼠标400ms后
    
    setPressTimer(timer);
  }, [dragState.isDragging]);

  // 统一的移动处理
  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!dragState.isReady || !dragState.draggedTabId) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const isTouch = 'touches' in e;
    
    // 检查是否开始拖拽
    if (!dragState.isDragging) {
      if (isTouch && touchState.startPos) {
        // 触摸端：检查移动距离
        const deltaX = clientX - touchState.startPos.x;
        const deltaY = clientY - touchState.startPos.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance > 10) {
          setDragState(prev => ({ ...prev, isDragging: true }));
          document.body.style.overflow = 'hidden';
          e.preventDefault();
        }
      } else if (!isTouch) {
        // 桌面端：长按后任何移动都开始拖拽
        setDragState(prev => ({ ...prev, isDragging: true }));
        e.preventDefault();
      }
    }
    
    if (dragState.isDragging) {
      e.preventDefault();
      
      // 处理触摸拖拽视觉效果
      if (isTouch && touchState.dragElement && touchState.startPos) {
        const deltaX = clientX - touchState.startPos.x;
        const deltaY = clientY - touchState.startPos.y;
        touchState.dragElement.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(1deg) scale(1.02)`;
        touchState.dragElement.style.zIndex = '1000';
        touchState.dragElement.style.opacity = '0.8';
      }
      
      // 计算插入位置
      const insertIndex = calculateInsertIndex(clientX, clientY);
      setDragState(prev => ({ ...prev, insertIndex }));
    }
  }, [dragState, touchState, calculateInsertIndex]);

  // 统一的释放处理
  const handlePressEnd = useCallback(() => {
    const wasDragging = dragState.isDragging;
    
    if (dragState.isDragging && dragState.draggedTabId && dragState.insertIndex !== -1) {
      const draggedIndex = tabs.findIndex(tab => tab.id === dragState.draggedTabId);
      let targetIndex = dragState.insertIndex;
      
      // 调整插入位置
      if (draggedIndex < targetIndex) {
        targetIndex -= 1;
      }
      
      if (draggedIndex !== targetIndex && targetIndex >= 0) {
        dispatchTabAction({
          type: "MOVE_TAB",
          payload: { fromIndex: draggedIndex, toIndex: targetIndex }
        });
      }
    }
    
    // 恢复触摸拖拽元素样式
    if (touchState.dragElement) {
      touchState.dragElement.style.transform = '';
      touchState.dragElement.style.zIndex = '';
      touchState.dragElement.style.opacity = '';
    }
    
    clearDragState();
    
    // 如果刚刚完成了拖拽，暂时阻止点击事件
    if (wasDragging) {
      setTimeout(() => {
        // 可以在这里做一些额外的清理工作
      }, 50);
    }
  }, [dragState, tabs, touchState, dispatchTabAction, clearDragState]);

  // 清理计时器和全局事件监听
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (dragState.isReady && dragState.draggedTabId && !dragState.isDragging) {
        // 桌面端：长按后任何移动都开始拖拽
        setDragState(prev => ({ ...prev, isDragging: true }));
        e.preventDefault();
      }
      
      if (dragState.isDragging) {
        e.preventDefault();
        // 计算插入位置
        const insertIndex = calculateInsertIndex(e.clientX, e.clientY);
        setDragState(prev => ({ ...prev, insertIndex }));
      }
    };
    
    const handleGlobalEnd = () => clearDragState();
    const handleVisibilityChange = () => {
      if (document.hidden) clearDragState();
    };

    if (dragState.isReady || dragState.isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
    }
    
    document.addEventListener('mouseup', handleGlobalEnd);
    document.addEventListener('touchend', handleGlobalEnd);
    document.addEventListener('touchcancel', handleGlobalEnd);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalEnd);
      document.removeEventListener('touchend', handleGlobalEnd);
      document.removeEventListener('touchcancel', handleGlobalEnd);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [dragState.isReady, dragState.isDragging, dragState.draggedTabId, calculateInsertIndex, clearDragState]);

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
            {tabs.map((tab, index) => {
              // 计算是否需要显示插入指示器
              const showIndicatorBefore = dragState.isDragging && dragState.insertIndex === index;
              const showIndicatorAfter = dragState.isDragging && dragState.insertIndex === index + 1;
              
              // 计算标签页样式
              const isDraggedTab = dragState.draggedTabId === tab.id;
              const isShifting = dragState.isDragging && !isDraggedTab;
              
              return (
                <React.Fragment key={tab.id}>
                  {/* 插入位置指示器 - 前 */}
                  {showIndicatorBefore && (
                    <div className={classes.dragIndicator} />
                  )}
                  
                  <Box
                    data-tab-id={tab.id}
                    className={`${classes.tab} ${tab.isActive ? classes.activeTab : ""} ${
                      isDraggedTab && dragState.isDragging ? classes.dragging : ""
                    } ${isShifting ? classes.shifting : ""}`}
                    onClick={() => handleTabClick(tab)}
                    onMouseDown={(e) => handlePressStart(e, tab.id)}
                    onMouseUp={handlePressEnd}
                    onMouseLeave={handlePressEnd}
                    onTouchStart={(e) => handlePressStart(e, tab.id)}
                    onTouchMove={handleMove}
                    onTouchEnd={handlePressEnd}
                    style={{
                      opacity: isDraggedTab && dragState.isDragging ? 0.3 : 1,
                      pointerEvents: isDraggedTab && dragState.isDragging ? 'none' : 'auto'
                    }}
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
                        onClick={(e) => handleTabClose(e, tab.id)}
                        className={classes.closeButton}
                        title={t("Close tab")}
                      >
                        <IconX size={10} />
                      </ActionIcon>
                    </div>
                  </Box>
                  
                  {/* 插入位置指示器 - 后 */}
                  {showIndicatorAfter && (
                    <div className={classes.dragIndicator} />
                  )}
                </React.Fragment>
              );
            })}
            
            {/* 末尾插入指示器 */}
            {dragState.isDragging && dragState.insertIndex === tabs.length && (
              <div className={classes.dragIndicator} />
            )}
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