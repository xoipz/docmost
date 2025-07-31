import { useState, useEffect, useRef } from "react";
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
import lunisolar from "lunisolar";
import classes from "./journal-calendar.module.css";

// 节日数据
const HOLIDAYS = {
  // 阳历节日（固定日期）
  solar: {
    "01-01": "元旦",
    "03-08": "妇女节",
    "04-01": "愚人节",
    "05-01": "劳动节",
    "06-01": "儿童节",
    "07-01": "建党节",
    "08-01": "建军节",
    "08-15": "抗战胜利日",
    "09-10": "教师节",
    "10-01": "国庆节",
    "10-31": "万圣节",
    "12-13": "南京大屠杀纪念日"
    // 已移除不固定日期的节日：
    // - 清明节（根据节气计算，每年约4月4-6日）
  },
  // 农历节日（使用lunisolar动态计算）
  lunar: {}
};

// 使用lunisolar库进行精确的农历计算
const getLunarDay = (date: dayjs.Dayjs) => {
  try {
    // 使用lunisolar库转换为农历
    const lunarDate = lunisolar(date.toDate());
    
    // 获取农历日期信息 - 使用正确的API
    const day = lunarDate.lunar.day;
    
    // 农历日期转换为中文
    const lunarDays = [
      "初一", "初二", "初三", "初四", "初五", "初六", "初七", "初八", "初九", "初十",
      "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十",
      "廿一", "廿二", "廿三", "廿四", "廿五", "廿六", "廿七", "廿八", "廿九", "三十"
    ];
    
    return lunarDays[day - 1] || "初一";
  } catch (error) {
    console.error('农历计算错误:', error);
    return "计算错误";
  }
};

// 获取农历节日
const getLunarHoliday = (date: dayjs.Dayjs) => {
  try {
    const lunarDate = lunisolar(date.toDate());
    const lunarMonth = lunarDate.lunar.month;
    const lunarDay = lunarDate.lunar.day;
    
    // 固定农历节日
    const fixedLunarHolidays: Record<string, string> = {
      "1-1": "春节",
      "1-15": "元宵节", 
      "2-2": "龙抬头",
      "5-5": "端午节",
      "7-7": "七夕节",
      "8-15": "中秋节",
      "9-9": "重阳节",
      "12-8": "腊八节",
      "12-23": "小年"
    };
    
    // 检查固定节日
    const fixedKey = `${lunarMonth}-${lunarDay}`;
    if (fixedLunarHolidays[fixedKey]) {
      return fixedLunarHolidays[fixedKey];
    }
    
    // 特殊处理除夕：腊月最后一天
    if (lunarMonth === 12) {
      // 判断是否为腊月最后一天（除夕）
      // 方法：检查明天是否为正月初一
      const tomorrow = dayjs(date).add(1, 'day');
      const tomorrowLunar = lunisolar(tomorrow.toDate());
      
      if (tomorrowLunar.lunar.month === 1 && tomorrowLunar.lunar.day === 1) {
        return "除夕";
      }
    }
    
    return null;
  } catch (error) {
    console.error('农历节日计算错误:', error);
    return null;
  }
};

// 获取显示信息（节日优先，没有节日则显示农历日期）
const getDisplayInfo = (date: dayjs.Dayjs) => {
  const monthDay = date.format("MM-DD");
  
  // 首先检查阳历节日
  const solarHoliday = HOLIDAYS.solar[monthDay];
  if (solarHoliday) {
    return { text: solarHoliday, isHoliday: true };
  }
  
  // 然后检查农历节日（使用lunisolar动态计算）
  const lunarHoliday = getLunarHoliday(date);
  if (lunarHoliday) {
    return { text: lunarHoliday, isHoliday: true };
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

// 触摸滑动相关的工具函数
const useTouchSwipe = (onSwipeLeft: () => void, onSwipeRight: () => void) => {
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartX.current) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = touchStartX.current - currentX;
    const diffY = touchStartY.current - currentY;
    
    // 如果垂直滑动距离大于水平滑动距离，则不处理
    if (Math.abs(diffY) > Math.abs(diffX)) {
      return;
    }
    
    // 如果水平滑动距离大于10px，则认为是拖拽
    if (Math.abs(diffX) > 10) {
      isDragging.current = true;
      // 阻止默认的滚动行为
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX.current || !isDragging.current) return;
    
    const currentX = e.changedTouches[0].clientX;
    const diffX = touchStartX.current - currentX;
    
    // 滑动距离大于50px才触发切换
    if (Math.abs(diffX) > 50) {
      if (diffX > 0) {
        onSwipeLeft(); // 向左滑动，显示下个月
      } else {
        onSwipeRight(); // 向右滑动，显示上个月
      }
    }
    
    touchStartX.current = 0;
    touchStartY.current = 0;
    isDragging.current = false;
  };

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
};

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
  // 添加触摸滑动支持
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useTouchSwipe(
    onNavigateNext,
    onNavigatePrevious
  );
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
    <Paper p="2px" radius="md" withBorder className={classes.calendarContainer}>
      <Stack gap="md">
        {/* 日历导航栏 */}
        <Stack gap="sm">
          <Box className={classes.headerContainer}>
            {/* 移动端布局：单行结构 */}
            <div className={classes.mobileHeader}>
              {/* 单行：标题和今天按钮 */}
              <div 
                className={classes.navRow}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* 左侧标题 */}
                <Group gap={4} className={classes.titleGroup}>
                  <Button
                    variant="subtle"
                    size="sm"
                    onClick={() => onViewModeChange("year")}
                    style={{ fontWeight: 500 }}
                    className={classes.titleButton}
                  >
                    {currentDate.format("YYYY年")}
                  </Button>

                  <Button
                    variant="subtle"
                    size="sm"
                    onClick={() => onViewModeChange("year")}
                    leftSection={<IconCalendar size={14} />}
                    style={{ fontWeight: 500 }}
                    className={classes.titleButton}
                  >
                    {currentDate.format("MM月")}
                  </Button>
                </Group>

                {/* 右侧今天按钮 */}
                <Button
                  variant="filled"
                  size="xs"
                  onClick={onGoToToday}
                  className={classes.todayButtonMobile}
                >
                  今天
                </Button>
              </div>
            </div>

            {/* 桌面端布局：单行结构 */}
            <div className={classes.desktopHeader}>
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
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

                {/* 只在月视图显示今天按钮 */}
                <div style={{ position: 'absolute', left: 'calc(50% + 140px)', top: '50%', transform: 'translateY(-50%)' }}>
                  <Tooltip label={t("回到今天")}>
                    <Button
                      variant={currentDate.isSame(dayjs(), 'month') ? "outline" : "filled"}
                      size="xs"
                      onClick={onGoToToday}
                    >
                      今天
                    </Button>
                  </Tooltip>
                </div>
              </div>
            </div>
          </Box>
        </Stack>

        <Box 
          style={{ position: 'relative' }}
          className={classes.calendarGrid}
        >
          {/* 左侧点击区域 - 仅在非移动端显示 */}
          <Box
            onClick={onNavigatePrevious}
            className={classes.sideClickArea}
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
          
          {/* 右侧点击区域 - 仅在非移动端显示 */}
          <Box
            onClick={onNavigateNext}
            className={classes.sideClickArea}
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
          
          {/* 日期网格 - 添加触摸事件支持 */}
          <div 
            className={`${classes.daysGrid} ${classes.daysGridAnimated}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
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
                  <Stack gap={1} align="center" className={classes.dayContent}>
                    <Text size="sm" fw={today ? 500 : 400} c={!isCurrentMonth ? 'dimmed' : undefined} className={classes.dayNumber}>
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
                      className={classes.dayText}
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
    <Paper p="2px" radius="md" withBorder className={classes.calendarContainer}>
      <Stack gap="md">
        {/* 年份导航栏 */}
        <Stack gap="sm">
          <Box className={classes.headerContainer}>
            {/* 移动端布局：两行结构 */}
            <div className={classes.mobileHeader}>
              {/* 第一行：今天按钮 - 年视图中隐藏 */}
              <div className={classes.todayRow} style={{ display: 'none' }}>
                <Tooltip label={t("回到今天")}>
                  <Button
                    variant={currentDate.isSame(dayjs(), 'year') ? "outline" : "filled"}
                    size="xs"
                    onClick={onGoToToday}
                    className={classes.todayButtonTop}
                  >
                    今天
                  </Button>
                </Tooltip>
              </div>

              {/* 第二行：导航和标题 */}
              <div className={classes.navRow}>
                {/* 左侧：返回按钮 */}
                <ActionIcon
                  variant="subtle"
                  size="md"
                  onClick={() => onViewModeChange("month")}
                  aria-label={t("返回月视图")}
                  className={classes.navBackButton}
                >
                  <IconArrowLeft size={16} />
                </ActionIcon>

                {/* 中间：年份导航 */}
                <Group gap={8} className={classes.yearNavGroup}>
                  <ActionIcon
                    variant="subtle"
                    size="md"
                    onClick={onNavigatePrevious}
                    aria-label={t("上一年")}
                    className={classes.navButton}
                  >
                    <IconChevronLeft size={16} />
                  </ActionIcon>

                  <Button
                    variant="subtle"
                    size="sm"
                    onClick={() => onViewModeChange("decade")}
                    leftSection={<IconCalendarMonth size={14} />}
                    style={{ fontWeight: 500 }}
                    className={classes.titleButton}
                  >
                    {currentDate.format("YYYY年")}
                  </Button>

                  <ActionIcon
                    variant="subtle"
                    size="md"
                    onClick={onNavigateNext}
                    aria-label={t("下一年")}
                    className={classes.navButton}
                  >
                    <IconChevronRight size={16} />
                  </ActionIcon>
                </Group>

                {/* 右侧：占位元素 */}
                <div style={{ width: '40px' }}></div>
              </div>
            </div>

            {/* 桌面端布局 */}
            <div className={classes.desktopHeader}>
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

              {/* 桌面端年视图中隐藏今天按钮 */}
              <div style={{ display: 'none' }}>
                <Tooltip label={t("回到今天")}>
                  <Button
                    variant={currentDate.isSame(dayjs(), 'year') ? "outline" : "filled"}
                    size="xs"
                    onClick={onGoToToday}
                    style={{
                      position: 'absolute',
                      right: -4,
                      top: 'calc(50% - 4px)',
                      transform: 'translateY(-50%)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    今天
                  </Button>
                </Tooltip>
              </div>
            </div>
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
    <Paper p="2px" radius="md" withBorder className={classes.calendarContainer}>
      <Stack gap="md">
        {/* 十年导航栏 */}
        <Stack gap="sm">
          <Box className={classes.headerContainer}>
            {/* 移动端布局：两行结构 */}
            <div className={classes.mobileHeader}>
              {/* 第一行：今天按钮 - 十年视图中隐藏 */}
              <div className={classes.todayRow} style={{ display: 'none' }}>
                <Tooltip label={t("回到今天")}>
                  <Button
                    variant={Math.floor(dayjs().year() / 10) === Math.floor(currentYear / 10) ? "outline" : "filled"}
                    size="xs"
                    onClick={onGoToToday}
                    className={classes.todayButtonTop}
                  >
                    今天
                  </Button>
                </Tooltip>
              </div>

              {/* 第二行：导航和标题 */}
              <div className={classes.navRow}>
                {/* 左侧：返回按钮 */}
                <ActionIcon
                  variant="subtle"
                  size="md"
                  onClick={() => onViewModeChange("year")}
                  aria-label={t("返回年视图")}
                  className={classes.navBackButton}
                >
                  <IconArrowLeft size={16} />
                </ActionIcon>

                {/* 中间：年代导航 */}
                <Group gap={8} className={classes.decadeNavGroup}>
                  <ActionIcon
                    variant="subtle"
                    size="md"
                    onClick={onNavigatePrevious}
                    aria-label={t("上一个十年")}
                    className={classes.navButton}
                  >
                    <IconChevronLeft size={16} />
                  </ActionIcon>

                  <Text size="sm" fw={600} className={classes.decadeTitleText}>
                    {decadeStart}年-{decadeStart + 9}年
                  </Text>

                  <ActionIcon
                    variant="subtle"
                    size="md"
                    onClick={onNavigateNext}
                    aria-label={t("下一个十年")}
                    className={classes.navButton}
                  >
                    <IconChevronRight size={16} />
                  </ActionIcon>
                </Group>

                {/* 右侧：占位元素 */}
                <div style={{ width: '40px' }}></div>
              </div>
            </div>

            {/* 桌面端布局 */}
            <div className={classes.desktopHeader}>
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

              {/* 桌面端十年视图中隐藏今天按钮 */}
              <div style={{ display: 'none' }}>
                <Tooltip label={t("回到今天")}>
                  <Button
                    variant={Math.floor(dayjs().year() / 10) === Math.floor(currentYear / 10) ? "outline" : "filled"}
                    size="xs"
                    onClick={onGoToToday}
                    style={{
                      position: 'absolute',
                      right: -4,
                      top: 'calc(50% - 4px)',
                      transform: 'translateY(-50%)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    今天
                  </Button>
                </Tooltip>
              </div>
            </div>
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