import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { IconX, IconNote, IconCheck, IconTrash } from '@tabler/icons-react';
import './NoteEditor.css';

interface NoteEditorProps {
  show: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
  initialNote?: string;
  theme: 'light' | 'dark';
}

export default function NoteEditor({
  show,
  onClose,
  onConfirm,
  initialNote = '',
  theme
}: NoteEditorProps) {
  const { t } = useTranslation();
  const [note, setNote] = useState('');
  const [wordCount, setWordCount] = useState(0);
  
  const dialogRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 初始化数据
  useEffect(() => {
    if (show) {
      setNote(initialNote);
      setWordCount(initialNote.length);
      
      // 自动聚焦并选中所有文本
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          if (initialNote) {
            textareaRef.current.setSelectionRange(initialNote.length, initialNote.length);
          }
        }
      }, 100);
    }
  }, [show, initialNote]);

  // 处理文本变化
  const handleNoteChange = (value: string) => {
    setNote(value);
    setWordCount(value.length);
  };

  // 确认处理
  const handleConfirm = () => {
    onConfirm(note.trim());
    onClose();
  };

  // 清空备注
  const handleClear = () => {
    setNote('');
    setWordCount(0);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // 键盘事件处理
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + Enter 确认
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    } 
    // Escape 取消
    else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
    // 阻止事件冒泡，防止触发思维导图的快捷键
    e.stopPropagation();
  };

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

  return (
    <div className="note-editor-overlay">
      <div 
        ref={dialogRef}
        className={`note-editor-dialog ${theme === 'dark' ? 'dark' : ''}`}
      >
        {/* 头部 */}
        <div className="note-editor-header">
          <div className="header-title">
            <IconNote size={20} />
            <h3>{t('mindmap_note_title')}</h3>
            <span className="word-count">({wordCount} 字)</span>
          </div>
          <div className="header-actions">
            {note.trim() && (
              <button className="action-btn clear-btn" onClick={handleClear} title="清空">
                <IconTrash size={16} />
              </button>
            )}
            <button className="action-btn close-btn" onClick={onClose} title="关闭">
              <IconX size={20} />
            </button>
          </div>
        </div>

        {/* 内容 */}
        <div className="note-editor-content">
          <textarea
            ref={textareaRef}
            className="note-textarea"
            value={note}
            onChange={(e) => handleNoteChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('mindmap_note_placeholder')}
            rows={12}
          />
          
          {/* 编辑提示 */}
          <div className="note-tips">
            <div className="tip-item">
              <span className="tip-key">Ctrl + Enter</span>
              <span className="tip-desc">保存备注</span>
            </div>
            <div className="tip-item">
              <span className="tip-key">Esc</span>
              <span className="tip-desc">取消编辑</span>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="note-editor-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            {t('Cancel')}
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleConfirm}
          >
            <IconCheck size={16} />
            {t('Confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}