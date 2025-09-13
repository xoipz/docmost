import { useState, useEffect } from 'react';
import {
  IconPalette,
  IconBrush,
  IconLayout,
  IconList,
  IconKeyboard,
  IconChevronLeft,
  IconChevronRight,
  IconSettings,
  IconMessage,
  IconTag,
} from '@tabler/icons-react';

interface SidebarTriggerProps {
  theme: 'light' | 'dark';
  activeSidebar: string | null;
  onTrigger: (value: string) => void;
  isReadonly?: boolean;
  enableAi?: boolean;
}

const sidebarTriggerList = [
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
    name: '主题',
    value: 'theme',
    icon: IconPalette,
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
    name: '节点标签',
    value: 'nodeTag',
    icon: IconTag,
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
  {
    name: '快捷键',
    value: 'shortcutKey',
    icon: IconKeyboard,
  },
];

export default function SidebarTrigger({
  theme,
  activeSidebar,
  onTrigger,
  isReadonly = false,
  enableAi = false
}: SidebarTriggerProps) {
  const [show, setShow] = useState(true);
  const [maxHeight, setMaxHeight] = useState(0);

  const updateSize = () => {
    const topMargin = 110;
    const bottomMargin = 80;
    setMaxHeight(window.innerHeight - topMargin - bottomMargin);
  };

  useEffect(() => {
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const triggerList = sidebarTriggerList.filter(item => {
    if (isReadonly) {
      return ['outline', 'shortcutKey', 'ai'].includes(item.value);
    }
    if (!enableAi) {
      return item.value !== 'ai';
    }
    return true;
  });

  return (
    <div
      className={`
        sidebar-trigger-container 
        ${show ? 'show' : ''} 
        ${activeSidebar ? 'has-active' : ''} 
        ${theme === 'dark' ? 'isDark' : ''}
      `}
      style={{ maxHeight: `${maxHeight}px` }}
    >
      <div 
        className={`toggle-show-btn ${!show ? 'hide' : ''}`}
        onClick={() => setShow(!show)}
      >
        <span>
          {show ? <IconChevronRight size={16} /> : <IconChevronLeft size={16} />}
        </span>
      </div>
      <div className="trigger custom-scrollbar">
        {triggerList.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.value}
              className={`trigger-item ${activeSidebar === item.value ? 'active' : ''}`}
              onClick={() => onTrigger(item.value)}
            >
              <div className="trigger-icon">
                <Icon size={18} />
              </div>
              <div className="trigger-name">{item.name}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}