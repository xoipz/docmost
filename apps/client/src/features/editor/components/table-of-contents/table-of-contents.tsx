import { NodePos, useEditor } from "@tiptap/react";
import { TextSelection } from "@tiptap/pm/state";
import React, { FC, useEffect, useRef, useState } from "react";
import classes from "./table-of-contents.module.css";
import "../../../../assets/outside.css";
import clsx from "clsx";
import { Box, Text, Group, Button } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { IconChevronDown, IconChevronRight, IconChevronsDown, IconChevronsUp } from "@tabler/icons-react";

type TableOfContentsProps = {
  editor: ReturnType<typeof useEditor>;
  isShare?: boolean;
};

export type HeadingLink = {
  label: string;
  level: number;
  element: HTMLElement;
  position: number;
  id: string;
  parentId: string | null;
};

const recalculateLinks = (editor: ReturnType<typeof useEditor> | null, nodePos: NodePos[] | undefined) => {
  if (!editor || !editor.view || !nodePos) {
    return { links: [], nodes: [] };
  }

  const nodes: HTMLElement[] = [];
  let idCounter = 0;
  const links: HeadingLink[] = [];
  const parentStack: { id: string; level: number }[] = [];

  Array.from(nodePos).forEach((item) => {
    if (!editor || !editor.view) {
      console.warn("Editor or view became invalid during recalculateLinks iteration");
      return;
    }

    if (!item || !item.node || typeof item.pos !== 'number' || !item.element) {
      console.warn("Invalid NodePos item or essential properties are missing", item);
      return;
    }

    const label = item.node.textContent;
    const level = Number(item.node.attrs.level);
    if (label.length && level <= 5) {
      const id = `heading-${idCounter++}`;
      
      while (parentStack.length > 0 && parentStack[parentStack.length - 1].level >= level) {
        parentStack.pop();
      }
      
      const parentId = parentStack.length > 0 ? parentStack[parentStack.length - 1].id : null;
      
      links.push({
        label,
        level,
        element: item.element,
        position: item.pos,
        id,
        parentId,
      });
      
      parentStack.push({ id, level });
      nodes.push(item.element);
    }
  });

  return { links, nodes };
};

export const TableOfContents: FC<TableOfContentsProps> = (props) => {
  const { t } = useTranslation();
  const [links, setLinks] = useState<HeadingLink[]>([]);
  const [headingDOMNodes, setHeadingDOMNodes] = useState<HTMLElement[]>([]);
  const [activeElement, setActiveElement] = useState<HTMLElement | null>(null);
  const [expandedHeadings, setExpandedHeadings] = useState<Set<string>>(new Set());
  const headerPaddingRef = useRef<HTMLDivElement | null>(null);

  const expandAll = () => {
    const allIds = links.map(link => link.id);
    setExpandedHeadings(new Set(allIds));
  };

  const collapseAll = () => {
    setExpandedHeadings(new Set());
  };

  const handleScrollToHeading = (position: number) => {
    const { view } = props.editor;

    if (!view) return;
    
    let headerOffset = 50;
    if (headerPaddingRef.current) {
      try {
        const computedStyle = window.getComputedStyle(headerPaddingRef.current);
        const topValue = computedStyle.getPropertyValue("top");
        // 如果top值为0或不存在，则表示header可能不可见
        if (topValue && topValue !== "0px") {
          headerOffset = parseInt(topValue);
        }
      } catch (error) {
        console.error("Error getting header offset:", error);
      }
    }

    try {
      const domAtPosResult = view.domAtPos(position);
      if (!domAtPosResult || !domAtPosResult.node) return;
      
      const { node } = domAtPosResult;
      const element = node as HTMLElement;
      const scrollPosition =
        element.getBoundingClientRect().top + window.scrollY - headerOffset;

      window.scrollTo({
        top: scrollPosition,
        behavior: "smooth",
      });

      const tr = view.state.tr;
      tr.setSelection(new TextSelection(tr.doc.resolve(position)));
      view.dispatch(tr);
      view.focus();
    } catch (error) {
      console.error("Error in scrollToHeading:", error);
    }
  };

  const toggleHeading = (id: string) => {
    setExpandedHeadings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleUpdate = () => {
    if (!props.editor) {
      setLinks([]);
      setHeadingDOMNodes([]);
      return;
    }
    const result = recalculateLinks(props.editor, props.editor.$nodes("heading"));
    setLinks(result.links);
    setHeadingDOMNodes(result.nodes);
  };

  useEffect(() => {
    if (!props.editor) return;
    
    // 初始化headerPadding元素，确保它准备好用于计算滚动位置
    if (headerPaddingRef.current) {
      headerPaddingRef.current.style.display = 'block';
      headerPaddingRef.current.style.height = '0';
      headerPaddingRef.current.style.visibility = 'hidden';
    }
    
    props.editor.on("update", handleUpdate);

    return () => {
      props.editor?.off("update", handleUpdate);
    };
  }, [props.editor]);

  useEffect(
    () => {
      handleUpdate();
    },
    props.isShare ? [props.editor] : [],
  );

  useEffect(() => {
    try {
      const observeHandler = (entries: IntersectionObserverEntry[]) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveElement(entry.target as HTMLElement);
          }
        });
      };

      let headerOffset = 0;
      if (headerPaddingRef.current) {
        const computedStyle = window.getComputedStyle(headerPaddingRef.current);
        const topValue = computedStyle.getPropertyValue("top");
        // 如果top值为0或不存在，则表示header可能不可见
        if (topValue && topValue !== "0px") {
          headerOffset = parseInt(topValue);
        }
      }
      const observerOptions: IntersectionObserverInit = {
        rootMargin: `-${headerOffset}px 0px -85% 0px`,
        threshold: 0,
        root: null,
      };
      const observer = new IntersectionObserver(
        observeHandler,
        observerOptions,
      );

      headingDOMNodes.forEach((heading) => {
        observer.observe(heading);
      });
      return () => {
        headingDOMNodes.forEach((heading) => {
          observer.unobserve(heading);
        });
      };
    } catch (err) {
      console.log(err);
    }
  }, [headingDOMNodes, props.editor]);

  const renderHeading = (item: HeadingLink, index: number) => {
    const isExpanded = expandedHeadings.has(item.id);
    const children = links.filter(child => child.parentId === item.id);
    const hasChildren = children.length > 0;
    
    return (
      <div key={item.id}>
        <Box<"button">
          component="button"
          onClick={() => {
            handleScrollToHeading(item.position);
            if (hasChildren && !isExpanded) {
              toggleHeading(item.id);
            }
          }}
          className={clsx(classes.link, {
            [classes.linkActive]: item.element === activeElement,
          })}
          style={{
            paddingLeft: `var(--mantine-spacing-md))`,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            width: '100%',
          }}
        >
          {hasChildren && (
            <Box
              component="span"
              onClick={(e) => {
                e.stopPropagation();
                toggleHeading(item.id);
              }}
              style={{ 
                display: 'flex',
                alignItems: 'center',
                color: 'var(--mantine-color-text)',
                cursor: 'pointer'
              }}
            >
              {isExpanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
            </Box>
          )}
          {!hasChildren && <Box w={16} />}
          <Box component="span" style={{ opacity: 0.6, fontSize: '0.8em' }}>
            H{item.level}
          </Box>
          <Box component="span" style={{ flex: 1 }}>
            {item.label}
          </Box>
        </Box>
        {hasChildren && isExpanded && (
          <div style={{ marginLeft: 16 }}>
            {children.map((child) => renderHeading(child, links.indexOf(child)))}
          </div>
        )}
      </div>
    );
  };

  if (!links.length) {
    return (
      <>
        {!props.isShare && (
          <Text size="sm">
            {t("Add headings (H1, H2, H3) to generate a table of contents.")}
          </Text>
        )}

        {props.isShare && (
          <Text size="sm" c="dimmed">
            {t("No table of contents.")}
          </Text>
        )}
      </>
    );
  }

  return (
    <>
      {props.isShare && (
        <Text mb="md" fw={500}>
          {t("Table of contents")}
        </Text>
      )}
      <Group gap={4}>
        <Button
          variant="transparent"
          size="xs"
          color="gray"
          leftSection={<IconChevronsDown size={12} />}
          onClick={expandAll}
          px={8}
          styles={{
            root: {
              '&:hover': {
                backgroundColor: '#2e2e2e',
              },
            },
          }}
        >
          {t("展开全部")}
        </Button>
        <Button
          variant="transparent"
          size="xs"
          color="gray"
          leftSection={<IconChevronsUp size={12} />}
          onClick={collapseAll}
          px={8}
          styles={{
            root: {
              '&:hover': {
                backgroundColor: '#2e2e2e',
              },
            },
          }}
        >
          {t("收起全部")}
        </Button>
      </Group>
      <div className={props.isShare ? classes.leftBorder : ""}>
        {links
          .filter(item => item.parentId === null)
          .map((item) => renderHeading(item, links.indexOf(item)))}
      </div>
      <div ref={headerPaddingRef} className={classes.headerPadding} />
    </>
  );
};
