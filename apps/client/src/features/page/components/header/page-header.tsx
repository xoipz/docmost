import classes from "./page-header.module.css";
import PageHeaderMenu from "@/features/page/components/header/page-header-menu.tsx";
import { Group, Tooltip } from "@mantine/core";
import Breadcrumb from "@/features/page/components/breadcrumbs/breadcrumb.tsx";
import { useAtom } from "jotai";
import {
  desktopSidebarAtom,
  headerVisibleAtom,
  mobileSidebarAtom,
} from "@/components/layouts/global/hooks/atoms/sidebar-atom.ts";
import { useToggleSidebar } from "@/components/layouts/global/hooks/hooks/use-toggle-sidebar.ts";
import SidebarToggle from "@/components/ui/sidebar-toggle-button.tsx";
import { useTranslation } from "react-i18next";

interface Props {
  readOnly?: boolean;
}
export default function PageHeader({ readOnly }: Props) {
  const { t } = useTranslation();
  const [mobileOpened] = useAtom(mobileSidebarAtom);
  const toggleMobile = useToggleSidebar(mobileSidebarAtom);

  const [desktopOpened] = useAtom(desktopSidebarAtom);
  const toggleDesktop = useToggleSidebar(desktopSidebarAtom);

  const [headerVisible] = useAtom(headerVisibleAtom);

  return (
    <div className={classes.header}>
      <Group justify="space-between" h="100%" px="md" wrap="nowrap">
        <Group wrap="nowrap">
          {!headerVisible && (
            <Tooltip label={t("Sidebar toggle")}>
              <SidebarToggle
                aria-label={t("Sidebar toggle")}
                opened={mobileOpened}
                onClick={toggleMobile}
                hiddenFrom="sm"
                size="sm"
              />
            </Tooltip>
          )}

          {!headerVisible && (
            <Tooltip label={t("Sidebar toggle")}>
              <SidebarToggle
                aria-label={t("Sidebar toggle")}
                opened={desktopOpened}
                onClick={toggleDesktop}
                visibleFrom="sm"
                size="sm"
              />
            </Tooltip>
          )}

          <Breadcrumb />
        </Group>

        <Group justify="flex-end" h="100%" px="md" wrap="nowrap">
          <PageHeaderMenu readOnly={readOnly} />
        </Group>
      </Group>
    </div>
  );
}
