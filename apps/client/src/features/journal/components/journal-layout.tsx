import { useState, useEffect } from "react";
import { Stack, Divider, Box } from "@mantine/core";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { JournalCalendar, CalendarViewMode } from "./journal-calendar";
import { JournalList } from "./journal-list";
import { journalSelectedDateAtom, journalViewModeAtom } from "../atoms/journal-atoms";
import { IPage } from "@/features/page/types/page.types.ts";

interface JournalLayoutProps {
  spaceId: string;
  journals: IPage[];
  selectedJournalId?: string;
  onJournalSelect: (journal: IPage) => void;
  onCreateJournal: (date: Date) => void;
  onJournalEdit: (journal: IPage) => void;
}

export function JournalLayout({
  spaceId,
  journals,
  selectedJournalId,
  onJournalSelect,
  onCreateJournal,
  onJournalEdit,
}: JournalLayoutProps) {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useAtom(journalSelectedDateAtom);
  const [viewMode, setViewMode] = useAtom(journalViewModeAtom);

  // Get journal dates for calendar display
  const journalDates = journals
    .filter((journal) => journal.isJournal && journal.journalDate)
    .map((journal) => {
      // 确保日期格式为 YYYY-MM-DD
      if (journal.journalDate.includes('T')) {
        // 如果是 ISO 格式，转换为 YYYY-MM-DD
        return dayjs(journal.journalDate).format("YYYY-MM-DD");
      }
      return journal.journalDate;
    });

  // 添加调试信息
  console.log('JournalLayout received journals count:', journals.length);
  console.log('All journals data:', journals.map(j => ({
    id: j.id,
    title: j.title,
    isJournal: j.isJournal,
    journalDate: j.journalDate
  })));
  console.log('Filtered journal entries:', journals.filter(j => j.isJournal && j.journalDate));
  console.log('Processed journalDates:', journalDates);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    
    // Find journal for this date
    const dateStr = dayjs(date).format("YYYY-MM-DD");
    const existingJournal = journals.find(
      (journal) => {
        if (!journal.isJournal || !journal.journalDate) return false;
        
        // 处理不同的日期格式
        let journalDateStr = journal.journalDate;
        if (journalDateStr.includes('T')) {
          journalDateStr = dayjs(journalDateStr).format("YYYY-MM-DD");
        }
        
        return journalDateStr === dateStr;
      }
    );
    
    if (existingJournal) {
      onJournalSelect(existingJournal);
    }
  };

  const handleDateDoubleClick = (date: Date) => {
    const dateStr = dayjs(date).format("YYYY-MM-DD");
    const existingJournal = journals.find(
      (journal) => {
        if (!journal.isJournal || !journal.journalDate) return false;
        
        // 处理不同的日期格式
        let journalDateStr = journal.journalDate;
        if (journalDateStr.includes('T')) {
          journalDateStr = dayjs(journalDateStr).format("YYYY-MM-DD");
        }
        
        return journalDateStr === dateStr;
      }
    );
    
    if (existingJournal) {
      // Edit existing journal
      onJournalEdit(existingJournal);
    } else {
      // Create new journal
      onCreateJournal(date);
    }
  };

  const handleJournalSelect = (journal: IPage) => {
    // Update selected date when journal is selected
    if (journal.journalDate) {
      let dateToSet;
      if (journal.journalDate.includes('T')) {
        dateToSet = dayjs(journal.journalDate).toDate();
      } else {
        dateToSet = dayjs(journal.journalDate).toDate();
      }
      setSelectedDate(dateToSet);
    }
    onJournalSelect(journal);
  };

  const handleJournalDoubleClick = (journal: IPage) => {
    onJournalEdit(journal);
  };

  const handleViewModeChange = (mode: CalendarViewMode) => {
    setViewMode(mode);
  };

  return (
    <Stack gap="md" style={{ height: "100%" }}>
      {/* Calendar Section */}
      <Box>
        <JournalCalendar
          selectedDate={selectedDate || undefined}
          onDateSelect={handleDateSelect}
          onDateDoubleClick={handleDateDoubleClick}
          journalDates={journalDates}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
        />
      </Box>

      <Divider />

      {/* Journal List Section */}
      <Box style={{ flex: 1, minHeight: 0 }}>
        <JournalList
          journals={journals}
          selectedJournalId={selectedJournalId}
          onJournalSelect={handleJournalSelect}
          onJournalDoubleClick={handleJournalDoubleClick}
        />
      </Box>
    </Stack>
  );
}