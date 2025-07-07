import { ActionIcon } from "@mantine/core";
import { useAtom } from "jotai";
import { pageEditorAtom } from "@/features/editor/atoms/editor-atoms";
import { useTranslation } from "react-i18next";
import classes from "./quick-input-bar.module.css";
import { atomWithStorage } from "jotai/utils";
import { asideStateAtom } from "@/components/layouts/global/hooks/atoms/sidebar-atom";
import { useCallback, useMemo } from "react";
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
  IconClipboard,
  IconBulb,
} from "@tabler/icons-react";
import React from "react";

// TAG:底部快速输入栏
// 定义所有按钮
const buttons = [
  // 基础功能区 - 始终显示
  { label: "/", content: "/", category: "base", priority: 1 },
  { label: "粘贴", icon: IconClipboard, command: "paste", category: "base", priority: 2 },
  { label: "智能选词", icon: IconBulb, command: "smartSelection", category: "base", priority: 3 },
  // 标题
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

// 定义筛选模式
const filterModes = [
  { name: "全部", key: "all", icon: IconFilter },
  { name: "标题", key: "headings", icon: IconH1 },
  { name: "块元素", key: "blocks", icon: IconTable },
  { name: "符号", key: "symbols", icon: IconCode },
];

// 筛选模式状态
const filterModeAtom = atomWithStorage("quickInputFilterMode", 0);

export function QuickInputBar() {
  const { t } = useTranslation();
  const [editor] = useAtom(pageEditorAtom);
  const [filterMode, setFilterMode] = useAtom(filterModeAtom);
  const [, setAsideState] = useAtom(asideStateAtom);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const handleInsert = useCallback((button: typeof buttons[0]) => {
    if (!editor) return;
    
    if (button.command === "paste") {
      // 处理粘贴功能
      if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText().then(text => {
          if (text) {
            editor.commands.insertContent(text);
          }
        }).catch(() => {
          // 如果剪贴板访问失败，使用 execCommand 作为后备
          try {
            document.execCommand('paste');
          } catch (e) {
            console.warn('粘贴失败:', e);
          }
        });
      } else {
        // 如果不支持 clipboard API，直接使用 execCommand
        try {
          document.execCommand('paste');
        } catch (e) {
          console.warn('粘贴失败，浏览器不支持:', e);
        }
      }
    } else if (button.command === "smartSelection") {
      // 智能选词功能
      const { state } = editor;
      const { selection } = state;
      const { from, to } = selection;
      
      if (from === to) {
        // 如果没有选择文本，选择当前单词
        const doc = state.doc;
        const $pos = doc.resolve(from);
        const text = $pos.parent.textContent;
        const start = $pos.parentOffset;
        
        // 找到单词边界
        let wordStart = start;
        let wordEnd = start;
        
        // 向前找单词开始
        while (wordStart > 0 && /\w/.test(text[wordStart - 1])) {
          wordStart--;
        }
        
        // 向后找单词结束
        while (wordEnd < text.length && /\w/.test(text[wordEnd])) {
          wordEnd++;
        }
        
        // 如果找到了单词，选择它
        if (wordStart < wordEnd) {
          const startPos = from - start + wordStart;
          const endPos = from - start + wordEnd;
          editor.commands.setTextSelection({ from: startPos, to: endPos });
        }
      } else {
        // 如果已经选择了文本，扩展选择到整行
        const doc = state.doc;
        const $from = doc.resolve(from);
        const $to = doc.resolve(to);
        
        // 选择整行
        const lineStart = $from.start($from.depth);
        const lineEnd = $to.end($to.depth);
        editor.commands.setTextSelection({ from: lineStart, to: lineEnd });
      }
    } else if (button.command) {
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

  const filteredButtons = useMemo(() => {
    const currentMode = filterModes[filterMode];
    
    // 基础功能始终显示
    const baseButtons = buttons.filter(button => button.category === 'base');
    
    if (currentMode.key === 'all') {
      return buttons;
    } else {
      return [...baseButtons, ...buttons.filter(button => button.category === currentMode.key)];
    }
  }, [filterMode]);

  // 轮换筛选模式
  const handleFilterToggle = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setFilterMode(prev => (prev + 1) % filterModes.length);
  }, [setFilterMode]);

  // 防止默认行为，避免编辑器失焦
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
  }, []);

  const currentFilterMode = filterModes[filterMode];

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
      
      <ActionIcon 
        variant="light" 
        className={classes.actionButton} 
        title={`${t("筛选")}: ${currentFilterMode.name}`}
        onMouseDown={handleMouseDown}
        onClick={handleFilterToggle}
      >
        <currentFilterMode.icon size={16} />
      </ActionIcon>
    </div>
  );
} 