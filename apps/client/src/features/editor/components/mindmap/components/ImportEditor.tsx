import React, { useState, useRef } from 'react';
import { IconX, IconUpload, IconCheck, IconFileImport, IconAlertCircle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface ImportEditorProps {
  show: boolean;
  onClose: () => void;
  onConfirm: (data: any) => void;
  theme: 'light' | 'dark';
}

const ImportEditor: React.FC<ImportEditorProps> = ({
  show,
  onClose,
  onConfirm,
  theme
}) => {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 支持的文件格式
  const supportedFormats = ['.smm', '.json', '.xmind', '.md'];
  const acceptString = supportedFormats.join(',');

  const handleFileSelect = (file: File) => {
    const fileName = file.name.toLowerCase();
    const isSupported = supportedFormats.some(format => fileName.endsWith(format));
    
    if (!isSupported) {
      setError(t('mindmap.import.unsupportedFormat', { formats: supportedFormats.join(', ') }));
      return;
    }

    setSelectedFile(file);
    setError('');
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const parseFile = async (file: File): Promise<any> => {
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.smm') || fileName.endsWith('.json')) {
      // SMM/JSON 文件解析
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        if (typeof data !== 'object') {
          throw new Error('Invalid file format');
        }
        return data;
      } catch (error) {
        throw new Error(t('mindmap.import.parseError'));
      }
    } else if (fileName.endsWith('.md')) {
      // Markdown 文件解析
      const text = await file.text();
      try {
        // 动态导入 markdown 解析器
        const { default: markdown } = await import('simple-mind-map/src/parse/markdown.js');
        return markdown.transformMarkdownTo(text);
      } catch (error) {
        throw new Error(t('mindmap.import.parseError'));
      }
    } else if (fileName.endsWith('.xmind')) {
      // XMind 文件解析
      try {
        // 动态导入 xmind 解析器
        const { default: xmind } = await import('simple-mind-map/src/parse/xmind.js');
        return await xmind.parseXmindFile(file);
      } catch (error) {
        throw new Error(t('mindmap.import.parseError'));
      }
    }
    
    throw new Error(t('mindmap.import.unsupportedFormat'));
  };

  const handleConfirm = async () => {
    if (!selectedFile) {
      setError(t('mindmap.import.noFileSelected'));
      return;
    }

    setIsLoading(true);
    try {
      const data = await parseFile(selectedFile);
      onConfirm(data);
      onClose();
      setSelectedFile(null);
    } catch (error) {
      setError(error.message || t('mindmap.import.parseError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const reset = () => {
    setSelectedFile(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!show) return null;

  return (
    <div className={`import-editor-overlay ${theme === 'dark' ? 'isDark' : ''}`} onClick={handleOverlayClick}>
      <div className="import-editor-dialog">
        <div className="import-editor-header">
          <div className="import-editor-title">
            <IconFileImport size={20} />
            <span>{t('mindmap.import.title')}</span>
          </div>
          <button 
            className="import-editor-close" 
            onClick={handleClose}
            type="button"
          >
            <IconX size={16} />
          </button>
        </div>

        <div className="import-editor-content">
          {/* 文件上传区域 */}
          <div 
            className={`file-upload-area ${dragActive ? 'drag-active' : ''} ${selectedFile ? 'has-file' : ''}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptString}
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />
            
            {selectedFile ? (
              <div className="selected-file">
                <div className="file-icon">📄</div>
                <div className="file-info">
                  <div className="file-name">{selectedFile.name}</div>
                  <div className="file-size">{(selectedFile.size / 1024).toFixed(1)} KB</div>
                </div>
                <button
                  className="file-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    reset();
                  }}
                >
                  <IconX size={16} />
                </button>
              </div>
            ) : (
              <div className="upload-prompt">
                <IconUpload size={48} className="upload-icon" />
                <h3>{t('mindmap.import.dragDropText')}</h3>
                <p>{t('mindmap.import.orClickToSelect')}</p>
                <div className="supported-formats">
                  <span>{t('mindmap.import.supportedFormats')}:</span>
                  <span className="format-list">{supportedFormats.join(', ')}</span>
                </div>
              </div>
            )}
          </div>

          {/* 错误信息 */}
          {error && (
            <div className="error-message">
              <IconAlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* 格式说明 */}
          <div className="format-info">
            <h4>{t('mindmap.import.formatDescriptions')}</h4>
            <ul>
              <li><strong>.smm/.json</strong>: {t('mindmap.import.smmDescription')}</li>
              <li><strong>.xmind</strong>: {t('mindmap.import.xmindDescription')}</li>
              <li><strong>.md</strong>: {t('mindmap.import.markdownDescription')}</li>
            </ul>
          </div>
        </div>

        <div className="import-editor-footer">
          <button 
            type="button" 
            className="import-btn import-btn-cancel" 
            onClick={handleClose}
          >
            {t('Cancel')}
          </button>
          <button 
            type="button" 
            className="import-btn import-btn-confirm" 
            onClick={handleConfirm}
            disabled={!selectedFile || isLoading}
          >
            {isLoading ? (
              <>
                <div className="loading-spinner" />
                {t('mindmap.import.importing')}
              </>
            ) : (
              <>
                <IconCheck size={16} />
                {t('mindmap.import.import')}
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        .import-editor-overlay {
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

        .import-editor-overlay.isDark {
          background: rgba(0, 0, 0, 0.7);
        }

        .import-editor-dialog {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 600px;
          max-height: 80vh;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
        }

        .isDark .import-editor-dialog {
          background: #2d3748;
          color: white;
        }

        .import-editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
        }

        .isDark .import-editor-header {
          border-bottom-color: #4a5568;
        }

        .import-editor-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 600;
          color: #1a202c;
        }

        .isDark .import-editor-title {
          color: #f7fafc;
        }

        .import-editor-close {
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

        .import-editor-close:hover {
          background: #f1f5f9;
          color: #334155;
        }

        .isDark .import-editor-close {
          color: #a0aec0;
        }

        .isDark .import-editor-close:hover {
          background: #4a5568;
          color: #e2e8f0;
        }

        .import-editor-content {
          flex: 1;
          overflow: auto;
          padding: 24px;
        }

        .file-upload-area {
          border: 2px dashed #d1d5db;
          border-radius: 12px;
          padding: 40px 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 20px;
          background: #f9fafb;
        }

        .file-upload-area:hover, .file-upload-area.drag-active {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .isDark .file-upload-area {
          background: #4a5568;
          border-color: #718096;
        }

        .isDark .file-upload-area:hover, .isDark .file-upload-area.drag-active {
          border-color: #63b3ed;
          background: #5a6573;
        }

        .file-upload-area.has-file {
          border-color: #10b981;
          background: #ecfdf5;
        }

        .isDark .file-upload-area.has-file {
          border-color: #34d399;
          background: #064e3b;
        }

        .selected-file {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .file-icon {
          font-size: 32px;
        }

        .file-info {
          text-align: left;
        }

        .file-name {
          font-weight: 500;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .isDark .file-name {
          color: #e2e8f0;
        }

        .file-size {
          font-size: 12px;
          color: #6b7280;
        }

        .isDark .file-size {
          color: #a0aec0;
        }

        .file-remove {
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s;
        }

        .file-remove:hover {
          background: #dc2626;
        }

        .upload-prompt h3 {
          margin: 16px 0 8px;
          font-size: 18px;
          color: #1f2937;
        }

        .isDark .upload-prompt h3 {
          color: #e2e8f0;
        }

        .upload-prompt p {
          margin: 0 0 16px;
          color: #6b7280;
        }

        .isDark .upload-prompt p {
          color: #a0aec0;
        }

        .upload-icon {
          color: #9ca3af;
          margin-bottom: 8px;
        }

        .isDark .upload-icon {
          color: #718096;
        }

        .supported-formats {
          font-size: 12px;
          color: #6b7280;
          margin-top: 12px;
        }

        .isDark .supported-formats {
          color: #a0aec0;
        }

        .format-list {
          font-family: monospace;
          background: rgba(59, 130, 246, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
          margin-left: 4px;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          color: #dc2626;
          font-size: 14px;
          margin-bottom: 16px;
        }

        .isDark .error-message {
          background: #991b1b;
          border-color: #dc2626;
          color: #fca5a5;
        }

        .format-info {
          padding: 16px;
          background: #f8fafc;
          border-radius: 8px;
          border-left: 3px solid #3b82f6;
        }

        .isDark .format-info {
          background: #1a202c;
          border-left-color: #63b3ed;
        }

        .format-info h4 {
          margin: 0 0 12px;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .isDark .format-info h4 {
          color: #e2e8f0;
        }

        .format-info ul {
          margin: 0;
          padding-left: 20px;
          list-style-type: disc;
        }

        .format-info li {
          margin-bottom: 6px;
          font-size: 13px;
          color: #6b7280;
          line-height: 1.4;
        }

        .isDark .format-info li {
          color: #a0aec0;
        }

        .import-editor-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 20px 24px;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .isDark .import-editor-footer {
          border-top-color: #4a5568;
          background: #1a202c;
        }

        .import-btn {
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

        .import-btn-cancel {
          background: #f1f5f9;
          color: #475569;
        }

        .import-btn-cancel:hover {
          background: #e2e8f0;
        }

        .import-btn-confirm {
          background: #3b82f6;
          color: white;
        }

        .import-btn-confirm:hover:not(:disabled) {
          background: #2563eb;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }

        .import-btn-confirm:disabled {
          background: #d1d5db;
          color: #9ca3af;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .isDark .import-btn-cancel {
          background: #4a5568;
          color: #e2e8f0;
        }

        .isDark .import-btn-cancel:hover {
          background: #718096;
        }

        .isDark .import-btn-confirm:disabled {
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

export default ImportEditor;