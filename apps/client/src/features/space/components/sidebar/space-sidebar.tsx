import {
  ActionIcon,
  Group,
  Menu,
  Text,
  Tooltip,
  UnstyledButton,
  Popover,
} from "@mantine/core";
import {
  IconArrowDown,
  IconDots,
  IconFileExport,
  IconHome,
  IconPlus,
  IconSearch,
  IconSettings,
  IconChevronUp,
  IconChevronDown,
  IconLayoutSidebarLeftCollapse,
} from "@tabler/icons-react";
import classes from "./space-sidebar.module.css";
import React, { useMemo, useState, useEffect, useRef } from "react";
import { useAtom } from "jotai";
import { SearchSpotlight } from "@/features/search/search-spotlight.tsx";
import { treeApiAtom } from "@/features/page/tree/atoms/tree-api-atom.ts";
import { Link, useLocation, useParams } from "react-router-dom";
import clsx from "clsx";
import { useDisclosure } from "@mantine/hooks";
import SpaceSettingsModal from "@/features/space/components/settings-modal.tsx";
import { useGetSpaceBySlugQuery } from "@/features/space/queries/space-query.ts";
import { getSpaceUrl } from "@/lib/config.ts";
import SpaceTree from "@/features/page/tree/components/space-tree.tsx";
import { useSpaceAbility } from "@/features/space/permissions/use-space-ability.ts";
import {
  SpaceCaslAction,
  SpaceCaslSubject,
} from "@/features/space/permissions/permissions.type.ts";
import PageImportModal from "@/features/page/components/page-import-modal.tsx";
import { useTranslation } from "react-i18next";
import { SwitchSpace } from "./switch-space";
import ExportModal from "@/components/common/export-modal";
import { 
  mobileSidebarAtom, 
  desktopSidebarAtom,
  headerVisibleAtom
} from "@/components/layouts/global/hooks/atoms/sidebar-atom.ts";
import { useToggleSidebar } from "@/components/layouts/global/hooks/hooks/use-toggle-sidebar.ts";
import { searchSpotlight } from "@/features/search/constants";

export function SpaceSidebar() {
  const { t } = useTranslation();
  const [tree] = useAtom(treeApiAtom);
  const location = useLocation();
  const [opened, { open: openSettings, close: closeSettings }] =
    useDisclosure(false);
  const [mobileSidebarOpened] = useAtom(mobileSidebarAtom);
  const toggleMobileSidebar = useToggleSidebar(mobileSidebarAtom);
  const [desktopSidebarOpened] = useAtom(desktopSidebarAtom);
  const toggleDesktopSidebar = useToggleSidebar(desktopSidebarAtom);
  const [headerVisible] = useAtom(headerVisibleAtom);

  const { spaceSlug } = useParams();
  const { data: space, isLoading, isError } = useGetSpaceBySlugQuery(spaceSlug);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const [menuCollapsed, setMenuCollapsed] = useState(() => {
    const saved = localStorage.getItem('docmost-menu-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const spaceRules = space?.membership?.permissions;
  const spaceAbility = useSpaceAbility(spaceRules);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.mantine-Menu-dropdown')) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('click', handleGlobalClick);
    }

    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [isMenuOpen]);

  // 保存折叠状态到 localStorage
  const toggleMenuCollapse = () => {
    const newState = !menuCollapsed;
    setMenuCollapsed(newState);
    localStorage.setItem('docmost-menu-collapsed', JSON.stringify(newState));
  };

  // 处理侧边栏收起
  const handleSidebarCollapse = () => {
    if (window.innerWidth < 768) {
      // 移动端收起移动侧边栏
      toggleMobileSidebar();
    } else {
      // 桌面端收起桌面侧边栏
      toggleDesktopSidebar();
    }
  };

  if (!space) {
    return <></>;
  }

  function handleCreatePage() {
    tree?.create({ parentId: null, type: "internal", index: 0 });
    setIsMenuOpen(false);
    
    if (mobileSidebarOpened) {
      toggleMobileSidebar();
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 获取视口尺寸
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // 菜单的预估尺寸（可根据实际菜单大小调整）
    const menuWidth = 200;
    const menuHeight = 45;
    
    // 计算菜单位置，确保不超出视口
    let x = e.pageX;
    let y = e.pageY;
    
    // 检查是否会超出右边界
    if (x + menuWidth > viewportWidth) {
      x = viewportWidth - menuWidth; // 减去 10px 作为边距
    }
    
    // 检查是否会超出底部边界
    if (y + menuHeight > viewportHeight) {
      y = viewportHeight - menuHeight; // 减去 10px 作为边距
    }
    console.log(x,y)
    
    setMenuPosition({ x, y });
    setIsMenuOpen(true);
  };

  return (
    <>
      <div className={classes.navbar}>
        <div
          className={classes.section}
          style={{
            border: "none",
            marginTop: 2,
            marginBottom: 3,
          }}
        >
          {!headerVisible ? (
            <Group gap={0} ml={0} align="center" wrap="nowrap">
              <Tooltip label={t("收起侧边栏")} withArrow position="right">
                <ActionIcon
                  variant="subtle"
                  size={36}
                  onClick={handleSidebarCollapse}
                  aria-label={t("收起侧边栏")}
                  color="gray"
                  style={{ flexShrink: 0, width: 48 }}
                >
                  <IconLayoutSidebarLeftCollapse size={20} />
                </ActionIcon>
              </Tooltip>
              <div style={{ flex: 1, minWidth: 0 }}>
                <SwitchSpace spaceName={space?.name} spaceSlug={space?.slug} />
              </div>
            </Group>
          ) : (
            <SwitchSpace spaceName={space?.name} spaceSlug={space?.slug} />
          )}
        </div>

        <div className={classes.section}>
          <Group 
            className={classes.pagesHeader} 
            justify="space-between"
            onClick={toggleMenuCollapse}
            style={{ cursor: 'pointer' }}
          >
            <Text size="xs" fw={500} c="dimmed">
              {t("导航")}
            </Text>
            <Tooltip label={menuCollapsed ? t("展开菜单") : t("收起菜单")} withArrow position="right">
              <ActionIcon
                variant="default"
                size={18}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMenuCollapse();
                }}
                aria-label={menuCollapsed ? t("展开菜单") : t("收起菜单")}
              >
                {menuCollapsed ? <IconChevronDown size={16} /> : <IconChevronUp size={16} />}
              </ActionIcon>
            </Tooltip>
          </Group>

          <div className={classes.menuItems}>
            {/* 搜索功能始终显示 */}
            <UnstyledButton className={classes.menu} onClick={searchSpotlight.open}>
              <div className={classes.menuItemInner}>
                <IconSearch
                  size={18}
                  className={classes.menuItemIcon}
                  stroke={2}
                />
                <span>{t("Search")}</span>
              </div>
            </UnstyledButton>

            {!menuCollapsed && (
              <>
                <UnstyledButton
                  component={Link}
                  to={getSpaceUrl(spaceSlug)}
                  className={clsx(
                    classes.menu,
                    location.pathname.toLowerCase() === getSpaceUrl(spaceSlug)
                      ? classes.activeButton
                      : "",
                  )}
                >
                  <div className={classes.menuItemInner}>
                    <IconHome
                      size={18}
                      className={classes.menuItemIcon}
                      stroke={2}
                    />
                    <span>{t("Overview")}</span>
                  </div>
                </UnstyledButton>

                <UnstyledButton className={classes.menu} onClick={openSettings}>
                  <div className={classes.menuItemInner}>
                    <IconSettings
                      size={18}
                      className={classes.menuItemIcon}
                      stroke={2}
                    />
                    <span>{t("Space settings")}</span>
                  </div>
                </UnstyledButton>

                {spaceAbility.can(
                  SpaceCaslAction.Manage,
                  SpaceCaslSubject.Page,
                ) && (
                  <UnstyledButton
                    className={classes.menu}
                    onClick={handleCreatePage}
                  >
                    <div className={classes.menuItemInner}>
                      <IconPlus
                        size={18}
                        className={classes.menuItemIcon}
                        stroke={2}
                      />
                      <span>{t("New page")}</span>
                    </div>
                  </UnstyledButton>
                )}
              </>
            )}
          </div>
        </div>

        <div className={clsx(classes.section, classes.sectionPages)}  style={{borderBottom: 'none'}}>
          <Group className={classes.pagesHeader} justify="space-between">
            <Text size="xs" fw={500} c="dimmed">
              {t("Pages")}
            </Text>

            {spaceAbility.can(
              SpaceCaslAction.Manage,
              SpaceCaslSubject.Page,
            ) && (
              <Group gap="xs">
                <SpaceMenu spaceId={space.id} onSpaceSettings={openSettings} />

                <Tooltip label={t("Create page")} withArrow position="right">
                  <ActionIcon
                    variant="default"
                    size={18}
                    onClick={handleCreatePage}
                    aria-label={t("Create page")}
                  >
                    <IconPlus />
                  </ActionIcon>
                </Tooltip>
              </Group>
            )}
          </Group>

          <div className={classes.pages}>
            <SpaceTree
              spaceId={space.id}
              readOnly={spaceAbility.cannot(
                SpaceCaslAction.Manage,
                SpaceCaslSubject.Page,
              )}
            />
          </div>
        </div>
        <div 
          ref={targetRef}
          style={{ flex: 1,zIndex: 9,marginTop: -30 }} 
          onContextMenu={handleContextMenu}
        />
        
        <Menu
          opened={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          closeOnClickOutside
          closeOnEscape
          withinPortal
          position="bottom"
          offset={0}
          styles={{
            dropdown: {
              position: 'fixed',
              top: menuPosition.y,
              left: menuPosition.x,
              minWidth: 200,
              maxWidth: 'calc(100vw - 20px)',
              maxHeight: 'calc(100vh - 20px)',
              overflow: 'auto',
            }
          }}
        >
          <Menu.Dropdown>
            {spaceAbility.can(
              SpaceCaslAction.Manage,
              SpaceCaslSubject.Page,
            ) && (
              <Menu.Item
                leftSection={<IconPlus size={16} />}
                onClick={handleCreatePage}
              >
                {t("新建文件")}
              </Menu.Item>
            )}
          </Menu.Dropdown>
        </Menu>
      </div>

      <SpaceSettingsModal
        opened={opened}
        onClose={closeSettings}
        spaceId={space?.slug}
      />

      <SearchSpotlight spaceId={space.id} />
    </>
  );
}

interface SpaceMenuProps {
  spaceId: string;
  onSpaceSettings: () => void;
}
function SpaceMenu({ spaceId, onSpaceSettings }: SpaceMenuProps) {
  const { t } = useTranslation();
  const [importOpened, { open: openImportModal, close: closeImportModal }] =
    useDisclosure(false);
  const [exportOpened, { open: openExportModal, close: closeExportModal }] =
    useDisclosure(false);

  return (
    <>
      <Menu width={200} shadow="md" withArrow>
        <Menu.Target>
          <Tooltip
            label={t("Import pages & space settings")}
            withArrow
            position="top"
          >
            <ActionIcon
              variant="default"
              size={18}
              aria-label={t("Space menu")}
            >
              <IconDots />
            </ActionIcon>
          </Tooltip>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Item
            onClick={openImportModal}
            leftSection={<IconArrowDown size={16} />}
          >
            {t("Import pages")}
          </Menu.Item>

          <Menu.Item
            onClick={openExportModal}
            leftSection={<IconFileExport size={16} />}
          >
            {t("Export space")}
          </Menu.Item>

          <Menu.Divider />

          <Menu.Item
            onClick={onSpaceSettings}
            leftSection={<IconSettings size={16} />}
          >
            {t("Space settings")}
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>

      <PageImportModal
        spaceId={spaceId}
        open={importOpened}
        onClose={closeImportModal}
      />

      <ExportModal
        type="space"
        id={spaceId}
        open={exportOpened}
        onClose={closeExportModal}
      />
    </>
  );
}
