import React, { useState, useEffect, useRef } from 'react';
import { IconX, IconCheck, IconMathFunction } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface FormulaEditorProps {
  show: boolean;
  onClose: () => void;
  onConfirm: (formula: string) => void;
  theme: 'light' | 'dark';
}

// 常用公式列表
const formulaList = [
  'a^2',
  'a_2', 
  'a^{2+2}',
  'a_{i,j}',
  'x_2^3',
  '\\overbrace{1+2+\\cdots+100}',
  '\\sum_{k=1}^N k^2',
  '\\lim_{n \\to \\infty}x_n',
  '\\int_{-N}^{N} e^x\\, dx',
  '\\sqrt{3}',
  '\\sqrt[n]{3}',
  '\\sin\\theta',
  '\\log X',
  '\\log_{10}',
  '\\log_\\alpha X',
  '\\lim_{t\\to n}T',
  '\\frac{1}{2}=0.5',
  '\\binom{n}{k}',
  '\\begin{matrix}x & y \\\\z & v\\end{matrix}',
  '\\begin{cases}3x + 5y +  z \\\\7x - 2y + 4z \\\\-6x + 3y + 2z\\end{cases}'
];

const FormulaEditor: React.FC<FormulaEditorProps> = ({
  show,
  onClose,
  onConfirm,
  theme
}) => {
  const { t } = useTranslation();
  const [formulaText, setFormulaText] = useState('');
  const [renderedFormulas, setRenderedFormulas] = useState<Array<{text: string, html: string}>>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (show) {
      setFormulaText('');
      // 聚焦文本框
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 100);
      
      // 渲染常用公式（使用直接导入的 katex）
      try {
        const rendered = formulaList.map(formula => ({
          text: formula,
          html: katex.renderToString(formula, {
            throwOnError: false,
            displayMode: false
          })
        }));
        setRenderedFormulas(rendered);
      } catch (error) {
        console.warn('KaTeX 渲染失败:', error);
        setRenderedFormulas([]);
      }
    }
  }, [show]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
    // 阻止事件冒泡，避免影响思维导图的键盘操作
    e.stopPropagation();
  };

  const handleConfirm = () => {
    const formula = formulaText.trim();
    if (formula) {
      onConfirm(formula);
      onClose();
    }
  };

  const handleFormulaSelect = (formula: string) => {
    setFormulaText(formula);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!show) return null;

  return (
    <div className={`formula-editor-overlay ${theme === 'dark' ? 'isDark' : ''}`} onClick={handleOverlayClick}>
      <div className="formula-editor-dialog">
        <div className="formula-editor-header">
          <div className="formula-editor-title">
            <IconMathFunction size={20} />
            <span>{t('mindmap_formula_title')}</span>
          </div>
          <button 
            className="formula-editor-close" 
            onClick={onClose}
            type="button"
          >
            <IconX size={16} />
          </button>
        </div>

        <div className="formula-editor-content">
          {/* 输入区域 */}
          <div className="formula-input-section">
            <label className="formula-label">{t('mindmap_formula_inputLabel')}</label>
            <textarea
              ref={textareaRef}
              value={formulaText}
              onChange={(e) => setFormulaText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('mindmap_formula_placeholder')}
              className="formula-input"
              rows={4}
            />
            <div className="formula-tip">
              {t('mindmap_formula_tip')}
            </div>
          </div>

          {/* 常用公式 */}
          <div className="formula-list-section">
              <h4 className="formula-section-title">{t('mindmap_formula_commonFormulas')}</h4>
              <div className="formula-list">
                {renderedFormulas.length > 0 ? renderedFormulas.map((item, index) => (
                  <div
                    key={index}
                    className="formula-item"
                    onClick={() => handleFormulaSelect(item.text)}
                  >
                    <div 
                      className="formula-preview"
                      dangerouslySetInnerHTML={{ __html: item.html }}
                    />
                    <div className="formula-source">{item.text}</div>
                  </div>
                )) : formulaList.map((formula, index) => (
                  <div
                    key={index}
                    className="formula-item"
                    onClick={() => handleFormulaSelect(formula)}
                  >
                    <div className="formula-preview">{formula}</div>
                    <div className="formula-source">{formula}</div>
                  </div>
                ))}
              </div>
            </div>
        </div>

        <div className="formula-editor-footer">
          <button 
            type="button" 
            className="formula-btn formula-btn-cancel" 
            onClick={onClose}
          >
            {t('Cancel')}
          </button>
          <button 
            type="button" 
            className="formula-btn formula-btn-confirm" 
            onClick={handleConfirm}
            disabled={!formulaText.trim()}
          >
            <IconCheck size={16} />
            {t('Confirm')}
          </button>
        </div>
      </div>

      <style>{`
        .formula-editor-overlay {
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

        .formula-editor-overlay.isDark {
          background: rgba(0, 0, 0, 0.7);
        }

        .formula-editor-dialog {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 700px;
          max-height: 80vh;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
        }

        .isDark .formula-editor-dialog {
          background: #2d3748;
          color: white;
        }

        .formula-editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
        }

        .isDark .formula-editor-header {
          border-bottom-color: #4a5568;
        }

        .formula-editor-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 600;
          color: #1a202c;
        }

        .isDark .formula-editor-title {
          color: #f7fafc;
        }

        .formula-editor-close {
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

        .formula-editor-close:hover {
          background: #f1f5f9;
          color: #334155;
        }

        .isDark .formula-editor-close {
          color: #a0aec0;
        }

        .isDark .formula-editor-close:hover {
          background: #4a5568;
          color: #e2e8f0;
        }

        .formula-editor-content {
          flex: 1;
          overflow: auto;
          padding: 24px;
        }

        .formula-input-section {
          margin-bottom: 24px;
        }

        .formula-label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .isDark .formula-label {
          color: #e2e8f0;
        }

        .formula-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          font-family: 'Fira Code', 'Consolas', monospace;
          resize: vertical;
          min-height: 80px;
          transition: all 0.2s;
        }

        .formula-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .isDark .formula-input {
          background: #4a5568;
          border-color: #718096;
          color: white;
        }

        .isDark .formula-input:focus {
          border-color: #63b3ed;
          box-shadow: 0 0 0 3px rgba(99, 179, 237, 0.1);
        }

        .formula-tip {
          margin-top: 8px;
          font-size: 12px;
          color: #6b7280;
          line-height: 1.4;
        }

        .isDark .formula-tip {
          color: #a0aec0;
        }

        .formula-list-section {
          border-top: 1px solid #e2e8f0;
          padding-top: 24px;
        }

        .isDark .formula-list-section {
          border-top-color: #4a5568;
        }

        .formula-section-title {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 500;
          color: #374151;
        }

        .isDark .formula-section-title {
          color: #e2e8f0;
        }

        .formula-list {
          display: grid;
          gap: 12px;
          max-height: 300px;
          overflow-y: auto;
        }

        .formula-item {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          gap: 16px;
        }

        .formula-item:hover {
          border-color: #3b82f6;
          background: #f8fafc;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .isDark .formula-item {
          border-color: #4a5568;
          background: #4a5568;
        }

        .isDark .formula-item:hover {
          border-color: #63b3ed;
          background: #5a6573;
        }

        .formula-preview {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 40px;
          font-size: 16px;
        }

        .formula-source {
          flex: 1;
          font-family: 'Fira Code', 'Consolas', monospace;
          font-size: 13px;
          color: #6b7280;
          padding: 8px 12px;
          background: #f9fafb;
          border-radius: 4px;
          word-break: break-all;
        }

        .isDark .formula-source {
          background: #2d3748;
          color: #a0aec0;
        }

        .formula-editor-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 20px 24px;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .isDark .formula-editor-footer {
          border-top-color: #4a5568;
          background: #1a202c;
        }

        .formula-btn {
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

        .formula-btn-cancel {
          background: #f1f5f9;
          color: #475569;
        }

        .formula-btn-cancel:hover {
          background: #e2e8f0;
        }

        .formula-btn-confirm {
          background: #3b82f6;
          color: white;
        }

        .formula-btn-confirm:hover:not(:disabled) {
          background: #2563eb;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }

        .formula-btn-confirm:disabled {
          background: #d1d5db;
          color: #9ca3af;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .isDark .formula-btn-cancel {
          background: #4a5568;
          color: #e2e8f0;
        }

        .isDark .formula-btn-cancel:hover {
          background: #718096;
        }

        .isDark .formula-btn-confirm:disabled {
          background: #4a5568;
          color: #718096;
        }
      `}</style>
    </div>
  );
};

export default FormulaEditor;