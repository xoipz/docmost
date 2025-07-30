import { Button, Group, SegmentedControl, Tooltip } from "@mantine/core";
import { IconBook, IconHome } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { SpaceViewMode } from "@/features/journal/atoms/journal-atoms.ts";

interface SpaceViewModeToggleProps {
  mode: SpaceViewMode;
  onChange: (mode: SpaceViewMode) => void;
}

export function SpaceViewModeToggle({ mode, onChange }: SpaceViewModeToggleProps) {
  const { t } = useTranslation();

  return (
    <SegmentedControl
      size="xs"
      radius="md"
      style={{ width: 'fit-content' }}
      data={[
        {
          value: "normal",
          label: (
            <Group gap={4} wrap="nowrap">
              <IconHome size={14} />
              <span style={{ fontSize: '12px' }}>{t("普通模式")}</span>
            </Group>
          ),
        },
        {
          value: "journal", 
          label: (
            <Group gap={4} wrap="nowrap">
              <IconBook size={14} />
              <span style={{ fontSize: '12px' }}>{t("日记模式")}</span>
            </Group>
          ),
        },
      ]}
      value={mode}
      onChange={(value) => onChange(value as SpaceViewMode)}
    />
  );
}