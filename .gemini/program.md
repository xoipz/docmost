### 项目概述
本项目是一个基于Web的现代化、支持实时协同的文档知识库，类似于Notion或Confluence。

### 技术栈核心
- **整体架构**：采用基于 `pnpm` workspace 和 `nx` 的 Monorepo 架构，分为前端、后端和共享包。
- **前端 (`apps/client`)**：
    - **框架**: React (Vite构建)
    - **语言**: TypeScript
    - **UI库**: Mantine UI
    - **核心编辑器**: Tiptap (基于 ProseMirror)
- **后端 (`apps/server`)**：
    - **框架**: NestJS
    - **语言**: TypeScript
- **共享包 (`packages/`)**：
    - `editor-ext`: 存放自定义的Tiptap编辑器扩展，是项目编辑器功能的核心。

### 编辑器（Tiptap）深度分析
编辑器是本项目的核心与复杂性所在。
- **基础**: 使用 `StarterKit` 提供基础的文本格式化功能。
- **实时协同**: 通过 `@tiptap/extension-collaboration` 和 `@tiptap/extension-collaboration-cursor` 扩展，并集成 `Hocuspocus` 作为WebSocket后端，实现多人实时编辑。这是项目的关键特性。
- **富文本与自定义节点**:
    - 通过大量的自定义扩展（如表格、图片、视频、附件、绘图、数学公式等）和自定义React节点视图（NodeView）来实现���富的“块”级编辑体验。
    - 自定义扩展主要位于 `packages/editor-ext/src/lib`。
    - 自定义节点的React组件位于 `apps/client/src/features/editor/components`。
- **输入辅助功能**:
    - **命令菜单**: 通过 `Suggestion` 插件实现了多种命令触发器：
        - `@` 用于提及用户 (`Mention`)
        - `/` 用于唤起块菜单 (`SlashCommand`)
        - `:` 用于插入表情符号 (`EmojiCommand`)
    - **快捷键**: 定义了大量的键盘快捷键来提升编辑效率（如 `Mod-1` 创建H1标题）。
- **剪贴板**: 实现了自定义的Markdown粘贴逻辑，能将Markdown文本直接转换为富文本格式。

### 当前挑战
项目当前面临一个与中文输入法（IME）相关的严重Bug。在进行文本替换时，会导致选区外的文本被删除。经过多轮排查，已基本排除输入规则（Input Rules）和建议插件（Suggestion）的直接原因，目前高度怀疑是**实时协同（Hocuspocus）模块与IME的输入事件之间存在竞态条件（Race Condition）**，导致编辑器状态在关键时刻被污染。