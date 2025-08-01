import { NodeViewContent, NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { ActionIcon, CopyButton, Group, Select, Tooltip } from "@mantine/core";
import { useEffect, useState, useRef } from "react";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import classes from "./code-block.module.css";
import React from "react";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { showNotification } from "@mantine/notifications";

const MermaidView = React.lazy(
  () => import("@/features/editor/components/code-block/mermaid-view.tsx"),
);

// **重要**: 将此选择器替换为你的 PageHeader 组件的实际 CSS 选择器
// 我们现在假设你给 PageHeader 添加了 'docmost-page-header-sticky-ref' 这个唯一的类名
const PAGE_HEADER_SELECTOR = '.docmost-page-header-sticky-ref'; 
const STICKY_OFFSET_FROM_HEADER_BOTTOM = 4; // 10px
const STICKY_HYSTERESIS = 8; // 滞后缓冲区，防止抖动

export default function CodeBlockView(props: NodeViewProps) {
  const { t } = useTranslation();
  const { node, updateAttributes, extension, editor, getPos } = props;
  const { language } = node.attrs;
  const [languageValue, setLanguageValue] = useState<string | null>(
    language || null,
  );
  const [isSelected, setIsSelected] = useState(false);

  const copyButtonContainerRef = useRef<HTMLDivElement>(null);
  const nodeViewWrapperRef = useRef<HTMLDivElement>(null); // Ref for the NodeViewWrapper
  const stickyStateRef = useRef<boolean>(false); // 跟踪当前吸顶状态

  useEffect(() => {
    const updateSelection = () => {
      const { state } = editor;
      const { from, to } = state.selection;
      // Check if the selection intersects with the node's range
      const isNodeSelected =
        (from >= getPos() && from < getPos() + node.nodeSize) ||
        (to > getPos() && to <= getPos() + node.nodeSize);
      setIsSelected(isNodeSelected);
    };

    editor.on("selectionUpdate", updateSelection);
    return () => {
      editor.off("selectionUpdate", updateSelection);
    };
  }, [editor, getPos(), node.nodeSize]);

  useEffect(() => {
    const copyButtonEl = copyButtonContainerRef.current;
    const codeBlockEl = nodeViewWrapperRef.current;

    if (!copyButtonEl || !codeBlockEl) return;

    let lastKnownButtonWidth = copyButtonEl.offsetWidth;

    const handleStickiness = () => {
      if (!copyButtonEl || !codeBlockEl) return;

      const pageHeaderEl = document.querySelector(PAGE_HEADER_SELECTOR);
      if (!pageHeaderEl) {
        // PageHeader 不存在，取消吸顶
        if (stickyStateRef.current) {
          stickyStateRef.current = false;
          copyButtonEl.classList.remove(classes.stickyActive);
          copyButtonEl.style.position = '';
          copyButtonEl.style.top = '';
          copyButtonEl.style.left = '';
          copyButtonEl.style.width = '';
        }
        return;
      }

      const pageHeaderRect = pageHeaderEl.getBoundingClientRect();
      const codeBlockRect = codeBlockEl.getBoundingClientRect();
      // 获取按钮当前的实际渲染宽度，如果它还未fixed，则为原始宽度
      const currentButtonWidth = copyButtonEl.offsetWidth || lastKnownButtonWidth;
      if(currentButtonWidth > 0 && !stickyStateRef.current) {
        lastKnownButtonWidth = currentButtonWidth;
      }

      const stickTriggerY = pageHeaderRect.bottom + STICKY_OFFSET_FROM_HEADER_BOTTOM;

      // 改进的吸顶条件判断，使用滞后机制防止抖动
      let shouldBeSticky;
      if (stickyStateRef.current) {
        // 如果已经是吸顶状态，使用更宽松的条件来保持吸顶
        shouldBeSticky = 
          codeBlockRect.top < stickTriggerY + STICKY_HYSTERESIS &&
          codeBlockRect.bottom > stickTriggerY + copyButtonEl.offsetHeight - STICKY_HYSTERESIS;
      } else {
        // 如果还不是吸顶状态，使用标准条件来触发吸顶
        shouldBeSticky = 
          codeBlockRect.top < stickTriggerY &&
          codeBlockRect.bottom > stickTriggerY + copyButtonEl.offsetHeight;
      }

      if (shouldBeSticky && !stickyStateRef.current) {
        stickyStateRef.current = true;
        copyButtonEl.classList.add(classes.stickyActive);
        copyButtonEl.style.width = `${lastKnownButtonWidth}px`; // 保持宽度
        copyButtonEl.style.position = 'fixed';
        copyButtonEl.style.top = `${stickTriggerY}px`;

        // 水平定位：尝试将按钮定位在代码块的右侧
        const menuGroupEl = copyButtonEl.parentElement; // .menuGroup
        if (menuGroupEl) {
            // 将按钮的右边缘（包括 margin）与代码块的右边缘对齐
            copyButtonEl.style.left = `${codeBlockRect.right - lastKnownButtonWidth - 4}px`;
        } else {
            // 如果没有 menuGroup，则默认行为或需要其他定位策略
            copyButtonEl.style.left = `${codeBlockRect.left}px`; // 应急定位
        }
      } else if (!shouldBeSticky && stickyStateRef.current) {
        stickyStateRef.current = false;
        copyButtonEl.classList.remove(classes.stickyActive);
        copyButtonEl.style.position = '';
        copyButtonEl.style.top = '';
        copyButtonEl.style.left = '';
        copyButtonEl.style.width = '';
      }
    };

    // 使用 ResizeObserver 监听 PageHeader 和 CodeBlock 的大小变化
    let resizeObserver: ResizeObserver | null = null;
    const observedElements: Element[] = [];
    const pageHeaderForObserver = document.querySelector(PAGE_HEADER_SELECTOR);
    if (pageHeaderForObserver) observedElements.push(pageHeaderForObserver);
    if (codeBlockEl) observedElements.push(codeBlockEl);

    if (observedElements.length > 0) {
      resizeObserver = new ResizeObserver(handleStickiness);
      observedElements.forEach(el => resizeObserver!.observe(el));
    }

    window.addEventListener('scroll', handleStickiness, { passive: true });
    window.addEventListener('resize', handleStickiness, { passive: true }); // 窗口大小变化也应触发
    handleStickiness(); // 初始检查

    return () => {
      window.removeEventListener('scroll', handleStickiness);
      window.removeEventListener('resize', handleStickiness);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      // 清理样式和状态
      if (copyButtonEl && stickyStateRef.current) {
        stickyStateRef.current = false;
        copyButtonEl.classList.remove(classes.stickyActive);
        copyButtonEl.style.position = '';
        copyButtonEl.style.top = '';
        copyButtonEl.style.left = '';
        copyButtonEl.style.width = '';
      }
    };
  }, [editor.isEditable, language]); // editor.isEditable 和 language 变化时重新设置

  function changeLanguage(language: string) {
    setLanguageValue(language);
    updateAttributes({
      language: language,
    });
  }

  const handleCopy = async () => {
    try {
      const text = node?.textContent || '';
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      showNotification({
        title: t("Success"),
        message: t("Code copied to clipboard"),
        color: "green",
        autoClose: 2000,
      });
    } catch (err) {
      showNotification({
        title: t("Error"),
        message: t("Failed to copy code"),
        color: "red",
        autoClose: 2000,
      });
    }
  };

  // 处理代码块内部复制事件，强制使用纯文本复制
  const handleInternalCopy = (event: React.ClipboardEvent<HTMLPreElement>) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const selectedText = selection.toString();
      if (selectedText && event.clipboardData) {
        event.preventDefault();
        // 只设置纯文本到剪贴板
        event.clipboardData.setData('text/plain', selectedText);
        // 清除HTML格式数据
        event.clipboardData.setData('text/html', '');
      }
    }
  };

  return (
    <NodeViewWrapper className="codeBlock" ref={nodeViewWrapperRef}>
      <Group
        justify="flex-end"
        contentEditable={false}
        className={classes.menuGroup}
      >
        <Select
          placeholder="auto"
          checkIconPosition="right"
          data={extension.options.lowlight.listLanguages().sort()}
          value={languageValue}
          onChange={changeLanguage}
          searchable
          style={{ maxWidth: "130px" }}
          classNames={{ input: classes.selectInput }}
          disabled={!editor.isEditable}
        />

        <div className={classes.copyButtonContainer} ref={copyButtonContainerRef}>
          <Tooltip label={t("Copy")} withArrow position="right">
            <ActionIcon
              color="gray"
              variant="subtle"
              onClick={handleCopy}
            >
              <IconCopy size={16} />
            </ActionIcon>
          </Tooltip>
        </div>
      </Group>

      <pre
        spellCheck="false"
        onCopy={handleInternalCopy}
        hidden={
          ((language === "mermaid" && !editor.isEditable) ||
            (language === "mermaid" && !isSelected)) &&
          node.textContent.length > 0
        }
      >
        <NodeViewContent as="code" className={`language-${language}`} />
      </pre>

      {language === "mermaid" && (
        <Suspense fallback={null}>
          <MermaidView props={props} />
        </Suspense>
      )}
    </NodeViewWrapper>
  );
}
