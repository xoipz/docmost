import { Extension } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    heading: {
      toggleHeading: (attributes: { level: number }) => ReturnType
    }
    codeBlock: {
      setCodeBlock: (attributes?: { language: string }) => ReturnType
      toggleCodeBlock: (attributes?: { language: string }) => ReturnType
    }
    mathBlock: {
      setMathBlock: () => ReturnType
    }
  }
}

// TAG：快捷键修改位置
export const HeadingShortcuts = Extension.create({
  name: 'headingShortcuts',

  addKeyboardShortcuts() {
    return {
      'Mod-1': () => this.editor.commands.toggleHeading({ level: 1 }),
      'Mod-2': () => this.editor.commands.toggleHeading({ level: 2 }),
      'Mod-3': () => this.editor.commands.toggleHeading({ level: 3 }),
      'Mod-4': () => this.editor.commands.toggleHeading({ level: 4 }),
      'Mod-5': () => this.editor.commands.toggleHeading({ level: 5 }),
      'Mod-6': () => this.editor.commands.toggleHeading({ level: 6 }),
      'Mod-Shift-K': () => this.editor.chain().focus().toggleCodeBlock().run(),
      'Mod-Shift-M': () => this.editor.chain().focus().setMathBlock().run(),
      'Mod-Alt-T': () => this.editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    }
  },
}) 