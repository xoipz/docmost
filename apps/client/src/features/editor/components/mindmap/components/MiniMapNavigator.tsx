import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './MiniMapNavigator.css';

interface MiniMapNavigatorProps {
  mindMap: any;
  show: boolean;
  theme: 'light' | 'dark';
  onToggle: () => void;
}

export default function MiniMapNavigator({ mindMap, show, theme, onToggle }: MiniMapNavigatorProps) {
  const { t } = useTranslation();
  const navigatorBoxRef = useRef<HTMLDivElement>(null);
  const svgBoxRef = useRef<HTMLDivElement>(null);
  
  const [boxWidth, setBoxWidth] = useState(0);
  const [boxHeight, setBoxHeight] = useState(0);
  const [svgBoxScale, setSvgBoxScale] = useState(1);
  const [svgBoxLeft, setSvgBoxLeft] = useState(0);
  const [svgBoxTop, setSvgBoxTop] = useState(0);
  const [viewBoxStyle, setViewBoxStyle] = useState({
    left: 0,
    top: 0,
    bottom: 0,
    right: 0
  });
  const [mindMapImg, setMindMapImg] = useState('');
  const [mindMapSvg, setMindMapSvg] = useState('');
  const [width, setWidth] = useState(0);
  const [withTransition, setWithTransition] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // 计算容器宽度
  const setSize = () => {
    const newWidth = Math.min(window.innerWidth - 80, 370);
    setWidth(newWidth);
  };

  // 初始化容器尺寸
  const init = () => {
    if (!navigatorBoxRef.current) return;
    const { width: boxW, height: boxH } = navigatorBoxRef.current.getBoundingClientRect();
    
    // 确保尺寸合理
    if (boxW > 0 && boxH > 0) {
      setBoxWidth(boxW);
      setBoxHeight(boxH);
    } else {
    }
  };

  // 渲染小地图
  const drawMiniMap = async (forceWidth?: number, forceHeight?: number) => {
    if (!mindMap || !mindMap.miniMap) {
      return;
    }
    
    // 使用传入的尺寸或已有的状态尺寸
    const width = forceWidth || boxWidth;
    const height = forceHeight || boxHeight;
    
    if (!width || !height) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      const result = mindMap.miniMap.calculationMiniMap(width, height);
      
      if (!result) {
        console.error('calculationMiniMap 返回空结果');
        setIsLoading(false);
        return;
      }
      
      const {
        getImgUrl,
        svgHTML,
        viewBoxStyle,
        miniMapBoxScale,
        miniMapBoxLeft,
        miniMapBoxTop
      } = result;
      
      
      // 设置视口框样式和位置
      setViewBoxStyle(viewBoxStyle);
      setSvgBoxScale(miniMapBoxScale);
      setSvgBoxLeft(miniMapBoxLeft);
      setSvgBoxTop(miniMapBoxTop);
      
      // 优先使用SVG HTML，因为它能更准确地控制尺寸
      if (svgHTML) {
        setMindMapSvg(svgHTML);
        setMindMapImg('');
        setIsLoading(false);
      } else {
        // 获取图片版本作为备选
        if (getImgUrl && typeof getImgUrl === 'function') {
          getImgUrl((img: string) => {
            setIsLoading(false);
            if (img) {
              setMindMapImg(img);
              setMindMapSvg('');
            }
          });
        } else {
          console.error('getImgUrl 不是函数:', typeof getImgUrl);
          setIsLoading(false);
        }
      }
      
    } catch (error) {
      console.error('渲染小地图失败:', error);
      setIsLoading(false);
    }
  };

  // 数据变化时更新小地图
  useEffect(() => {
    if (!mindMap || !show) return;

    let timer: NodeJS.Timeout;
    const handleDataChange = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        // 确保有尺寸时才绘制
        if (boxWidth && boxHeight) {
          drawMiniMap(boxWidth, boxHeight);
        }
      }, 500); // 使用原版的500ms延迟
    };

    // 监听数据变化事件
    mindMap.on('data_change', handleDataChange);
    mindMap.on('view_data_change', handleDataChange);
    mindMap.on('node_tree_render_end', handleDataChange);

    return () => {
      clearTimeout(timer);
      mindMap.off('data_change', handleDataChange);
      mindMap.off('view_data_change', handleDataChange);
      mindMap.off('node_tree_render_end', handleDataChange);
    };
  }, [mindMap, show, boxWidth, boxHeight]);

  // 视口框位置变化
  useEffect(() => {
    if (!mindMap || !show) return;

    const handleViewBoxPositionChange = ({ left, right, top, bottom }: any) => {
      setWithTransition(false);
      setViewBoxStyle({
        left,
        right,
        top,
        bottom
      });
    };

    mindMap.on('mini_map_view_box_position_change', handleViewBoxPositionChange);

    return () => {
      mindMap.off('mini_map_view_box_position_change', handleViewBoxPositionChange);
    };
  }, [mindMap, show]);

  // 窗口大小变化
  useEffect(() => {
    let sizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(sizeTimer);
      sizeTimer = setTimeout(() => {
        setSize();
        if (show && navigatorBoxRef.current) {
          const rect = navigatorBoxRef.current.getBoundingClientRect();
          const width = rect?.width || Math.min(window.innerWidth - 80, 370);
          const height = rect?.height || 220;
          setBoxWidth(width);
          setBoxHeight(height);
          setTimeout(() => {
            drawMiniMap(width, height);
          }, 100);
        }
      }, 300);
    };

    setSize();
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(sizeTimer);
      window.removeEventListener('resize', handleResize);
    };
  }, [show]);

  // 显示/隐藏时初始化
  useEffect(() => {
    if (show && navigatorBoxRef.current && mindMap) {
      
      // 确保思维导图已经完全渲染
      const initMiniMap = () => {
        if (mindMap && mindMap.renderer && mindMap.renderer.root) {
          
          // 获取容器尺寸并立即绘制
          const rect = navigatorBoxRef.current?.getBoundingClientRect();
          let width = rect?.width || 0;
          let height = rect?.height || 0;
          
          // 如果没有获取到尺寸，使用默认值
          if (!width || !height) {
            width = Math.min(window.innerWidth - 80, 370);
            height = 220;
          }
          
          // 更新状态并立即绘制
          setBoxWidth(width);
          setBoxHeight(height);
          
          // 直接调用绘制，传入尺寸
          setTimeout(() => {
            drawMiniMap(width, height);
          }, 50);
          
        } else {
          setTimeout(initMiniMap, 100);
        }
      };
      
      // 立即执行
      initMiniMap();
    } else if (!show) {
      setMindMapImg('');
      setMindMapSvg('');
      setIsLoading(false);
    }
  }, [show, mindMap]);

  // 鼠标事件处理
  const handleMouseDown = (e: React.MouseEvent) => {
    if (mindMap && mindMap.miniMap) {
      mindMap.miniMap.onMousedown(e.nativeEvent);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (mindMap && mindMap.miniMap) {
      mindMap.miniMap.onMousemove(e.nativeEvent);
    }
  };

  const handleViewBoxMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mindMap && mindMap.miniMap) {
      mindMap.miniMap.onViewBoxMousedown(e.nativeEvent);
    }
  };

  const handleViewBoxMouseMove = (e: React.MouseEvent) => {
    if (mindMap && mindMap.miniMap) {
      mindMap.miniMap.onViewBoxMousemove(e.nativeEvent);
    }
  };

  // 鼠标松开事件（全局）
  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      if (!withTransition) {
        setWithTransition(true);
      }
      if (mindMap && mindMap.miniMap) {
        mindMap.miniMap.onMouseup(e);
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [mindMap, withTransition]);

  if (!show) return null;

  return (
    <div
      ref={navigatorBoxRef}
      className={`minimap-navigator-box ${theme === 'dark' ? 'isDark' : ''}`}
      style={{ 
        width: width + 'px',
        height: '220px' // 确保高度固定为220px
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
    >
      <div
        ref={svgBoxRef}
        className="minimap-svg-box"
        style={{
          transform: `scale(${svgBoxScale})`,
          left: svgBoxLeft + 'px',
          top: svgBoxTop + 'px',
          width: 'auto', // 让宽度自适应
          height: 'auto' // 让高度自适应
        }}
      >
        {mindMapSvg ? (
          <div 
            dangerouslySetInnerHTML={{ __html: mindMapSvg }}
            onMouseDown={(e) => e.preventDefault()}
          />
        ) : mindMapImg ? (
          <img 
            src={mindMapImg} 
            alt="思维导图小地图"
            onMouseDown={(e) => e.preventDefault()}
            onLoad={(e) => {
              const img = e.target as HTMLImageElement;
            }}
            style={{ 
              maxWidth: 'none', // 移除最大宽度限制
              maxHeight: 'none', // 移除最大高度限制
              width: 'auto',
              height: 'auto'
            }}
          />
        ) : (
          <div 
            style={{ 
              width: '100%', 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: theme === 'dark' ? '#666' : '#999',
              fontSize: '12px',
              cursor: isLoading ? 'default' : 'pointer'
            }}
            onClick={() => !isLoading && drawMiniMap(boxWidth, boxHeight)}
          >
            {isLoading ? '生成中...' : '点击重试'}
          </div>
        )}
      </div>
      <div
        className={`minimap-window-box ${withTransition ? 'withTransition' : ''}`}
        style={viewBoxStyle}
        onMouseDown={handleViewBoxMouseDown}
        onMouseMove={handleViewBoxMouseMove}
      />
    </div>
  );
}