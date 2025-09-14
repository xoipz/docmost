// 自定义图标配置 - 为 docmost 思维导图定制
export const customIconList = [
  {
    name: '优先级',
    type: 'priority',
    list: [
      {
        name: '1',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
          <circle cx="12" cy="12" r="10" fill="#E93B30"/>
          <text x="12" y="12" text-anchor="middle" dy="0.35em" fill="white" font-size="12" font-weight="bold">1</text>
        </svg>`
      },
      {
        name: '2',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
          <circle cx="12" cy="12" r="10" fill="#FA8D2E"/>
          <text x="12" y="12" text-anchor="middle" dy="0.35em" fill="white" font-size="12" font-weight="bold">2</text>
        </svg>`
      },
      {
        name: '3',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
          <circle cx="12" cy="12" r="10" fill="#2E66FA"/>
          <text x="12" y="12" text-anchor="middle" dy="0.35em" fill="white" font-size="12" font-weight="bold">3</text>
        </svg>`
      },
      {
        name: '4',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
          <circle cx="12" cy="12" r="10" fill="#6D768D"/>
          <text x="12" y="12" text-anchor="middle" dy="0.35em" fill="white" font-size="12" font-weight="bold">4</text>
        </svg>`
      },
      {
        name: '5',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
          <circle cx="12" cy="12" r="10" fill="#00C851"/>
          <text x="12" y="12" text-anchor="middle" dy="0.35em" fill="white" font-size="12" font-weight="bold">5</text>
        </svg>`
      },
    ]
  },
  {
    name: '情感',
    type: 'emotion',
    list: [
      {
        name: 'happy',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
          <circle cx="12" cy="12" r="10" fill="#FFD700" stroke="#FFA500" stroke-width="1"/>
          <circle cx="8" cy="9" r="1.5" fill="#333"/>
          <circle cx="16" cy="9" r="1.5" fill="#333"/>
          <path d="M8 15c1 2 3 2 4 2s3 0 4-2" stroke="#333" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        </svg>`
      },
      {
        name: 'sad',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
          <circle cx="12" cy="12" r="10" fill="#4169E1" stroke="#1E4ED8" stroke-width="1"/>
          <circle cx="8" cy="9" r="1.5" fill="white"/>
          <circle cx="16" cy="9" r="1.5" fill="white"/>
          <path d="M8 17c1-2 3-2 4-2s3 0 4 2" stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        </svg>`
      },
      {
        name: 'love',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#FF69B4"/>
        </svg>`
      },
      {
        name: 'star',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#FFD700" stroke="#FFA500" stroke-width="0.5"/>
        </svg>`
      },
      {
        name: 'think',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
          <circle cx="12" cy="12" r="10" fill="#DAA520" stroke="#B8860B" stroke-width="1"/>
          <text x="12" y="12" text-anchor="middle" dy="0.35em" fill="white" font-size="14" font-weight="bold">?</text>
        </svg>`
      },
      {
        name: 'cool',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#333"/>
        </svg>`
      },
    ]
  },
  {
    name: '状态',
    type: 'status',
    list: [
      {
        name: 'done',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
          <circle cx="12" cy="12" r="10" fill="#28A745"/>
          <path d="M8 12l2 2 4-4" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`
      },
      {
        name: 'todo',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
          <circle cx="12" cy="12" r="10" fill="none" stroke="#FFC107" stroke-width="2"/>
        </svg>`
      },
      {
        name: 'progress',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
          <circle cx="12" cy="12" r="10" fill="#17A2B8"/>
          <path d="M12 2 A10 10 0 0 1 22 12" fill="white"/>
        </svg>`
      },
      {
        name: 'warning',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
          <path d="M12 2L1 21h22L12 2z" fill="#FD7E14"/>
          <text x="12" y="14" text-anchor="middle" dy="0.35em" fill="white" font-size="12" font-weight="bold">!</text>
        </svg>`
      },
      {
        name: 'error',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
          <circle cx="12" cy="12" r="10" fill="#DC3545"/>
          <path d="M8 8l8 8M16 8l-8 8" stroke="white" stroke-width="2" stroke-linecap="round"/>
        </svg>`
      },
      {
        name: 'info',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
          <circle cx="12" cy="12" r="10" fill="#6F42C1"/>
          <text x="12" y="12" text-anchor="middle" dy="0.35em" fill="white" font-size="12" font-weight="bold">i</text>
        </svg>`
      },
    ]
  },
  {
    name: '标记',
    type: 'marker',
    list: [
      {
        name: 'star',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#FFD700"/>
        </svg>`
      },
      {
        name: 'flag',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
          <path d="M5 3v18h2V13h10l-2-5 2-5H7V3H5z" fill="#FF4500"/>
        </svg>`
      },
      {
        name: 'light',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
          <path d="M12 2l2 6 6-2-2 6 6 2-6 2 2 6-6-2-2 6-2-6-6 2 2-6-6-2 6-2-2-6 6 2z" fill="#FFFF00" stroke="#FFD700" stroke-width="0.5"/>
        </svg>`
      },
      {
        name: 'heart',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#FF0000"/>
        </svg>`
      },
      {
        name: 'diamond',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
          <path d="M12 2l5 7-5 13-5-13z" fill="#00CED1"/>
        </svg>`
      },
      {
        name: 'target',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
          <circle cx="12" cy="12" r="10" fill="none" stroke="#FFD700" stroke-width="2"/>
          <circle cx="12" cy="12" r="6" fill="none" stroke="#FFD700" stroke-width="2"/>
          <circle cx="12" cy="12" r="2" fill="#FFD700"/>
        </svg>`
      },
    ]
  }
];

// 导出图标映射，用于图标选择器显示
export const iconDisplayMap = {
  'priority_1': { icon: '1', color: '#E93B30', style: 'priority' },
  'priority_2': { icon: '2', color: '#FA8D2E', style: 'priority' },
  'priority_3': { icon: '3', color: '#2E66FA', style: 'priority' },
  'priority_4': { icon: '4', color: '#6D768D', style: 'priority' },
  'priority_5': { icon: '5', color: '#00C851', style: 'priority' },
  
  'emotion_happy': { icon: '☺', color: '#FFD700', style: 'emotion' },
  'emotion_sad': { icon: '☹', color: '#4169E1', style: 'emotion' },
  'emotion_love': { icon: '♥', color: '#FF69B4', style: 'emotion' },
  'emotion_star': { icon: '★', color: '#FFD700', style: 'emotion' },
  'emotion_think': { icon: '?', color: '#DAA520', style: 'emotion' },
  'emotion_cool': { icon: '★', color: '#333', style: 'emotion' },
  
  'status_done': { icon: '✓', color: '#28A745', style: 'status' },
  'status_todo': { icon: '○', color: '#FFC107', style: 'status' },
  'status_progress': { icon: '◐', color: '#17A2B8', style: 'status' },
  'status_warning': { icon: '!', color: '#FD7E14', style: 'status' },
  'status_error': { icon: '✗', color: '#DC3545', style: 'status' },
  'status_info': { icon: 'i', color: '#6F42C1', style: 'status' },
  
  'marker_star': { icon: '★', color: '#FFD700', style: 'marker' },
  'marker_flag': { icon: '⚑', color: '#FF4500', style: 'marker' },
  'marker_light': { icon: '◆', color: '#FFFF00', style: 'marker' },
  'marker_heart': { icon: '♥', color: '#FF0000', style: 'marker' },
  'marker_diamond': { icon: '♦', color: '#00CED1', style: 'marker' },
  'marker_target': { icon: '◎', color: '#FFD700', style: 'marker' },
};