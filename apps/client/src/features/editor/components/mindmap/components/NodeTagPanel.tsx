import React, { useState, useEffect } from 'react';
import { Box, Group, Text, TextInput, Button, Badge, ColorPicker, ActionIcon } from '@mantine/core';
import { IconTag, IconX, IconPlus, IconEdit } from '@tabler/icons-react';
import Sidebar from './Sidebar';
import { SmartColorPicker } from './EnhancedColorPicker';
import '../styles/node-tag-panel.css';

interface NodeTagPanelProps {
  mindMap: any;
  theme: 'light' | 'dark';
  show: boolean;
  onClose: () => void;
  activeNodes: any[];
}

// 预设标签颜色
const tagColors = [
  '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
  '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
  '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
  '#ff5722', '#795548', '#9e9e9e', '#607d8b'
];

// 预设标签模板
const tagTemplates = [
  { name: '重要', color: '#f44336' },
  { name: '紧急', color: '#ff9800' },
  { name: '完成', color: '#4caf50' },
  { name: '进行中', color: '#2196f3' },
  { name: '待定', color: '#9e9e9e' },
  { name: '想法', color: '#9c27b0' },
  { name: '问题', color: '#f44336' },
  { name: '解决方案', color: '#00bcd4' },
];

interface Tag {
  id: string;
  text: string;
  color: string;
}

export default function NodeTagPanel({
  mindMap,
  theme,
  show,
  onClose,
  activeNodes
}: NodeTagPanelProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagText, setNewTagText] = useState('');
  const [newTagColor, setNewTagColor] = useState('#2196f3');
  const [editingTag, setEditingTag] = useState<string | null>(null);

  // 从节点获取标签数据
  useEffect(() => {
    if (activeNodes.length > 0 && activeNodes[0]) {
      const node = activeNodes[0];
      const nodeTags = node.getData('tags') || [];
      setTags(nodeTags);
    }
  }, [activeNodes]);

  // 更新节点标签
  const updateNodeTags = (newTags: Tag[]) => {
    if (!mindMap || activeNodes.length === 0) return;

    setTags(newTags);
    
    activeNodes.forEach(node => {
      node.setData('tags', newTags);
    });
    
    mindMap.render();
  };

  // 添加新标签
  const addTag = () => {
    if (!newTagText.trim()) return;
    
    const newTag: Tag = {
      id: Date.now().toString(),
      text: newTagText.trim(),
      color: newTagColor
    };
    
    const newTags = [...tags, newTag];
    updateNodeTags(newTags);
    setNewTagText('');
  };

  // 删除标签
  const deleteTag = (tagId: string) => {
    const newTags = tags.filter(tag => tag.id !== tagId);
    updateNodeTags(newTags);
  };

  // 编辑标签
  const editTag = (tagId: string, newText: string, newColor?: string) => {
    const newTags = tags.map(tag => 
      tag.id === tagId 
        ? { ...tag, text: newText, ...(newColor && { color: newColor }) }
        : tag
    );
    updateNodeTags(newTags);
    setEditingTag(null);
  };

  // 使用预设标签
  const useTemplate = (template: typeof tagTemplates[0]) => {
    const newTag: Tag = {
      id: Date.now().toString(),
      text: template.name,
      color: template.color
    };
    
    const newTags = [...tags, newTag];
    updateNodeTags(newTags);
  };

  return (
    <Sidebar
      title="节点标签"
      show={show}
      onClose={onClose}
      theme={theme}
    >
      {activeNodes.length > 0 ? (
        <div className="node-tag-panel">
          
          {/* 当前标签列表 */}
          <div className="panel-section">
            <div className="section-title">
              <IconTag size={16} />
              当前标签
            </div>
            
            {tags.length > 0 ? (
              <div className="tags-list">
                {tags.map((tag) => (
                  <div key={tag.id} className="tag-item">
                    {editingTag === tag.id ? (
                      <div className="tag-edit">
                        <TextInput
                          size="xs"
                          defaultValue={tag.text}
                          onBlur={(e) => editTag(tag.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              editTag(tag.id, e.currentTarget.value);
                            } else if (e.key === 'Escape') {
                              setEditingTag(null);
                            }
                          }}
                          autoFocus
                        />
                      </div>
                    ) : (
                      <Badge
                        color={tag.color}
                        variant="filled"
                        size="lg"
                        leftSection={
                          <div 
                            className="tag-color-dot"
                            style={{ backgroundColor: tag.color }}
                          />
                        }
                        rightSection={
                          <Group gap={2}>
                            <ActionIcon
                              size={16}
                              variant="transparent"
                              color="white"
                              onClick={() => setEditingTag(tag.id)}
                            >
                              <IconEdit size={12} />
                            </ActionIcon>
                            <ActionIcon
                              size={16}
                              variant="transparent"
                              color="white"
                              onClick={() => deleteTag(tag.id)}
                            >
                              <IconX size={12} />
                            </ActionIcon>
                          </Group>
                        }
                      >
                        {tag.text}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <Text size="sm" c="dimmed">暂无标签</Text>
            )}
          </div>

          {/* 添加新标签 */}
          <div className="panel-section">
            <div className="section-title">添加标签</div>
            
            <div className="add-tag-form">
              <TextInput
                placeholder="标签名称"
                value={newTagText}
                onChange={(e) => setNewTagText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addTag();
                  }
                }}
                size="sm"
                mb="sm"
              />
              
              <Group mb="sm">
                <Text size="sm">颜色:</Text>
                <SmartColorPicker
                  value={newTagColor}
                  onChange={setNewTagColor}
                  type="general"
                  size="sm"
                />
              </Group>
              
              <Button
                leftSection={<IconPlus size={14} />}
                onClick={addTag}
                disabled={!newTagText.trim()}
                size="sm"
                fullWidth
              >
                添加标签
              </Button>
            </div>
          </div>

          {/* 标签模板 */}
          <div className="panel-section">
            <div className="section-title">快速添加</div>
            
            <div className="tag-templates">
              {tagTemplates.map((template, index) => (
                <Button
                  key={index}
                  variant="light"
                  size="xs"
                  onClick={() => useTemplate(template)}
                  leftSection={
                    <div 
                      className="template-color-dot"
                      style={{ backgroundColor: template.color }}
                    />
                  }
                  className="template-button"
                >
                  {template.name}
                </Button>
              ))}
            </div>
          </div>

        </div>
      ) : (
        <div className="empty-state">
          <Text size="sm" c="dimmed">请选择节点以管理标签</Text>
        </div>
      )}
    </Sidebar>
  );
}