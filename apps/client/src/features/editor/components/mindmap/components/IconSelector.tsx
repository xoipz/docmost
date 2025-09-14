import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { IconX } from '@tabler/icons-react';
import './IconSelector.css';
import { iconDisplayMap } from '../config/icons';

// 图标数据 - 基于配置文件重构
const iconGroups = [
  {
    name: 'mindmap.icons.priority',
    type: 'priority',
    list: [
      { name: '1', ...iconDisplayMap['priority_1'] },
      { name: '2', ...iconDisplayMap['priority_2'] },
      { name: '3', ...iconDisplayMap['priority_3'] },
      { name: '4', ...iconDisplayMap['priority_4'] },
      { name: '5', ...iconDisplayMap['priority_5'] },
    ]
  },
  {
    name: 'mindmap.icons.emotion',
    type: 'emotion', 
    list: [
      { name: 'happy', ...iconDisplayMap['emotion_happy'] },
      { name: 'sad', ...iconDisplayMap['emotion_sad'] },
      { name: 'love', ...iconDisplayMap['emotion_love'] },
      { name: 'star', ...iconDisplayMap['emotion_star'] },
      { name: 'think', ...iconDisplayMap['emotion_think'] },
      { name: 'cool', ...iconDisplayMap['emotion_cool'] },
    ]
  },
  {
    name: 'mindmap.icons.status',
    type: 'status',
    list: [
      { name: 'done', ...iconDisplayMap['status_done'] },
      { name: 'todo', ...iconDisplayMap['status_todo'] },
      { name: 'progress', ...iconDisplayMap['status_progress'] },
      { name: 'warning', ...iconDisplayMap['status_warning'] },
      { name: 'error', ...iconDisplayMap['status_error'] },
      { name: 'info', ...iconDisplayMap['status_info'] },
    ]
  },
  {
    name: 'mindmap.icons.marker',
    type: 'marker',
    list: [
      { name: 'star', ...iconDisplayMap['marker_star'] },
      { name: 'flag', ...iconDisplayMap['marker_flag'] },
      { name: 'light', ...iconDisplayMap['marker_light'] },
      { name: 'heart', ...iconDisplayMap['marker_heart'] },
      { name: 'diamond', ...iconDisplayMap['marker_diamond'] },
      { name: 'target', ...iconDisplayMap['marker_target'] },
    ]
  }
];

interface IconSelectorProps {
  show: boolean;
  onClose: () => void;
  onIconSelect: (iconKey: string, iconData: any) => void;
  selectedIcons: string[];
  mindMap?: any;
  theme: 'light' | 'dark';
}

export default function IconSelector({ 
  show, 
  onClose, 
  onIconSelect, 
  selectedIcons = [],
  mindMap,
  theme 
}: IconSelectorProps) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    if (!show) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [show, onClose]);

  if (!show) return null;

  const handleIconClick = (group: any, icon: any) => {
    const iconKey = `${group.type}_${icon.name}`;
    onIconSelect(iconKey, { ...icon, type: group.type });
  };

  const isIconSelected = (group: any, icon: any) => {
    const iconKey = `${group.type}_${icon.name}`;
    return selectedIcons.includes(iconKey);
  };

  return (
    <div className="icon-selector-overlay">
      <div 
        ref={dialogRef}
        className={`icon-selector-dialog ${theme === 'dark' ? 'dark' : ''}`}
      >
        {/* 头部 */}
        <div className="icon-selector-header">
          <h3>{t('mindmap.toolbar.icon')}</h3>
          <button className="close-btn" onClick={onClose}>
            <IconX size={20} />
          </button>
        </div>

        {/* 内容 */}
        <div className="icon-selector-content">
          {iconGroups.map((group) => (
            <div key={group.type} className="icon-group">
              <div className="icon-group-title">{t(group.name)}</div>
              <div className="icon-grid">
                {group.list.map((icon) => (
                  <div
                    key={`${group.type}_${icon.name}`}
                    className={`icon-item ${isIconSelected(group, icon) ? 'selected' : ''}`}
                    onClick={() => handleIconClick(group, icon)}
                    title={icon.name}
                  >
                    <span 
                      className={`icon-display ${icon.style || ''}`}
                      style={{ 
                        color: icon.style === 'priority' ? 'white' : icon.color,
                        '--icon-bg-color': icon.color 
                      } as React.CSSProperties}
                    >
                      {icon.icon}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 底部说明 */}
        <div className="icon-selector-footer">
          <div className="icon-tip">
            {t('mindmap.icons.tip')}
          </div>
        </div>
      </div>
    </div>
  );
}