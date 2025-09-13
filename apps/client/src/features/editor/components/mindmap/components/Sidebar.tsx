import { ReactNode } from 'react';
import { IconX } from '@tabler/icons-react';

interface SidebarProps {
  title?: string;
  show: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  children: ReactNode;
  zIndex?: number;
}

export default function Sidebar({
  title,
  show,
  onClose,
  theme,
  children,
  zIndex = 1000
}: SidebarProps) {
  return (
    <div
      className={`
        sidebar-container 
        ${show ? 'show' : ''} 
        ${theme === 'dark' ? 'isDark' : ''}
      `}
      style={{ zIndex }}
      onClick={(e) => e.stopPropagation()}
    >
      <span className="close-btn" onClick={onClose}>
        <IconX size={20} />
      </span>
      {title && (
        <div className="sidebar-header">
          {title}
        </div>
      )}
      <div className="sidebar-content custom-scrollbar">
        {children}
      </div>
    </div>
  );
}