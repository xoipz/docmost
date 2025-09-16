import React, { useState } from 'react';
import { IconX, IconDownload, IconCheck, IconFileExport } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface ExportEditorProps {
  show: boolean;
  onClose: () => void;
  onExport: (format: string, options: any) => void;
  theme: 'light' | 'dark';
}

// 导出格式配置
const exportFormats = [
  {
    type: 'png',
    name: 'PNG 图片',
    icon: '🖼️',
    description: '高质量位图格式，适合查看和分享',
    hasOptions: true
  },
  {
    type: 'svg',
    name: 'SVG 矢量图',
    icon: '🎨',
    description: '可缩放矢量图形，保持清晰度',
    hasOptions: true
  },
  {
    type: 'pdf',
    name: 'PDF 文档',
    icon: '📄',
    description: 'PDF文档格式，适合打印和存档',
    hasOptions: true
  },
  {
    type: 'smm',
    name: 'SMM 文件',
    icon: '💾',
    description: 'SimpleMindMap私有格式，可重新导入编辑',
    hasOptions: false
  },
  {
    type: 'xmind',
    name: 'XMind 文件',
    icon: '🧠',
    description: 'XMind 思维导图格式，可在 XMind 中打开',
    hasOptions: false
  },
  {
    type: 'json',
    name: 'JSON 数据',
    icon: '📊',
    description: 'JSON数据格式，可用于数据交换',
    hasOptions: false
  },
  {
    type: 'md',
    name: 'Markdown',
    icon: '📝',
    description: 'Markdown文档格式',
    hasOptions: false
  },
  {
    type: 'txt',
    name: '纯文本',
    icon: '📃',
    description: '纯文本格式，层级结构',
    hasOptions: false
  }
];

const ExportEditor: React.FC<ExportEditorProps> = ({
  show,
  onClose,
  onExport,
  theme
}) => {
  const { t } = useTranslation();
  const [selectedFormat, setSelectedFormat] = useState('png');
  const [fileName, setFileName] = useState('mindmap');
  const [options, setOptions] = useState({
    paddingX: 10,
    paddingY: 10,
    isTransparent: false,
    quality: 1,
    includeBackground: true
  });
  const [isExporting, setIsExporting] = useState(false);

  const currentFormat = exportFormats.find(f => f.type === selectedFormat);

  const handleConfirm = async () => {
    setIsExporting(true);
    try {
      await onExport(selectedFormat, {
        fileName,
        ...options
      });
      onClose();
    } catch (error) {
      console.error('导出失败:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!show) return null;

  return (
    <div className={`export-editor-overlay ${theme === 'dark' ? 'isDark' : ''}`} onClick={handleOverlayClick}>
      <div className="export-editor-dialog">
        <div className="export-editor-header">
          <div className="export-editor-title">
            <IconFileExport size={20} />
            <span>{t('mindmap_export_title')}</span>
          </div>
          <button 
            className="export-editor-close" 
            onClick={onClose}
            type="button"
          >
            <IconX size={16} />
          </button>
        </div>

        <div className="export-editor-content">
          <div className="export-layout">
            {/* 格式选择列表 */}
            <div className="format-list">
              {exportFormats.map((format) => (
                <div
                  key={format.type}
                  className={`format-item ${selectedFormat === format.type ? 'active' : ''}`}
                  onClick={() => setSelectedFormat(format.type)}
                >
                  <div className="format-icon">{format.icon}</div>
                  <div className="format-info">
                    <div className="format-name">{format.name}</div>
                    <div className="format-desc">{format.description}</div>
                  </div>
                  {selectedFormat === format.type && (
                    <div className="format-check">
                      <IconCheck size={16} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 配置选项 */}
            <div className="config-panel">
              {/* 文件名设置 */}
              <div className="config-section">
                <label className="config-label">{t('mindmap_export_fileName')}</label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="config-input"
                  placeholder="输入文件名"
                />
                <div className="file-extension">.{selectedFormat}</div>
              </div>

              {/* 格式信息 */}
              <div className="format-details">
                <div className="detail-row">
                  <span className="detail-label">{t('mindmap_export_format')}:</span>
                  <span className="detail-value">.{selectedFormat}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">{t('mindmap_export_description')}:</span>
                  <span className="detail-value">{currentFormat?.description}</span>
                </div>
              </div>

              {/* 高级选项 */}
              {currentFormat?.hasOptions && (
                <div className="config-section">
                  <h4 className="section-title">{t('mindmap_export_options')}</h4>
                  
                  {(selectedFormat === 'png' || selectedFormat === 'svg' || selectedFormat === 'pdf') && (
                    <>
                      <div className="option-row">
                        <label className="option-label">{t('mindmap_export_paddingX')}</label>
                        <input
                          type="number"
                          value={options.paddingX}
                          onChange={(e) => setOptions({...options, paddingX: Number(e.target.value)})}
                          className="option-input"
                          min="0"
                          max="100"
                        />
                        <span className="option-unit">px</span>
                      </div>
                      
                      <div className="option-row">
                        <label className="option-label">{t('mindmap_export_paddingY')}</label>
                        <input
                          type="number"
                          value={options.paddingY}
                          onChange={(e) => setOptions({...options, paddingY: Number(e.target.value)})}
                          className="option-input"
                          min="0"
                          max="100"
                        />
                        <span className="option-unit">px</span>
                      </div>

                      {(selectedFormat === 'png' || selectedFormat === 'pdf') && (
                        <div className="option-row">
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={options.isTransparent}
                              onChange={(e) => setOptions({...options, isTransparent: e.target.checked})}
                              className="checkbox-input"
                            />
                            <span className="checkbox-text">{t('mindmap_export_transparentBackground')}</span>
                          </label>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="export-editor-footer">
          <button 
            type="button" 
            className="export-btn export-btn-cancel" 
            onClick={onClose}
          >
            {t('Cancel')}
          </button>
          <button 
            type="button" 
            className="export-btn export-btn-confirm" 
            onClick={handleConfirm}
            disabled={!fileName.trim() || isExporting}
          >
            {isExporting ? (
              <>
                <div className="loading-spinner" />
                {t('mindmap_export_exporting')}
              </>
            ) : (
              <>
                <IconDownload size={16} />
                {t('mindmap_export_export')}
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        .export-editor-overlay {
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

        .export-editor-overlay.isDark {
          background: rgba(0, 0, 0, 0.7);
        }

        .export-editor-dialog {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 800px;
          max-height: 85vh;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
        }

        .isDark .export-editor-dialog {
          background: #2d3748;
          color: white;
        }

        .export-editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
        }

        .isDark .export-editor-header {
          border-bottom-color: #4a5568;
        }

        .export-editor-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 600;
          color: #1a202c;
        }

        .isDark .export-editor-title {
          color: #f7fafc;
        }

        .export-editor-close {
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          border-radius: 6px;
          color: #64748b;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .export-editor-close:hover {
          background: #f1f5f9;
          color: #334155;
        }

        .isDark .export-editor-close {
          color: #a0aec0;
        }

        .isDark .export-editor-close:hover {
          background: #4a5568;
          color: #e2e8f0;
        }

        .export-editor-content {
          flex: 1;
          overflow: hidden;
        }

        .export-layout {
          display: flex;
          height: 100%;
        }

        .format-list {
          width: 280px;
          background: #f8fafc;
          border-right: 1px solid #e2e8f0;
          overflow-y: auto;
          padding: 16px 0;
        }

        .isDark .format-list {
          background: #1a202c;
          border-right-color: #4a5568;
        }

        .format-item {
          display: flex;
          align-items: center;
          padding: 16px 20px;
          cursor: pointer;
          transition: all 0.2s;
          border-left: 3px solid transparent;
          position: relative;
        }

        .format-item:hover {
          background: #f1f5f9;
        }

        .format-item.active {
          background: white;
          border-left-color: #3b82f6;
        }

        .isDark .format-item:hover {
          background: #2d3748;
        }

        .isDark .format-item.active {
          background: #4a5568;
          border-left-color: #63b3ed;
        }

        .format-icon {
          font-size: 24px;
          margin-right: 12px;
          flex-shrink: 0;
        }

        .format-info {
          flex: 1;
        }

        .format-name {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .isDark .format-name {
          color: #e2e8f0;
        }

        .format-desc {
          font-size: 12px;
          color: #6b7280;
          line-height: 1.3;
        }

        .isDark .format-desc {
          color: #a0aec0;
        }

        .format-check {
          color: #3b82f6;
          margin-left: 8px;
        }

        .isDark .format-check {
          color: #63b3ed;
        }

        .config-panel {
          flex: 1;
          padding: 24px;
          overflow-y: auto;
        }

        .config-section {
          margin-bottom: 24px;
        }

        .config-label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .isDark .config-label {
          color: #e2e8f0;
        }

        .config-input {
          width: 100%;
          max-width: 300px;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: all 0.2s;
        }

        .config-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .isDark .config-input {
          background: #4a5568;
          border-color: #718096;
          color: white;
        }

        .isDark .config-input:focus {
          border-color: #63b3ed;
          box-shadow: 0 0 0 3px rgba(99, 179, 237, 0.1);
        }

        .file-extension {
          display: inline-block;
          margin-left: 8px;
          color: #6b7280;
          font-size: 14px;
        }

        .isDark .file-extension {
          color: #a0aec0;
        }

        .format-details {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .isDark .format-details {
          background: #1a202c;
          border-color: #4a5568;
        }

        .detail-row {
          display: flex;
          margin-bottom: 8px;
        }

        .detail-row:last-child {
          margin-bottom: 0;
        }

        .detail-label {
          font-weight: 500;
          color: #6b7280;
          min-width: 60px;
          font-size: 13px;
        }

        .isDark .detail-label {
          color: #a0aec0;
        }

        .detail-value {
          color: #1f2937;
          font-size: 13px;
        }

        .isDark .detail-value {
          color: #e2e8f0;
        }

        .section-title {
          margin: 0 0 16px;
          font-size: 16px;
          font-weight: 600;
          color: #374151;
        }

        .isDark .section-title {
          color: #e2e8f0;
        }

        .option-row {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
          gap: 12px;
        }

        .option-label {
          font-size: 14px;
          color: #374151;
          min-width: 80px;
        }

        .isDark .option-label {
          color: #e2e8f0;
        }

        .option-input {
          width: 80px;
          padding: 6px 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 13px;
        }

        .option-input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .isDark .option-input {
          background: #4a5568;
          border-color: #718096;
          color: white;
        }

        .option-unit {
          font-size: 12px;
          color: #6b7280;
        }

        .isDark .option-unit {
          color: #a0aec0;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .checkbox-input {
          width: 16px;
          height: 16px;
        }

        .checkbox-text {
          font-size: 14px;
          color: #374151;
        }

        .isDark .checkbox-text {
          color: #e2e8f0;
        }

        .export-editor-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 20px 24px;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .isDark .export-editor-footer {
          border-top-color: #4a5568;
          background: #1a202c;
        }

        .export-btn {
          padding: 10px 20px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .export-btn-cancel {
          background: #f1f5f9;
          color: #475569;
        }

        .export-btn-cancel:hover {
          background: #e2e8f0;
        }

        .export-btn-confirm {
          background: #3b82f6;
          color: white;
        }

        .export-btn-confirm:hover:not(:disabled) {
          background: #2563eb;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }

        .export-btn-confirm:disabled {
          background: #d1d5db;
          color: #9ca3af;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .isDark .export-btn-cancel {
          background: #4a5568;
          color: #e2e8f0;
        }

        .isDark .export-btn-cancel:hover {
          background: #718096;
        }

        .isDark .export-btn-confirm:disabled {
          background: #4a5568;
          color: #718096;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ExportEditor;