import { useState, useEffect } from 'react';
import { IconUpload, IconArrowDown } from '@tabler/icons-react';
import { ActionIcon, Tabs, Select, Slider, Checkbox, Text } from '@mantine/core';
import Sidebar from './Sidebar';
import '../styles/base-style-panel.css';

interface BaseStylePanelProps {
  mindMap: any;
  theme: 'light' | 'dark';
  show: boolean;
  onClose: () => void;
}

const colorList = [
  '#4D4D4D', '#999999', '#FFFFFF', '#F44E3B', '#FE9200', '#FCDC00',
  '#DBDF00', '#A4DD00', '#68CCCA', '#73D8FF', '#AEA1FF', '#FDA1FF',
  '#333333', '#808080', '#cccccc', '#D33115', '#E27300', '#FCC400',
  '#B0BC00', '#68BC00', '#16A5A5', '#009CE0', '#7B64FF', '#FA28FF',
  '#000000', '#666666', '#B3B3B3', '#9F0500', '#C45100', '#FB9E00',
  '#808900', '#194D33', '#0C797D', '#0062B1', '#653294', 'transparent'
];

const backgroundRepeatList = [
  { label: '不重复', value: 'no-repeat' },
  { label: '重复', value: 'repeat' },
  { label: '水平重复', value: 'repeat-x' },
  { label: '垂直重复', value: 'repeat-y' },
];

const backgroundPositionList = [
  { label: '左上', value: 'left top' },
  { label: '居中上', value: 'center top' },
  { label: '右上', value: 'right top' },
  { label: '左中', value: 'left center' },
  { label: '居中', value: 'center center' },
  { label: '右中', value: 'right center' },
  { label: '左下', value: 'left bottom' },
  { label: '居中下', value: 'center bottom' },
  { label: '右下', value: 'right bottom' },
];

const backgroundSizeList = [
  { label: '自动', value: 'auto' },
  { label: '覆盖', value: 'cover' },
  { label: '包含', value: 'contain' },
];

const lineWidthList = [
  { label: '0px', value: '0' },
  { label: '1px', value: '1' },
  { label: '2px', value: '2' },
  { label: '3px', value: '3' },
  { label: '4px', value: '4' },
  { label: '5px', value: '5' },
];

const lineStyleList = [
  { label: '直线', value: 'straight' },
  { label: '曲线', value: 'curve' },
  { label: '直连', value: 'direct' },
];

const borderDasharrayList = [
  { label: '实线', value: 'none' },
  { label: '虚线1', value: '5,5' },
  { label: '虚线2', value: '10,10' },
  { label: '虚线3', value: '20,10,5,5,5,10' },
];

const fontFamilyList = [
  { label: '微软雅黑', value: '微软雅黑, Microsoft YaHei' },
  { label: '宋体', value: '宋体, SimSun, Songti SC' },
  { label: '楷体', value: '楷体, 楷体_GB2312, SimKai, STKaiti' },
  { label: '黑体', value: '黑体, SimHei, Heiti SC' },
  { label: 'Arial', value: 'arial, helvetica, sans-serif' },
  { label: 'Times New Roman', value: 'times new roman' },
];

const fontSizeList = [
  { label: '10px', value: '10' },
  { label: '12px', value: '12' },
  { label: '14px', value: '14' },
  { label: '16px', value: '16' },
  { label: '18px', value: '18' },
  { label: '24px', value: '24' },
  { label: '32px', value: '32' },
];

export default function BaseStylePanel({
  mindMap,
  theme,
  show,
  onClose
}: BaseStylePanelProps) {
  const [activeTab, setActiveTab] = useState('color');
  const [marginTab, setMarginTab] = useState('second');
  const [style, setStyle] = useState<any>({});

  useEffect(() => {
    if (mindMap) {
      try {
        const themeConfig = mindMap.getThemeConfig && mindMap.getThemeConfig() || {};
        setStyle({
          // 背景样式
          backgroundColor: themeConfig.backgroundColor || '#f6f6f6',
          backgroundImage: themeConfig.backgroundImage || '',
          backgroundRepeat: themeConfig.backgroundRepeat || 'no-repeat',
          backgroundPosition: themeConfig.backgroundPosition || 'center center',
          backgroundSize: themeConfig.backgroundSize || 'cover',
          
          // 连线样式
          lineWidth: themeConfig.lineWidth || 2,
          lineColor: themeConfig.lineColor || '#549688',
          lineStyle: themeConfig.lineStyle || 'curve',
          lineDasharray: themeConfig.lineDasharray || 'none',
          showLineMarker: themeConfig.showLineMarker ?? true,
          
          // 概要连线
          generalizationLineColor: themeConfig.generalizationLineColor || '#549688',
          generalizationLineWidth: themeConfig.generalizationLineWidth || 1,
          
          // 关联线
          associativeLineColor: themeConfig.associativeLineColor || '#549688',
          associativeLineWidth: themeConfig.associativeLineWidth || 2,
          associativeLineActiveColor: themeConfig.associativeLineActiveColor || '#2196f3',
          associativeLineActiveWidth: themeConfig.associativeLineActiveWidth || 2,
          associativeLineDasharray: themeConfig.associativeLineDasharray || 'none',
          
          // 关联线文字
          associativeLineTextColor: themeConfig.associativeLineTextColor || '#333',
          associativeLineTextFontFamily: themeConfig.associativeLineTextFontFamily || '微软雅黑, Microsoft YaHei',
          associativeLineTextFontSize: themeConfig.associativeLineTextFontSize || 14,
          
          // 节点边框风格
          nodeUseLineStyle: themeConfig.nodeUseLineStyle ?? false,
          
          // 内边距
          paddingX: themeConfig.paddingX || 15,
          paddingY: themeConfig.paddingY || 8,
          
          // 图片限制
          imgMaxWidth: themeConfig.imgMaxWidth || 200,
          imgMaxHeight: themeConfig.imgMaxHeight || 200,
          
          // 图标大小
          iconSize: themeConfig.iconSize || 20,
          
          // 二级节点外边距
          second: {
            marginX: themeConfig.second?.marginX || 25,
            marginY: themeConfig.second?.marginY || 25,
          },
          
          // 其他节点外边距
          node: {
            marginX: themeConfig.node?.marginX || 25,
            marginY: themeConfig.node?.marginY || 25,
          }
        });
      } catch (error) {
        console.error('Error initializing BaseStylePanel:', error);
        // 设置默认值
        setStyle({
          backgroundColor: '#f6f6f6',
          backgroundImage: '',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center center',
          backgroundSize: 'cover',
          lineWidth: 2,
          lineColor: '#549688',
          lineStyle: 'curve',
          lineDasharray: 'none',
          showLineMarker: true,
          paddingX: 15,
          paddingY: 8,
          imgMaxWidth: 200,
          imgMaxHeight: 200,
          iconSize: 20,
          second: { marginX: 25, marginY: 25 },
          node: { marginX: 25, marginY: 25 }
        });
      }
    }
  }, [mindMap]);

  const update = (key: string, value: any) => {
    if (!mindMap) return;
    
    const newStyle = { ...style };
    
    // 处理嵌套对象
    if (key.includes('.')) {
      const [parentKey, childKey] = key.split('.');
      if (!newStyle[parentKey]) newStyle[parentKey] = {};
      newStyle[parentKey][childKey] = value;
    } else {
      newStyle[key] = value;
    }
    
    setStyle(newStyle);
    
    // 更新思维导图配置
    if (key.includes('.')) {
      const [parentKey, childKey] = key.split('.');
      const parentObj = mindMap.getThemeConfig(parentKey) || {};
      mindMap.setThemeConfig({ [parentKey]: { ...parentObj, [childKey]: value } });
    } else {
      mindMap.setThemeConfig({ [key]: value });
    }
    
    mindMap.render();
  };

  const updateMargin = (type: string, value: number) => {
    const key = `${marginTab}.${type}`;
    update(key, value);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        update('backgroundImage', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const ColorPicker = ({ color, onChange }: { color: string; onChange: (color: string) => void }) => (
    <div className="color-picker">
      <div className="color-list">
        {colorList.map((c) => (
          <div
            key={c}
            className={`color-item ${color === c ? 'active' : ''}`}
            style={{ 
              backgroundColor: c === 'transparent' ? '#f0f0f0' : c,
              border: c === '#FFFFFF' ? '1px solid #ddd' : 'none'
            }}
            onClick={() => onChange(c)}
            title={c}
          >
            {c === 'transparent' && <span style={{ fontSize: '8px' }}>透明</span>}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Sidebar
      title="基础样式"
      show={show}
      onClose={onClose}
      theme={theme}
    >
      <div className="base-style-panel" style={{ padding: '20px', paddingTop: '10px' }}>
        
        {/* 背景设置 */}
        <div className="panel-section" style={{ marginBottom: '30px' }}>
          <h3 className="section-title" style={{ marginBottom: '15px', fontSize: '16px', fontWeight: 500 }}>背景</h3>
          
          <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'color')}>
            <Tabs.List>
              <Tabs.Tab value="color">颜色</Tabs.Tab>
              <Tabs.Tab value="image">图片</Tabs.Tab>
            </Tabs.List>
            
            <Tabs.Panel value="color" pt="md">
              <ColorPicker 
                color={style.backgroundColor} 
                onChange={(color) => update('backgroundColor', color)} 
              />
            </Tabs.Panel>
            
            <Tabs.Panel value="image" pt="md">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ marginBottom: 10 }}
              />
              
              <div className="form-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <Text size="sm" style={{ minWidth: '80px' }}>图片重复:</Text>
                <Select
                  size="xs"
                  data={backgroundRepeatList}
                  value={style.backgroundRepeat || 'no-repeat'}
                  onChange={(value) => update('backgroundRepeat', value || 'no-repeat')}
                  style={{ width: '120px' }}
                  searchable={false}
                  clearable={false}
                />
              </div>
              
              <div className="form-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <Text size="sm" style={{ minWidth: '80px' }}>图片位置:</Text>
                <Select
                  size="xs"
                  data={backgroundPositionList}
                  value={style.backgroundPosition || 'center center'}
                  onChange={(value) => update('backgroundPosition', value || 'center center')}
                  style={{ width: '120px' }}
                  searchable={false}
                  clearable={false}
                />
              </div>
              
              <div className="form-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <Text size="sm" style={{ minWidth: '80px' }}>图片大小:</Text>
                <Select
                  size="xs"
                  data={backgroundSizeList}
                  value={style.backgroundSize || 'cover'}
                  onChange={(value) => update('backgroundSize', value || 'cover')}
                  style={{ width: '120px' }}
                  searchable={false}
                  clearable={false}
                />
              </div>
            </Tabs.Panel>
          </Tabs>
        </div>

        {/* 连线设置 */}
        <div className="panel-section" style={{ marginBottom: '30px' }}>
          <h3 className="section-title" style={{ marginBottom: '15px', fontSize: '16px', fontWeight: 500 }}>连线</h3>
          
          <div className="form-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <Text size="sm" style={{ minWidth: '60px' }}>颜色:</Text>
            <div 
              className="color-block"
              style={{ 
                backgroundColor: style.lineColor,
                width: '30px',
                height: '20px',
                border: '1px solid #ddd',
                cursor: 'pointer',
                borderRadius: '4px'
              }}
              onClick={(e) => {
                const colors = ['#549688', '#2196f3', '#f44336', '#4caf50', '#ff9800'];
                const currentIndex = colors.indexOf(style.lineColor);
                const nextColor = colors[(currentIndex + 1) % colors.length];
                update('lineColor', nextColor);
              }}
            />
          </div>
          
          <div className="form-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <Text size="sm" style={{ minWidth: '60px' }}>宽度:</Text>
            <Select
              size="xs"
              data={lineWidthList}
              value={style.lineWidth?.toString() || '2'}
              onChange={(value) => update('lineWidth', parseInt(value || '2'))}
              style={{ width: '80px' }}
              searchable={false}
              clearable={false}
            />
          </div>
          
          <div className="form-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <Text size="sm" style={{ minWidth: '60px' }}>样式:</Text>
            <Select
              size="xs"
              data={lineStyleList}
              value={style.lineStyle || 'curve'}
              onChange={(value) => update('lineStyle', value || 'curve')}
              style={{ width: '80px' }}
              searchable={false}
              clearable={false}
            />
          </div>
          
          <div className="form-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <Checkbox
              label="显示箭头"
              checked={style.showLineMarker}
              onChange={(event) => update('showLineMarker', event.currentTarget.checked)}
            />
          </div>
        </div>

        {/* 内边距设置 */}
        <div className="panel-section" style={{ marginBottom: '30px' }}>
          <h3 className="section-title" style={{ marginBottom: '15px', fontSize: '16px', fontWeight: 500 }}>节点内边距</h3>
          
          <div className="form-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
            <Text size="sm" style={{ minWidth: '100px' }}>水平内边距:</Text>
            <Slider
              value={style.paddingX || 15}
              onChange={(value) => update('paddingX', value)}
              max={50}
              min={0}
              style={{ flex: 1, marginLeft: 10 }}
              marks={[
                { value: 0, label: '0' },
                { value: 25, label: '25' },
                { value: 50, label: '50' }
              ]}
            />
          </div>
          
          <div className="form-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
            <Text size="sm" style={{ minWidth: '100px' }}>垂直内边距:</Text>
            <Slider
              value={style.paddingY || 8}
              onChange={(value) => update('paddingY', value)}
              max={30}
              min={0}
              style={{ flex: 1, marginLeft: 10 }}
              marks={[
                { value: 0, label: '0' },
                { value: 15, label: '15' },
                { value: 30, label: '30' }
              ]}
            />
          </div>
        </div>

        {/* 图片限制 */}
        <div className="panel-section" style={{ marginBottom: '30px' }}>
          <h3 className="section-title" style={{ marginBottom: '15px', fontSize: '16px', fontWeight: 500 }}>图片</h3>
          
          <div className="form-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
            <Text size="sm" style={{ minWidth: '80px' }}>最大宽度:</Text>
            <Slider
              value={style.imgMaxWidth || 200}
              onChange={(value) => update('imgMaxWidth', value)}
              max={500}
              min={10}
              style={{ flex: 1, marginLeft: 10 }}
            />
          </div>
          
          <div className="form-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
            <Text size="sm" style={{ minWidth: '80px' }}>最大高度:</Text>
            <Slider
              value={style.imgMaxHeight || 200}
              onChange={(value) => update('imgMaxHeight', value)}
              max={500}
              min={10}
              style={{ flex: 1, marginLeft: 10 }}
            />
          </div>
        </div>

        {/* 图标大小 */}
        <div className="panel-section" style={{ marginBottom: '30px' }}>
          <h3 className="section-title" style={{ marginBottom: '15px', fontSize: '16px', fontWeight: 500 }}>图标</h3>
          
          <div className="form-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
            <Text size="sm" style={{ minWidth: '60px' }}>大小:</Text>
            <Slider
              value={style.iconSize || 20}
              onChange={(value) => update('iconSize', value)}
              max={50}
              min={12}
              style={{ flex: 1, marginLeft: 10 }}
            />
          </div>
        </div>

        {/* 节点外边距 */}
        <div className="panel-section" style={{ marginBottom: '30px' }}>
          <h3 className="section-title" style={{ marginBottom: '15px', fontSize: '16px', fontWeight: 500 }}>节点外边距</h3>
          
          <Tabs value={marginTab} onChange={(value) => setMarginTab(value || 'second')}>
            <Tabs.List>
              <Tabs.Tab value="second">二级节点</Tabs.Tab>
              <Tabs.Tab value="node">其他节点</Tabs.Tab>
            </Tabs.List>
            
            <Tabs.Panel value="second" pt="md">
              <div className="form-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                <Text size="sm" style={{ minWidth: '80px' }}>水平间距:</Text>
                <Slider
                  value={style.second?.marginX || 25}
                  onChange={(value) => updateMargin('marginX', value)}
                  max={200}
                  min={0}
                  style={{ flex: 1, marginLeft: 10 }}
                />
              </div>
              
              <div className="form-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                <Text size="sm" style={{ minWidth: '80px' }}>垂直间距:</Text>
                <Slider
                  value={style.second?.marginY || 25}
                  onChange={(value) => updateMargin('marginY', value)}
                  max={200}
                  min={0}
                  style={{ flex: 1, marginLeft: 10 }}
                />
              </div>
            </Tabs.Panel>
            
            <Tabs.Panel value="node" pt="md">
              <div className="form-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                <Text size="sm" style={{ minWidth: '80px' }}>水平间距:</Text>
                <Slider
                  value={style.node?.marginX || 25}
                  onChange={(value) => updateMargin('marginX', value)}
                  max={200}
                  min={0}
                  style={{ flex: 1, marginLeft: 10 }}
                />
              </div>
              
              <div className="form-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                <Text size="sm" style={{ minWidth: '80px' }}>垂直间距:</Text>
                <Slider
                  value={style.node?.marginY || 25}
                  onChange={(value) => updateMargin('marginY', value)}
                  max={200}
                  min={0}
                  style={{ flex: 1, marginLeft: 10 }}
                />
              </div>
            </Tabs.Panel>
          </Tabs>
        </div>
        
      </div>
    </Sidebar>
  );
}