import { AppShell, Container } from "@mantine/core";
import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import SettingsSidebar from "@/components/settings/settings-sidebar.tsx";
import { useAtom } from "jotai";
import {
  asideStateAtom,
  desktopSidebarAtom,
  headerVisibleAtom,
  mobileSidebarAtom,
  sidebarWidthAtom,
} from "@/components/layouts/global/hooks/atoms/sidebar-atom.ts";
import { SpaceSidebar } from "@/features/space/components/sidebar/space-sidebar.tsx";
import { AppHeader } from "@/components/layouts/global/app-header.tsx";
import Aside from "@/components/layouts/global/aside.tsx";
import classes from "./app-shell.module.css";
import { useTrialEndAction } from "@/ee/hooks/use-trial-end-action.tsx";

export default function GlobalAppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  useTrialEndAction();
  const [mobileOpened, setMobileOpened] = useAtom(mobileSidebarAtom);
  const [desktopOpened] = useAtom(desktopSidebarAtom);
  const [{ isAsideOpen }, setAsideState] = useAtom(asideStateAtom);
  const [sidebarWidth, setSidebarWidth] = useAtom(sidebarWidthAtom);
  const [headerVisible] = useAtom(headerVisibleAtom);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLElement | null>(null);

  // 处理侧边栏点击外部关闭
  const handleClickOutsideSidebar = () => {
    if (mobileOpened && window.innerWidth < 768) {
      setMobileOpened(false);
    }
  };

  // 处理右侧栏点击外部关闭
  const handleClickOutsideAside = () => {
    if (isAsideOpen && window.innerWidth < 768) {
      setAsideState(prev => ({ ...prev, isAsideOpen: false }));
    }
  };

  const startResizing = React.useCallback((mouseDownEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = React.useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = React.useCallback(
    (mouseMoveEvent) => {
      if (isResizing) {
        const newWidth =
          mouseMoveEvent.clientX -
          sidebarRef.current?.getBoundingClientRect().left;
        if (newWidth < 220) {
          setSidebarWidth(220);
          return;
        }
        if (newWidth > 600) {
          setSidebarWidth(600);
          return;
        }
        setSidebarWidth(newWidth);
      }
    },
    [isResizing],
  );

  useEffect(() => {
    //https://codesandbox.io/p/sandbox/kz9de
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  // 为移动设备添加点击外部关闭事件处理
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // 处理侧边栏
      if (mobileOpened && window.innerWidth < 768) {
        const navbarElement = document.querySelector(`.${classes.navbar}`);
        if (navbarElement && !navbarElement.contains(event.target as Node) && 
            !target.closest('.burger-button')) { // 确保不是点击的汉堡按钮
          setMobileOpened(false);
        }
      }
      
      // 处理右侧栏
      if (isAsideOpen && window.innerWidth < 768) {
        const asideElement = document.querySelector(`.${classes.aside}`);
        if (asideElement && !asideElement.contains(event.target as Node) &&
            !target.closest('.aside-toggle-button')) { // 确保不是点击的侧边栏切换按钮
          setAsideState(prev => ({ ...prev, isAsideOpen: false }));
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mobileOpened, isAsideOpen, setMobileOpened, setAsideState]);

  const location = useLocation();
  const isSettingsRoute = location.pathname.startsWith("/settings");
  const isSpaceRoute = location.pathname.startsWith("/s/");
  const isHomeRoute = location.pathname.startsWith("/home");
  const isPageRoute = location.pathname.includes("/p/");

  return (
    <AppShell
      header={headerVisible ? { height: 45 } : undefined}
      navbar={
        !isHomeRoute && {
          width: isSpaceRoute ? sidebarWidth : 300,
          breakpoint: "sm",
          collapsed: {
            mobile: !mobileOpened,
            desktop: !desktopOpened,
          },
        }
      }
      aside={
        isPageRoute && {
          width: 350,
          breakpoint: "sm",
          collapsed: { mobile: !isAsideOpen, desktop: !isAsideOpen },
        }
      }
      padding="md"
    >
      {headerVisible && (
        <AppShell.Header className={classes.header}>
          <AppHeader />
        </AppShell.Header>
      )}
      {!isHomeRoute && (
        <AppShell.Navbar
          className={classes.navbar}
          withBorder={false}
          ref={sidebarRef}
        >
          <div className={classes.resizeHandle} onMouseDown={startResizing} />
          {isSpaceRoute && <SpaceSidebar />}
          {isSettingsRoute && <SettingsSidebar />}
        </AppShell.Navbar>
      )}
      <AppShell.Main>
        {isSettingsRoute ? (
          <Container size={800}>{children}</Container>
        ) : (
          children
        )}
      </AppShell.Main>

      {isPageRoute && (
        <AppShell.Aside 
          className={classes.aside} 
          p="md" 
          withBorder={false}
        >
          <Aside />
        </AppShell.Aside>
      )}
    </AppShell>
  );
}
