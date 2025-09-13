import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';

interface ThemePanelProps {
  mindMap: any;
  theme: 'light' | 'dark';
  show: boolean;
  onClose: () => void;
}

const themeList = [
  { value: 'default', name: '默认', color: '#549688' },
  { value: 'classic', name: '经典', color: '#5aa9f3' },
  { value: 'minions', name: '小黄人', color: '#fff566' },
  { value: 'pinkGrape', name: '粉红葡萄', color: '#f08bb4' },
  { value: 'mint', name: '薄荷', color: '#57c5f7' },
  { value: 'gold', name: '金色', color: '#ffd700' },
  { value: 'vitalityOrange', name: '活力橙', color: '#ffa500' },
  { value: 'greenLeaf', name: '绿叶', color: '#7ed321' },
  { value: 'dark2', name: '深色2', color: '#4a4a4a' },
  { value: 'skyGreen', name: '天空绿', color: '#87ceeb' },
  { value: 'classic2', name: '经典2', color: '#40a9ff' },
  { value: 'classic3', name: '经典3', color: '#13c2c2' },
  { value: 'classic4', name: '经典4', color: '#52c41a' },
  { value: 'classicGreen', name: '经典绿', color: '#52c41a' },
  { value: 'classicBlue', name: '经典蓝', color: '#1890ff' },
  { value: 'blueSky', name: '蓝天', color: '#87ceeb' },
  { value: 'brainImpairedPink', name: '脑残粉', color: '#ff1493' },
  { value: 'dark', name: '深色', color: '#2c3e50' },
  { value: 'earthYellow', name: '大地黄', color: '#daa520' },
  { value: 'freshGreen', name: '清新绿', color: '#90ee90' },
  { value: 'freshRed', name: '清新红', color: '#ff6b6b' },
  { value: 'romanticPurple', name: '浪漫紫', color: '#dda0dd' },
  { value: 'simpleBlack', name: '简约黑', color: '#2c2c2c' },
  { value: 'courseGreen', name: '课程绿', color: '#228b22' },
  { value: 'coffee', name: '咖啡', color: '#8b4513' },
  { value: 'redSpirit', name: '红色精神', color: '#dc143c' },
  { value: 'blackHumour', name: '黑色幽默', color: '#1c1c1c' },
  { value: 'lateNightOffice', name: '深夜办公室', color: '#2f4f4f' },
  { value: 'blackGold', name: '黑金', color: '#000000' },
];

export default function ThemePanel({
  mindMap,
  theme,
  show,
  onClose
}: ThemePanelProps) {
  const [currentTheme, setCurrentTheme] = useState('default');

  useEffect(() => {
    if (mindMap) {
      // 获取当前主题
      const themeConfig = mindMap.getThemeConfig && mindMap.getThemeConfig() || {};
      setCurrentTheme(themeConfig.theme || 'default');
    }
  }, [mindMap]);

  const handleThemeChange = (themeName: string) => {
    if (!mindMap) return;
    
    setCurrentTheme(themeName);
    mindMap.setTheme(themeName);
    
    // 保存到本地存储
    try {
      localStorage.setItem('mindmap-theme', themeName);
    } catch (e) {
      console.warn('Failed to save theme to localStorage');
    }
  };

  return (
    <Sidebar
      title="主题"
      show={show}
      onClose={onClose}
      theme={theme}
    >
      <div className="theme-panel">
        <div className="panel-section">
          <div className="section-title">选择主题</div>
          <div className="theme-grid">
            {themeList.map((themeItem) => (
              <div
                key={themeItem.value}
                className={`theme-item ${currentTheme === themeItem.value ? 'active' : ''}`}
                onClick={() => handleThemeChange(themeItem.value)}
              >
                <div 
                  className="theme-color"
                  style={{ backgroundColor: themeItem.color }}
                ></div>
                <div className="theme-name">{themeItem.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Sidebar>
  );
}