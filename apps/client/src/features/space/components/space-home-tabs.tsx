import { Text, Tabs, Space, Stack, Box } from "@mantine/core";
import { IconClockHour3 } from "@tabler/icons-react";
import RecentChanges from "@/components/common/recent-changes.tsx";
import { useParams } from "react-router-dom";
import { useGetSpaceBySlugQuery } from "@/features/space/queries/space-query.ts";
import { useTranslation } from "react-i18next";
import { useAtom } from "jotai";
import { spaceViewModeAtom } from "@/features/journal/atoms/journal-atoms.ts";
import { SpaceViewModeToggle } from "@/features/journal/components/space-view-mode-toggle.tsx";
import { JournalLayout } from "@/features/journal/components/journal-layout.tsx";
import { useGetJournalsQuery } from "@/features/journal/queries/journal-query.ts";
import { useJournalInteraction } from "@/features/journal/hooks/use-journal-interaction.ts";

export default function SpaceHomeTabs() {
  const { t } = useTranslation();
  const { spaceSlug } = useParams();
  const { data: space } = useGetSpaceBySlugQuery(spaceSlug);
  const [viewMode, setViewMode] = useAtom(spaceViewModeAtom);
  
  const { data: journals = [] } = useGetJournalsQuery(space?.id);
  
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

  if (viewMode === "journal") {
    return (
      <Stack gap="md">
        <SpaceViewModeToggle 
          mode={viewMode} 
          onChange={setViewMode} 
        />
        
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
      <SpaceViewModeToggle 
        mode={viewMode} 
        onChange={setViewMode} 
      />
      
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
