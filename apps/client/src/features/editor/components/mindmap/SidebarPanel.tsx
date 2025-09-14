import { useState, useEffect } from 'react';
import {
  IconX,
  IconPalette,
  IconBrush,
  IconLayout,
  IconList,
  IconChevronLeft,
  IconChevronRight,
  IconSettings,
  IconMessage,
  IconBold,
  IconItalic,
  IconUnderline,
  IconStrikethrough,
  IconUpload,
} from '@tabler/icons-react';
import './sidebar-panel.css';
import './styles/sidebar.css';
import './styles/panels.css';
import './styles/panel-specific.css';
import NodeStylePanel from './components/NodeStylePanel';

interface SidebarPanelProps {
  mindMap: any;
  theme: 'light' | 'dark';
  onClose?: () => void;
}

const sidebarItems = [
  {
    name: '节点样式',
    value: 'nodeStyle',
    icon: IconPalette,
  },
  {
    name: '基础样式',
    value: 'baseStyle',
    icon: IconBrush,
  },
  {
    name: '结构',
    value: 'structure',
    icon: IconLayout,
  },
  {
    name: '大纲',
    value: 'outline',
    icon: IconList,
  },
  {
    name: 'AI对话',
    value: 'ai',
    icon: IconMessage,
  },
  {
    name: '设置',
    value: 'setting',
    icon: IconSettings,
  },
];

export default function SidebarPanel({ mindMap, theme, onClose }: SidebarPanelProps) {
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeNodes, setActiveNodes] = useState<any[]>([]);
  const [isReadonly, setIsReadonly] = useState(false);

  // 监听节点激活事件
  useEffect(() => {
    
    if (!mindMap) {
      return;
    }


    const handleNodeActive = (node: any, nodeList: any[]) => {
      setActiveNodes(nodeList || []);
    };

    const handleNodeClick = (...args: any[]) => {
      // 尝试获取当前激活的节点
      if (mindMap.renderer && mindMap.renderer.activeNodeList) {
        setActiveNodes(mindMap.renderer.activeNodeList);
      }
    };

    const handleAnyEvent = (eventName: string) => (...args: any[]) => {
    };

    const handleModeChange = (mode: string) => {
      setIsReadonly(mode === 'readonly');
    };

    // 尝试多个可能的事件名称
    if (typeof mindMap.on === 'function') {
      mindMap.on('node_active', handleNodeActive);
      mindMap.on('nodeActive', handleNodeActive);
      mindMap.on('node_click', handleNodeClick);
      mindMap.on('click', handleNodeClick);
      mindMap.on('nodeClick', handleNodeClick);
      mindMap.on('mode_change', handleModeChange);
      
      // 监听一些常见事件来调试
      ['select', 'node_select', 'selection_change', 'active_change'].forEach(eventName => {
        mindMap.on(eventName, handleAnyEvent(eventName));
      });
    } else {
      console.error('mindMap.on 不是函数');
    }

    // 初始化状态
    if (mindMap.renderer && mindMap.renderer.activeNodeList) {
      setActiveNodes(mindMap.renderer.activeNodeList);
    }

    // 手动检查当前激活节点的其他可能方法
    try {
      if (mindMap.command && mindMap.command.selection) {
      }
      if (mindMap.renderer && mindMap.renderer.activeNodeList) {
      }
    } catch (error) {
    }

    return () => {
      if (typeof mindMap.off === 'function') {
        mindMap.off('node_active', handleNodeActive);
        mindMap.off('nodeActive', handleNodeActive);
        mindMap.off('node_click', handleNodeClick);
        mindMap.off('click', handleNodeClick);
        mindMap.off('nodeClick', handleNodeClick);
        mindMap.off('mode_change', handleModeChange);
        
        // 清理调试事件监听器
        ['select', 'node_select', 'selection_change', 'active_change'].forEach(eventName => {
          mindMap.off(eventName, handleAnyEvent(eventName));
        });
      }
    };
  }, [mindMap]);

  // 过滤可用的侧边栏项
  const availableItems = sidebarItems.filter(item => {
    if (isReadonly) {
      return ['outline'].includes(item.value);
    }
    // AI功能暂时隐藏
    if (item.value === 'ai') return false;
    return true;
  });

  const handleItemClick = (value: string) => {
    setActivePanel(activePanel === value ? null : value);
  };

  const renderPanelContent = () => {
    const commonProps = { mindMap, theme };
    
    switch (activePanel) {
      case 'nodeStyle':
        return (
          <NodeStylePanel 
            mindMap={mindMap}
            theme={theme}
            show={true}
            onClose={() => setActivePanel(null)}
            activeNodes={activeNodes}
          />
        );
      case 'baseStyle':
        return <BaseStylePanel {...commonProps} />;
      case 'structure':
        return <StructurePanel {...commonProps} />;
      case 'outline':
        return <OutlinePanel {...commonProps} />;
      case 'setting':
        return <SettingPanel {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* 右侧触发器栏 */}
      <div className={`sidebar-trigger-container ${showSidebar ? 'show' : ''} ${activePanel ? 'has-active' : ''} ${theme === 'dark' ? 'isDark' : ''}`}>
        <div className="toggle-show-btn" onClick={() => setShowSidebar(!showSidebar)}>
          {showSidebar ? <IconChevronRight size={16} /> : <IconChevronLeft size={16} />}
        </div>
        <div className="trigger-list">
          {availableItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.value}
                className={`trigger-item ${activePanel === item.value ? 'active' : ''}`}
                onClick={() => handleItemClick(item.value)}
              >
                <Icon size={18} className="trigger-icon" />
                <div className="trigger-name">{item.name}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 侧边面板 */}
      {activePanel && (
        <div className={`sidebar-panel ${theme === 'dark' ? 'isDark' : ''}`}>
          <div className="sidebar-header">
            <span>{sidebarItems.find(item => item.value === activePanel)?.name}</span>
            <IconX 
              size={20} 
              className="close-btn" 
              onClick={() => setActivePanel(null)}
            />
          </div>
          <div className="sidebar-content">
            {renderPanelContent()}
          </div>
        </div>
      )}
    </>
  );
}

// 基础样式面板
function BaseStylePanel({ mindMap, theme }: { mindMap: any; theme: string }) {
  const [backgroundColor, setBackgroundColor] = useState('#f7f7f7');
  
  // 初始化时获取当前背景颜色
  useEffect(() => {
    if (mindMap) {
      try {
        const currentBg = mindMap.getThemeConfig?.()?.backgroundColor || '#f7f7f7';
        setBackgroundColor(currentBg);
      } catch (error) {
        console.error('获取背景颜色失败:', error);
      }
    }
  }, [mindMap]);
  
  const handleBackgroundColorChange = (color: string) => {
    setBackgroundColor(color);
    try {
      if (mindMap && mindMap.setThemeConfig) {
        mindMap.setThemeConfig({
          backgroundColor: color
        });
      }
    } catch (error) {
      console.error('设置背景颜色失败:', error);
    }
  };
  
  return (
    <div className="panel-section">
      <div className="section-title">画布设置</div>
      <div className="form-item">
        <label>背景颜色</label>
        <input 
          type="color" 
          value={backgroundColor}
          onChange={(e) => handleBackgroundColorChange(e.target.value)}
        />
      </div>
      <div className="form-item">
        <label>显示水印</label>
        <input 
          type="checkbox"
          onChange={(e) => {
            try {
              if (mindMap && mindMap.watermark) {
                if (e.target.checked) {
                  mindMap.watermark.createWatermark();
                } else {
                  mindMap.watermark.removeWatermark();
                }
              }
            } catch (error) {
              console.error('设置水印失败:', error);
            }
          }}
        />
      </div>
    </div>
  );
}

// 结构面板
function StructurePanel({ mindMap, theme }: { mindMap: any; theme: string }) {
  const structures = [
    { value: 'logicalStructure', label: '逻辑结构图' },
    { value: 'mindMap', label: '思维导图' },
    { value: 'catalogOrganization', label: '目录组织图' },
    { value: 'organizationStructure', label: '组织结构图' },
    { value: 'timeline', label: '时间轴' },
    { value: 'timeline2', label: '时间轴2' },
    { value: 'fishbone', label: '鱼骨图' },
    { value: 'verticalTimeline', label: '竖向时间轴' },
  ];

  return (
    <div className="panel-section">
      <div className="section-title">选择结构</div>
      <div className="structure-list">
        {structures.map(structure => (
          <div
            key={structure.value}
            className="structure-item"
            onClick={() => {
              try {
                if (mindMap && mindMap.setLayout) {
                  mindMap.setLayout(structure.value);
                }
              } catch (error) {
                console.error('设置布局失败:', error);
              }
            }}
          >
            {structure.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// 大纲面板
function OutlinePanel({ mindMap, theme }: { mindMap: any; theme: string }) {
  // 获取大纲数据
  const getOutlineData = () => {
    try {
      if (!mindMap) return [];
      const data = mindMap.getData();
      if (!data) return [];
      
      const result: any[] = [];
      
      const traverse = (node: any, level: number = 0) => {
        if (!node || !node.data) return;
        result.push({
          text: node.data.text || '空节点',
          level,
          uid: node.data.uid || `node-${level}-${result.length}`
        });
        if (node.children && Array.isArray(node.children)) {
          node.children.forEach((child: any) => traverse(child, level + 1));
        }
      };
      
      traverse(data);
      return result;
    } catch (error) {
      console.error('获取大纲数据失败:', error);
      return [];
    }
  };

  return (
    <div className="panel-section">
      <div className="section-title">大纲视图</div>
      <div className="outline-list">
        {getOutlineData().map((item, index) => (
          <div
            key={index}
            className="outline-item"
            style={{ paddingLeft: `${item.level * 20}px` }}
          >
            {item.text || '空节点'}
          </div>
        ))}
      </div>
    </div>
  );
}

// 设置面板
function SettingPanel({ mindMap, theme }: { mindMap: any; theme: string }) {
  // 快捷键数据
  const shortcuts = [
    // 基本操作
    { category: '基本操作', key: 'Tab', desc: '插入子节点' },
    { category: '基本操作', key: 'Enter', desc: '插入同级节点' },
    { category: '基本操作', key: 'Delete/Backspace', desc: '删除节点' },
    { category: '基本操作', key: 'F2', desc: '编辑节点' },
    { category: '基本操作', key: 'Space', desc: '展开/收起节点' },
    
    // 编辑操作
    { category: '编辑操作', key: 'Ctrl+Z', desc: '撤销' },
    { category: '编辑操作', key: 'Ctrl+Y / Ctrl+Shift+Z', desc: '重做' },
    { category: '编辑操作', key: 'Ctrl+C', desc: '复制节点' },
    { category: '编辑操作', key: 'Ctrl+V', desc: '粘贴节点' },
    { category: '编辑操作', key: 'Ctrl+X', desc: '剪切节点' },
    { category: '编辑操作', key: 'Ctrl+A', desc: '全选' },
    
    // 导航操作
    { category: '导航操作', key: '↑↓←→', desc: '导航选择节点' },
    { category: '导航操作', key: 'Ctrl+↑↓', desc: '上下移动节点' },
    { category: '导航操作', key: 'Home', desc: '回到根节点' },
    
    // 视图操作
    { category: '视图操作', key: 'Ctrl+0', desc: '重置视图' },
    { category: '视图操作', key: 'Ctrl+ +', desc: '放大' },
    { category: '视图操作', key: 'Ctrl+ -', desc: '缩小' },
    { category: '视图操作', key: 'Ctrl+F', desc: '搜索节点' },
    { category: '视图操作', key: 'Escape', desc: '关闭搜索' },
    
    // 样式操作
    { category: '样式操作', key: 'Ctrl+B', desc: '加粗文字' },
    { category: '样式操作', key: 'Ctrl+I', desc: '斜体文字' },
    
    // 高级功能
    { category: '高级功能', key: 'Ctrl+G', desc: '添加概要' },
    { category: '高级功能', key: 'Ctrl+L', desc: '创建关联线' },
    
    // 文件操作
    { category: '文件操作', key: 'Ctrl+S', desc: '保存文件' },
  ];

  // 按分类分组
  const groupedShortcuts = shortcuts.reduce((groups, shortcut) => {
    const category = shortcut.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(shortcut);
    return groups;
  }, {} as Record<string, typeof shortcuts>);

  return (
    <div className="panel-section">
      <div className="section-title">编辑器设置</div>
      <div className="form-item">
        <label>
          <input 
            type="checkbox" 
            defaultChecked
            onChange={(e) => {
              try {
                if (mindMap && mindMap.setOpt) {
                  mindMap.setOpt('readonly', !e.target.checked);
                }
              } catch (error) {
                console.error('设置编辑模式失败:', error);
              }
            }}
          />
          启用编辑模式
        </label>
      </div>
      <div className="form-item">
        <label>
          <input 
            type="checkbox" 
            defaultChecked
            onChange={(e) => {
              try {
                if (mindMap && mindMap.setOpt) {
                  mindMap.setOpt('enableNodeRichText', e.target.checked);
                }
              } catch (error) {
                console.error('设置富文本失败:', error);
              }
            }}
          />
          启用节点富文本
        </label>
      </div>
      <div className="form-item">
        <label>
          <input 
            type="checkbox" 
            defaultChecked
            onChange={(e) => {
              try {
                if (mindMap && mindMap.setOpt) {
                  mindMap.setOpt('contextMenu', e.target.checked);
                }
              } catch (error) {
                console.error('设置右键菜单失败:', error);
              }
            }}
          />
          启用右键菜单
        </label>
      </div>
      <div className="form-item">
        <label>
          <input 
            type="checkbox" 
            onChange={(e) => {
              try {
                if (mindMap && mindMap.setOpt) {
                  mindMap.setOpt('enableFreeDrag', e.target.checked);
                }
              } catch (error) {
                console.error('设置自由拖拽失败:', error);
              }
            }}
          />
          启用自由拖拽
        </label>
      </div>
      
      {/* 快捷键部分 */}
      <div className="section-title" style={{ marginTop: '24px' }}>快捷键列表</div>
      <div className="shortcut-list">
        {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
          <div key={category} className="shortcut-category">
            <div className="shortcut-category-title">{category}</div>
            {categoryShortcuts.map((item, index) => (
              <div key={index} className="shortcut-item">
                <span className="shortcut-key">
                  {item.key.split(/[+\/]/).map((key, i, arr) => (
                    <span key={i}>
                      <kbd>{key.trim()}</kbd>
                      {i < arr.length - 1 && (item.key.includes('/') ? ' / ' : ' + ')}
                    </span>
                  ))}
                </span>
                <span className="shortcut-desc">{item.desc}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      
      <div className="shortcut-tips">
        <div className="section-title">使用提示</div>
        <p>• 大部分操作都有对应的快捷键，熟练使用可以大幅提高效率</p>
        <p>• 在编辑节点文字时，部分快捷键可能不可用</p>
        <p>• Mac 用户请将 Ctrl 替换为 Cmd</p>
        <p>• 方向键可以在节点之间快速导航</p>
        <p>• 使用 Tab 和 Enter 可以快速创建思维导图结构</p>
      </div>
    </div>
  );
}

