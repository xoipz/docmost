import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';

interface OutlinePanelProps {
  mindMap: any;
  theme: 'light' | 'dark';
  show: boolean;
  onClose: () => void;
}

interface OutlineItem {
  text: string;
  level: number;
  uid: string;
  isRoot: boolean;
}

export default function OutlinePanel({
  mindMap,
  theme,
  show,
  onClose
}: OutlinePanelProps) {
  const [outline, setOutline] = useState<OutlineItem[]>([]);

  const generateOutline = () => {
    if (!mindMap) return [];
    
    try {
      const data = mindMap.getData();
      const result: OutlineItem[] = [];
      
      const traverse = (node: any, level: number = 0) => {
        result.push({
          text: node.data.text || '空节点',
          level,
          uid: node.data.uid,
          isRoot: level === 0
        });
        
        if (node.children && node.children.length > 0) {
          node.children.forEach((child: any) => traverse(child, level + 1));
        }
      };
      
      traverse(data);
      return result;
    } catch (error) {
      console.error('生成大纲失败:', error);
      return [];
    }
  };

  useEffect(() => {
    if (mindMap && show) {
      setOutline(generateOutline());
      
      // 监听数据变化，实时更新大纲
      const handleDataChange = () => {
        setOutline(generateOutline());
      };
      
      mindMap.on('data_change', handleDataChange);
      mindMap.on('node_active', handleDataChange);
      
      return () => {
        mindMap.off('data_change', handleDataChange);
        mindMap.off('node_active', handleDataChange);
      };
    }
  }, [mindMap, show]);

  const handleOutlineItemClick = (uid: string) => {
    if (!mindMap) return;
    
    try {
      // 查找并激活对应的节点
      const findNodeByUid = (node: any, targetUid: string): any => {
        if (node.uid === targetUid) return node;
        if (node.children) {
          for (const child of node.children) {
            const found = findNodeByUid(child, targetUid);
            if (found) return found;
          }
        }
        return null;
      };
      
      const rootNode = mindMap.renderer.root;
      const targetNode = findNodeByUid(rootNode, uid);
      
      if (targetNode) {
        // 激活节点
        mindMap.execCommand('SET_NODE_ACTIVE', targetNode, true);
        // 居中显示该节点
        mindMap.renderer.moveNodeToCenter(targetNode);
      }
    } catch (error) {
      console.error('定位节点失败:', error);
    }
  };

  const getIndentStyle = (level: number) => ({
    paddingLeft: `${level * 16}px`
  });

  return (
    <Sidebar
      title="大纲"
      show={show}
      onClose={onClose}
      theme={theme}
    >
      <div className="outline-panel">
        <div className="panel-section">
          <div className="section-title">
            大纲视图
            <span className="outline-count">({outline.length})</span>
          </div>
          
          {outline.length > 0 ? (
            <div className="outline-list">
              {outline.map((item, index) => (
                <div
                  key={`${item.uid}-${index}`}
                  className={`outline-item ${item.isRoot ? 'root' : ''}`}
                  style={getIndentStyle(item.level)}
                  onClick={() => handleOutlineItemClick(item.uid)}
                >
                  <div className="outline-bullet">
                    {item.isRoot ? '●' : '○'}
                  </div>
                  <div className="outline-text">
                    {item.text}
                  </div>
                  <div className="outline-level">
                    L{item.level}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>暂无大纲数据</p>
            </div>
          )}
          
          <div className="outline-actions">
            <button 
              className="outline-btn"
              onClick={() => setOutline(generateOutline())}
            >
              刷新大纲
            </button>
            <button 
              className="outline-btn"
              onClick={() => {
                const text = outline.map(item => 
                  `${'  '.repeat(item.level)}${item.level === 0 ? '# ' : '- '}${item.text}`
                ).join('\n');
                
                navigator.clipboard?.writeText(text).then(() => {
                  alert('大纲已复制到剪贴板');
                }).catch(() => {
                  // 降级处理
                  const textArea = document.createElement('textarea');
                  textArea.value = text;
                  document.body.appendChild(textArea);
                  textArea.select();
                  document.execCommand('copy');
                  document.body.removeChild(textArea);
                  alert('大纲已复制到剪贴板');
                });
              }}
            >
              复制大纲
            </button>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}