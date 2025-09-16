import React, { useState, useRef } from 'react';
import { Box, Group, Text, Button, Select, FileInput, Image, Grid } from '@mantine/core';
import { IconUpload, IconPhoto, IconTrash } from '@tabler/icons-react';
import { SmartColorPicker } from './EnhancedColorPicker';

interface BackgroundSettingsPanelProps {
  mindMap: any;
  theme: 'light' | 'dark';
  isOpen: boolean;
  onClose: () => void;
}

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

// 内置背景图片库
const builtinBackgrounds = [
  {
    name: '纸张纹理1',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDYwIDAgTCAwIDAgMCA2MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjBmMGYwIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=',
    type: 'pattern'
  },
  {
    name: '网格纹理',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZTZlNmU2IiBzdHJva2Utd2lkdGg9IjEiLz48Y2lyY2xlIGN4PSI0MCIgY3k9IjQwIiByPSIzIiBmaWxsPSIjZTZlNmU2Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+',
    type: 'pattern'
  },
  {
    name: '点状纹理',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZG90cyIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSIyIiBmaWxsPSIjZGRkZGRkIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2RvdHMpIi8+PC9zdmc+',
    type: 'pattern'
  },
  {
    name: '斜线纹理',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0ic3RyaXBlcyIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDAgMCBMIDIwIDIwIiBzdHJva2U9IiNmMGYwZjAiIHN0cm9rZS13aWR0aD0iMSIvPjxwYXRoIGQ9Ik0gMCAyMCBMIDIwIDAiIHN0cm9rZT0iI2YwZjBmMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI3N0cmlwZXMpIi8+PC9zdmc+',
    type: 'pattern'
  }
];

export const BackgroundSettingsPanel: React.FC<BackgroundSettingsPanelProps> = ({
  mindMap,
  theme,
  isOpen,
  onClose
}) => {
  const [backgroundConfig, setBackgroundConfig] = useState({
    backgroundColor: '#fafafa',
    backgroundImage: '',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center center',
    backgroundSize: 'auto'
  });

  const fileInputRef = useRef<HTMLButtonElement>(null);

  // 更新背景配置
  const updateBackground = (key: string, value: any) => {
    setBackgroundConfig(prev => ({ ...prev, [key]: value }));
    
    if (mindMap) {
      try {
        const themeUpdate: any = {};
        
        switch (key) {
          case 'backgroundColor':
            themeUpdate.backgroundColor = value;
            break;
          case 'backgroundImage':
            themeUpdate.backgroundImage = value;
            break;
          case 'backgroundRepeat':
            themeUpdate.backgroundRepeat = value;
            break;
          case 'backgroundPosition':
            themeUpdate.backgroundPosition = value;
            break;
          case 'backgroundSize':
            themeUpdate.backgroundSize = value;
            break;
        }
        
        // 应用主题配置
        mindMap.setThemeConfig(themeUpdate);
        mindMap.render();
        
      } catch (error) {
        console.error('更新背景配置失败:', error);
      }
    }
  };

  // 处理图片上传
  const handleImageUpload = (file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        updateBackground('backgroundImage', imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  // 移除背景图片
  const removeBackgroundImage = () => {
    updateBackground('backgroundImage', '');
  };

  // 使用内置背景
  const useBuiltinBackground = (background: typeof builtinBackgrounds[0]) => {
    updateBackground('backgroundImage', background.url);
  };

  if (!isOpen) return null;

  return (
    <Box p="md">
      <Text fw={600} mb="lg">背景设置</Text>
      
      {/* 背景颜色 */}
      <Box mb="xl">
        <Text fw={500} mb="sm">背景颜色</Text>
        <SmartColorPicker
          value={backgroundConfig.backgroundColor}
          onChange={(color) => updateBackground('backgroundColor', color)}
          type="background"
          size="md"
        />
      </Box>

      {/* 背景图片上传 */}
      <Box mb="xl">
        <Text fw={500} mb="sm">背景图片</Text>
        
        <Group mb="md">
          <FileInput
            ref={fileInputRef}
            placeholder="选择图片文件"
            accept="image/*"
            onChange={handleImageUpload}
            leftSection={<IconUpload size={16} />}
            style={{ flex: 1 }}
          />
          
          {backgroundConfig.backgroundImage && (
            <Button
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
        {backgroundConfig.backgroundImage && (
          <Box mb="md">
            <Text size="sm" mb="xs">预览</Text>
            <Image
              src={backgroundConfig.backgroundImage}
              alt="背景预览"
              style={{ maxWidth: '200px', maxHeight: '120px' }}
              radius="md"
            />
          </Box>
        )}

        {/* 图片设置选项 */}
        {backgroundConfig.backgroundImage && (
          <Box>
            <Group mb="md">
              <Box style={{ flex: 1 }}>
                <Text size="sm" mb="xs">重复方式</Text>
                <Select
                  value={backgroundConfig.backgroundRepeat}
                  data={backgroundRepeatOptions}
                  onChange={(value) => value && updateBackground('backgroundRepeat', value)}
                />
              </Box>
              
              <Box style={{ flex: 1 }}>
                <Text size="sm" mb="xs">图片位置</Text>
                <Select
                  value={backgroundConfig.backgroundPosition}
                  data={backgroundPositionOptions}
                  onChange={(value) => value && updateBackground('backgroundPosition', value)}
                />
              </Box>
            </Group>

            <Box mb="md">
              <Text size="sm" mb="xs">图片大小</Text>
              <Select
                value={backgroundConfig.backgroundSize}
                data={backgroundSizeOptions}
                onChange={(value) => value && updateBackground('backgroundSize', value)}
              />
            </Box>
          </Box>
        )}
      </Box>

      {/* 内置背景图片库 */}
      <Box>
        <Text fw={500} mb="sm">内置背景</Text>
        <Grid>
          {builtinBackgrounds.map((bg, index) => (
            <Grid.Col span={6} key={index}>
              <Box
                style={{
                  border: '1px solid var(--mantine-color-gray-3)',
                  borderRadius: '8px',
                  padding: '8px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  ':hover': {
                    borderColor: 'var(--mantine-color-blue-5)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }
                }}
                onClick={() => useBuiltinBackground(bg)}
              >
                <Box
                  style={{
                    width: '100%',
                    height: '60px',
                    backgroundImage: `url(${bg.url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: '4px',
                    marginBottom: '8px',
                    border: '1px solid var(--mantine-color-gray-2)'
                  }}
                />
                <Text size="xs" c="dimmed">{bg.name}</Text>
              </Box>
            </Grid.Col>
          ))}
        </Grid>

        {/* 清除背景 */}
        <Group mt="md" justify="center">
          <Button
            variant="light"
            onClick={() => {
              updateBackground('backgroundColor', '#ffffff');
              updateBackground('backgroundImage', '');
            }}
          >
            清除所有背景
          </Button>
        </Group>
      </Box>
    </Box>
  );
};