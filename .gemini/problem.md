### 待解决问题

**日期**：2025年7月19日
**状态**：【解决中】

#### Bug描述
在Tiptap编辑器中，当使用中文输入法（IME）来替换一段已经选中的文本时，除了选中的文本被替换外，光标后方的部分文本也会被意外删除。

---

### 排查日志

#### 假设1：Suggestion插件与IME冲突
- **怀疑对象**：`@mention` 插件的 `Suggestion` 功能。
- **操作**：为 `Mention` 扩展的 `suggestion` 配置添加 `ignoreComposition: true`。
- **结果**：失败。Bug依然存在。已撤销修改。

#### 假设2：输入规则（Input Rules）与IME冲突
- **怀疑对象 1**：`Typography` 扩展，它会自动转换标点符号。
- **操作**：在编辑器扩展中注释掉 `Typography`。
- **结果**：失败。Bug依然存在。已撤销修改。

- **怀疑对象 2**：`StarterKit` 中所有默认的输入规则（如 `## `转标题, `* `转列表等）。
- **操作**：通过配置 `StarterKit.configure`，一次性禁用了 `blockquote`, `bulletList`, `heading`, `horizontalRule`, `listItem`, `orderedList` 等所有相关扩展。
- **结果**：失败。Bug依然存在。已撤销修改。

#### 假设3：其他Suggestion插件与IME冲突
- **怀疑对象**：`SlashCommand` (/) 和 `EmojiCommand` (:)，它们也都基于 `Suggestion` 插件。
- **操作**：为 `SlashCommand` 和 `EmojiCommand` 同时添加 `ignoreComposition: true` 配置。
- **结果**：失败。Bug依然存在。已撤销修改。

#### 当前的核心假设：协同编辑（Collaboration）与IME冲突
- **怀疑对象**：Hocuspocus 协同编辑功能。
- **推理**：在本地进行中文输入法“组合”（composition）的过程中，从协同服务器接收到了一个状态更新包。这个外部更新干扰了本地正在进行的输入事务，导致ProseMirror在计算文本替换范围时出错，从而删除了额外的文本。这是一个典型的竞态条件（Race Condition）问题。
- **下一步计划**：暂时彻底禁用 `Collaboration` 和 `CollaborationCursor` 扩展，以验证禁用协同后，该Bug是否消失。这是目前可能性最高的根源。
