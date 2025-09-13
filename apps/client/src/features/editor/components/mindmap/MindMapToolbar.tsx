import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  IconArrowBack,
  IconArrowForward,
  IconTrash,
  IconPhoto,
  IconLink,
  IconNote,
  IconTag,
  IconBrackets,
  IconLine,
  IconMoodSmile,
  IconShare2,
  IconGitBranch,
  IconFileImport,
  IconFileExport,
  IconBrush,
  IconMathFunction,
  IconPalette,
  IconHome,
  IconSearch,
  IconMinus,
  IconPlus,
  IconSun,
  IconMoon,
  IconMaximize,
  IconEye,
  IconEdit,
  IconDotsVertical,
  IconKeyboard,
  IconBrandGithub,
  IconBook,
  IconDownload,
  IconMessage,
  IconX,
  IconDeviceFloppy,
} from '@tabler/icons-react';
import './mindmap-toolbar.css';
import SidebarPanel from './SidebarPanel';
import BaseStylePanelSimple from './components/BaseStylePanelSimple';
import MiniMapNavigator from './components/MiniMapNavigator';
import IconMapNavigator from '@/components/icons/icon-map-navigator';

interface MindMapToolbarProps {
  mindMap: any;
  theme: 'light' | 'dark';
  onThemeChange?: () => void;
  onSave: () => void;
  onExport?: () => void;
  onExit: () => void;
  isSaving?: boolean;
}

export default function MindMapToolbar({
  mindMap,
  theme,
  onThemeChange,
  onSave,
  onExport,
  onExit,
  isSaving = false,
}: MindMapToolbarProps) {
  const { t } = useTranslation();
  
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [activeNodes, setActiveNodes] = useState<any[]>([]);
  const [isInPainter, setIsInPainter] = useState(false);
  const [scaleValue, setScaleValue] = useState(100);
  const [isReadonly, setIsReadonly] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showBaseStyle, setShowBaseStyle] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(false);

  // 通用的 toast 提示函数
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const toast = document.createElement('div');
    toast.innerHTML = message;
    
    const colors = {
      success: { bg: '#4caf50', icon: '✅' },
      error: { bg: '#f44336', icon: '❌' },
      info: { bg: '#2196f3', icon: 'ℹ️' }
    };
    
    const { bg, icon } = colors[type];
    
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${bg};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      z-index: 10002;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      animation: slideInOut 3s ease-in-out;
      max-width: 300px;
      word-wrap: break-word;
    `;
    
    // 添加图标
    toast.innerHTML = `${icon} ${message}`;
    
    // 添加CSS动画
    if (!document.querySelector('#toast-styles')) {
      const style = document.createElement('style');
      style.id = 'toast-styles';
      style.textContent = `
        @keyframes slideInOut {
          0% { opacity: 0; transform: translateX(100%); }
          15% { opacity: 1; transform: translateX(0); }
          85% { opacity: 1; transform: translateX(0); }
          100% { opacity: 0; transform: translateX(100%); }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    
    // 3秒后自动移除
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 3000);
  };

  // 监听历史记录变化和节点激活
  useEffect(() => {
    if (!mindMap) return;

    // 使用正确的事件名称监听撤回前进状态变化
    const handleBackForward = (index: number, len: number) => {
      setCanUndo(index > 0);          // 不在起始位置时可以撤回
      setCanRedo(index < len - 1);    // 不在末尾位置时可以前进
    };

    const handleNodeActive = (node: any, nodeList: any[]) => {
      setActiveNodes(nodeList || []);
    };

    const handleScale = (scale: number) => {
      setScaleValue(Math.round(scale * 100));
    };

    // 监听正确的事件
    mindMap.on('back_forward', handleBackForward);
    mindMap.on('node_active', handleNodeActive);
    mindMap.on('scale', handleScale);
    
    // 也监听数据变化事件，确保状态同步
    mindMap.on('data_change', () => {
      // 数据变化时也可能影响历史记录状态，这里不需要特别处理
      // back_forward 事件已经会触发
    });
    
    // 初始化状态 - 在初始化时通常没有历史记录，所以都是false
    setCanUndo(false);
    setCanRedo(false);
    
    if (mindMap.view) {
      setScaleValue(Math.round(mindMap.view.scale * 100));
    }
    
    return () => {
      mindMap.off('back_forward', handleBackForward);
      mindMap.off('node_active', handleNodeActive);
      mindMap.off('scale', handleScale);
      mindMap.off('data_change'); // 清理数据变化监听器
    };
  }, [mindMap]);

  // 移除键盘快捷键处理 - 由 mindmap-view.tsx 统一处理
  // useEffect(() => {
  //   // 键盘事件处理代码被移除，避免与 mindmap-view.tsx 冲突
  // }, [mindMap, activeNodes, canUndo, canRedo, showSearch, onSave]);

  // 点击外部关闭更多菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.mindmap-more-menu') && !target.closest('.mindmap-nav-btn')) {
        setShowMoreMenu(false);
      }
    };
    
    if (showMoreMenu) {
      document.addEventListener('click', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showMoreMenu]);

  const execCommand = (command: string, ...args: any[]) => {
    try {
      if (!mindMap || !mindMap.execCommand) {
        console.warn('MindMap 实例或 execCommand 方法不可用');
        return;
      }
      
      mindMap.execCommand(command, ...args);
    } catch (error) {
      console.error('执行命令失败:', command, error);
    }
  };

  // 计算是否有根节点被选中
  const hasRoot = activeNodes && activeNodes.length > 0 && activeNodes.some(node => node && node.isRoot);
  
  // 计算是否有概要节点被选中  
  const hasGeneralization = activeNodes && activeNodes.length > 0 && activeNodes.some(node => node && node.isGeneralization);

  // 格式刷功能
  const handlePainter = () => {
    if (isInPainter) {
      // 结束格式刷
      if (mindMap && mindMap.painter) {
        mindMap.painter.endPainter();
      }
      setIsInPainter(false);
    } else {
      // 开始格式刷
      if (mindMap && mindMap.painter) {
        mindMap.painter.startPainter();
      }
      setIsInPainter(true);
    }
  };

  // 图片功能
  const handleImage = () => {
    if (activeNodes.length <= 0) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          if (mindMap) {
            mindMap.execCommand('SET_NODE_IMAGE', activeNodes[0], {
              url: e.target.result,
              title: file.name,
              width: 100,
              height: 100
            });
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // 图标功能
  const handleIcon = () => {
    if (activeNodes.length <= 0) return;
    // 简化的图标选择，实际应该有一个图标选择器
    const icons = ['😀', '👍', '⭐', '✅', '❌', '💡', '🎯', '🔴'];
    const icon = icons[Math.floor(Math.random() * icons.length)];
    if (mindMap) {
      mindMap.execCommand('SET_NODE_ICON', activeNodes[0], [icon]);
    }
  };

  // 链接功能
  const handleLink = () => {
    if (activeNodes.length <= 0) return;
    const url = window.prompt('🔗 请输入链接地址\n\n示例：https://www.example.com');
    if (url && mindMap) {
      mindMap.execCommand('SET_NODE_HYPERLINK', activeNodes[0], url, url);
      showToast('链接已添加', 'success');
    }
  };

  // 备注功能
  const handleNote = () => {
    if (activeNodes.length <= 0) return;
    const note = window.prompt('📝 请输入备注内容\n\n可以输入多行文本来详细说明这个节点');
    if (note && mindMap) {
      mindMap.execCommand('SET_NODE_NOTE', activeNodes[0], note);
      showToast('备注已添加', 'success');
    }
  };

  // 标签功能
  const handleTag = () => {
    if (activeNodes.length <= 0) return;
    const tag = window.prompt('🏷️ 请输入标签内容\n\n示例：重要,待办,紧急\n（多个标签用逗号分隔）');
    if (tag && mindMap) {
      const tags = tag.split(',').map(t => t.trim()).filter(t => t);
      mindMap.execCommand('SET_NODE_TAG', activeNodes[0], tags);
      showToast(`已添加 ${tags.length} 个标签`, 'success');
    }
  };

  // 公式功能
  const handleFormula = () => {
    if (activeNodes.length <= 0 || hasGeneralization) return;
    const formula = window.prompt('📊 请输入LaTeX公式\n\n示例：\n· E=mc^2\n· \\frac{a}{b}\n· \\sum_{i=1}^{n} x_i');
    if (formula && mindMap) {
      mindMap.execCommand('INSERT_FORMULA', formula);
      showToast('公式已添加', 'success');
    }
  };

  // 导出功能
  const handleExport = async () => {
    if (!mindMap) return;
    
    try {
      const data = await mindMap.export('png', true);
      const blob = new Blob([data], { type: 'image/png' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mindmap.png';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // 导入功能
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.smm,.xmind,.md';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          try {
            const data = JSON.parse(e.target.result);
            if (mindMap) {
              mindMap.setData(data);
            }
          } catch (error) {
            console.error('Import failed:', error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // 缩放控制
  const handleZoomIn = () => {
    if (mindMap && mindMap.view) {
      mindMap.view.enlarge();
    }
  };

  const handleZoomOut = () => {
    if (mindMap && mindMap.view) {
      mindMap.view.narrow();
    }
  };

  // 重置缩放到100%
  const resetZoom = () => {
    if (mindMap && mindMap.view) {
      const cx = mindMap.width / 2;
      const cy = mindMap.height / 2;
      mindMap.view.setScale(1, cx, cy);
      setScaleValue(100);
    }
  };

  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value.replace(/[^0-9]/g, ''));
    if (!isNaN(value) && value > 0 && value <= 500) {
      setScaleValue(value);
      if (mindMap && mindMap.view) {
        const cx = mindMap.width / 2;
        const cy = mindMap.height / 2;
        mindMap.view.setScale(value / 100, cx, cy);
      }
    }
  };

  // 回到根节点并居中
  const handleBackToRoot = () => {
    if (mindMap && mindMap.renderer) {
      mindMap.renderer.setRootNodeCenter();
    }
  };

  // 回正：重置视图到根节点居中并100%缩放
  const handleReset = () => {
    if (mindMap) {
      // 重置缩放到100%
      if (mindMap.view) {
        const cx = mindMap.width / 2;
        const cy = mindMap.height / 2;
        mindMap.view.setScale(1, cx, cy);
        setScaleValue(100);
      }
      // 回到根节点居中
      if (mindMap.renderer) {
        mindMap.renderer.setRootNodeCenter();
      }
    }
  };

  // 切换只读模式
  const toggleReadonly = () => {
    const newReadonly = !isReadonly;
    setIsReadonly(newReadonly);
    if (mindMap) {
      mindMap.setMode(newReadonly ? 'readonly' : 'edit');
    }
  };

  // 搜索功能
  const handleSearch = () => {
    setShowSearch(!showSearch);
    if (!showSearch && mindMap && mindMap.search) {
      // 显示搜索框
      setTimeout(() => {
        const input = document.querySelector('.mindmap-search-input') as HTMLInputElement;
        if (input) {
          input.focus();
        }
      }, 100);
    } else if (showSearch && mindMap && mindMap.search) {
      // 关闭搜索
      mindMap.search.endSearch();
      setSearchText('');
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
    if (mindMap && mindMap.search) {
      if (value) {
        mindMap.search.search(value);
      } else {
        mindMap.search.endSearch();
      }
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && mindMap && mindMap.search) {
      mindMap.search.next();
    } else if (e.key === 'Escape') {
      setShowSearch(false);
      setSearchText('');
      if (mindMap && mindMap.search) {
        mindMap.search.endSearch();
      }
    }
  };

  return (
    <>
      {/* 顶部工具栏 */}
      <div className={`mindmap-toolbar-top ${theme === 'dark' ? 'isDark' : ''}`}>
        {/* 第一组工具栏 - 节点操作 */}
        <div className="mindmap-toolbar-block">
          {/* 撤销/重做 */}
          <div 
            className={`mindmap-toolbar-btn ${!canUndo ? 'disabled' : ''}`}
            onClick={() => canUndo && execCommand('BACK')}
          >
            <span className="icon">
              <IconArrowBack size={16} />
            </span>
            <span className="text">撤销</span>
          </div>
          <div 
            className={`mindmap-toolbar-btn ${!canRedo ? 'disabled' : ''}`}
            onClick={() => canRedo && execCommand('FORWARD')}
          >
            <span className="icon">
              <IconArrowForward size={16} />
            </span>
            <span className="text">前进</span>
          </div>

          {/* 格式刷 */}
          <div 
            className={`mindmap-toolbar-btn ${activeNodes.length <= 0 || hasGeneralization ? 'disabled' : ''} ${isInPainter ? 'active' : ''}`}
            onClick={handlePainter}
          >
            <span className="icon">
              <IconBrush size={16} />
            </span>
            <span className="text">格式刷</span>
          </div>

          {/* 插入同级节点 */}
          <div 
            className={`mindmap-toolbar-btn ${activeNodes.length <= 0 || hasRoot || hasGeneralization ? 'disabled' : ''}`}
            onClick={() => execCommand('INSERT_NODE')}
          >
            <span className="icon">
              <IconShare2 size={16} />
            </span>
            <span className="text">同级节点</span>
          </div>

          {/* 插入子节点 */}
          <div 
            className={`mindmap-toolbar-btn ${activeNodes.length <= 0 || hasGeneralization ? 'disabled' : ''}`}
            onClick={() => execCommand('INSERT_CHILD_NODE')}
          >
            <span className="icon">
              <IconGitBranch size={16} />
            </span>
            <span className="text">子节点</span>
          </div>

          {/* 删除节点 */}
          <div 
            className={`mindmap-toolbar-btn ${activeNodes.length <= 0 ? 'disabled' : ''}`}
            onClick={() => execCommand('REMOVE_NODE')}
          >
            <span className="icon">
              <IconTrash size={16} />
            </span>
            <span className="text">删除</span>
          </div>

          {/* 图片 */}
          <div 
            className={`mindmap-toolbar-btn ${activeNodes.length <= 0 ? 'disabled' : ''}`}
            onClick={handleImage}
          >
            <span className="icon">
              <IconPhoto size={16} />
            </span>
            <span className="text">图片</span>
          </div>

          {/* 图标 */}
          <div 
            className={`mindmap-toolbar-btn ${activeNodes.length <= 0 ? 'disabled' : ''}`}
            onClick={handleIcon}
          >
            <span className="icon">
              <IconMoodSmile size={16} />
            </span>
            <span className="text">图标</span>
          </div>

          {/* 链接 */}
          <div 
            className={`mindmap-toolbar-btn ${activeNodes.length <= 0 ? 'disabled' : ''}`}
            onClick={handleLink}
          >
            <span className="icon">
              <IconLink size={16} />
            </span>
            <span className="text">链接</span>
          </div>

          {/* 备注 */}
          <div 
            className={`mindmap-toolbar-btn ${activeNodes.length <= 0 ? 'disabled' : ''}`}
            onClick={handleNote}
          >
            <span className="icon">
              <IconNote size={16} />
            </span>
            <span className="text">备注</span>
          </div>

          {/* 标签 */}
          <div 
            className={`mindmap-toolbar-btn ${activeNodes.length <= 0 ? 'disabled' : ''}`}
            onClick={handleTag}
          >
            <span className="icon">
              <IconTag size={16} />
            </span>
            <span className="text">标签</span>
          </div>

          {/* 概要 */}
          <div 
            className={`mindmap-toolbar-btn ${activeNodes.length <= 0 || hasRoot || hasGeneralization ? 'disabled' : ''}`}
            onClick={() => execCommand('ADD_GENERALIZATION')}
          >
            <span className="icon">
              <IconBrackets size={16} />
            </span>
            <span className="text">概要</span>
          </div>

          {/* 关联线 */}
          <div 
            className={`mindmap-toolbar-btn ${activeNodes.length <= 0 || hasGeneralization ? 'disabled' : ''}`}
            onClick={() => {
              if (activeNodes.length > 0 && !hasGeneralization && mindMap && mindMap.associativeLine) {
                mindMap.associativeLine.createLineFromActiveNode();
              }
            }}
          >
            <span className="icon">
              <IconLine size={16} />
            </span>
            <span className="text">关联线</span>
          </div>

          {/* 公式 */}
          <div 
            className={`mindmap-toolbar-btn ${activeNodes.length <= 0 || hasGeneralization ? 'disabled' : ''}`}
            onClick={handleFormula}
          >
            <span className="icon">
              <IconMathFunction size={16} />
            </span>
            <span className="text">公式</span>
          </div>
        </div>

        {/* 第二组工具栏 - 导入导出、搜索、保存和退出 */}
        <div className="mindmap-toolbar-block">
          <div className="mindmap-toolbar-btn" onClick={handleImport}>
            <span className="icon">
              <IconFileImport size={16} />
            </span>
            <span className="text">导入</span>
          </div>
          <div className="mindmap-toolbar-btn" onClick={handleExport}>
            <span className="icon">
              <IconFileExport size={16} />
            </span>
            <span className="text">导出</span>
          </div>
          <div 
            className="mindmap-toolbar-btn" 
            onClick={() => setShowSearch(!showSearch)}
          >
            <span className="icon">
              <IconSearch size={16} />
            </span>
            <span className="text">搜索</span>
          </div>
          
          {/* 保存按钮 */}
          <div 
            className={`mindmap-toolbar-btn ${isSaving ? 'disabled' : ''}`}
            onClick={!isSaving ? onSave : undefined}
          >
            <span className="icon">
              <IconDeviceFloppy size={16} />
            </span>
            <span className="text">{isSaving ? '保存中...' : '保存'}</span>
          </div>
          
          {/* 导出按钮 */}
          {onExport && (
            <div 
              className="mindmap-toolbar-btn"
              onClick={onExport}
            >
              <span className="icon">
                <IconDownload size={16} />
              </span>
              <span className="text">导出</span>
            </div>
          )}
          
          {/* 退出按钮 */}
          <div 
            className="mindmap-toolbar-btn" 
            onClick={onExit}
            style={{ marginRight: 0 }}
          >
            <span className="icon">
              <IconX size={16} />
            </span>
            <span className="text">退出</span>
          </div>
        </div>
      </div>

      {/* 右侧工具栏和面板 */}
      <SidebarPanel mindMap={mindMap} theme={theme} />

      {/* 底部导航工具栏 */}
      <div className={`mindmap-navigator-toolbar ${theme === 'dark' ? 'isDark' : ''}`}>
        <div className="mindmap-navigator-item">
          <div className="mindmap-nav-btn" onClick={handleBackToRoot} title="回到根节点">
            <IconHome size={18} />
          </div>
        </div>
        
        <div className="mindmap-navigator-item">
          <div 
            className={`mindmap-nav-btn ${showMiniMap ? 'active' : ''}`} 
            onClick={() => setShowMiniMap(!showMiniMap)} 
            title={showMiniMap ? t("Close MiniMap") : t("Open MiniMap")}
          >
            <IconMapNavigator size={18} />
          </div>
        </div>

        <div className="mindmap-navigator-item">
          <div className="mindmap-nav-btn" onClick={handleSearch} title="搜索">
            <IconSearch size={18} />
          </div>
        </div>

        <div className="mindmap-navigator-item">
          <div 
            className={`mindmap-nav-btn ${showBaseStyle ? 'active' : ''}`} 
            onClick={() => setShowBaseStyle(!showBaseStyle)} 
            title="基础样式"
          >
            <IconPalette size={18} />
          </div>
        </div>

        <div className="mindmap-navigator-item">
          <div className="mindmap-nav-btn" onClick={toggleReadonly} title={isReadonly ? "编辑" : "只读"}>
            {isReadonly ? <IconEdit size={18} /> : <IconEye size={18} />}
          </div>
        </div>

        <div className="mindmap-navigator-item mindmap-scale-control">
          <div className="mindmap-nav-btn" onClick={handleZoomOut}>
            <IconMinus size={16} />
          </div>
          <div className="mindmap-scale-info" onClick={resetZoom} title="点击重置为100%">
            <input
              type="text"
              value={`${scaleValue}`}
              onChange={handleScaleChange}
              onBlur={() => setScaleValue(scaleValue)}
              onClick={(e) => e.stopPropagation()} // 防止点击输入框时触发重置
            />
            %
          </div>
          <div className="mindmap-nav-btn" onClick={handleZoomIn}>
            <IconPlus size={16} />
          </div>
        </div>

        <div className="mindmap-navigator-item">
          <div className="mindmap-nav-btn" onClick={handleReset} title="回正（居中并重置缩放）">
            <IconHome size={18} />
          </div>
        </div>

        <div className="mindmap-navigator-item">
          <div className="mindmap-nav-btn" onClick={onThemeChange} title="切换主题">
            {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
          </div>
        </div>

        <div className="mindmap-navigator-item" style={{ position: 'relative' }}>
          <div 
            className="mindmap-nav-btn" 
            title="更多"
            onClick={() => setShowMoreMenu(!showMoreMenu)}
          >
            <IconDotsVertical size={18} />
          </div>
          {showMoreMenu && (
            <div className="mindmap-more-menu">
              <div className="mindmap-more-menu-item" onClick={() => {
                // 显示快捷键
                showToast('快捷键功能已在设置面板中，请点击右侧设置图标查看', 'info');
                setShowMoreMenu(false);
              }}>
                <IconKeyboard size={16} />
                <span>快捷键</span>
              </div>
              <div className="mindmap-more-menu-item" onClick={() => {
                // AI对话
                showToast('AI对话功能待实现', 'info');
                setShowMoreMenu(false);
              }}>
                <IconMessage size={16} />
                <span>AI对话</span>
              </div>
              <div className="mindmap-more-menu-item" onClick={() => {
                // 下载客户端
                window.open('https://github.com/wanglin2/mind-map/releases', '_blank');
                setShowMoreMenu(false);
              }}>
                <IconDownload size={16} />
                <span>下载客户端</span>
              </div>
              <div className="mindmap-more-menu-item" onClick={() => {
                // GitHub
                window.open('https://github.com/wanglin2/mind-map', '_blank');
                setShowMoreMenu(false);
              }}>
                <IconBrandGithub size={16} />
                <span>GitHub</span>
              </div>
              <div className="mindmap-more-menu-item" onClick={() => {
                // 文档
                window.open('https://wanglin2.github.io/mind-map/#/doc/zh/introduction', '_blank');
                setShowMoreMenu(false);
              }}>
                <IconBook size={16} />
                <span>文档</span>
              </div>
            </div>
          )}
        </div>
      </div>


      {/* 搜索框 */}
      {showSearch && (
        <div className={`mindmap-search-box ${theme === 'dark' ? 'isDark' : ''}`}>
          <input
            className="mindmap-search-input"
            type="text"
            placeholder="搜索节点..."
            value={searchText}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            autoFocus
          />
          <button
            className="mindmap-search-close"
            onClick={() => {
              setShowSearch(false);
              setSearchText('');
              if (mindMap && mindMap.search) {
                mindMap.search.endSearch();
              }
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* 基础样式面板 */}
      <BaseStylePanelSimple
        mindMap={mindMap}
        theme={theme}
        show={showBaseStyle}
        onClose={() => setShowBaseStyle(false)}
      />

      {/* 小地图导航器 */}
      <MiniMapNavigator
        mindMap={mindMap}
        show={showMiniMap}
        theme={theme}
        onToggle={() => setShowMiniMap(!showMiniMap)}
      />
    </>
  );
}