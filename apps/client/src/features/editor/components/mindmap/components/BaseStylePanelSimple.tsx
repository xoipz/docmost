import { useState, useEffect, useRef } from 'react';
import { Slider, Text, Checkbox, Select, Group, Box, FileInput, Button, Image, Grid } from '@mantine/core';
import { IconUpload, IconTrash } from '@tabler/icons-react';
import Sidebar from './Sidebar';
import { SmartColorPicker } from './EnhancedColorPicker';
import '../styles/base-style-panel.css';

interface BaseStylePanelProps {
  mindMap: any;
  theme: 'light' | 'dark';
  show: boolean;
  onClose: () => void;
}

// 连线样式选项
const lineStyleOptions = [
  { value: 'none', label: '实线' },
  { value: '5,5', label: '虚线1' },
  { value: '10,10', label: '虚线2' },
  { value: '20,10,5,5,5,10', label: '虚线3' },
  { value: '5,5,1,5', label: '虚线4' },
  { value: '15,10,5,10,15', label: '虚线5' },
  { value: '1,5', label: '虚线6' }
];

// 连线类型选项
const lineTypeOptions = [
  { value: 'curve', label: '曲线' },
  { value: 'straight', label: '直线' },
  { value: 'direct', label: '直连' }
];

// 图片重复方式选项
const backgroundRepeatOptions = [
  { value: 'no-repeat', label: '不重复' },
  { value: 'repeat', label: '重复' },
  { value: 'repeat-x', label: '水平重复' },
  { value: 'repeat-y', label: '垂直重复' }
];

// 图片位置选项
const backgroundPositionOptions = [
  { value: 'left top', label: '左上' },
  { value: 'center top', label: '中上' },
  { value: 'right top', label: '右上' },
  { value: 'left center', label: '左中' },
  { value: 'center center', label: '居中' },
  { value: 'right center', label: '右中' },
  { value: 'left bottom', label: '左下' },
  { value: 'center bottom', label: '中下' },
  { value: 'right bottom', label: '右下' }
];

// 图片大小模式
const backgroundSizeOptions = [
  { value: 'auto', label: '原始大小' },
  { value: 'cover', label: '覆盖' },
  { value: 'contain', label: '包含' }
];

export default function BaseStylePanelSimple({
  mindMap,
  theme,
  show,
  onClose
}: BaseStylePanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [style, setStyle] = useState<any>({
    // 节点内边距
    paddingX: 15,
    paddingY: 8,
    
    // 连线基础设置
    lineWidth: 2,
    lineColor: '#549688',
    lineDasharray: 'none',
    lineStyle: 'curve',
    showLineMarker: true,
    
    // 背景设置
    backgroundColor: '#fafafa',
    backgroundImage: '',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center center',
    backgroundSize: 'auto',
    
    // 图片设置
    imgMaxWidth: 200,
    imgMaxHeight: 200,
    
    // 图标设置
    iconSize: 20,
    
    // 彩虹线条
    enableRainbowLines: false
  });

  useEffect(() => {
    if (mindMap) {
      try {
        const themeConfig = mindMap.getThemeConfig?.() || {};
        setStyle({
          // 节点内边距
          paddingX: themeConfig.paddingX || 15,
          paddingY: themeConfig.paddingY || 8,
          
          // 连线基础设置
          lineWidth: themeConfig.lineWidth || 2,
          lineColor: themeConfig.lineColor || '#549688',
          lineDasharray: themeConfig.lineDasharray || 'none',
          lineStyle: themeConfig.lineStyle || 'curve',
          showLineMarker: themeConfig.showLineMarker ?? true,
          
          // 背景设置
          backgroundColor: themeConfig.backgroundColor || '#fafafa',
          backgroundImage: themeConfig.backgroundImage || '',
          backgroundRepeat: themeConfig.backgroundRepeat || 'no-repeat',
          backgroundPosition: themeConfig.backgroundPosition || 'center center',
          backgroundSize: themeConfig.backgroundSize || 'auto',
          
          // 图片设置
          imgMaxWidth: themeConfig.imgMaxWidth || 200,
          imgMaxHeight: themeConfig.imgMaxHeight || 200,
          
          // 图标设置
          iconSize: themeConfig.iconSize || 20,
          
          // 彩虹线条
          enableRainbowLines: false
        });
      } catch (error) {
        console.error('Error initializing BaseStylePanel:', error);
      }
    }
  }, [mindMap]);

  const update = (key: string, value: any) => {
    if (!mindMap) return;
    
    try {
      const newStyle = { ...style, [key]: value };
      setStyle(newStyle);
      
      // 特殊处理彩虹线条
      if (key === 'enableRainbowLines') {
        if (mindMap.rainbowLines) {
          if (value) {
            mindMap.rainbowLines.rainbow();
          } else {
            mindMap.rainbowLines.reset();
          }
        }
        return;
      }
      
      // 应用主题配置
      mindMap.setThemeConfig({ [key]: value });
      mindMap.render();
    } catch (error) {
      console.error('Error updating style:', error);
    }
  };

  // 处理图片上传
  const handleImageUpload = (file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        update('backgroundImage', imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  // 移除背景图片
  const removeBackgroundImage = () => {
    update('backgroundImage', '');
  };

  return (
    <Sidebar
      title="基础样式"
      show={show}
      onClose={onClose}
      theme={theme}
    >
      <div className="base-style-panel" style={{ padding: '20px', paddingTop: '10px' }}>
        
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

        {/* 连线设置 */}
        <div className="panel-section" style={{ marginBottom: '30px' }}>
          <h3 className="section-title" style={{ marginBottom: '15px', fontSize: '16px', fontWeight: 500 }}>连线</h3>
          
          {/* 连线颜色 */}
          <Box mb="md">
            <Text size="sm" mb="xs">连线颜色</Text>
            <SmartColorPicker
              value={style.lineColor}
              onChange={(color) => update('lineColor', color)}
              type="border"
              size="sm"
            />
          </Box>

          {/* 连线宽度 */}
          <div className="form-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
            <Text size="sm" style={{ minWidth: '60px' }}>宽度:</Text>
            <Slider
              value={style.lineWidth || 2}
              onChange={(value) => update('lineWidth', value)}
              max={10}
              min={1}
              style={{ flex: 1, marginLeft: 10 }}
              marks={[
                { value: 1, label: '1' },
                { value: 5, label: '5' },
                { value: 10, label: '10' }
              ]}
            />
          </div>
          
          {/* 连线样式 */}
          <Box mb="md">
            <Text size="sm" mb="xs">连线样式</Text>
            <Select
              value={style.lineDasharray}
              data={lineStyleOptions}
              onChange={(value) => value && update('lineDasharray', value)}
              renderOption={({ option }) => (
                <Group>
                  <svg width="60" height="20">
                    <line
                      x1="5"
                      y1="10"
                      x2="55"
                      y2="10"
                      stroke={theme === 'dark' ? '#fff' : '#333'}
                      strokeWidth="2"
                      strokeDasharray={option.value === 'none' ? undefined : option.value}
                    />
                  </svg>
                  <Text>{option.label}</Text>
                </Group>
              )}
            />
          </Box>

          {/* 连线类型 */}
          <Box mb="md">
            <Text size="sm" mb="xs">连线类型</Text>
            <Select
              value={style.lineStyle}
              data={lineTypeOptions}
              onChange={(value) => value && update('lineStyle', value)}
            />
          </Box>
          
          <div className="form-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
            <Checkbox
              label="显示箭头"
              checked={style.showLineMarker}
              onChange={(event) => update('showLineMarker', event.currentTarget.checked)}
            />
          </div>

          <div className="form-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <Checkbox
              label="彩虹线条"
              checked={style.enableRainbowLines}
              onChange={(event) => update('enableRainbowLines', event.currentTarget.checked)}
            />
          </div>
        </div>

        {/* 背景设置 */}
        <div className="panel-section" style={{ marginBottom: '30px' }}>
          <h3 className="section-title" style={{ marginBottom: '15px', fontSize: '16px', fontWeight: 500 }}>背景</h3>
          
          {/* 背景颜色 */}
          <Box mb="md">
            <Text size="sm" mb="xs">背景颜色</Text>
            <SmartColorPicker
              value={style.backgroundColor}
              onChange={(color) => update('backgroundColor', color)}
              type="background"
              size="sm"
            />
          </Box>

          {/* 背景图片上传 */}
          <Box mb="md">
            <Text size="sm" mb="xs">背景图片</Text>
            <Group mb="sm">
              <FileInput
                placeholder="选择图片文件"
                accept="image/*"
                onChange={handleImageUpload}
                leftSection={<IconUpload size={16} />}
                style={{ flex: 1 }}
              />
              
              {style.backgroundImage && (
                <Button
                  size="sm"
                  variant="light"
                  color="red"
                  onClick={removeBackgroundImage}
                  leftSection={<IconTrash size={16} />}
                >
                  移除
                </Button>
              )}
            </Group>

            {/* 背景图片预览 */}
            {style.backgroundImage && (
              <Box mb="md">
                <Text size="xs" mb="xs" c="dimmed">预览</Text>
                <Image
                  src={style.backgroundImage}
                  alt="背景预览"
                  style={{ maxWidth: '150px', maxHeight: '90px' }}
                  radius="md"
                />
              </Box>
            )}
          </Box>

          {/* 图片设置选项 */}
          {style.backgroundImage && (
            <Box>
              <Group mb="md">
                <Box style={{ flex: 1 }}>
                  <Text size="sm" mb="xs">重复方式</Text>
                  <Select
                    size="sm"
                    value={style.backgroundRepeat}
                    data={backgroundRepeatOptions}
                    onChange={(value) => value && update('backgroundRepeat', value)}
                  />
                </Box>
                
                <Box style={{ flex: 1 }}>
                  <Text size="sm" mb="xs">位置</Text>
                  <Select
                    size="sm"
                    value={style.backgroundPosition}
                    data={backgroundPositionOptions}
                    onChange={(value) => value && update('backgroundPosition', value)}
                  />
                </Box>
              </Group>

              <Box mb="md">
                <Text size="sm" mb="xs">大小模式</Text>
                <Select
                  size="sm"
                  value={style.backgroundSize}
                  data={backgroundSizeOptions}
                  onChange={(value) => value && update('backgroundSize', value)}
                />
              </Box>
            </Box>
          )}

          {/* 清除背景按钮 */}
          <Group justify="center">
            <Button
              size="sm"
              variant="light"
              onClick={() => {
                update('backgroundColor', '#ffffff');
                update('backgroundImage', '');
              }}
            >
              清除所有背景
            </Button>
          </Group>
        </div>

        {/* 图片设置 */}
        <div className="panel-section" style={{ marginBottom: '30px' }}>
          <h3 className="section-title" style={{ marginBottom: '15px', fontSize: '16px', fontWeight: 500 }}>图片</h3>
          
          <div className="form-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
            <Text size="sm" style={{ minWidth: '80px' }}>最大宽度:</Text>
            <Slider
              value={style.imgMaxWidth || 200}
              onChange={(value) => update('imgMaxWidth', value)}
              max={500}
              min={50}
              style={{ flex: 1, marginLeft: 10 }}
            />
          </div>
          
          <div className="form-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
            <Text size="sm" style={{ minWidth: '80px' }}>最大高度:</Text>
            <Slider
              value={style.imgMaxHeight || 200}
              onChange={(value) => update('imgMaxHeight', value)}
              max={500}
              min={50}
              style={{ flex: 1, marginLeft: 10 }}
            />
          </div>
        </div>

        {/* 图标设置 */}
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
        
      </div>
    </Sidebar>
  );
}