import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';

interface StructurePanelProps {
  mindMap: any;
  theme: 'light' | 'dark';
  show: boolean;
  onClose: () => void;
}

const layoutGroupList = [
  {
    name: '基础结构',
    list: [
      { value: 'logicalStructure', label: '逻辑结构图', desc: '经典的思维导图结构' },
      { value: 'mindMap', label: '思维导图', desc: '标准的思维导图布局' },
      { value: 'catalogOrganization', label: '目录组织图', desc: '层级目录结构' },
      { value: 'organizationStructure', label: '组织结构图', desc: '组织架构图' },
    ]
  },
  {
    name: '时间轴',
    list: [
      { value: 'timeline', label: '时间轴', desc: '水平时间轴布局' },
      { value: 'timeline2', label: '时间轴2', desc: '另一种时间轴样式' },
      { value: 'verticalTimeline', label: '竖向时间轴', desc: '垂直时间轴布局' },
    ]
  },
  {
    name: '特殊结构',
    list: [
      { value: 'fishbone', label: '鱼骨图', desc: '因果分析鱼骨图' },
    ]
  }
];

// 布局预览图片映射（这里用简单的背景色代替）
const layoutPreviewMap: Record<string, string> = {
  logicalStructure: '#ff6b6b',
  mindMap: '#4ecdc4',
  catalogOrganization: '#45b7d1',
  organizationStructure: '#f9ca24',
  timeline: '#f0932b',
  timeline2: '#eb4d4b',
  verticalTimeline: '#6c5ce7',
  fishbone: '#a29bfe',
};

export default function StructurePanel({
  mindMap,
  theme,
  show,
  onClose
}: StructurePanelProps) {
  const [currentLayout, setCurrentLayout] = useState('logicalStructure');

  useEffect(() => {
    if (mindMap) {
      const layout = mindMap.getLayout && mindMap.getLayout() || 'logicalStructure';
      setCurrentLayout(layout);
    }
  }, [mindMap]);

  const handleLayoutChange = (layout: string) => {
    if (!mindMap) return;
    
    setCurrentLayout(layout);
    mindMap.setLayout(layout);
    
    // 保存到本地存储
    try {
      localStorage.setItem('mindmap-layout', layout);
    } catch (e) {
      console.warn('Failed to save layout to localStorage');
    }
  };

  return (
    <Sidebar
      title="结构"
      show={show}
      onClose={onClose}
      theme={theme}
    >
      <div className="structure-panel">
        {layoutGroupList.map((group) => (
          <div key={group.name} className="panel-section">
            <div className="section-title">{group.name}</div>
            <div className="layout-grid">
              {group.list.map((layout) => (
                <div
                  key={layout.value}
                  className={`layout-item ${currentLayout === layout.value ? 'active' : ''}`}
                  onClick={() => handleLayoutChange(layout.value)}
                >
                  <div 
                    className="layout-preview"
                    style={{ backgroundColor: layoutPreviewMap[layout.value] || '#ddd' }}
                  >
                    <div className="layout-preview-content">
                      {/* 这里可以放置布局预览的SVG或图片 */}
                      <div className="preview-placeholder">
                        {layout.label.slice(0, 2)}
                      </div>
                    </div>
                  </div>
                  <div className="layout-info">
                    <div className="layout-name">{layout.label}</div>
                    <div className="layout-desc">{layout.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {/* 布局选项 */}
        <div className="panel-section">
          <div className="section-title">布局选项</div>
          
          <div className="form-item">
            <label>
              <input
                type="checkbox"
                onChange={(e) => {
                  if (mindMap) {
                    mindMap.setThemeConfig({
                      enableFreeDrag: e.target.checked
                    });
                  }
                }}
              />
              启用自由拖拽
            </label>
          </div>
          
          <div className="form-item">
            <label>
              <input
                type="checkbox"
                onChange={(e) => {
                  if (mindMap) {
                    mindMap.setThemeConfig({
                      isUseCustomNodeContent: e.target.checked
                    });
                  }
                }}
              />
              使用自定义节点内容
            </label>
          </div>
          
          <div className="form-item">
            <label>
              <input
                type="checkbox"
                defaultChecked
                onChange={(e) => {
                  if (mindMap) {
                    mindMap.setThemeConfig({
                      enableNodeRichText: e.target.checked
                    });
                  }
                }}
              />
              启用节点富文本
            </label>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}