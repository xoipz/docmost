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


// 定义所有按钮
const buttons = [
  // 基础功能区 - 始终显示
  { label: "/", content: "/", category: "base", priority: 1 },
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

// TAG:App - 底部快速输入栏
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
      if (navigator?.clipboard?.readText) {
        navigator.clipboard.readText().then(text => {
          if (text) {
            editor.chain().focus().insertContent(text).run();
          }
        }).catch(err => {
          console.warn('剪贴板读取失败:', err);
          // 尝试使用浏览器原生粘贴
          editor.chain().focus().run();
          try {
            document.execCommand('paste');
          } catch (e) {
            console.warn('粘贴失败:', e);
          }
        });
      } else {
        // 如果不支持 clipboard API，focus 编辑器后尝试原生粘贴
        editor.chain().focus().run();
        try {
          document.execCommand('paste');
        } catch (e) {
          console.warn('粘贴失败，浏览器不支持:', e);
        }
      }
    } else if (button.command === "smartSelection") {
      // 渐进式智能选词功能: 单词 → 句子 → 下一个句子 → ... → 段落
      const { state } = editor;
      const { selection } = state;
      const { from, to } = selection;
      const doc = state.doc;
      
      // 获取整个段落的文本内容
      const $pos = doc.resolve(from);
      const node = $pos.parent;
      const paragraphText = node.textContent;
      const nodeStart = $pos.start();
      const cursorOffsetInParagraph = from - nodeStart;
      
      // 文本分割辅助函数
      const segmentText = (text: string, granularity: 'word' | 'sentence') => {
        if ('Intl' in window && 'Segmenter' in Intl) {
          // 使用浏览器原生 Intl.Segmenter API
          const segmenter = new Intl.Segmenter('zh-CN', { granularity });
          return Array.from(segmenter.segment(text));
        } else {
          // 回退到简单的正则表达式分割
          if (granularity === 'word') {
            const words = [];
            const regex = /[\u4e00-\u9fa5\u3400-\u4dbf\uf900-\ufaff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af\uff00-\uffefa-zA-Z0-9_]+/g;
            let match;
            while ((match = regex.exec(text)) !== null) {
              words.push({
                segment: match[0],
                index: match.index,
                isWordLike: true
              });
            }
            return words;
          } else {
            // 简单的句子分割
            const sentences = [];
            const regex = /[^.!?。！？]*[.!?。！？]*/g;
            let match;
            while ((match = regex.exec(text)) !== null) {
              if (match[0].trim()) {
                sentences.push({
                  segment: match[0],
                  index: match.index,
                  isWordLike: false
                });
              }
            }
            return sentences;
          }
        }
      };
      
      if (from === to) {
        // 第一阶段：没有选择时，优先选择当前单词
        const words = segmentText(paragraphText, 'word');
        
        // 找到光标所在的单词
        let currentWordStart = -1;
        let currentWordEnd = -1;
        let foundWord = false;
        
        for (const word of words) {
          const wordStart = word.index;
          const wordEnd = word.index + word.segment.length;
          
          if (wordStart <= cursorOffsetInParagraph && cursorOffsetInParagraph <= wordEnd) {
            // 只选择非空白的单词
            if (word.segment.trim().length > 0) {
              currentWordStart = wordStart;
              currentWordEnd = wordEnd;
              foundWord = true;
              break;
            }
          }
        }
        
        if (foundWord) {
          const startPos = nodeStart + currentWordStart;
          const endPos = nodeStart + currentWordEnd;
          editor.chain().focus().setTextSelection({ from: startPos, to: endPos }).run();
        } else {
          // 如果没找到单词，回退到选择单个字符
          const charAtCursor = paragraphText[cursorOffsetInParagraph];
          if (charAtCursor && charAtCursor.trim()) {
            const startPos = from;
            const endPos = from + 1;
            editor.chain().focus().setTextSelection({ from: startPos, to: endPos }).run();
          }
        }
      } else {
        // 已有选择时，进行渐进式扩展：词 → 遇到符号停止 → 句子 → 下一个句子 → 段落
        const selectedStartInParagraph = from - nodeStart;
        const selectedEndInParagraph = to - nodeStart;
        const selectionLength = selectedEndInParagraph - selectedStartInParagraph;
        
        // 如果当前选择是单个字符，先扩展到词
        if (selectionLength === 1) {
          const words = segmentText(paragraphText, 'word');
          
          for (const word of words) {
            const wordStart = word.index;
            const wordEnd = word.index + word.segment.length;
            
            // 如果当前选择的字符在这个单词内
            if (wordStart <= selectedStartInParagraph && selectedEndInParagraph <= wordEnd) {
              if (word.segment.trim().length > 1) {
                const startPos = nodeStart + wordStart;
                const endPos = nodeStart + wordEnd;
                editor.chain().focus().setTextSelection({ from: startPos, to: endPos }).run();
                return;
              }
            }
          }
        }
        
        // 判断当前选择是否是单词级别，如果是则扩展到符号边界
        const words = segmentText(paragraphText, 'word');
        let isWordSelection = false;
        let currentWordEnd = -1;
        
        // 检查当前选择是否恰好是一个完整单词
        for (const word of words) {
          const wordStart = word.index;
          const wordEnd = word.index + word.segment.length;
          
          if (Math.abs(selectedStartInParagraph - wordStart) <= 1 && 
              Math.abs(selectedEndInParagraph - wordEnd) <= 1) {
            isWordSelection = true;
            currentWordEnd = wordEnd;
            break;
          }
        }
        
        // 如果当前选择是单词，扩展到下一个符号边界
        if (isWordSelection) {
          // 从单词结束位置开始，找到下一个标点符号或句子边界
          let expandEnd = currentWordEnd;
          const punctuationRegex = /[.!?。！？,，;；:：]/;
          
          // 向后扩展到下一个标点符号
          while (expandEnd < paragraphText.length) {
            const char = paragraphText[expandEnd];
            if (punctuationRegex.test(char)) {
              expandEnd++;
              break;
            } else if (/\s/.test(char)) {
              // 跳过空白字符
              expandEnd++;
            } else {
              // 遇到下一个单词字符，包含它
              const nextWords = segmentText(paragraphText.slice(expandEnd), 'word');
              if (nextWords.length > 0) {
                const nextWord = nextWords[0];
                expandEnd += nextWord.segment.length;
              } else {
                break;
              }
            }
          }
          
          if (expandEnd > selectedEndInParagraph) {
            const startPos = nodeStart + selectedStartInParagraph;
            const endPos = nodeStart + expandEnd;
            editor.chain().focus().setTextSelection({ from: startPos, to: endPos }).run();
            return;
          }
        }
        
        // 符号边界选择 → 句子 → 下一个句子 → 段落的扩展
        const sentences = segmentText(paragraphText, 'sentence');
        let currentSentenceStart = -1;
        let currentSentenceEnd = -1;
        let nextSentenceEnd = -1;
        
        // 找到当前选择所在的句子范围
        for (const sentence of sentences) {
          const sentenceStart = sentence.index;
          const sentenceEnd = sentence.index + sentence.segment.length;
          
          // 如果当前选择与这个句子有交集
          if (selectedStartInParagraph < sentenceEnd && selectedEndInParagraph > sentenceStart) {
            if (currentSentenceStart === -1) {
              currentSentenceStart = sentenceStart;
            }
            currentSentenceEnd = sentenceEnd;
          } else if (currentSentenceEnd !== -1 && nextSentenceEnd === -1) {
            // 找到下一个句子的结束位置
            nextSentenceEnd = sentenceEnd;
            break;
          }
        }
        
        if (currentSentenceStart !== -1 && currentSentenceEnd !== -1) {
          const sentenceLength = currentSentenceEnd - currentSentenceStart;
          
          // 检查当前选择是否已经是完整句子  
          const isFullSentence = (
            Math.abs(selectedStartInParagraph - currentSentenceStart) <= 1 &&
            Math.abs(selectedEndInParagraph - currentSentenceEnd) <= 1
          );
          
          if (!isFullSentence && selectionLength < sentenceLength) {
            // 当前选择小于句子，扩展到整个句子
            const startPos = nodeStart + currentSentenceStart;
            const endPos = nodeStart + currentSentenceEnd;
            editor.chain().focus().setTextSelection({ from: startPos, to: endPos }).run();
          } else if (nextSentenceEnd !== -1) {
            // 已经选择了完整句子，扩展到下一个句子
            const startPos = nodeStart + currentSentenceStart;
            const endPos = nodeStart + nextSentenceEnd;
            editor.chain().focus().setTextSelection({ from: startPos, to: endPos }).run();
          } else {
            // 已经是最后的句子，扩展到整个段落
            const startPos = nodeStart;
            const endPos = nodeStart + paragraphText.length;
            editor.chain().focus().setTextSelection({ from: startPos, to: endPos }).run();
          }
        }
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