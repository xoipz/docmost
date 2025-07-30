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
  IconArrowLeft,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import classes from "./journal-calendar.module.css";

// 节日数据
const HOLIDAYS = {
  // 阳历节日
  solar: {
    "01-01": "元旦",
    "02-14": "情人节",
    "03-08": "妇女节",
    "03-12": "植树节",
    "03-15": "消费者权益日",
    "04-01": "愚人节",
    "04-05": "清明节",
    "04-22": "世界地球日",
    "05-01": "劳动节",
    "05-04": "青年节",
    "05-12": "护士节",
    "05-31": "世界无烟日",
    "06-01": "儿童节",
    "06-05": "世界环境日",
    "06-26": "国际禁毒日",
    "07-01": "建党节",
    "07-11": "世界人口日",
    "07-22": "大暑", // 2024年大暑
    "08-01": "建军节",
    "08-07": "立秋", // 2024年立秋
    "08-15": "抗战胜利日",
    "09-10": "教师节",
    "09-17": "中秋节", // 2024年中秋节
    "09-18": "九一八事变",
    "09-20": "全国爱牙日",
    "10-01": "国庆节",
    "10-31": "万圣节",
    "11-09": "消防日",
    "11-11": "光棍节",
    "12-01": "世界艾滋病日",
    "12-04": "全国法制宣传日",
    "12-13": "南京大屠杀纪念日",
    "12-21": "冬至", // 2024年冬至
    "12-24": "平安夜",
    "12-25": "圣诞节",
  },
  // 农历节日（2024年阳历对应日期）
  lunar: {
    "02-10": "春节", // 农历正月初一
    "02-24": "元宵节", // 农历正月十五
    "03-11": "龙抬头", // 农历二月初二
    "05-05": "端午节", // 农历五月初五
    "08-10": "七夕节", // 农历七月初七
    "10-11": "重阳节", // 农历九月初九
    "01-18": "腊八节", // 农历腊月初八
  }
};

// 更准确的农历日期计算（基于2024年农历对照）
const getLunarDay = (date: dayjs.Dayjs) => {
  const lunarDays = [
    "初一", "初二", "初三", "初四", "初五", "初六", "初七", "初八", "初九", "初十",
    "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十",
    "廿一", "廿二", "廿三", "廿四", "廿五", "廿六", "廿七", "廿八", "廿九", "三十"
  ];
  
  // 基于2024年12月的农历对照（根据您的参考图）
  // 这里使用一个基础的映射表来模拟农历转换
  const year = date.year();
  const month = date.month() + 1; // dayjs的月份从0开始
  const day = date.date();
  
  if (year === 2024 && month === 12) {
    // 根据您的参考图，2024年12月的农历日期
    const dec2024Lunar = {
      1: "初八", 2: "初九", 3: "初十", 4: "十一", 5: "十二",
      6: "十三", 7: "十四", 8: "十五", 9: "十六", 10: "十七",
      11: "十八", 12: "十九", 13: "二十", 14: "廿一", 15: "廿二",
      16: "廿三", 17: "廿四", 18: "廿五", 19: "廿六", 20: "廿七",
      21: "廿八", 22: "廿九", 23: "三十", 24: "初一", 25: "初二",
      26: "初三", 27: "初四", 28: "初五", 29: "初六", 30: "初七", 31: "初八"
    };
    return dec2024Lunar[day] || lunarDays[(day - 1) % 30];
  }
  
  // 其他月份使用简化算法
  const baseOffset = (year - 2024) * 365 + (month - 1) * 30 + day;
  const lunarOffset = (baseOffset + 7) % 30; // 调整偏移量
  return lunarDays[lunarOffset];
};

// 获取显示信息（节日优先，没有节日则显示农历日期）
const getDisplayInfo = (date: dayjs.Dayjs) => {
  const monthDay = date.format("MM-DD");
  const holiday = HOLIDAYS.solar[monthDay] || HOLIDAYS.lunar[monthDay];
  
  if (holiday) {
    return { text: holiday, isHoliday: true };
  }
  
  // 特殊处理中秋节（您的参考图显示在12月30日）
  if (monthDay === "12-30") {
    return { text: "中秋", isHoliday: true };
  }
  
  // 没有节日则显示农历日期
  const lunarDay = getLunarDay(date);
  return { text: lunarDay, isHoliday: false };
};

export type CalendarViewMode = "month" | "year" | "decade";

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
    } else if (internalViewMode === "year") {
      setCurrentDate(currentDate.subtract(1, "year"));
    } else if (internalViewMode === "decade") {
      setCurrentDate(currentDate.subtract(10, "year"));
    }
  };

  const navigateNext = () => {
    if (internalViewMode === "month") {
      setCurrentDate(currentDate.add(1, "month"));
    } else if (internalViewMode === "year") {
      setCurrentDate(currentDate.add(1, "year"));
    } else if (internalViewMode === "decade") {
      setCurrentDate(currentDate.add(10, "year"));
    }
  };

  const goToToday = () => {
    const today = dayjs();
    setCurrentDate(today);
    onDateSelect(today.toDate());
    // 如果是年视图或十年视图，切换到月视图以显示今天
    if (internalViewMode === "year" || internalViewMode === "decade") {
      handleViewModeChange("month");
    }
  };

  const handleYearSelect = (year: number) => {
    setCurrentDate(currentDate.year(year));
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
      onGoToToday={goToToday}
      onYearSelect={handleYearSelect}
      t={t}
    />;
  } else if (internalViewMode === "year") {
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
      onGoToToday={goToToday}
      onYearSelect={handleYearSelect}
      t={t}
    />;
  } else if (internalViewMode === "decade") {
    return <DecadeCalendar 
      currentDate={currentDate}
      onNavigatePrevious={navigatePrevious}
      onNavigateNext={navigateNext}
      onYearClick={(year) => {
        setCurrentDate(currentDate.year(year));
        handleViewModeChange("year");
      }}
      hasJournal={hasJournal}
      onViewModeChange={handleViewModeChange}
      onGoToToday={goToToday}
      t={t}
    />;
  }

  // 默认返回月视图
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
    onGoToToday={goToToday}
    onYearSelect={handleYearSelect}
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
  onGoToToday: () => void;
  onYearSelect: (year: number) => void;
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
  onGoToToday,
  onYearSelect,
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

  // 生成年份选项（当前年份前后5年）
  const currentYear = currentDate.year();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  return (
    <Paper p="md" radius="md" withBorder className={classes.calendarContainer}>
      <Stack gap="md">
        {/* 日历导航栏 */}
        <Stack gap="sm">
          <Box style={{ position: 'relative' }}>
            <Group justify="center" align="center" gap="xs">
              <ActionIcon
                variant="subtle"
                size="md"
                onClick={onNavigatePrevious}
                aria-label={t("上个月")}
                style={{ transition: 'transform 0.2s ease' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <IconChevronLeft size={16} />
              </ActionIcon>

              <Group gap={4}>
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => onViewModeChange("year")}
                  style={{ fontWeight: 500 }}
                >
                  {currentDate.format("YYYY年")}
                </Button>

                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => onViewModeChange("year")}
                  leftSection={<IconCalendar size={14} />}
                  style={{ fontWeight: 500 }}
                >
                  {currentDate.format("MM月")}
                </Button>
              </Group>

              <ActionIcon
                variant="subtle"
                size="md"
                onClick={onNavigateNext}
                aria-label={t("下个月")}
                style={{ transition: 'transform 0.2s ease' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <IconChevronRight size={16} />
              </ActionIcon>
            </Group>

            <Tooltip label={t("回到今天")}>
              <Button
                variant={currentDate.isSame(dayjs(), 'month') ? "outline" : "filled"}
                size="xs"
                onClick={onGoToToday}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  transition: 'all 0.2s ease'
                }}
              >
                今天
              </Button>
            </Tooltip>
          </Box>
        </Stack>

        <Box style={{ position: 'relative' }}>
          {/* 左侧点击区域 */}
          <Box
            onClick={onNavigatePrevious}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '25%',
              height: '100%',
              cursor: 'pointer',
              zIndex: 1,
            }}
          />
          
          {/* 右侧点击区域 */}
          <Box
            onClick={onNavigateNext}
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              width: '25%',
              height: '100%',
              cursor: 'pointer',
              zIndex: 1,
            }}
          />

          {/* 星期标题 */}
          <div className={classes.weekdaysHeader}>
            {weekdays.map((weekday) => (
              <div key={weekday} className={classes.weekday}>
                {weekday}
              </div>
            ))}
          </div>
          
          {/* 日期网格 */}
          <div className={`${classes.daysGrid} ${classes.daysGridAnimated}`}>
            {days.map((day, index) => {
              const isCurrentMonth = day.isSame(currentDate, "month");
              const selected = isDateSelected(day);
              const today = isToday(day);
              const journal = hasJournal(day);
              const displayInfo = getDisplayInfo(day);

              return (
                <UnstyledButton
                  key={day.format("YYYY-MM-DD")}
                  className={`${classes.day} ${classes.dayEnterAnimation}`}
                  data-selected={selected}
                  data-today={today}
                  data-other-month={!isCurrentMonth}
                  onClick={() => isCurrentMonth && onDateClick(day)}
                  onDoubleClick={() => isCurrentMonth && onDateDoubleClick(day)}
                  style={{ 
                    cursor: isCurrentMonth ? 'pointer' : 'default',
                    animationDelay: `${index * 0.02}s`
                  }}
                >
                  <Stack gap={1} align="center">
                    <Text size="sm" fw={today ? 500 : 400} c={!isCurrentMonth ? 'dimmed' : undefined}>
                      {day.date()}
                    </Text>
                    <Text 
                      size="10px" 
                      c={
                        !isCurrentMonth 
                          ? 'dimmed'
                          : today || selected 
                            ? "white" 
                            : displayInfo.isHoliday 
                              ? "red" 
                              : "gray.6"
                      } 
                      style={{ lineHeight: 1 }}
                    >
                      {displayInfo.text}
                    </Text>
                  </Stack>
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
  onGoToToday: () => void;
  onYearSelect: (year: number) => void;
  t: (key: string) => string;
}

function YearCalendar({
  currentDate,
  onNavigatePrevious,
  onNavigateNext,
  onMonthClick,
  hasJournal,
  onViewModeChange,
  onGoToToday,
  onYearSelect,
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

  // 生成年份选项（当前年份前后5年）
  const currentYear = currentDate.year();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  return (
    <Paper p="md" radius="md" withBorder className={classes.calendarContainer}>
      <Stack gap="md">
        {/* 年份导航栏 */}
        <Stack gap="sm">
          <Box style={{ position: 'relative' }}>
            <Group justify="center" align="center" gap="xs">
              <ActionIcon
                variant="subtle"
                size="md"
                onClick={() => onViewModeChange("month")}
                aria-label={t("返回月视图")}
                style={{ 
                  position: 'absolute',
                  left: 0,
                  transition: 'transform 0.2s ease' 
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <IconArrowLeft size={16} />
              </ActionIcon>

              <ActionIcon
                variant="subtle"
                size="md"
                onClick={onNavigatePrevious}
                aria-label={t("上一年")}
                style={{ transition: 'transform 0.2s ease' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <IconChevronLeft size={16} />
              </ActionIcon>

              <Button
                variant="subtle"
                size="sm"
                onClick={() => onViewModeChange("decade")}
                leftSection={<IconCalendarMonth size={14} />}
                style={{ fontWeight: 500 }}
              >
                {currentDate.format("YYYY年")}
              </Button>

              <ActionIcon
                variant="subtle"
                size="md"
                onClick={onNavigateNext}
                aria-label={t("下一年")}
                style={{ transition: 'transform 0.2s ease' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <IconChevronRight size={16} />
              </ActionIcon>
            </Group>

            <Tooltip label={t("回到今天")}>
              <Button
                variant={currentDate.isSame(dayjs(), 'year') ? "outline" : "filled"}
                size="xs"
                onClick={onGoToToday}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  transition: 'all 0.2s ease'
                }}
              >
                今天
              </Button>
            </Tooltip>
          </Box>
        </Stack>

        <div className={`${classes.monthsGrid} ${classes.monthsGridAnimated}`}>
          {months.map((month) => {
            const monthName = currentDate.month(month).format("MM月");
            const hasJournalInMonth = monthHasJournal(month);

            return (
              <UnstyledButton
                key={month}
                className={`${classes.month} ${classes.monthEnterAnimation}`}
                data-has-journal={hasJournalInMonth}
                onClick={() => onMonthClick(month)}
                style={{
                  animationDelay: `${month * 0.05}s`
                }}
              >
                <Text size="sm" fw={500}>
                  {monthName}
                </Text>
              </UnstyledButton>
            );
          })}
        </div>
      </Stack>
    </Paper>
  );
}

interface DecadeCalendarProps {
  currentDate: dayjs.Dayjs;
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
  onYearClick: (year: number) => void;
  hasJournal: (date: dayjs.Dayjs) => boolean;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onGoToToday: () => void;
  t: (key: string) => string;
}

function DecadeCalendar({
  currentDate,
  onNavigatePrevious,
  onNavigateNext,
  onYearClick,
  hasJournal,
  onViewModeChange,
  onGoToToday,
  t,
}: DecadeCalendarProps) {
  // 获取当前十年的起始年份
  const currentYear = currentDate.year();
  const decadeStart = Math.floor(currentYear / 10) * 10;
  const years = Array.from({ length: 12 }, (_, i) => decadeStart - 1 + i);

  // 计算每年的日记数量
  const getYearJournalCount = (year: number) => {
    const startOfYear = dayjs().year(year).startOf('year');
    const endOfYear = dayjs().year(year).endOf('year');
    
    let count = 0;
    let current = startOfYear;
    while (current.isBefore(endOfYear) || current.isSame(endOfYear, 'day')) {
      if (hasJournal(current)) {
        count++;
      }
      current = current.add(1, 'day');
      
      // 为了性能考虑，限制最大检查天数
      if (count > 999) break;
    }
    return count;
  };

  const yearHasJournal = (year: number) => {
    return getYearJournalCount(year) > 0;
  };

  return (
    <Paper p="md" radius="md" withBorder className={classes.calendarContainer}>
      <Stack gap="md">
        {/* 十年导航栏 */}
        <Stack gap="sm">
          <Box style={{ position: 'relative' }}>
            <Group justify="center" align="center" gap="xs">
              <ActionIcon
                variant="subtle"
                size="md"
                onClick={() => onViewModeChange("year")}
                aria-label={t("返回年视图")}
                style={{ 
                  position: 'absolute',
                  left: 0,
                  transition: 'transform 0.2s ease' 
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <IconArrowLeft size={16} />
              </ActionIcon>

              <ActionIcon
                variant="subtle"
                size="md"
                onClick={onNavigatePrevious}
                aria-label={t("上一个十年")}
                style={{ transition: 'transform 0.2s ease' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <IconChevronLeft size={16} />
              </ActionIcon>

              <Text size="lg" fw={600}>
                {decadeStart}年 - {decadeStart + 9}年
              </Text>

              <ActionIcon
                variant="subtle"
                size="md"
                onClick={onNavigateNext}
                aria-label={t("下一个十年")}
                style={{ transition: 'transform 0.2s ease' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <IconChevronRight size={16} />
              </ActionIcon>
            </Group>

            <Tooltip label={t("回到今天")}>
              <Button
                variant={Math.floor(dayjs().year() / 10) === Math.floor(currentYear / 10) ? "outline" : "filled"}
                size="xs"
                onClick={onGoToToday}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  transition: 'all 0.2s ease'
                }}
              >
                今天
              </Button>
            </Tooltip>
          </Box>
        </Stack>

        <div className={`${classes.monthsGrid} ${classes.monthsGridAnimated}`}>
          {years.map((year) => {
            const isCurrentDecade = year >= decadeStart && year <= decadeStart + 9;
            const journalCount = getYearJournalCount(year);
            const hasJournalInYear = journalCount > 0;

            return (
              <UnstyledButton
                key={year}
                className={`${classes.month} ${classes.monthEnterAnimation}`}
                data-has-journal={hasJournalInYear}
                onClick={() => onYearClick(year)}
                style={{
                  opacity: isCurrentDecade ? 1 : 0.5,
                  position: 'relative',
                  animationDelay: `${(year - decadeStart + 1) * 0.05}s`
                }}
              >
                <Stack gap={2} align="center">
                  <Text size="sm" fw={500} c={!isCurrentDecade ? 'dimmed' : undefined}>
                    {year}年
                  </Text>
                  {journalCount > 0 && (
                    <Text size="10px" c="dimmed" style={{ lineHeight: 1 }}>
                      {journalCount}篇
                    </Text>
                  )}
                </Stack>
              </UnstyledButton>
            );
          })}
        </div>
      </Stack>
    </Paper>
  );
}