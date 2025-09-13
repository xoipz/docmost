import Sidebar from './Sidebar';

interface ShortcutKeyPanelProps {
  theme: 'light' | 'dark';
  show: boolean;
  onClose: () => void;
}

const shortcutGroups = [
  {
    name: '基本操作',
    shortcuts: [
      { key: 'Tab', desc: '插入子节点' },
      { key: 'Enter', desc: '插入同级节点' },
      { key: 'Delete/Backspace', desc: '删除节点' },
      { key: 'Space', desc: '编辑节点' },
      { key: 'F2', desc: '编辑节点' },
    ]
  },
  {
    name: '编辑操作',
    shortcuts: [
      { key: 'Ctrl+Z', desc: '撤销' },
      { key: 'Ctrl+Y', desc: '重做' },
      { key: 'Ctrl+A', desc: '全选' },
      { key: 'Ctrl+C', desc: '复制' },
      { key: 'Ctrl+V', desc: '粘贴' },
      { key: 'Ctrl+X', desc: '剪切' },
    ]
  },
  {
    name: '导航操作',
    shortcuts: [
      { key: '↑↓←→', desc: '导航选择节点' },
    ]
  },
  {
    name: '视图操作',
    shortcuts: [
      { key: 'Ctrl+0', desc: '重置为100%缩放' },
      { key: 'Ctrl+1', desc: '适合窗口' },
    ]
  },
  {
    name: '节点样式',
    shortcuts: [
      { key: 'Ctrl+B', desc: '切换粗体' },
      { key: 'Ctrl+I', desc: '切换斜体' },
      { key: 'Ctrl+U', desc: '切换下划线' },
    ]
  },
  {
    name: '主题与界面',
    shortcuts: [
      { key: 'Ctrl+T', desc: '切换明暗主题' },
      { key: 'Escape', desc: '退出思维导图编辑器' },
    ]
  },
  {
    name: '文件操作',
    shortcuts: [
      { key: 'Ctrl+S', desc: '保存思维导图' },
      { key: 'Ctrl+E', desc: '导出为图片/SVG' },
    ]
  }
];

export default function ShortcutKeyPanel({
  theme,
  show,
  onClose
}: ShortcutKeyPanelProps) {
  return (
    <Sidebar
      title="快捷键"
      show={show}
      onClose={onClose}
      theme={theme}
    >
      <div className="shortcut-panel">
        {shortcutGroups.map((group) => (
          <div key={group.name} className="panel-section">
            <div className="section-title">{group.name}</div>
            <div className="shortcut-list">
              {group.shortcuts.map((shortcut, index) => (
                <div key={index} className="shortcut-item">
                  <div className="shortcut-key">
                    {shortcut.key.split('+').map((key, keyIndex) => (
                      <span key={keyIndex}>
                        <kbd>{key}</kbd>
                        {keyIndex < shortcut.key.split('+').length - 1 && ' + '}
                      </span>
                    ))}
                  </div>
                  <div className="shortcut-desc">{shortcut.desc}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        <div className="panel-section">
          <div className="section-title">使用说明</div>
          <div className="shortcut-tips">
            <p>• 所有快捷键均已激活，可直接使用</p>
            <p>• 在编辑节点文字时，只有保存和导出快捷键可用</p>
            <p>• Mac 用户请将 Ctrl 替换为 Cmd</p>
            <p>• 按 Escape 键可随时退出思维导图编辑器</p>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}