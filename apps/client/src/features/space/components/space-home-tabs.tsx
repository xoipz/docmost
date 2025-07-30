import { Text, Tabs, Space, Stack, Box, Group, Button } from "@mantine/core";
import { IconClockHour3, IconRefresh } from "@tabler/icons-react";
import RecentChanges from "@/components/common/recent-changes.tsx";
import { useParams } from "react-router-dom";
import { useGetSpaceBySlugQuery } from "@/features/space/queries/space-query.ts";
import { useTranslation } from "react-i18next";
import { useAtom } from "jotai";
import { createSpaceViewModeAtom } from "@/features/journal/atoms/journal-atoms.ts";
import { SpaceViewModeToggle } from "@/features/journal/components/space-view-mode-toggle.tsx";
import { JournalLayout } from "@/features/journal/components/journal-layout.tsx";
import { useGetJournalsQuery } from "@/features/journal/queries/journal-query.ts";
import { useJournalInteraction } from "@/features/journal/hooks/use-journal-interaction.ts";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function SpaceHomeTabs() {
  const { t } = useTranslation();
  const { spaceSlug } = useParams();
  const { data: space } = useGetSpaceBySlugQuery(spaceSlug);
  const queryClient = useQueryClient();
  
  // 使用基于spaceId的独立viewMode atom
  const spaceViewModeAtom = useMemo(() => 
    space?.id ? createSpaceViewModeAtom(space.id) : createSpaceViewModeAtom('default'),
    [space?.id]
  );
  const [viewMode, setViewMode] = useAtom(spaceViewModeAtom);
  
  const { data: journals = [] } = useGetJournalsQuery(space?.id);
  console.log('SpaceHomeTabs: 接收到的journals数据:', journals, 'space?.id:', space?.id);
  
  const {
    journalDates,
    handleDateSelect,
    handleDateDoubleClick,
    handleJournalSelect,
    handleJournalDoubleClick,
  } = useJournalInteraction({
    spaceSlug,
    journals,
  });

  // 刷新当前页面数据
  const handleRefresh = () => {
    if (space?.id) {
      // 刷新当前space的相关查询
      queryClient.invalidateQueries({ queryKey: ["recent-changes", space.id] });
      queryClient.invalidateQueries({ queryKey: ["journals", space.id] });
      queryClient.invalidateQueries({ queryKey: ["spaces", spaceSlug] });
    }
  };

  if (viewMode === "journal") {
    return (
      <Stack gap="md">
        {/* 顶部工具栏：左边刷新按钮，右边模式切换 */}
        <Group justify="space-between" align="center">
          <Button
            variant="light"
            size="xs"
            leftSection={<IconRefresh size={14} />}
            onClick={handleRefresh}
          >
            {t("刷新")}
          </Button>
          
          <SpaceViewModeToggle 
            mode={viewMode} 
            onChange={setViewMode} 
          />
        </Group>
        
        <JournalLayout
          spaceId={space?.id || ""}
          journals={journals}
          onJournalSelect={handleJournalSelect}
          onCreateJournal={handleDateDoubleClick}
          onJournalEdit={handleJournalDoubleClick}
        />
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      {/* 顶部工具栏：左边刷新按钮，右边模式切换 */}
      <Group justify="space-between" align="center">
        <Button
          variant="light"
          size="xs"
          leftSection={<IconRefresh size={14} />}
          onClick={handleRefresh}
        >
          {t("刷新")}
        </Button>
        
        <SpaceViewModeToggle 
          mode={viewMode} 
          onChange={setViewMode} 
        />
      </Group>
      
      <Tabs defaultValue="recent">
        <Tabs.List>
          <Tabs.Tab value="recent" leftSection={<IconClockHour3 size={18} />}>
            <Text size="sm" fw={500}>
              {t("Recently updated")}
            </Text>
          </Tabs.Tab>
        </Tabs.List>

        <Space my="md" />

        <Tabs.Panel value="recent">
          {space?.id && <RecentChanges spaceId={space.id} />}
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
