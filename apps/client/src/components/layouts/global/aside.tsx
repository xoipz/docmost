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
  const [{ tab }, setAsideState] = useAtom(asideStateAtom);
  const [defaultOpenToc] = useAtom(defaultOpenTocAtom);
  const { t } = useTranslation();
  const pageEditor = useAtomValue(pageEditorAtom);

  useEffect(() => {
    if (defaultOpenToc && !tab) {
      setAsideState({ tab: "toc", isAsideOpen: true });
    }
  }, [defaultOpenToc, tab, setAsideState]);

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
