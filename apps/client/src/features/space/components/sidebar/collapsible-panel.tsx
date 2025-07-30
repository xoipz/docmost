import React, { useState, ReactNode } from 'react';
import { Group, Text, ActionIcon, Collapse, Box } from '@mantine/core';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import classes from './space-sidebar.module.css';

interface CollapsiblePanelProps {
  title: string;
  children: ReactNode;
  defaultCollapsed?: boolean;
  storageKey?: string;
  rightSection?: ReactNode;
}

export function CollapsiblePanel({ 
  title, 
  children, 
  defaultCollapsed = false, 
  storageKey,
  rightSection 
}: CollapsiblePanelProps) {
  const [collapsed, setCollapsed] = useState(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : defaultCollapsed;
    }
    return defaultCollapsed;
  });

  const toggleCollapse = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(newState));
    }
  };

  return (
    <div className={classes.section}>
      <Group 
        className={classes.pagesHeader} 
        justify="space-between"
        onClick={toggleCollapse}
        style={{ cursor: 'pointer' }}
      >
        <Text size="xs" fw={500} c="dimmed">
          {title}
        </Text>
        <Group gap="xs">
          {rightSection}
          <ActionIcon
            variant="default"
            size={18}
            onClick={(e) => {
              e.stopPropagation();
              toggleCollapse();
            }}
            aria-label={collapsed ? `展开${title}` : `收起${title}`}
          >
            {collapsed ? <IconChevronDown size={16} /> : <IconChevronUp size={16} />}
          </ActionIcon>
        </Group>
      </Group>

      <Collapse in={!collapsed}>
        <Box>
          {children}
        </Box>
      </Collapse>
    </div>
  );
}