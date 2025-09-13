import React from 'react';
import { Box, ColorPicker as MantineColorPicker, Group, Text } from '@mantine/core';

interface EnhancedColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  swatches?: string[];
}

// 35种预设颜色 - 来自mind-map\web
const defaultSwatches = [
  '#4D4D4D', '#999999', '#FFFFFF', '#F44E3B', '#FE9200', '#FCDC00',
  '#DBDF00', '#A4DD00', '#68CCCA', '#73D8FF', '#AEA1FF', '#FDA1FF',
  '#333333', '#808080', '#CCCCCC', '#D33115', '#E27300', '#FCC400',
  '#B0BC00', '#68BC00', '#16A5A5', '#009CE0', '#7B64FF', '#FA28FF',
  '#000000', '#666666', '#B3B3B3', '#9F0500', '#C45100', '#FB9E00',
  '#808900', '#194D33', '#0C797D', '#0062B1', '#653294', 'transparent'
];

// 渐变背景预设
const gradientPresets = [
  'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(45deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(45deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(45deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(45deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(45deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(45deg, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(45deg, #ff8a80 0%, #ea6100 100%)'
];

export const EnhancedColorPicker: React.FC<EnhancedColorPickerProps> = ({
  value,
  onChange,
  label,
  size = 'sm',
  swatches = defaultSwatches
}) => {
  return (
    <Box>
      {label && (
        <Text size="sm" fw={500} mb={8}>
          {label}
        </Text>
      )}
      
      <MantineColorPicker
        value={value}
        onChange={onChange}
        size={size}
        swatches={swatches}
        swatchesPerRow={6}
        format="hex"
      />
    </Box>
  );
};

// 简化的颜色选择器 - 只显示色块
interface SimpleColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  colors?: string[];
  size?: number;
  className?: string;
}

export const SimpleColorPicker: React.FC<SimpleColorPickerProps> = ({
  value,
  onChange,
  colors = defaultSwatches,
  size = 20,
  className = ''
}) => {
  return (
    <Group gap={4} className={className}>
      {colors.map((color, index) => (
        <Box
          key={index}
          style={{
            width: size,
            height: size,
            backgroundColor: color === 'transparent' ? '#f0f0f0' : color,
            border: value === color ? '2px solid var(--mantine-color-blue-5)' : '1px solid var(--mantine-color-gray-3)',
            borderRadius: 3,
            cursor: 'pointer',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            color: '#666'
          }}
          onClick={() => onChange(color)}
        >
          {color === 'transparent' && '透明'}
        </Box>
      ))}
    </Group>
  );
};

// 渐变色选择器
interface GradientPickerProps {
  value: string;
  onChange: (gradient: string) => void;
  presets?: string[];
}

export const GradientPicker: React.FC<GradientPickerProps> = ({
  value,
  onChange,
  presets = gradientPresets
}) => {
  return (
    <Box>
      <Text size="sm" fw={500} mb={8}>
        渐变预设
      </Text>
      <Group gap={8}>
        {presets.map((gradient, index) => (
          <Box
            key={index}
            style={{
              width: 40,
              height: 20,
              background: gradient,
              border: value === gradient ? '2px solid var(--mantine-color-blue-5)' : '1px solid var(--mantine-color-gray-3)',
              borderRadius: 4,
              cursor: 'pointer'
            }}
            onClick={() => onChange(gradient)}
          />
        ))}
      </Group>
    </Box>
  );
};

// 智能颜色选择器 - 根据使用场景自动选择最佳的颜色选择方式
interface SmartColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  type?: 'text' | 'background' | 'border' | 'general';
  size?: 'sm' | 'md' | 'lg';
  showPresets?: boolean;
  showGradients?: boolean;
}

export const SmartColorPicker: React.FC<SmartColorPickerProps> = ({
  value,
  onChange,
  type = 'general',
  size = 'md',
  showPresets = true,
  showGradients = false
}) => {
  // 根据类型选择合适的预设颜色
  const getSwatchesByType = () => {
    switch (type) {
      case 'text':
        return [
          '#000000', '#333333', '#666666', '#999999', '#FFFFFF',
          '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF',
          '#00FFFF', '#FFA500', '#800080', '#008000', '#FF69B4'
        ];
      case 'background':
        return [
          '#FFFFFF', '#F8F9FA', '#E9ECEF', '#DEE2E6', '#CED4DA',
          '#ADB5BD', '#6C757D', '#495057', '#343A40', '#212529',
          '#FFF3CD', '#D4EDDA', '#CCE5FF', '#F8D7DA', '#E2E3E5'
        ];
      case 'border':
        return [
          '#DEE2E6', '#ADB5BD', '#6C757D', '#495057', '#343A40',
          '#007BFF', '#28A745', '#FFC107', '#DC3545', '#6F42C1',
          '#FD7E14', '#20C997', '#E83E8C', '#6C757D', '#343A40'
        ];
      default:
        return defaultSwatches;
    }
  };

  return (
    <Box>
      {showPresets && (
        <Box mb={showGradients ? 16 : 0}>
          <SimpleColorPicker
            value={value}
            onChange={onChange}
            colors={getSwatchesByType()}
            size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20}
          />
        </Box>
      )}
      
      {showGradients && (
        <GradientPicker
          value={value}
          onChange={onChange}
        />
      )}
      
      <Box mt={8}>
        <MantineColorPicker
          value={value}
          onChange={onChange}
          size={size === 'sm' ? 'xs' : size === 'lg' ? 'md' : 'sm'}
          format="hex"
        />
      </Box>
    </Box>
  );
};

export default EnhancedColorPicker;