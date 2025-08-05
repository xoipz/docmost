import { Stack, Group, Text, ActionIcon, Box, Paper, Divider } from "@mantine/core";
import { useAtom } from "jotai";
import { favoriteButtonsAtom, allQuickInputButtons } from "@/features/editor/components/quick-input-bar/quick-input-bar";
import { useTranslation } from "react-i18next";
import { IconChevronUp, IconChevronDown, IconX, IconPlus, IconStar, IconGripVertical } from "@tabler/icons-react";
import { useState, useCallback } from "react";

export function FavoriteButtonsSettings() {
  const { t } = useTranslation();
  const [favoriteButtons, setFavoriteButtons] = useAtom(favoriteButtonsAtom);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [tempOrder, setTempOrder] = useState<string[]>([]);

  // 获取可选的按钮（排除基础功能按钮，它们始终显示）
  const availableButtons = allQuickInputButtons.filter(button => button.category !== 'base');
  
  // 获取当前显示的顺序（拖拽时显示临时顺序）
  const displayOrder = tempOrder.length > 0 ? tempOrder : favoriteButtons;
  
  // 获取未收藏的按钮
  const unFavoriteButtons = availableButtons.filter(button => !favoriteButtons.includes(button.label));

  // 添加到收藏（添加到最后）
  const handleAddFavorite = useCallback((buttonLabel: string) => {
    const newFavorites = [...favoriteButtons, buttonLabel];
    setFavoriteButtons(newFavorites);
  }, [favoriteButtons, setFavoriteButtons]);

  // 移动按钮位置
  const handleMoveButton = useCallback((buttonLabel: string, direction: 'up' | 'down') => {
    const currentOrder = tempOrder.length > 0 ? tempOrder : favoriteButtons;
    const currentIndex = currentOrder.indexOf(buttonLabel);
    if (currentIndex === -1) return;

    const newButtons = [...currentOrder];
    if (direction === 'up' && currentIndex > 0) {
      [newButtons[currentIndex], newButtons[currentIndex - 1]] = [newButtons[currentIndex - 1], newButtons[currentIndex]];
    } else if (direction === 'down' && currentIndex < newButtons.length - 1) {
      [newButtons[currentIndex], newButtons[currentIndex + 1]] = [newButtons[currentIndex + 1], newButtons[currentIndex]];
    }
    
    setFavoriteButtons(newButtons);
    setTempOrder([]); // 清除临时顺序
  }, [tempOrder, favoriteButtons, setFavoriteButtons]);

  // 取消收藏
  const handleRemoveFavorite = useCallback((buttonLabel: string) => {
    const newButtons = favoriteButtons.filter(label => label !== buttonLabel);
    setFavoriteButtons(newButtons);
    setTempOrder([]); // 清除临时顺序
  }, [favoriteButtons, setFavoriteButtons]);

  // 拖拽开始
  const handleDragStart = useCallback((e: React.DragEvent, buttonLabel: string) => {
    e.dataTransfer.setData('text/plain', buttonLabel);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItem(buttonLabel);
    setTempOrder([...favoriteButtons]);
  }, [favoriteButtons]);

  // 拖拽悬停
  const handleDragOver = useCallback((e: React.DragEvent, targetButtonLabel: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (!draggedItem || draggedItem === targetButtonLabel) return;

    const currentOrder = tempOrder.length > 0 ? tempOrder : favoriteButtons;
    const dragIndex = currentOrder.indexOf(draggedItem);
    const targetIndex = currentOrder.indexOf(targetButtonLabel);
    
    if (dragIndex === -1 || targetIndex === -1) return;

    const newOrder = [...currentOrder];
    newOrder.splice(dragIndex, 1);
    newOrder.splice(targetIndex, 0, draggedItem);
    
    setTempOrder(newOrder);
  }, [draggedItem, tempOrder, favoriteButtons]);

  // 处理放置
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    if (tempOrder.length > 0) {
      setFavoriteButtons(tempOrder);
    }
    
    setDraggedItem(null);
    setTempOrder([]);
  }, [tempOrder, setFavoriteButtons]);

  // 拖拽结束
  const handleDragEnd = useCallback(() => {
    if (tempOrder.length > 0) {
      setFavoriteButtons(tempOrder);
    }
    setDraggedItem(null);
    setTempOrder([]);
  }, [tempOrder, setFavoriteButtons]);

  // 获取按钮显示信息
  const getButtonInfo = (label: string) => {
    const button = allQuickInputButtons.find(b => b.label === label);
    return button;
  };

  return (
    <Stack gap="md">
      {/* 已收藏的按钮（排序和取消收藏） */}
      <Paper p="sm" withBorder>
        <Group mb="xs" gap="xs">
          <IconStar size={16} />
          <Text size="sm" fw={500}>{t("常用按钮")}</Text>
          <Text size="xs" c="dimmed">({favoriteButtons.length})</Text>
        </Group>
        
        {favoriteButtons.length > 0 ? (
          <Stack gap="xs">
            {displayOrder.map((buttonLabel, index) => {
              const buttonInfo = getButtonInfo(buttonLabel);
              if (!buttonInfo) return null;
              
              const isDragging = draggedItem === buttonLabel;

              return (
                <Paper 
                  key={buttonLabel} 
                  p="xs" 
                  withBorder 
                  draggable
                  onDragStart={(e) => handleDragStart(e, buttonLabel)}
                  onDragOver={(e) => handleDragOver(e, buttonLabel)}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  style={{ 
                    backgroundColor: isDragging 
                      ? 'var(--mantine-color-default-hover)' 
                      : 'var(--mantine-color-blue-light)', 
                    borderColor: isDragging 
                      ? 'var(--mantine-color-default-border)' 
                      : 'var(--mantine-color-blue-3)',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    opacity: isDragging ? 0.8 : 1,
                    transform: `scale(${isDragging ? 0.98 : 1}) translateY(${isDragging ? '-2px' : '0'})`,
                    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isDragging 
                      ? 'var(--mantine-shadow-md)' 
                      : 'var(--mantine-shadow-xs)',
                    zIndex: isDragging ? 10 : 1
                  }}
                >
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap="xs">
                      <Box
                        style={{
                          cursor: isDragging ? 'grabbing' : 'grab',
                          color: isDragging 
                            ? 'var(--mantine-color-blue-6)' 
                            : 'var(--mantine-color-gray-6)',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '2px',
                          transition: 'color 0.15s ease'
                        }}
                        title={t("拖拽排序")}
                      >
                        <IconGripVertical size={14} />
                      </Box>
                      {buttonInfo.icon && <buttonInfo.icon size={16} />}
                      <Text size="sm">{t(buttonInfo.label)}</Text>
                    </Group>
                    <Group gap="4px">
                      <ActionIcon
                        variant="subtle"
                        size="sm"
                        onClick={() => handleMoveButton(buttonLabel, 'up')}
                        disabled={index === 0}
                        style={{ minWidth: 24, minHeight: 24 }}
                        title={t("上移")}
                      >
                        <IconChevronUp size={14} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        size="sm"
                        onClick={() => handleMoveButton(buttonLabel, 'down')}
                        disabled={index === displayOrder.length - 1}
                        style={{ minWidth: 24, minHeight: 24 }}
                        title={t("下移")}
                      >
                        <IconChevronDown size={14} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="sm"
                        onClick={() => handleRemoveFavorite(buttonLabel)}
                        style={{ minWidth: 24, minHeight: 24 }}
                        title={t("取消收藏")}
                      >
                        <IconX size={14} />
                      </ActionIcon>
                    </Group>
                  </Group>
                </Paper>
              );
            })}
          </Stack>
        ) : (
          <Box p="md" style={{ textAlign: 'center' }}>
            <Text size="sm" c="dimmed">{t("暂无常用按钮，请从下方添加")}</Text>
          </Box>
        )}
      </Paper>

      <Divider />

      {/* 可添加的按钮 */}
      {unFavoriteButtons.length > 0 && (
        <Paper p="sm" withBorder>
          <Group mb="xs" gap="xs">
            <IconPlus size={16} />
            <Text size="sm" fw={500}>{t("添加常用按钮")}</Text>
          </Group>
          
          <Stack gap="xs">
            {unFavoriteButtons.map((button) => (
              <Paper key={button.label} p="xs" withBorder>
                <Group justify="space-between" wrap="nowrap">
                  <Group gap="xs">
                    {button.icon && <button.icon size={16} />}
                    <Text size="sm">{t(button.label)}</Text>
                  </Group>
                  <ActionIcon
                    variant="subtle"
                    color="blue"
                    size="sm"
                    onClick={() => handleAddFavorite(button.label)}
                    style={{ minWidth: 24, minHeight: 24 }}
                    title={t("添加到常用")}
                  >
                    <IconPlus size={14} />
                  </ActionIcon>
                </Group>
              </Paper>
            ))}
          </Stack>
        </Paper>
      )}

      {unFavoriteButtons.length === 0 && (
        <Box p="md" style={{ textAlign: 'center' }}>
          <Text size="sm" c="dimmed">{t("所有按钮都已添加到常用")}</Text>
        </Box>
      )}
    </Stack>
  );
}