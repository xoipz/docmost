import { useState, useMemo, useEffect, useRef } from "react";
import {
  Box,
  Collapse,
  Group,
  Paper,
  Stack,
  Text,
  UnstyledButton,
  ActionIcon,
  Tooltip,
  ScrollArea,
} from "@mantine/core";
import {
  IconChevronDown,
  IconChevronRight,
  IconBook,
  IconCalendar,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { IPage } from "@/features/page/types/page.types.ts";
import classes from "./journal-list.module.css";

interface JournalListProps {
  journals: IPage[];
  selectedJournalId?: string;
  onJournalSelect: (journal: IPage) => void;
  onJournalDoubleClick: (journal: IPage) => void;
}

interface MonthGroup {
  monthKey: string;
  monthLabel: string;
  journals: IPage[];
}

interface YearGroup {
  year: string;
  yearLabel: string;
  months: MonthGroup[];
}

export function JournalList({
  journals,
  selectedJournalId,
  onJournalSelect,
  onJournalDoubleClick,
}: JournalListProps) {
  const { t } = useTranslation();
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const initialized = useRef(false);

  const groupedJournals = useMemo(() => {
    const yearGroups: Record<string, YearGroup> = {};

    journals
      .filter((journal) => journal.isJournal && journal.journalDate)
      .sort((a, b) => {
        // Sort by journal date descending (newest first)
        return dayjs(b.journalDate).unix() - dayjs(a.journalDate).unix();
      })
      .forEach((journal) => {
        const date = dayjs(journal.journalDate);
        const year = date.format("YYYY");
        const monthKey = date.format("YYYY-MM");
        const monthLabel = date.format("MM月");

        // Initialize year group if not exists
        if (!yearGroups[year]) {
          yearGroups[year] = {
            year,
            yearLabel: `${year}年`,
            months: [],
          };
        }

        // Find or create month group within year
        let monthGroup = yearGroups[year].months.find(m => m.monthKey === monthKey);
        if (!monthGroup) {
          monthGroup = {
            monthKey,
            monthLabel,
            journals: [],
          };
          yearGroups[year].months.push(monthGroup);
        }

        monthGroup.journals.push(journal);
      });

    // Sort months within each year
    Object.values(yearGroups).forEach(yearGroup => {
      yearGroup.months.sort((a, b) => {
        return dayjs(b.monthKey).unix() - dayjs(a.monthKey).unix();
      });
    });

    return Object.values(yearGroups).sort((a, b) => {
      // Sort year groups by year descending
      return parseInt(b.year) - parseInt(a.year);
    });
  }, [journals]);

  // 默认展开最新的年份和月份
  useEffect(() => {
    console.log('useEffect triggered, groupedJournals.length:', groupedJournals.length);
    console.log('initialized.current:', initialized.current);
    
    if (groupedJournals.length > 0 && !initialized.current) {
      console.log('Initializing for the first time');
      
      // 只展开最新的年份
      const mostRecentYear = groupedJournals[0].year;
      console.log('Setting expanded year:', mostRecentYear);
      setExpandedYears(new Set([mostRecentYear]));
      
      // 展开最近的月份
      const mostRecentMonth = groupedJournals[0].months[0]?.monthKey;
      console.log('Most recent month:', mostRecentMonth);
      
      if (mostRecentMonth) {
        console.log('Setting initial expanded month:', mostRecentMonth);
        setExpandedMonths(new Set([mostRecentMonth]));
      }
      
      initialized.current = true;    
    }
  }, [groupedJournals]);

  const toggleYear = (year: string) => {
    console.log('toggleYear called with:', year);
    console.log('Current expandedYears:', Array.from(expandedYears));
    
    const newExpandedYears = new Set(expandedYears);
    const wasExpanded = newExpandedYears.has(year);
    
    console.log('Year was expanded:', wasExpanded);
    
    if (wasExpanded) {
      console.log('Collapsing year:', year);
      newExpandedYears.delete(year);
      // 当年份收缩时，也要清空该年份下的所有月份展开状态
      const newExpandedMonths = new Set(expandedMonths);
      const yearMonths = groupedJournals.find(yg => yg.year === year)?.months || [];
      yearMonths.forEach(month => {
        newExpandedMonths.delete(month.monthKey);
      });
      setExpandedMonths(newExpandedMonths);
    } else {
      console.log('Expanding year:', year);
      newExpandedYears.add(year);
    }
    
    console.log('New expandedYears will be:', Array.from(newExpandedYears));
    setExpandedYears(newExpandedYears);
  };

  const toggleMonth = (monthKey: string) => {
    console.log('toggleMonth called with:', monthKey);
    console.log('Current expandedMonths:', Array.from(expandedMonths));
    
    const newExpandedMonths = new Set(expandedMonths);
    const wasExpanded = newExpandedMonths.has(monthKey);
    
    console.log('Month was expanded:', wasExpanded);
    
    if (wasExpanded) {
      console.log('Collapsing month:', monthKey);
      newExpandedMonths.delete(monthKey);
    } else {
      console.log('Expanding month:', monthKey);
      // 展开这个月份，保持其他月份的展开状态
      newExpandedMonths.add(monthKey);
    }
    
    console.log('New expandedMonths will be:', Array.from(newExpandedMonths));
    setExpandedMonths(newExpandedMonths);
  };

  const handleJournalClick = (journal: IPage) => {
    // 单击直接跳转到笔记
    onJournalDoubleClick(journal);
  };

  if (journals.length === 0) {
    return (
      <Paper p="md" radius="md" withBorder className={classes.emptyState}>
        <Stack align="center" gap="sm">
          <IconBook size={40} color="var(--mantine-color-gray-5)" />
          <Text size="sm" c="dimmed" ta="center">
            {t("还没有日记")}
          </Text>
          <Text size="xs" c="dimmed" ta="center">
            {t("双击日历中的日期开始写日记")}
          </Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <div className={classes.container}>
      <Stack gap="xs">
        {groupedJournals.map((yearGroup) => {
          return (
            <Box key={yearGroup.year} className={classes.yearSection}>
              {/* 年份标题（可点击收缩展开） */}
              <UnstyledButton
                className={classes.yearHeader}
                onClick={() => toggleYear(yearGroup.year)}
              >
                <Group justify="space-between" wrap="nowrap">
                  <Group gap="xs" wrap="nowrap">
                    <ActionIcon
                      variant="subtle"
                      size="xs"
                      className={classes.expandIcon}
                    >
                      {expandedYears.has(yearGroup.year) ? (
                        <IconChevronDown size={12} />
                      ) : (
                        <IconChevronRight size={12} />
                      )}
                    </ActionIcon>
                    <Text size="sm" fw={600}>
                      {yearGroup.yearLabel}
                    </Text>
                  </Group>
                  <Text size="xs" c="dimmed" className={classes.count}>
                    {yearGroup.months.reduce((total, month) => total + month.journals.length, 0)}
                  </Text>
                </Group>
              </UnstyledButton>

              {/* 年份内容 */}
              <Collapse in={expandedYears.has(yearGroup.year)}>
                <div className={classes.yearContent}>
                {yearGroup.months.map((monthGroup) => {
                  const isMonthExpanded = expandedMonths.has(monthGroup.monthKey);
                  
                  console.log(`Month ${monthGroup.monthKey} expanded state:`, isMonthExpanded);
                  
                  return (
                    <Box key={monthGroup.monthKey} className={classes.monthSection}>
                      {/* 月份标题 */}
                      <UnstyledButton
                        className={classes.monthButton}
                        onClick={() => toggleMonth(monthGroup.monthKey)}
                      >
                        <Group justify="space-between" wrap="nowrap">
                          <Group gap="xs" wrap="nowrap">
                            <ActionIcon
                              variant="subtle"
                              size="xs"
                              className={classes.expandIcon}
                            >
                              {isMonthExpanded ? (
                                <IconChevronDown size={12} />
                              ) : (
                                <IconChevronRight size={12} />
                              )}
                            </ActionIcon>
                            <Text size="sm" fw={500}>
                              {monthGroup.monthLabel}
                            </Text>
                          </Group>
                          <Text size="xs" c="dimmed" className={classes.count}>
                            {monthGroup.journals.length}
                          </Text>
                        </Group>
                      </UnstyledButton>

                      {/* 月份内容 - 日记列表 */}
                      <Collapse in={isMonthExpanded}>
                        <div className={classes.journalList}>
                          {monthGroup.journals.map((journal, index) => (
                            <JournalItem
                              key={journal.id}
                              journal={journal}
                              isSelected={journal.id === selectedJournalId}
                              onClick={() => handleJournalClick(journal)}
                              isLast={index === monthGroup.journals.length - 1}
                            />
                          ))}
                        </div>
                      </Collapse>
                    </Box>
                  );
                })}
                </div>
              </Collapse>
            </Box>
          );
        })}
      </Stack>
    </div>
  );
}

interface JournalItemProps {
  journal: IPage;
  isSelected: boolean;
  onClick: () => void;
  isLast?: boolean;
}

function JournalItem({
  journal,
  isSelected,
  onClick,
  isLast = false,
}: JournalItemProps) {
  const { t } = useTranslation();
  const journalDate = dayjs(journal.journalDate);

  return (
    <UnstyledButton
      className={classes.journalItem}
      data-selected={isSelected}
      data-last={isLast}
      onClick={onClick}
    >
      <Group gap="sm" wrap="nowrap" align="center">
        <Box className={classes.dateTag}>
          <Text size="xs" fw={600}>
            {journalDate.format("DD")}
          </Text>
        </Box>
        
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Text
            size="sm"
            fw={500}
            className={classes.journalTitle}
            title={journal.title || t("无标题")}
          >
            {journal.title || t("无标题")}
          </Text>
          
          <Text size="xs" c="dimmed" className={classes.journalDate}>
            {journalDate.format("MM-DD")}
          </Text>
        </Box>
      </Group>
    </UnstyledButton>
  );
}