import { useState, useEffect } from "react";
import {
  ActionIcon,
  Box,
  Button,
  Group,
  Paper,
  Text,
  UnstyledButton,
  Tooltip,
  Stack,
  Flex,
} from "@mantine/core";
import {
  IconChevronLeft,
  IconChevronRight,
  IconCalendar,
  IconCalendarMonth,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import classes from "./journal-calendar.module.css";

export type CalendarViewMode = "month" | "year";

interface JournalCalendarProps {
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
  onDateDoubleClick: (date: Date) => void;
  journalDates: string[];
  viewMode?: CalendarViewMode;
  onViewModeChange?: (mode: CalendarViewMode) => void;
}

export function JournalCalendar({
  selectedDate,
  onDateSelect,
  onDateDoubleClick,
  journalDates,
  viewMode = "month",
  onViewModeChange,
}: JournalCalendarProps) {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [internalViewMode, setInternalViewMode] = useState<CalendarViewMode>(viewMode);

  // 添加调试信息
  console.log('JournalCalendar received journalDates:', journalDates);

  useEffect(() => {
    if (selectedDate) {
      setCurrentDate(dayjs(selectedDate));
    }
  }, [selectedDate]);

  const handleViewModeChange = (mode: CalendarViewMode) => {
    setInternalViewMode(mode);
    onViewModeChange?.(mode);
  };

  const navigatePrevious = () => {
    if (internalViewMode === "month") {
      setCurrentDate(currentDate.subtract(1, "month"));
    } else {
      setCurrentDate(currentDate.subtract(1, "year"));
    }
  };

  const navigateNext = () => {
    if (internalViewMode === "month") {
      setCurrentDate(currentDate.add(1, "month"));
    } else {
      setCurrentDate(currentDate.add(1, "year"));
    }
  };

  const handleDateClick = (date: dayjs.Dayjs) => {
    onDateSelect(date.toDate());
  };

  const handleDateDoubleClick = (date: dayjs.Dayjs) => {
    onDateDoubleClick(date.toDate());
  };

  const isDateSelected = (date: dayjs.Dayjs) => {
    return selectedDate && dayjs(selectedDate).isSame(date, "day");
  };

  const isToday = (date: dayjs.Dayjs) => {
    return dayjs().isSame(date, "day");
  };

  const hasJournal = (date: dayjs.Dayjs) => {
    const dateStr = date.format("YYYY-MM-DD");
    const hasEntry = journalDates.includes(dateStr);
    // 添加调试信息（生产环境中可以移除）
    if (hasEntry) {
      console.log(`Found journal for date: ${dateStr}`);
    }
    return hasEntry;
  };

  if (internalViewMode === "month") {
    return <MonthCalendar 
      currentDate={currentDate}
      onNavigatePrevious={navigatePrevious}
      onNavigateNext={navigateNext}
      onDateClick={handleDateClick}
      onDateDoubleClick={handleDateDoubleClick}
      isDateSelected={isDateSelected}
      isToday={isToday}
      hasJournal={hasJournal}
      onViewModeChange={handleViewModeChange}
      t={t}
    />;
  }

  return <YearCalendar 
    currentDate={currentDate}
    onNavigatePrevious={navigatePrevious}
    onNavigateNext={navigateNext}
    onMonthClick={(month) => {
      setCurrentDate(currentDate.month(month));
      handleViewModeChange("month");
    }}
    hasJournal={hasJournal}
    onViewModeChange={handleViewModeChange}
    t={t}
  />;
}

interface MonthCalendarProps {
  currentDate: dayjs.Dayjs;
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
  onDateClick: (date: dayjs.Dayjs) => void;
  onDateDoubleClick: (date: dayjs.Dayjs) => void;
  isDateSelected: (date: dayjs.Dayjs) => boolean;
  isToday: (date: dayjs.Dayjs) => boolean;
  hasJournal: (date: dayjs.Dayjs) => boolean;
  onViewModeChange: (mode: CalendarViewMode) => void;
  t: (key: string) => string;
}

function MonthCalendar({
  currentDate,
  onNavigatePrevious,
  onNavigateNext,
  onDateClick,
  onDateDoubleClick,
  isDateSelected,
  isToday,
  hasJournal,
  onViewModeChange,
  t,
}: MonthCalendarProps) {
  const startOfMonth = currentDate.startOf("month");
  const endOfMonth = currentDate.endOf("month");
  const startOfWeek = startOfMonth.startOf("week");
  const endOfWeek = endOfMonth.endOf("week");

  const days = [];
  let current = startOfWeek;

  while (current.isBefore(endOfWeek) || current.isSame(endOfWeek, "day")) {
    days.push(current);
    current = current.add(1, "day");
  }

  const weekdays = [
    "日",
    "一", 
    "二",
    "三",
    "四",
    "五",
    "六",
  ];

  return (
    <Paper p="md" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="center" align="center" gap="xs">
          <ActionIcon
            variant="subtle"
            size="lg"
            onClick={onNavigatePrevious}
            aria-label={t("上个月")}
          >
            <IconChevronLeft size={20} />
          </ActionIcon>

          <Button
            variant="subtle"
            size="sm"
            onClick={() => onViewModeChange("year")}
            leftSection={<IconCalendar size={14} />}
          >
            {currentDate.format("YYYY年MM月")}
          </Button>

          <ActionIcon
            variant="subtle"
            size="lg"
            onClick={onNavigateNext}
            aria-label={t("下个月")}
          >
            <IconChevronRight size={20} />
          </ActionIcon>
        </Group>

        <Box>
          {/* 星期标题 */}
          <div className={classes.weekdaysHeader}>
            {weekdays.map((weekday) => (
              <div key={weekday} className={classes.weekday}>
                {weekday}
              </div>
            ))}
          </div>
          
          {/* 日期网格 */}
          <div className={classes.daysGrid}>
            {days.map((day) => {
              const isCurrentMonth = day.isSame(currentDate, "month");
              const selected = isDateSelected(day);
              const today = isToday(day);
              const journal = hasJournal(day);

              return (
                <UnstyledButton
                  key={day.format("YYYY-MM-DD")}
                  className={classes.day}
                  data-selected={selected}
                  data-today={today}
                  data-other-month={!isCurrentMonth}
                  onClick={() => onDateClick(day)}
                  onDoubleClick={() => onDateDoubleClick(day)}
                >
                  <Text size="sm" fw={today ? 500 : 400} c={!isCurrentMonth ? 'dimmed' : undefined}>
                    {day.date()}
                  </Text>
                  {journal && <div className={classes.journalDot} />}
                </UnstyledButton>
              );
            })}
          </div>
        </Box>
      </Stack>
    </Paper>
  );
}

interface YearCalendarProps {
  currentDate: dayjs.Dayjs;
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
  onMonthClick: (month: number) => void;
  hasJournal: (date: dayjs.Dayjs) => boolean;
  onViewModeChange: (mode: CalendarViewMode) => void;
  t: (key: string) => string;
}

function YearCalendar({
  currentDate,
  onNavigatePrevious,
  onNavigateNext,
  onMonthClick,
  hasJournal,
  onViewModeChange,
  t,
}: YearCalendarProps) {
  const months = Array.from({ length: 12 }, (_, i) => i);
  
  const monthHasJournal = (month: number) => {
    const startOfMonth = currentDate.month(month).startOf("month");
    const endOfMonth = currentDate.month(month).endOf("month");
    
    let current = startOfMonth;
    while (current.isBefore(endOfMonth) || current.isSame(endOfMonth, "day")) {
      if (hasJournal(current)) {
        return true;
      }
      current = current.add(1, "day");
    }
    return false;
  };

  return (
    <Paper p="md" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="center" align="center" gap="xs">
          <ActionIcon
            variant="subtle"
            size="lg"
            onClick={onNavigatePrevious}
            aria-label={t("上一年")}
          >
            <IconChevronLeft size={20} />
          </ActionIcon>

          <Button
            variant="subtle"
            size="sm"
            onClick={() => onViewModeChange("month")}
            leftSection={<IconCalendarMonth size={14} />}
          >
            {currentDate.format("YYYY年")}
          </Button>

          <ActionIcon
            variant="subtle"
            size="lg"
            onClick={onNavigateNext}
            aria-label={t("下一年")}
          >
            <IconChevronRight size={20} />
          </ActionIcon>
        </Group>

        <div className={classes.monthsGrid}>
          {months.map((month) => {
            const monthName = currentDate.month(month).format("MM月");
            const hasJournalInMonth = monthHasJournal(month);

            return (
              <UnstyledButton
                key={month}
                className={classes.month}
                onClick={() => onMonthClick(month)}
              >
                <Text size="sm" fw={500}>
                  {monthName}
                </Text>
                {hasJournalInMonth && <div className={classes.journalDot} />}
              </UnstyledButton>
            );
          })}
        </div>
      </Stack>
    </Paper>
  );
}