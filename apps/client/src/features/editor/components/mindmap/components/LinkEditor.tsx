import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { IconX, IconLink, IconExternalLink, IconCheck } from '@tabler/icons-react';
import './LinkEditor.css';

interface LinkEditorProps {
  show: boolean;
  onClose: () => void;
  onConfirm: (url: string, title: string) => void;
  initialUrl?: string;
  initialTitle?: string;
  theme: 'light' | 'dark';
}

const PROTOCOLS = [
  { value: 'https', label: 'HTTPS' },
  { value: 'http', label: 'HTTP' },
  { value: 'none', label: '无协议' }
];

export default function LinkEditor({
  show,
  onClose,
  onConfirm,
  initialUrl = '',
  initialTitle = '',
  theme
}: LinkEditorProps) {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [protocol, setProtocol] = useState('https');
  const [isValidUrl, setIsValidUrl] = useState(true);
  
  const dialogRef = useRef<HTMLDivElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  // 初始化数据
  useEffect(() => {
    if (show) {
      // 解析初始URL和协议
      if (initialUrl) {
        const protocolMatch = initialUrl.match(/^(https?):\/\//);
        if (protocolMatch) {
          setProtocol(protocolMatch[1]);
          setUrl(initialUrl.replace(/^https?:\/\//, ''));
        } else {
          setProtocol('none');
          setUrl(initialUrl);
        }
      } else {
        setUrl('');
        setProtocol('https');
      }
      
      setTitle(initialTitle);
      
      // 自动聚焦输入框
      setTimeout(() => {
        if (urlInputRef.current) {
          urlInputRef.current.focus();
        }
      }, 100);
    }
  }, [show, initialUrl, initialTitle]);

  // URL验证
  const validateUrl = (urlString: string) => {
    if (!urlString.trim()) return true; // 空URL是有效的（删除链接）
    
    try {
      // 简单的URL验证
      const urlPattern = /^([a-zA-Z][a-zA-Z\d+\-.]*:\/\/)?[^\s/$.?#].[^\s]*$/;
      return urlPattern.test(urlString) || urlPattern.test(`https://${urlString}`);
    } catch {
      return false;
    }
  };

  // 处理URL变化
  const handleUrlChange = (value: string) => {
    setUrl(value);
    setIsValidUrl(validateUrl(value));
    
    // 自动检测协议
    const protocolMatch = value.match(/^(https?):\/\//);
    if (protocolMatch) {
      setProtocol(protocolMatch[1]);
      setUrl(value.replace(/^https?:\/\//, ''));
    }
  };

  // 构建完整URL
  const buildFullUrl = () => {
    if (!url.trim()) return '';
    return protocol === 'none' ? url : `${protocol}://${url}`;
  };

  // 确认处理
  const handleConfirm = () => {
    const fullUrl = buildFullUrl();
    const finalTitle = title.trim() || url.trim() || '链接';
    onConfirm(fullUrl, finalTitle);
    onClose();
  };

  // 键盘事件处理
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValidUrl) {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
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
    <div className="link-editor-overlay">
      <div 
        ref={dialogRef}
        className={`link-editor-dialog ${theme === 'dark' ? 'dark' : ''}`}
      >
        {/* 头部 */}
        <div className="link-editor-header">
          <div className="header-title">
            <IconLink size={20} />
            <h3>{t('mindmap.link.title')}</h3>
          </div>
          <button className="close-btn" onClick={onClose}>
            <IconX size={20} />
          </button>
        </div>

        {/* 内容 */}
        <div className="link-editor-content">
          {/* URL输入 */}
          <div className="form-group">
            <label className="form-label">{t('mindmap.link.url')}</label>
            <div className="url-input-group">
              <select 
                className="protocol-select"
                value={protocol}
                onChange={(e) => setProtocol(e.target.value)}
              >
                {PROTOCOLS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <input
                ref={urlInputRef}
                type="text"
                className={`url-input ${!isValidUrl ? 'error' : ''}`}
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="example.com"
              />
            </div>
            {!isValidUrl && (
              <div className="error-message">{t('mindmap.link.invalidUrl')}</div>
            )}
          </div>

          {/* 标题输入 */}
          <div className="form-group">
            <label className="form-label">{t('mindmap.link.displayTitle')}</label>
            <input
              type="text"
              className="title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('mindmap.link.titlePlaceholder')}
            />
          </div>

          {/* 预览 */}
          {url.trim() && isValidUrl && (
            <div className="link-preview">
              <div className="preview-label">{t('mindmap.link.preview')}:</div>
              <div className="preview-link">
                <IconExternalLink size={14} />
                <span>{title.trim() || url.trim()}</span>
                <span className="preview-url">({buildFullUrl()})</span>
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="link-editor-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            {t('Cancel')}
          </button>
          <button 
            className={`btn btn-primary ${!isValidUrl ? 'disabled' : ''}`}
            onClick={handleConfirm}
            disabled={!isValidUrl}
          >
            <IconCheck size={16} />
            {t('Confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}