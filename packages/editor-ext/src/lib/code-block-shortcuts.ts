import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { TextSelection } from '@tiptap/pm/state'

export const CodeBlockShortcuts = Extension.create({
  name: 'codeBlockShortcuts',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('codeBlockShortcuts'),
        props: {
          handleKeyDown: (view, event) => {
            // 检查是否在代码块中
            const { state } = view
            const { selection } = state
            const { $from } = selection
            const node = $from.node()
            
            if (node && node.type.name === 'codeBlock') {
              // 检查是否是 Ctrl+A（包括大写键盘状态）
              if ((event.key === 'a' || event.key === 'A') && (event.ctrlKey || event.metaKey)) {
                event.preventDefault()
                
                // 获取代码块的起始和结束位置
                const start = $from.start()
                const end = start + node.nodeSize
                
                // 创建新的选择范围，确保包含所有内容
                const tr = state.tr
                tr.setSelection(TextSelection.create(tr.doc, start, end))
                view.dispatch(tr)
                
                return true
              }
            }
            return false
          },
        },
      }),
    ]
  },
}) 