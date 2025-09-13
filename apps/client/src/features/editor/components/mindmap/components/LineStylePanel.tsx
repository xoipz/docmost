import React, { useState, useEffect } from 'react';
import { Box, Group, Text, Slider, Select, Checkbox } from '@mantine/core';
import { SmartColorPicker } from './EnhancedColorPicker';
import '../styles/rainbow-lines.css';

interface LineStylePanelProps {
  mindMap: any;
  theme: 'light' | 'dark';
  isOpen: boolean;
  onClose: () => void;
}

// 连线样式选项
const lineStyleOptions = [
  { value: 'none', label: '实线', dashArray: 'none' },
  { value: '5,5', label: '虚线1', dashArray: '5,5' },
  { value: '10,10', label: '虚线2', dashArray: '10,10' },
  { value: '20,10,5,5,5,10', label: '虚线3', dashArray: '20,10,5,5,5,10' },
  { value: '5,5,1,5', label: '虚线4', dashArray: '5,5,1,5' },
  { value: '15,10,5,10,15', label: '虚线5', dashArray: '15,10,5,10,15' },
  { value: '1,5', label: '虚线6', dashArray: '1,5' }
];

// 连线类型选项
const lineTypeOptions = [
  { value: 'straight', label: '直线' },
  { value: 'curve', label: '曲线' },
  { value: 'direct', label: '直连' }
];

// 根节点连线样式
const rootLineStyleOptions = [
  { value: 'normal', label: '普通' },
  { value: 'bracket', label: '括号' },
  { value: 'brace', label: '大括号' }
];

// 根节点连线起始位置
const rootLineStartOptions = [
  { value: 'center', label: '中心' },
  { value: 'border', label: '边缘' }
];

// 彩虹线条色系 - 增强版
const rainbowColorOptions = [
  { 
    value: 'default', 
    label: '默认', 
    colors: ['#f44336', '#ff9800', '#ffeb3b', '#4caf50', '#2196f3', '#9c27b0']
  },
  { 
    value: 'red', 
    label: '红色系', 
    colors: ['#ffcdd2', '#f8bbd9', '#f48fb1', '#f06292', '#e91e63', '#ad1457']
  },
  { 
    value: 'orange', 
    label: '橙色系', 
    colors: ['#ffe0b2', '#ffcc02', '#ffb74d', '#ff9800', '#f57c00', '#e65100']
  },
  { 
    value: 'yellow', 
    label: '黄色系', 
    colors: ['#fff9c4', '#fff59d', '#fff176', '#ffee58', '#ffeb3b', '#f9a825']
  },
  { 
    value: 'green', 
    label: '绿色系', 
    colors: ['#dcedc8', '#c5e1a5', '#aed581', '#9ccc65', '#8bc34a', '#689f38']
  },
  { 
    value: 'blue', 
    label: '蓝色系', 
    colors: ['#e3f2fd', '#bbdefb', '#90caf9', '#64b5f6', '#42a5f5', '#1e88e5']
  },
  { 
    value: 'purple', 
    label: '紫色系', 
    colors: ['#f3e5f5', '#e1bee7', '#ce93d8', '#ba68c8', '#ab47bc', '#8e24aa']
  }
];

export const LineStylePanel: React.FC<LineStylePanelProps> = ({
  mindMap,
  theme,
  isOpen,
  onClose
}) => {
  const [lineConfig, setLineConfig] = useState({
    // 基础连线设置
    lineColor: '#549688',
    lineWidth: 2,
    lineDasharray: 'none',
    lineStyle: 'curve',
    lineRadius: 5,
    
    // 根节点连线设置
    rootLineStyle: 'normal',
    rootLineStartPosition: 'center',
    
    // 箭头设置
    showArrow: true,
    
    // 彩虹线条
    enableRainbowLines: false,
    rainbowColorScheme: 'default',
    
    // 概要连线
    summaryLineColor: '#549688',
    summaryLineWidth: 2,
    
    // 关联线
    associationLineColor: '#549688',
    associationLineWidth: 2,
    associationLineActiveColor: '#1890ff',
    associationLineActiveWidth: 3,
    associationLineDasharray: '5,5',
    
    // 关联线文字
    associationTextFontFamily: '微软雅黑',
    associationTextColor: '#333333',
    associationTextFontSize: 14
  });

  // 监听mindMap变化，初始化配置
  useEffect(() => {
    if (mindMap) {
      // 获取当前主题配置
      try {
        const themeConfig = mindMap.getThemeConfig && mindMap.getThemeConfig();
        if (themeConfig) {
          setLineConfig(prevConfig => ({
            ...prevConfig,
            lineColor: themeConfig.lineColor || prevConfig.lineColor,
            lineWidth: themeConfig.lineWidth || prevConfig.lineWidth,
            lineDasharray: themeConfig.lineDasharray || prevConfig.lineDasharray,
            lineStyle: themeConfig.lineStyle || prevConfig.lineStyle,
            showArrow: themeConfig.showArrow !== undefined ? themeConfig.showArrow : prevConfig.showArrow
          }));
        }
      } catch (error) {
      }
    }
  }, [mindMap]);

  // 更新配置
  const updateConfig = (key: string, value: any) => {
    setLineConfig(prev => ({ ...prev, [key]: value }));
    
    if (mindMap) {
      try {
        // 构建主题配置更新
        const themeUpdate: any = {};
        
        switch (key) {
          case 'lineColor':
            themeUpdate.lineColor = value;
            break;
          case 'lineWidth':
            themeUpdate.lineWidth = value;
            break;
          case 'lineDasharray':
            themeUpdate.lineDasharray = value;
            break;
          case 'lineStyle':
            themeUpdate.lineStyle = value;
            break;
          case 'lineRadius':
            themeUpdate.lineRadius = value;
            break;
          case 'showArrow':
            themeUpdate.showArrow = value;
            break;
          case 'rootLineStyle':
            themeUpdate.rootLineKeepSameInCurve = value === 'normal';
            break;
          case 'enableRainbowLines':
            if (mindMap.rainbowLines) {
              if (value) {
                mindMap.rainbowLines.rainbow();
              } else {
                mindMap.rainbowLines.reset();
              }
            }
            return; // 彩虹线条不需要更新主题配置
          case 'summaryLineColor':
            themeUpdate.generalizationLineColor = value;
            break;
          case 'summaryLineWidth':
            themeUpdate.generalizationLineWidth = value;
            break;
          case 'associationLineColor':
            themeUpdate.associativeLineColor = value;
            break;
          case 'associationLineWidth':
            themeUpdate.associativeLineWidth = value;
            break;
          case 'associationLineActiveColor':
            themeUpdate.associativeLineActiveColor = value;
            break;
          case 'associationLineActiveWidth':
            themeUpdate.associativeLineActiveWidth = value;
            break;
        }
        
        // 应用主题配置
        if (Object.keys(themeUpdate).length > 0) {
          mindMap.setThemeConfig(themeUpdate);
        }
        
        // 重新渲染
        mindMap.render();
        
      } catch (error) {
        console.error('更新连线配置失败:', error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <Box p="md">
      <Text fw={600} mb="lg">连线样式设置</Text>
      
      {/* 基础连线样式 */}
      <Box mb="xl">
        <Text fw={500} mb="sm">基础连线</Text>
        
        {/* 连线颜色 */}
        <Box mb="md">
          <Text size="sm" mb="xs">连线颜色</Text>
          <SmartColorPicker
            value={lineConfig.lineColor}
            onChange={(color) => updateConfig('lineColor', color)}
            type="border"
            size="sm"
          />
        </Box>

        {/* 连线宽度 */}
        <Box mb="md">
          <Text size="sm" mb={5}>连线宽度: {lineConfig.lineWidth}px</Text>
          <Slider
            value={lineConfig.lineWidth}
            onChange={(value) => updateConfig('lineWidth', value)}
            min={1}
            max={10}
            step={1}
            marks={[
              { value: 1, label: '1' },
              { value: 5, label: '5' },
              { value: 10, label: '10' }
            ]}
          />
        </Box>

        {/* 连线样式 */}
        <Box mb="md">
          <Text size="sm" mb="xs">连线样式</Text>
          <Select
            value={lineConfig.lineDasharray}
            data={lineStyleOptions}
            onChange={(value) => value && updateConfig('lineDasharray', value)}
            renderOption={({ option }) => (
              <Group>
                <svg width="60" height="20">
                  <line
                    x1="5"
                    y1="10"
                    x2="55"
                    y2="10"
                    stroke="#333"
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
            value={lineConfig.lineStyle}
            data={lineTypeOptions}
            onChange={(value) => value && updateConfig('lineStyle', value)}
          />
        </Box>

        {/* 连线圆角 */}
        <Box mb="md">
          <Text size="sm" mb={5}>连线圆角: {lineConfig.lineRadius}px</Text>
          <Slider
            value={lineConfig.lineRadius}
            onChange={(value) => updateConfig('lineRadius', value)}
            min={0}
            max={15}
            step={1}
            marks={[
              { value: 0, label: '0' },
              { value: 8, label: '8' },
              { value: 15, label: '15' }
            ]}
          />
        </Box>

        {/* 显示箭头 */}
        <Checkbox
          label="显示箭头"
          checked={lineConfig.showArrow}
          onChange={(event) => updateConfig('showArrow', event.currentTarget.checked)}
        />
      </Box>

      {/* 根节点连线样式 */}
      <Box mb="xl">
        <Text fw={500} mb="sm">根节点连线</Text>
        
        <Box mb="md">
          <Text size="sm" mb="xs">根节点连线样式</Text>
          <Select
            value={lineConfig.rootLineStyle}
            data={rootLineStyleOptions}
            onChange={(value) => value && updateConfig('rootLineStyle', value)}
          />
        </Box>

        <Box mb="md">
          <Text size="sm" mb="xs">连线起始位置</Text>
          <Select
            value={lineConfig.rootLineStartPosition}
            data={rootLineStartOptions}
            onChange={(value) => value && updateConfig('rootLineStartPosition', value)}
          />
        </Box>
      </Box>

      {/* 彩虹线条 */}
      <Box mb="xl">
        <Text fw={500} mb="sm">彩虹线条</Text>
        
        <Checkbox
          label="启用彩虹线条"
          checked={lineConfig.enableRainbowLines}
          onChange={(event) => updateConfig('enableRainbowLines', event.currentTarget.checked)}
          mb="md"
        />

        {lineConfig.enableRainbowLines && (
          <Box>
            <Text size="sm" mb="xs">色系选择</Text>
            <div className="rainbow-options">
              {rainbowColorOptions.map((option) => (
                <div
                  key={option.value}
                  className={`rainbow-option ${lineConfig.rainbowColorScheme === option.value ? 'active' : ''}`}
                  onClick={() => updateConfig('rainbowColorScheme', option.value)}
                >
                  <div className="rainbow-preview">
                    <svg width="60" height="20" viewBox="0 0 60 20">
                      {option.colors.map((color, index) => (
                        <line
                          key={index}
                          x1={index * 10 + 5}
                          y1={10}
                          x2={index * 10 + 15}
                          y2={10}
                          stroke={color}
                          strokeWidth="3"
                          className="rainbow-line"
                          style={{
                            animationDelay: `${index * 0.1}s`
                          }}
                        />
                      ))}
                    </svg>
                  </div>
                  <Text size="xs" ta="center">{option.label}</Text>
                </div>
              ))}
            </div>
          </Box>
        )}
      </Box>

      {/* 概要连线 */}
      <Box mb="xl">
        <Text fw={500} mb="sm">概要连线</Text>
        
        <Box mb="md">
          <Text size="sm" mb="xs">概要连线颜色</Text>
          <SmartColorPicker
            value={lineConfig.summaryLineColor}
            onChange={(color) => updateConfig('summaryLineColor', color)}
            type="border"
            size="sm"
          />
        </Box>

        <Box mb="md">
          <Text size="sm" mb={5}>概要连线宽度: {lineConfig.summaryLineWidth}px</Text>
          <Slider
            value={lineConfig.summaryLineWidth}
            onChange={(value) => updateConfig('summaryLineWidth', value)}
            min={1}
            max={10}
            step={1}
            marks={[
              { value: 1, label: '1' },
              { value: 5, label: '5' },
              { value: 10, label: '10' }
            ]}
          />
        </Box>
      </Box>

      {/* 关联线 */}
      <Box>
        <Text fw={500} mb="sm">关联线</Text>
        
        <Group mb="md">
          <Box style={{ flex: 1 }}>
            <Text size="sm" mb="xs">关联线颜色</Text>
            <SmartColorPicker
              value={lineConfig.associationLineColor}
              onChange={(color) => updateConfig('associationLineColor', color)}
              type="border"
              size="sm"
            />
          </Box>
          
          <Box style={{ flex: 1 }}>
            <Text size="sm" mb="xs">激活状态颜色</Text>
            <SmartColorPicker
              value={lineConfig.associationLineActiveColor}
              onChange={(color) => updateConfig('associationLineActiveColor', color)}
              type="border"
              size="sm"
            />
          </Box>
        </Group>

        <Group mb="md">
          <Box style={{ flex: 1 }}>
            <Text size="sm" mb={5}>关联线宽度: {lineConfig.associationLineWidth}px</Text>
            <Slider
              value={lineConfig.associationLineWidth}
              onChange={(value) => updateConfig('associationLineWidth', value)}
              min={1}
              max={10}
              step={1}
            />
          </Box>
          
          <Box style={{ flex: 1 }}>
            <Text size="sm" mb={5}>激活状态宽度: {lineConfig.associationLineActiveWidth}px</Text>
            <Slider
              value={lineConfig.associationLineActiveWidth}
              onChange={(value) => updateConfig('associationLineActiveWidth', value)}
              min={1}
              max={10}
              step={1}
            />
          </Box>
        </Group>

        <Box mb="md">
          <Text size="sm" mb="xs">关联线样式</Text>
          <Select
            value={lineConfig.associationLineDasharray}
            data={lineStyleOptions}
            onChange={(value) => value && updateConfig('associationLineDasharray', value)}
            renderOption={({ option }) => (
              <Group>
                <svg width="60" height="20">
                  <line
                    x1="5"
                    y1="10"
                    x2="55"
                    y2="10"
                    stroke="#333"
                    strokeWidth="2"
                    strokeDasharray={option.value === 'none' ? undefined : option.value}
                  />
                </svg>
                <Text>{option.label}</Text>
              </Group>
            )}
          />
        </Box>
      </Box>
    </Box>
  );
};