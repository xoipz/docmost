import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { IPage } from "@/features/page/types/page.types.ts";

interface UseJournalInteractionProps {
  spaceSlug?: string;
  journals: IPage[];
  onJournalSelect?: (journal: IPage) => void;
}

export function useJournalInteraction({
  spaceSlug,
  journals,
  onJournalSelect,
}: UseJournalInteractionProps) {
  const navigate = useNavigate();

  // 确保 journals 是数组
  const safeJournals = Array.isArray(journals) ? journals : [];

  const journalDates = useMemo(() => {
    return safeJournals
      .filter((journal) => journal.isJournal && journal.journalDate)
      .map((journal) => journal.journalDate);
  }, [safeJournals]);

  const findJournalByDate = (date: Date) => {
    const dateStr = dayjs(date).format("YYYY-MM-DD");
    return safeJournals.find(
      (journal) => journal.isJournal && journal.journalDate === dateStr
    );
  };

  const handleDateSelect = (date: Date) => {
    const existingJournal = findJournalByDate(date);
    if (existingJournal && onJournalSelect) {
      onJournalSelect(existingJournal);
    }
  };

  const handleDateDoubleClick = (date: Date) => {
    const existingJournal = findJournalByDate(date);
    const dateStr = dayjs(date).format("YYYY-MM-DD");
    
    if (existingJournal) {
      // Navigate to existing journal
      navigate(`/s/${spaceSlug}/p/${existingJournal.slugId}`);
    } else {
      // Create new journal
      navigate(`/s/${spaceSlug}/pages/new?journal=${dateStr}`);
    }
  };

  const handleJournalSelect = (journal: IPage) => {
    if (onJournalSelect) {
      onJournalSelect(journal);
    }
  };

  const handleJournalDoubleClick = (journal: IPage) => {
    navigate(`/s/${spaceSlug}/p/${journal.slugId}`);
  };

  return {
    journalDates,
    handleDateSelect,
    handleDateDoubleClick,
    handleJournalSelect,
    handleJournalDoubleClick,
    findJournalByDate,
  };
}