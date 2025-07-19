import { ActionIcon, Group, Menu, Text, Tooltip, Switch } from "@mantine/core";
import {
  IconArrowRight,
  IconArrowsHorizontal,
  IconDots,
  IconFileExport,
  IconHistory,
  IconLink,
  IconList,
  IconMessage,
  IconPrinter,
  IconSearch,
  IconTrash,
  IconWifiOff,
  IconCheck,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconSettings,
  IconEyeOff,
  IconKeyboard,
  IconKeyboardOff,
  IconShare,
  IconLayoutNavbar,
} from "@tabler/icons-react";
import React, { useEffect } from "react";
import useToggleAside from "@/hooks/use-toggle-aside.tsx";
import { useAtom, useAtomValue } from "jotai";
import { historyAtoms } from "@/features/page-history/atoms/history-atoms.ts";
import {
  getHotkeyHandler,
  useClipboard,
  useDisclosure,
  useHotkeys,
} from "@mantine/hooks";
import { useParams } from "react-router-dom";
import { usePageQuery } from "@/features/page/queries/page-query.ts";
import { buildPageUrl } from "@/features/page/page.utils.ts";
import { notifications } from "@mantine/notifications";
import { getAppUrl } from "@/lib/config.ts";
import { extractPageSlugId } from "@/lib";
import { treeApiAtom } from "@/features/page/tree/atoms/tree-api-atom.ts";
import { useDeletePageModal } from "@/features/page/hooks/use-delete-page-modal.tsx";
import { PageWidthToggle } from "@/features/user/components/page-width-pref.tsx";
import { Trans, useTranslation } from "react-i18next";
import ExportModal from "@/components/common/export-modal";
import {
  pageEditorAtom,
  yjsConnectionStatusAtom,
  keyboardShortcutsStatusAtom,
} from "@/features/editor/atoms/editor-atoms.ts";
import { searchAndReplaceStateAtom } from "@/features/editor/components/search-and-replace/atoms/search-and-replace-state-atom.ts";
import { formattedDate, timeAgo } from "@/lib/time.ts";
import { PageStateSegmentedControl } from "@/features/user/components/page-state-pref.tsx";
import MovePageModal from "@/features/page/components/move-page-modal.tsx";
import { useTimeAgo } from "@/hooks/use-time-ago.tsx";
import {
  defaultOpenTocAtom,
  headerVisibleAtom,
} from "@/components/layouts/global/hooks/atoms/sidebar-atom.ts";
import { pageHeaderButtonsAtom } from "@/features/page/atoms/page-header-atoms.ts";
import PageHeaderSettingsModal from "./page-header-settings-modal.tsx";
import ShareModal from "@/features/share/components/share-modal.tsx";

interface PageHeaderMenuProps {
  readOnly?: boolean;
}
export default function PageHeaderMenu({ readOnly }: PageHeaderMenuProps) {
  const { t } = useTranslation();
  const toggleAside = useToggleAside();
  const [yjsConnectionStatus] = useAtom(yjsConnectionStatusAtom);
  const [pageEditor] = useAtom(pageEditorAtom);
  const [headerButtons, setHeaderButtons] = useAtom(pageHeaderButtonsAtom);
  const [headerVisible, setHeaderVisible] = useAtom(headerVisibleAtom);
  const keyboardStatus = useAtomValue(keyboardShortcutsStatusAtom);

  useEffect(() => {
    setHeaderButtons((prev) => ({ ...prev, isPageHeaderVisible: true }));
    return () => {
      setHeaderButtons((prev) => ({ ...prev, isPageHeaderVisible: false }));
    };
  }, [setHeaderButtons]);

  useHotkeys(
    [
      [
        "mod+F",
        () => {
          const event = new CustomEvent("openFindDialogFromEditor", {});
          document.dispatchEvent(event);
        },
      ],
      [
        "Escape",
        () => {
          const event = new CustomEvent("closeFindDialogFromEditor", {});
          document.dispatchEvent(event);
        },
      ],
    ],
    [],
  );

  const handleUndo = () => {
    pageEditor?.commands.undo();
  };

  const handleRedo = () => {
    pageEditor?.commands.redo();
  };

  const toggleHeaderVisibility = () => {
    setHeaderVisible(!headerVisible);
  };
  return (
    <div className="shortcut-box page-header-menu-scrollable">
      {yjsConnectionStatus === "disconnected" && (
        <Tooltip
          label={t("Real-time editor connection lost. Retrying...")}
          openDelay={250}
          withArrow
        >
          <ActionIcon variant="default" c="red" style={{ border: "none", flexShrink: 0 }}>
            <IconWifiOff size={20} stroke={2} />
          </ActionIcon>
        </Tooltip>
      )}

      {!headerVisible && (
        <Tooltip label={t("Show header")} openDelay={250} withArrow>
          <ActionIcon
            variant="default"
            style={{ border: "none", flexShrink: 0 }}
            onClick={toggleHeaderVisibility}
          >
            <IconLayoutNavbar size={20} stroke={2} />
          </ActionIcon>
        </Tooltip>
      )}

      {!readOnly && <PageStateSegmentedControl size="xs" />}

      {!headerButtons.showShareButton && <ShareModal readOnly={readOnly} />}

      {headerButtons.showUndo && (
        <Tooltip label={t("Undo")} openDelay={250} withArrow>
          <ActionIcon
            variant="default"
            style={{ border: "none", flexShrink: 0 }}
            onClick={handleUndo}
            disabled={!pageEditor || readOnly}
          >
            <IconArrowBackUp size={20} stroke={2} />
          </ActionIcon>
        </Tooltip>
      )}

      {headerButtons.showRedo && (
        <Tooltip label={t("Redo")} openDelay={250} withArrow>
          <ActionIcon
            variant="default"
            style={{ border: "none", flexShrink: 0 }}
            onClick={handleRedo}
            disabled={!pageEditor || readOnly}
          >
            <IconArrowForwardUp size={20} stroke={2} />
          </ActionIcon>
        </Tooltip>
      )}

      {headerButtons.showComments && (
        <Tooltip label={t("Comments")} openDelay={250} withArrow>
          <ActionIcon
            variant="default"
            style={{ border: "none", flexShrink: 0 }}
            onClick={() => toggleAside("comments")}
          >
            <IconMessage size={20} stroke={2} />
          </ActionIcon>
        </Tooltip>
      )}

      {headerButtons.showToc && (
        <Tooltip label={t("Table of contents")} openDelay={250} withArrow>
          <ActionIcon
            variant="default"
            style={{ border: "none", flexShrink: 0 }}
            onClick={() => toggleAside("toc")}
          >
            <IconList size={20} stroke={2} />
          </ActionIcon>
        </Tooltip>
      )}

      <div style={{ flexShrink: 0 }}>
        <PageActionMenu readOnly={readOnly} />
      </div>
    </div>
  );
}

interface PageActionMenuProps {
  readOnly?: boolean;
}
function PageActionMenu({ readOnly }: PageActionMenuProps) {
  const { t } = useTranslation();
  const [, setHistoryModalOpen] = useAtom(historyAtoms);
  const clipboard = useClipboard({ timeout: 500 });
  const { pageSlug, spaceSlug } = useParams();
  const { data: page, isLoading } = usePageQuery({
    pageId: extractPageSlugId(pageSlug),
  });
  const { openDeleteModal } = useDeletePageModal();
  const [tree] = useAtom(treeApiAtom);
  const [exportOpened, { open: openExportModal, close: closeExportModal }] =
    useDisclosure(false);
  const [
    movePageModalOpened,
    { open: openMovePageModal, close: closeMoveSpaceModal },
  ] = useDisclosure(false);
  const [settingsOpened, { open: openSettings, close: closeSettings }] =
    useDisclosure(false);
  const [pageEditor] = useAtom(pageEditorAtom);
  const pageUpdatedAt = useTimeAgo(page?.updatedAt);
  const [defaultOpenToc, setDefaultOpenToc] = useAtom(defaultOpenTocAtom);
  const [headerButtons] = useAtom(pageHeaderButtonsAtom);

  const handleCopyLink = () => {
    const pageUrl =
      getAppUrl() + buildPageUrl(spaceSlug, page.slugId, page.title);

    // 检查clipboard API是否可用
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(pageUrl)
        .then(() => {
          notifications.show({ message: t("Link copied") });
        })
        .catch((error) => {
          console.error("复制失败:", error);
          fallbackCopyTextToClipboard(pageUrl);
        });
    } else {
      // 使用fallback方法
      fallbackCopyTextToClipboard(pageUrl);
    }
  };

  // Fallback方法：通过创建临时textarea元素来复制文本
  const fallbackCopyTextToClipboard = (text: string) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;

      // 避免滚动到底部
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);

      if (successful) {
        notifications.show({ message: t("Link copied") });
      } else {
        notifications.show({ message: t("Failed to copy link"), color: "red" });
      }
    } catch (err) {
      console.error("回退复制方法失败:", err);
      notifications.show({ message: t("Failed to copy link"), color: "red" });
    }
  };

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 250);
  };

  const openHistoryModal = () => {
    setHistoryModalOpen(true);
  };

  const handleDeletePage = () => {
    openDeleteModal({ onConfirm: () => tree?.delete(page.id) });
  };

  return (
    <>
      <Menu
        shadow="xl"
        position="bottom-end"
        offset={20}
        width={230}
        withArrow
        arrowPosition="center"
      >
        <Menu.Target>
          <ActionIcon variant="default" style={{ border: "none" }}>
            <IconDots size={20} />
          </ActionIcon>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Item
            leftSection={<IconLink size={16} />}
            onClick={handleCopyLink}
          >
            {t("Copy link")}
          </Menu.Item>
          <Menu.Divider />

          <Menu.Item
            leftSection={<IconSettings size={16} />}
            onClick={openSettings}
          >
            {t("Header Settings")}
          </Menu.Item>

          <Menu.Item
            leftSection={<IconHistory size={16} />}
            onClick={openHistoryModal}
          >
            {t("Page history")}
          </Menu.Item>

          <Menu.Divider />

          {!readOnly && (
            <Menu.Item
              leftSection={<IconArrowRight size={16} />}
              onClick={openMovePageModal}
            >
              {t("Move")}
            </Menu.Item>
          )}

          <Menu.Item
            leftSection={<IconFileExport size={16} />}
            onClick={openExportModal}
          >
            {t("Export")}
          </Menu.Item>

          <Menu.Item
            leftSection={<IconPrinter size={16} />}
            onClick={handlePrint}
          >
            {t("Print PDF")}
          </Menu.Item>

          {!readOnly && (
            <>
              <Menu.Divider />
              <Menu.Item
                color={"red"}
                leftSection={<IconTrash size={16} />}
                onClick={handleDeletePage}
              >
                {t("Delete")}
              </Menu.Item>
            </>
          )}

          <Menu.Divider />

          <>
            <Group px="sm" wrap="nowrap" style={{ cursor: "pointer" }}>
              <Tooltip
                label={t("Edited by {{name}} {{time}}", {
                  name: page.lastUpdatedBy.name,
                  time: pageUpdatedAt,
                })}
                position="left-start"
              >
                <div style={{ width: 210 }}>
                  <Text size="xs" c="dimmed" truncate="end">
                    {t("Word count: {{wordCount}}", {
                      wordCount: pageEditor?.storage?.characterCount?.words(),
                    })}
                  </Text>

                  <Text size="xs" c="dimmed" lineClamp={1}>
                    <Trans
                      defaults="Created by: <b>{{creatorName}}</b>"
                      values={{ creatorName: page?.creator?.name }}
                      components={{ b: <Text span fw={500} /> }}
                    />
                  </Text>
                  <Text size="xs" c="dimmed" truncate="end">
                    {t("Created at: {{time}}", {
                      time: formattedDate(page.createdAt),
                    })}
                  </Text>
                </div>
              </Tooltip>
            </Group>
          </>
        </Menu.Dropdown>
      </Menu>

      <ExportModal
        type="page"
        id={page.id}
        open={exportOpened}
        onClose={closeExportModal}
      />

      <MovePageModal
        pageId={page.id}
        slugId={page.slugId}
        currentSpaceSlug={spaceSlug}
        onClose={closeMoveSpaceModal}
        open={movePageModalOpened}
      />

      <PageHeaderSettingsModal
        opened={settingsOpened}
        onClose={closeSettings}
      />
    </>
  );
}
