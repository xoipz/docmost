import React, { useState, useEffect, useRef } from 'react';
import { IconX, IconPlus, IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface TagEditorProps {
  show: boolean;
  onClose: () => void;
  onConfirm: (tags: any[]) => void;
  initialTags: any[];
  theme: 'light' | 'dark';
}

// 根据文本内容生成颜色的函数
const generateColorByContent = (text: string): string => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // 生成饱和度和亮度合适的颜色
  const hue = Math.abs(hash % 360);
  const saturation = 60 + (Math.abs(hash) % 20); // 60-80%
  const lightness = 45 + (Math.abs(hash) % 10);  // 45-55%
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const TagEditor: React.FC<TagEditorProps> = ({
  show,
  onClose,
  onConfirm,
  initialTags,
  theme
}) => {
  const { t } = useTranslation();
  const [tags, setTags] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const MAX_TAGS = 5;

  useEffect(() => {
    if (show) {
      setTags(initialTags || []);
      setInputValue('');
      setEditingIndex(null);
      setEditingText('');
      // 聚焦输入框
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [show, initialTags]);

  useEffect(() => {
    if (editingIndex !== null && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingIndex]);

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      setEditingIndex(null);
      setEditingText('');
    }
  };

  const addTag = () => {
    const text = inputValue.trim();
    if (!text || tags.length >= MAX_TAGS) return;

    const newTag = {
      text,
      style: {
        fill: generateColorByContent(text)
      }
    };

    setTags([...tags, newTag]);
    setInputValue('');
  };

  const removeTag = (index: number) => {
    const newTags = [...tags];
    newTags.splice(index, 1);
    setTags(newTags);
  };

  const startEdit = (index: number) => {
    const tag = tags[index];
    setEditingIndex(index);
    setEditingText(typeof tag === 'string' ? tag : tag.text);
  };

  const saveEdit = () => {
    if (editingIndex === null) return;
    
    const text = editingText.trim();
    if (!text) {
      setEditingIndex(null);
      setEditingText('');
      return;
    }

    const newTags = [...tags];
    const currentTag = newTags[editingIndex];
    
    if (typeof currentTag === 'string') {
      newTags[editingIndex] = {
        text,
        style: { fill: generateColorByContent(text) }
      };
    } else {
      newTags[editingIndex] = {
        ...currentTag,
        text
      };
    }
    
    setTags(newTags);
    setEditingIndex(null);
    setEditingText('');
  };

  const handleConfirm = () => {
    onConfirm(tags);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!show) return null;

  return (
    <div className={`tag-editor-overlay ${theme === 'dark' ? 'isDark' : ''}`} onClick={handleOverlayClick}>
      <div className="tag-editor-dialog">
        <div className="tag-editor-header">
          <h3>{t('mindmap.tag.title')}</h3>
          <button 
            className="tag-editor-close" 
            onClick={onClose}
            type="button"
          >
            <IconX size={16} />
          </button>
        </div>

        <div className="tag-editor-content">
          {/* 输入框 */}
          <div className="tag-input-section">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder={tags.length >= MAX_TAGS ? t('mindmap.tag.maxTagsReached', { max: MAX_TAGS }) : t('mindmap.tag.placeholder')}
              disabled={tags.length >= MAX_TAGS}
              className="tag-input"
            />
            {inputValue.trim() && tags.length < MAX_TAGS && (
              <button
                type="button"
                className="tag-add-btn"
                onClick={addTag}
              >
                <IconPlus size={16} />
              </button>
            )}
          </div>

          {/* 标签列表 */}
          <div className="tag-list">
            {tags.map((tag, index) => {
              const tagText = typeof tag === 'string' ? tag : tag.text;
              const tagColor = typeof tag === 'string' 
                ? generateColorByContent(tag) 
                : (tag.style?.fill || generateColorByContent(tagText));

              return (
                <div
                  key={index}
                  className="tag-item"
                  style={{ backgroundColor: tagColor }}
                >
                  {editingIndex === index ? (
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onKeyDown={handleEditKeyDown}
                      onBlur={saveEdit}
                      className="tag-edit-input"
                    />
                  ) : (
                    <>
                      <span 
                        className="tag-text"
                        onClick={() => startEdit(index)}
                        title={t('mindmap.tag.clickToEdit')}
                      >
                        {tagText}
                      </span>
                      <button
                        type="button"
                        className="tag-delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTag(index);
                        }}
                        title={t('mindmap.tag.removeTag')}
                      >
                        <IconTrash size={12} />
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {tags.length === 0 && (
            <div className="tag-empty">
              {t('mindmap.tag.emptyState')}
            </div>
          )}
        </div>

        <div className="tag-editor-footer">
          <button 
            type="button" 
            className="tag-btn tag-btn-cancel" 
            onClick={onClose}
          >
            {t('Cancel')}
          </button>
          <button 
            type="button" 
            className="tag-btn tag-btn-confirm" 
            onClick={handleConfirm}
          >
            {t('Confirm')}
          </button>
        </div>
      </div>

      <style>{`
        .tag-editor-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10001;
        }

        .tag-editor-overlay.isDark {
          background: rgba(0, 0, 0, 0.7);
        }

        .tag-editor-dialog {
          background: white;
          border-radius: 8px;
          width: 90%;
          max-width: 500px;
          max-height: 80vh;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
        }

        .isDark .tag-editor-dialog {
          background: #2d3748;
          color: white;
        }

        .tag-editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #e2e8f0;
        }

        .isDark .tag-editor-header {
          border-bottom-color: #4a5568;
        }

        .tag-editor-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }

        .tag-editor-close {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          color: #64748b;
          transition: all 0.2s;
        }

        .tag-editor-close:hover {
          background: #f1f5f9;
          color: #334155;
        }

        .isDark .tag-editor-close {
          color: #a0aec0;
        }

        .isDark .tag-editor-close:hover {
          background: #4a5568;
          color: #e2e8f0;
        }

        .tag-editor-content {
          padding: 20px;
          flex: 1;
          overflow: auto;
        }

        .tag-input-section {
          position: relative;
          margin-bottom: 16px;
        }

        .tag-input {
          width: 100%;
          padding: 10px 12px;
          padding-right: 40px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: all 0.2s;
        }

        .tag-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .tag-input:disabled {
          background: #f9fafb;
          color: #9ca3af;
          cursor: not-allowed;
        }

        .isDark .tag-input {
          background: #4a5568;
          border-color: #718096;
          color: white;
        }

        .isDark .tag-input:focus {
          border-color: #63b3ed;
          box-shadow: 0 0 0 3px rgba(99, 179, 237, 0.1);
        }

        .isDark .tag-input:disabled {
          background: #2d3748;
          color: #718096;
        }

        .tag-add-btn {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .tag-add-btn:hover {
          background: #2563eb;
        }

        .tag-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 16px;
        }

        .tag-item {
          position: relative;
          padding: 6px 30px 6px 12px;
          border-radius: 16px;
          color: white;
          font-size: 13px;
          display: inline-flex;
          align-items: center;
          max-width: 200px;
        }

        .tag-text {
          cursor: pointer;
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .tag-edit-input {
          background: transparent;
          border: none;
          color: white;
          font-size: 13px;
          outline: none;
          width: 100px;
          min-width: 50px;
        }

        .tag-edit-input::placeholder {
          color: rgba(255, 255, 255, 0.7);
        }

        .tag-delete-btn {
          position: absolute;
          right: 6px;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: white;
          opacity: 0;
          transition: all 0.2s;
        }

        .tag-item:hover .tag-delete-btn {
          opacity: 1;
        }

        .tag-delete-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .tag-empty {
          text-align: center;
          color: #9ca3af;
          font-size: 14px;
          padding: 24px;
        }

        .isDark .tag-empty {
          color: #a0aec0;
        }

        .tag-editor-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 20px;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .isDark .tag-editor-footer {
          border-top-color: #4a5568;
          background: #1a202c;
        }

        .tag-btn {
          padding: 8px 16px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .tag-btn-cancel {
          background: #f1f5f9;
          color: #475569;
        }

        .tag-btn-cancel:hover {
          background: #e2e8f0;
        }

        .tag-btn-confirm {
          background: #3b82f6;
          color: white;
        }

        .tag-btn-confirm:hover {
          background: #2563eb;
        }

        .isDark .tag-btn-cancel {
          background: #4a5568;
          color: #e2e8f0;
        }

        .isDark .tag-btn-cancel:hover {
          background: #718096;
        }
      `}</style>
    </div>
  );
};

export default TagEditor;