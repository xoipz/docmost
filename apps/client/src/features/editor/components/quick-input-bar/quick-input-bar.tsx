import { ActionIcon, Menu } from "@mantine/core";
import { useAtom, useAtomValue } from "jotai";
import { pageEditorAtom } from "@/features/editor/atoms/editor-atoms";
import { useTranslation } from "react-i18next";
import classes from "./quick-input-bar.module.css";
import { atomWithStorage } from "jotai/utils";
import { sidebarWidthsAtom, asideStateAtom } from "@/components/layouts/global/hooks/atoms/sidebar-atom";
import { useEffect, useCallback, useMemo } from "react";
import { 
  IconFilter, 
  IconTable, 
  IconCode, 
  IconMath, 
  IconQuote, 
  IconCheckbox,
  IconH1,
  IconH2,
  IconH3,
  IconH4,
  IconH5,
} from "@tabler/icons-react";
import React from "react";

// 定义所有按钮
const buttons = [
  // 标题
  { label: "/", content: "/", category: "symbols" }, // 这个置顶
  { label: "H1", icon: IconH1, command: "toggleHeading", args: { level: 1 }, category: "headings" },
  { label: "H2", icon: IconH2, command: "toggleHeading", args: { level: 2 }, category: "headings" },
  { label: "H3", icon: IconH3, command: "toggleHeading", args: { level: 3 }, category: "headings" },
  { label: "H4", icon: IconH4, command: "toggleHeading", args: { level: 4 }, category: "headings" },
  { label: "H5", icon: IconH5, command: "toggleHeading", args: { level: 5 }, category: "headings" },
  // 块元素
  { label: "表格", icon: IconTable, command: "insertTable", args: { rows: 3, cols: 3 }, category: "blocks" },
  { label: "代码块", icon: IconCode, command: "toggleCodeBlock", category: "blocks" },
  { label: "公式块", icon: IconMath, command: "toggleMathBlock", category: "blocks" },
  { label: "引用块", icon: IconQuote, command: "toggleBlockquote", category: "blocks" },
  { label: "可选块", icon: IconCheckbox, command: "toggleTaskList", category: "blocks" },
  // 符号
  { label: ".", content: ".", category: "symbols" },
  { label: "()", content: ["(", ")"], category: "symbols" },
  { label: "[]", content: ["[", "]"], category: "symbols" },
  { label: "{}", content: ["{", "}"], category: "symbols" },
  { label: "''", content: ["'", "'"], category: "symbols" },
  { label: '""', content: ['"', '"'], category: "symbols" },
];

// 创建存储筛选状态的 atom
const quickInputFilterAtom = atomWithStorage("quickInputFilter", {
  headings: true,
  blocks: true,
  symbols: true,
});

export function QuickInputBar() {
  const { t } = useTranslation();
  const [editor] = useAtom(pageEditorAtom);
  const [filters, setFilters] = useAtom(quickInputFilterAtom);
  const sidebarWidths = useAtomValue(sidebarWidthsAtom);
  const [, setAsideState] = useAtom(asideStateAtom);
  const contentRef = React.useRef<HTMLDivElement>(null);

  // 更新 CSS 变量
  useEffect(() => {
    document.documentElement.style.setProperty('--aside-left-width', `${sidebarWidths.leftWidth}px`);
    document.documentElement.style.setProperty('--aside-right-width', `${sidebarWidths.rightWidth}px`);
  }, [sidebarWidths]);

  const handleInsert = useCallback((button: typeof buttons[0]) => {
    if (!editor) return;
    
    if (button.command) {
      // 使用命令直接插入
      editor.commands[button.command](button.args);
    } else if (Array.isArray(button.content)) {
      // 处理双符号
      const { state } = editor;
      const { selection } = state;
      const { from, to, empty } = selection;
      const [left, right] = button.content;

      if (empty) {
        editor.commands.insertContent(left + right);
        editor.commands.focus(from + left.length);
      } else {
        const selectedText = state.doc.textBetween(from, to);
        editor.commands.insertContent(left + selectedText + right);
      }
    } else {
      // 处理单符号
      editor.commands.insertContent(button.content);
    }

    // 如果点击的是评论按钮，打开评论侧边栏
    if (button.command === 'toggleComment') {
      setAsideState({ tab: 'comments', isAsideOpen: true });
    }
    
    editor?.chain().focus().run();
  }, [editor, setAsideState]);

  const filteredButtons = useMemo(() => 
    buttons.filter(button => filters[button.category])
  , [filters]);

  // 防止默认行为，避免编辑器失焦
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
  }, []);

  return (
    <div className={classes.quickInputBar}>
      <div className={classes.quickInputBarContent} ref={contentRef}>
        {filteredButtons.map((button, index) => (
          <ActionIcon
            key={index}
            variant="light"
            onMouseDown={handleMouseDown}
            onClick={() => handleInsert(button)}
            title={t(button.label)}
            className={classes.actionButton}
          >
            {button.icon ? <button.icon size={16} /> : button.label}
          </ActionIcon>
        ))}
      </div>
      
      <Menu position="top-end" width={200}>
        <Menu.Target>
          <ActionIcon variant="light" className={classes.actionButton} title={t("筛选")}>
            <IconFilter size={16} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>{t("显示分类")}</Menu.Label>
          <Menu.Item
            onClick={() => setFilters(prev => ({ ...prev, headings: !prev.headings }))}
            rightSection={filters.headings ? "✓" : ""}
          >
            {t("标题")}
          </Menu.Item>
          <Menu.Item
            onClick={() => setFilters(prev => ({ ...prev, blocks: !prev.blocks }))}
            rightSection={filters.blocks ? "✓" : ""}
          >
            {t("块元素")}
          </Menu.Item>
          <Menu.Item
            onClick={() => setFilters(prev => ({ ...prev, symbols: !prev.symbols }))}
            rightSection={filters.symbols ? "✓" : ""}
          >
            {t("符号")}
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </div>
  );
} 