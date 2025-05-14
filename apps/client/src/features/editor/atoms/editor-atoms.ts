import { atom } from "jotai";
import { Editor } from "@tiptap/core";

export const pageEditorAtom = atom<Editor | null>(null);

export const titleEditorAtom = atom<Editor | null>(null);

export const yjsConnectionStatusAtom = atom<string>("");

// 用于追踪键盘快捷键是否正常工作的状态
export const keyboardShortcutsStatusAtom = atom<{
  enabled: boolean;
  lastActivity: number;
}>({
  enabled: true,
  lastActivity: Date.now(),
});
