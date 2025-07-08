import { Badge, Group, Text, Tooltip, Box, ActionIcon } from "@mantine/core";
import classes from "./app-header.module.css";
import React from "react";
import TopMenu from "@/components/layouts/global/top-menu.tsx";
import { Link, useLocation, useParams } from "react-router-dom";
import APP_ROUTE from "@/lib/app-route.ts";
import { useAtom } from "jotai";
import {
  desktopSidebarAtom,
  headerVisibleAtom,
  mobileSidebarAtom,
} from "@/components/layouts/global/hooks/atoms/sidebar-atom.ts";
import { useToggleSidebar } from "@/components/layouts/global/hooks/hooks/use-toggle-sidebar.ts";
import SidebarToggle from "@/components/ui/sidebar-toggle-button.tsx";
import { useTranslation } from "react-i18next";
import useTrial from "@/ee/hooks/use-trial.tsx";
import { isCloud } from "@/lib/config.ts";
import { useGetSpaceBySlugQuery } from "@/features/space/queries/space-query.ts";
import { currentUserAtom } from "@/features/user/atoms/current-user-atom";
import { getHostnameUrl } from "@/ee/utils.ts";
import { useGetSpacesQuery } from "@/features/space/queries/space-query.ts";
import { getSpaceUrl } from "@/lib/config.ts";
import { pageHeaderButtonsAtom } from "@/features/page/atoms/page-header-atoms.ts";
import { IconLayoutNavbar } from "@tabler/icons-react";

const links = [{ link: APP_ROUTE.HOME, label: "Home" }];

export function AppHeader() {
  const { t } = useTranslation();
  const [mobileOpened] = useAtom(mobileSidebarAtom);
  const toggleMobile = useToggleSidebar(mobileSidebarAtom);

  const [desktopOpened] = useAtom(desktopSidebarAtom);
  const toggleDesktop = useToggleSidebar(desktopSidebarAtom);
  const { isTrial, trialDaysLeft } = useTrial();
  const location = useLocation();
  const { spaceSlug } = useParams();
  const { data: space } = useGetSpaceBySlugQuery(spaceSlug);
  const { data: spaces, isLoading } = useGetSpacesQuery({ page: 1 });
  const [currentUser] = useAtom(currentUserAtom);
  const currentWorkspace = currentUser?.workspace;
  const [{ isPageHeaderVisible }] = useAtom(pageHeaderButtonsAtom);
  const [headerVisible, setHeaderVisible] = useAtom(headerVisibleAtom);

  const toggleHeaderVisibility = () => {
    setHeaderVisible(!headerVisible);
  };

  const isHomeRoute = location.pathname.startsWith("/home");

  const homeItem = (
    <Link key="home" to={APP_ROUTE.HOME} className={classes.link}>
      {t("Home")}
    </Link>
  );

  // TAG:App-Header
  return (
    <>
      <Group h="100%" justify="space-between" wrap={"nowrap"}>
        <Group wrap="nowrap" className={classes.navContainer}>
          {!isHomeRoute && (
            <>
              <Tooltip label={t("Sidebar toggle")}>
                <SidebarToggle
                  aria-label={t("Sidebar toggle")}
                  opened={mobileOpened}
                  onClick={toggleMobile}
                  hiddenFrom="sm"
                  size="md"
                  ml={20}
                />
              </Tooltip>

              <Tooltip label={t("Sidebar toggle")}>
                <SidebarToggle
                  aria-label={t("Sidebar toggle")}
                  opened={desktopOpened}
                  onClick={toggleDesktop}
                  visibleFrom="sm"
                  size="md"
                  ml={20}
                />
              </Tooltip>
            </>
          )}
          {isHomeRoute && <div style={{ width: '10px'}}></div>}

          {/* <Text
            size="lg"
            fw={600}
            style={{ cursor: "pointer", userSelect: "none" }}
            component={Link}
            to="/home"
          >
            Docmost
          </Text> */}
          
          {homeItem}
          
          {spaces && spaces.items && spaces.items.length > 0 && (
            <div className={classes.spacesContainer}>
              {spaces.items.map((workspaceSpace) => (
                <Link 
                  key={workspaceSpace.id} 
                  to={getSpaceUrl(workspaceSpace.slug)} 
                  className={classes.spaceLink}
                  style={{
                    fontWeight: spaceSlug === workspaceSpace.slug ? 600 : 400,
                  }}
                  title={workspaceSpace.name}
                >
                  {workspaceSpace.name}
                </Link>
              ))}
            </div>
          )}
        </Group>

        <Group px={"xl"} wrap="nowrap">
          {isCloud() && isTrial && trialDaysLeft !== 0 && (
            <Badge
              variant="light"
              style={{ cursor: "pointer" }}
              component={Link}
              to={APP_ROUTE.SETTINGS.WORKSPACE.BILLING}
              visibleFrom="xs"
            >
              {trialDaysLeft === 1
                ? "1 day left"
                : `${trialDaysLeft} days left`}
            </Badge>
          )}
          {isPageHeaderVisible && headerVisible && (
            <Tooltip
              label={t("Toggle header visibility")}
              openDelay={250}
              withArrow
            >
              <ActionIcon
                variant="default"
                style={{ border: "none" }}
                onClick={toggleHeaderVisibility}
                className={classes['icon-strike-through']}
              >
                <IconLayoutNavbar size={20} stroke={2} />
              </ActionIcon>
            </Tooltip>
          )}
          <TopMenu />
        </Group>
      </Group>
    </>
  );
}
