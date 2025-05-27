import { Box, ScrollArea, Text } from "@mantine/core";
import CommentList from "@/features/comment/components/comment-list.tsx";
import { useAtom } from "jotai";
import { asideStateAtom, defaultOpenTocAtom } from "@/components/layouts/global/hooks/atoms/sidebar-atom.ts";
import React, { ReactNode, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { TableOfContents } from "@/features/editor/components/table-of-contents/table-of-contents.tsx";
import { useAtomValue } from "jotai";
import { pageEditorAtom } from "@/features/editor/atoms/editor-atoms.ts";

export default function Aside() {
  const [{ tab, isAsideOpen }, setAsideState] = useAtom(asideStateAtom);
  const [defaultOpenToc] = useAtom(defaultOpenTocAtom);
  const { t } = useTranslation();
  const pageEditor = useAtomValue(pageEditorAtom);

  useEffect(() => {
    // 检查是否是移动设备，移动设备上不默认打开目录
    const isMobileDevice = window.innerWidth < 768;
    
    // 只在非移动设备上自动打开默认TOC
    if (defaultOpenToc && !tab && !isMobileDevice) {
      setAsideState({ tab: "toc", isAsideOpen: true });
    }
  }, [defaultOpenToc, tab, setAsideState]);

  // 添加窗口大小改变的监听，确保响应式处理
  useEffect(() => {
    const handleResize = () => {
      // 如果是移动设备且TOC是打开的，关闭它
      if (window.innerWidth < 768 && tab === "toc" && isAsideOpen) {
        setAsideState({ tab, isAsideOpen: false });
      }
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [tab, isAsideOpen, setAsideState]);

  let title: string;
  let component: ReactNode;

  switch (tab) {
    case "comments":
      component = <CommentList />;
      title = "Comments";
      break;
    case "toc":
      component = <TableOfContents editor={pageEditor} />;
      title = "Table of contents";
      break;
    default:
      component = null;
      title = null;
  }

  return (
    <Box p="md">
      {component && (
        <>
          <Text mb="md" fw={500}>
            {t(title)}
          </Text>

          <ScrollArea
            style={{ height: "85vh" }}
            scrollbarSize={5}
            type="scroll"
          >
            <div style={{ paddingBottom: "200px" }}>{component}</div>
          </ScrollArea>
        </>
      )}
    </Box>
  );
}
