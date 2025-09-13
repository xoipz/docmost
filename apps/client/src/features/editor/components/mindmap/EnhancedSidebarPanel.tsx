import { useState, useEffect } from 'react';
import SidebarTrigger from './components/SidebarTrigger';
import NodeStylePanel from './components/NodeStylePanel';
import BaseStylePanel from './components/BaseStylePanel';
import StructurePanel from './components/StructurePanel';
import ThemePanel from './components/ThemePanel';
import OutlinePanel from './components/OutlinePanel';
import ShortcutKeyPanel from './components/ShortcutKeyPanel';
import NodeTagPanel from './components/NodeTagPanel';

interface EnhancedSidebarPanelProps {
  mindMap: any;
  theme: 'light' | 'dark';
  onClose?: () => void;
}

export default function EnhancedSidebarPanel({
  mindMap,
  theme,
  onClose
}: EnhancedSidebarPanelProps) {
  const [activeSidebar, setActiveSidebar] = useState<string | null>(null);
  const [activeNodes, setActiveNodes] = useState<any[]>([]);
  const [isReadonly, setIsReadonly] = useState(false);
  const [enableAi, setEnableAi] = useState(false);

  // 监听节点激活事件
  useEffect(() => {
    if (!mindMap) return;

    const handleNodeActive = (node: any, nodeList: any[]) => {
      setActiveNodes(nodeList || []);
    };

    const handleModeChange = (mode: string) => {
      setIsReadonly(mode === 'readonly');
    };

    mindMap.on('node_active', handleNodeActive);
    mindMap.on('mode_change', handleModeChange);

    // 初始化状态
    if (mindMap.renderer && mindMap.renderer.activeNodeList) {
      setActiveNodes(mindMap.renderer.activeNodeList);
    }

    return () => {
      mindMap.off('node_active', handleNodeActive);
      mindMap.off('mode_change', handleModeChange);
    };
  }, [mindMap]);

  const handleTrigger = (value: string) => {
    setActiveSidebar(activeSidebar === value ? null : value);
  };

  const handleCloseSidebar = () => {
    setActiveSidebar(null);
    onClose?.();
  };

  const renderPanel = () => {
    if (!activeSidebar) return null;

    const commonProps = {
      mindMap,
      theme,
      show: true,
      onClose: handleCloseSidebar
    };

    switch (activeSidebar) {
      case 'nodeStyle':
        return <NodeStylePanel {...commonProps} activeNodes={activeNodes} />;
      case 'baseStyle':
        return <BaseStylePanel {...commonProps} />;
      case 'theme':
        return <ThemePanel {...commonProps} />;
      case 'structure':
        return <StructurePanel {...commonProps} />;
      case 'outline':
        return <OutlinePanel {...commonProps} />;
      case 'nodeTag':
        return <NodeTagPanel {...commonProps} activeNodes={activeNodes} />;
      case 'shortcutKey':
        return <ShortcutKeyPanel {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* 右侧触发器 */}
      <SidebarTrigger
        theme={theme}
        activeSidebar={activeSidebar}
        onTrigger={handleTrigger}
        isReadonly={isReadonly}
        enableAi={enableAi}
      />

      {/* 侧边面板 */}
      {renderPanel()}
    </>
  );
}