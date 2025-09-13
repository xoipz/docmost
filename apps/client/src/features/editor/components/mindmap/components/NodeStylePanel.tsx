import { useState, useEffect } from 'react';
import { IconBold, IconItalic, IconUnderline, IconStrikethrough } from '@tabler/icons-react';
import Sidebar from './Sidebar';
import { SmartColorPicker } from './EnhancedColorPicker';
import '../styles/node-style-panel.css';

interface NodeStylePanelProps {
  mindMap: any;
  theme: 'light' | 'dark';
  show: boolean;
  onClose: () => void;
  activeNodes: any[];
}

const fontFamilyList = [
  { name: '微软雅黑', value: '微软雅黑, Microsoft YaHei' },
  { name: '宋体', value: '宋体, SimSun, Songti SC' },
  { name: '楷体', value: '楷体, 楷体_GB2312, SimKai, STKaiti' },
  { name: '黑体', value: '黑体, SimHei, Heiti SC' },
  { name: 'Arial', value: 'arial, helvetica, sans-serif' },
  { name: 'Times New Roman', value: 'times new roman' },
  { name: 'sans-serif', value: 'sans-serif' },
  { name: 'serif', value: 'serif' },
];

const fontSizeList = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48];

const colorList = [
  '#4D4D4D', '#999999', '#FFFFFF', '#F44E3B', '#FE9200', '#FCDC00',
  '#DBDF00', '#A4DD00', '#68CCCA', '#73D8FF', '#AEA1FF', '#FDA1FF',
  '#333333', '#808080', '#cccccc', '#D33115', '#E27300', '#FCC400',
  '#B0BC00', '#68BC00', '#16A5A5', '#009CE0', '#7B64FF', '#FA28FF',
  '#000000', '#666666', '#B3B3B3', '#9F0500', '#C45100', '#FB9E00',
  '#808900', '#194D33', '#0C797D', '#0062B1', '#653294', 'transparent'
];

const alignList = [
  { name: '居左', value: 'left' },
  { name: '居中', value: 'center' },
  { name: '居右', value: 'right' },
];

// 节点形状选项
const shapeList = [
  { name: '矩形', value: 'rectangle' },
  { name: '菱形', value: 'diamond' },
  { name: '平行四边形', value: 'parallelogram' },
  { name: '圆角矩形', value: 'roundedRectangle' },
  { name: '八角矩形', value: 'octagonalRectangle' },
  { name: '外三角矩形', value: 'outerTriangularRectangle' },
  { name: '内三角矩形', value: 'innerTriangularRectangle' },
  { name: '椭圆', value: 'ellipse' },
  { name: '圆形', value: 'circle' }
];

// 边框虚线样式
const borderDasharrayList = [
  { name: '无', value: 'none' },
  { name: '虚线1', value: '5,5' },
  { name: '虚线2', value: '10,10' },
  { name: '虚线3', value: '20,10,5,5,5,10' },
  { name: '虚线4', value: '5,5,1,5' },
  { name: '虚线5', value: '15,10,5,10,15' },
  { name: '虚线6', value: '1,5' }
];

// 渐变方向
const gradientDirections = [
  { name: '从左到右', value: 'to right' },
  { name: '从右到左', value: 'to left' },
  { name: '从上到下', value: 'to bottom' },
  { name: '从下到上', value: 'to top' },
  { name: '左上到右下', value: 'to bottom right' },
  { name: '右上到左下', value: 'to bottom left' },
  { name: '左下到右上', value: 'to top right' },
  { name: '右下到左上', value: 'to top left' }
];

export default function NodeStylePanel({
  mindMap,
  theme,
  show,
  onClose,
  activeNodes
}: NodeStylePanelProps) {
  const [style, setStyle] = useState<any>({});

  useEffect(() => {
    if (activeNodes.length > 0 && activeNodes[0]) {
      const node = activeNodes[0];
      setStyle({
        fontFamily: node.getStyle('fontFamily', false) || '微软雅黑, Microsoft YaHei',
        fontSize: node.getStyle('fontSize', false) || 16,
        color: node.getStyle('color', false) || '#333333',
        backgroundColor: node.getStyle('fillColor', false) || '#ffffff',
        fontWeight: node.getStyle('fontWeight', false) || 'normal',
        fontStyle: node.getStyle('fontStyle', false) || 'normal',
        textDecoration: node.getStyle('textDecoration', false) || 'none',
        textAlign: node.getStyle('textAlign', false) || 'center',
        borderColor: node.getStyle('borderColor', false) || '#549688',
        borderWidth: node.getStyle('borderWidth', false) || 1,
        borderRadius: node.getStyle('borderRadius', false) || 5,
        borderDasharray: node.getStyle('borderDasharray', false) || 'none',
        shape: node.getStyle('shape', false) || 'rectangle',
        gradientStyle: node.getStyle('gradientStyle', false) || false,
        startColor: node.getStyle('startColor', false) || '#ffffff',
        endColor: node.getStyle('endColor', false) || '#333333',
        gradientDirection: node.getStyle('gradientDirection', false) || 'to right',
        paddingX: node.getStyle('paddingX', false) || 15,
        paddingY: node.getStyle('paddingY', false) || 8
      });
    }
  }, [activeNodes]);

  const update = (key: string, value: any) => {
    if (!mindMap || activeNodes.length === 0) return;
    
    const newStyle = { ...style, [key]: value };
    setStyle(newStyle);
    
    // 使用正确的API方法更新节点样式
    activeNodes.forEach(node => {
      node.setStyle(key, value);
    });
    
    // 重新渲染
    mindMap.render();
  };

  const toggleFontWeight = () => {
    const newWeight = style.fontWeight === 'bold' ? 'normal' : 'bold';
    update('fontWeight', newWeight);
  };

  const toggleFontStyle = () => {
    const newStyle = style.fontStyle === 'italic' ? 'normal' : 'italic';
    update('fontStyle', newStyle);
  };

  const toggleTextDecoration = (decoration: string) => {
    const currentDecorations = style.textDecoration?.split(' ').filter(Boolean) || [];
    const hasDecoration = currentDecorations.includes(decoration);
    
    let newDecorations;
    if (hasDecoration) {
      newDecorations = currentDecorations.filter((d: string) => d !== decoration);
    } else {
      newDecorations = [...currentDecorations, decoration];
    }
    
    const newValue = newDecorations.length > 0 ? newDecorations.join(' ') : 'none';
    update('textDecoration', newValue);
  };

  const ColorPicker = ({ color, onChange }: { color: string; onChange: (color: string) => void }) => null; // 已被SmartColorPicker替换

  return (
    <Sidebar
      title="节点样式"
      show={show}
      onClose={onClose}
      theme={theme}
    >
      {activeNodes.length > 0 ? (
        <div className="node-style-panel">
          {/* 文字样式 */}
          <div className="panel-section">
            <div className="section-title">文字</div>
            
            {/* 字体和字号 */}
            <div className="form-row">
              <div className="form-item">
                <select
                  value={style.fontFamily}
                  onChange={(e) => update('fontFamily', e.target.value)}
                  className="form-select"
                >
                  {fontFamilyList.map((font) => (
                    <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                      {font.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-item">
                <select
                  value={style.fontSize}
                  onChange={(e) => update('fontSize', parseInt(e.target.value))}
                  className="form-select small"
                >
                  {fontSizeList.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-item">
                <select
                  value={style.textAlign}
                  onChange={(e) => update('textAlign', e.target.value)}
                  className="form-select small"
                >
                  {alignList.map((align) => (
                    <option key={align.value} value={align.value}>
                      {align.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 文字样式按钮 - 单独一行 */}
            <div className="form-row">
              <div className="style-btn-group">
                <div 
                  className={`style-btn ${style.fontWeight === 'bold' ? 'active' : ''}`}
                  onClick={toggleFontWeight}
                  title="粗体"
                >
                  <IconBold size={16} />
                </div>
                <div 
                  className={`style-btn ${style.fontStyle === 'italic' ? 'active' : ''}`}
                  onClick={toggleFontStyle}
                  title="斜体"
                >
                  <IconItalic size={16} />
                </div>
                <div 
                  className={`style-btn ${style.textDecoration?.includes('underline') ? 'active' : ''}`}
                  onClick={() => toggleTextDecoration('underline')}
                  title="下划线"
                >
                  <IconUnderline size={16} />
                </div>
                <div 
                  className={`style-btn ${style.textDecoration?.includes('line-through') ? 'active' : ''}`}
                  onClick={() => toggleTextDecoration('line-through')}
                  title="删除线"
                >
                  <IconStrikethrough size={16} />
                </div>
              </div>
            </div>

            {/* 文字颜色 */}
            <div className="form-item">
              <label>文字颜色</label>
              <SmartColorPicker
                value={style.color}
                onChange={(color) => update('color', color)}
                type="text"
                size="sm"
              />
            </div>
          </div>

          {/* 背景和边框 */}
          <div className="panel-section">
            <div className="section-title">背景和边框</div>
            
            <div className="form-item">
              <label>背景颜色</label>
              <SmartColorPicker
                value={style.backgroundColor}
                onChange={(color) => update('fillColor', color)}
                type="background"
                size="sm"
              />
            </div>

            {/* 渐变背景选项 */}
            <div className="form-item">
              <label>
                <input
                  type="checkbox"
                  checked={style.gradientStyle}
                  onChange={(e) => update('gradientStyle', e.target.checked)}
                />
                启用渐变背景
              </label>
            </div>

            {style.gradientStyle && (
              <>
                <div className="form-row">
                  <div className="form-item">
                    <label>开始颜色</label>
                    <SmartColorPicker
                      value={style.startColor}
                      onChange={(color) => update('startColor', color)}
                      type="background"
                      size="sm"
                    />
                  </div>
                  <div className="form-item">
                    <label>结束颜色</label>
                    <SmartColorPicker
                      value={style.endColor}
                      onChange={(color) => update('endColor', color)}
                      type="background"
                      size="sm"
                    />
                  </div>
                </div>
                <div className="form-item">
                  <label>渐变方向</label>
                  <select
                    value={style.gradientDirection}
                    onChange={(e) => update('gradientDirection', e.target.value)}
                    className="form-select"
                  >
                    {gradientDirections.map((dir) => (
                      <option key={dir.value} value={dir.value}>
                        {dir.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="form-item">
              <label>边框颜色</label>
              <SmartColorPicker
                value={style.borderColor}
                onChange={(color) => update('borderColor', color)}
                type="border"
                size="sm"
              />
            </div>

            <div className="form-row">
              <div className="form-item">
                <label>边框样式</label>
                <select
                  value={style.borderDasharray}
                  onChange={(e) => update('borderDasharray', e.target.value)}
                  className="form-select"
                >
                  {borderDasharrayList.map((dash) => (
                    <option key={dash.value} value={dash.value}>
                      {dash.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-item">
                <label>边框宽度</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={style.borderWidth}
                  onChange={(e) => update('borderWidth', parseInt(e.target.value))}
                  className="form-input small"
                />
              </div>
              <div className="form-item">
                <label>圆角</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={style.borderRadius}
                  onChange={(e) => update('borderRadius', parseInt(e.target.value))}
                  className="form-input small"
                />
              </div>
            </div>
          </div>

          {/* 节点形状 */}
          <div className="panel-section">
            <div className="section-title">节点形状</div>
            <div className="form-item">
              <select
                value={style.shape}
                onChange={(e) => update('shape', e.target.value)}
                className="form-select"
              >
                {shapeList.map((shape) => (
                  <option key={shape.value} value={shape.value}>
                    {shape.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 节点内边距 */}
          <div className="panel-section">
            <div className="section-title">节点内边距</div>
            <div className="form-row">
              <div className="form-item">
                <label>水平边距: {style.paddingX}px</label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={style.paddingX}
                  onChange={(e) => update('paddingX', parseInt(e.target.value))}
                  className="form-range"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-item">
                <label>垂直边距: {style.paddingY}px</label>
                <input
                  type="range"
                  min="2"
                  max="30"
                  value={style.paddingY}
                  onChange={(e) => update('paddingY', parseInt(e.target.value))}
                  className="form-range"
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <p>请选择节点以编辑样式</p>
        </div>
      )}
    </Sidebar>
  );
}