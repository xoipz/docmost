import {
  ActionIcon,
  Anchor,
  Button,
  Group,
  Indicator,
  Popover,
  Switch,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import {
  IconCheck,
  IconCopy,
  IconExternalLink,
  IconWorld,
  IconShare,
} from "@tabler/icons-react";
import React, { useEffect, useMemo, useState } from "react";
import {
  useCreateShareMutation,
  useDeleteShareMutation,
  useShareForPageQuery,
  useUpdateShareMutation,
} from "@/features/share/queries/share-query.ts";
import { Link, useParams } from "react-router-dom";
import { extractPageSlugId, getPageIcon } from "@/lib";
import { useTranslation } from "react-i18next";
import CopyTextButton from "@/components/common/copy.tsx";
import { getAppUrl } from "@/lib/config.ts";
import { buildPageUrl } from "@/features/page/page.utils.ts";
import classes from "@/features/share/components/share.module.css";
import { notifications } from "@mantine/notifications";
import { useClipboard } from "@mantine/hooks";

interface ShareModalProps {
  readOnly: boolean;
  opened?: boolean;
  onClose?: () => void;
  usedInMenu?: boolean;
}
export default function ShareModal({ readOnly, opened, onClose, usedInMenu = false }: ShareModalProps) {
  const { t } = useTranslation();
  const { pageSlug } = useParams();
  const pageId = extractPageSlugId(pageSlug);
  const { data: share } = useShareForPageQuery(pageId);
  const { spaceSlug } = useParams();
  const createShareMutation = useCreateShareMutation();
  const updateShareMutation = useUpdateShareMutation();
  const deleteShareMutation = useDeleteShareMutation();
  // pageIsShared means that the share exists and its level equals zero.
  const pageIsShared = share && share.level === 0;
  // if level is greater than zero, then it is a descendant page from a shared page
  const isDescendantShared = share && share.level > 0;

  const publicLink = `${getAppUrl()}/share/${share?.key}/p/${pageSlug}`;

  const [isPagePublic, setIsPagePublic] = useState<boolean>(false);
  const clipboard = useClipboard({ timeout: 2000 });

  useEffect(() => {
    if (share) {
      setIsPagePublic(true);
    } else {
      setIsPagePublic(false);
    }
  }, [share, pageId]);

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.checked;

    if (value) {
      createShareMutation.mutateAsync({
        pageId: pageId,
        includeSubPages: true,
        searchIndexing: true,
      });
      setIsPagePublic(value);
    } else {
      if (share && share.id) {
        deleteShareMutation.mutateAsync(share.id);
        setIsPagePublic(value);
      }
    }
  };

  const handleSubPagesChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.currentTarget.checked;
    updateShareMutation.mutateAsync({
      shareId: share.id,
      includeSubPages: value,
    });
  };

  const handleIndexSearchChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.currentTarget.checked;
    updateShareMutation.mutateAsync({
      shareId: share.id,
      searchIndexing: value,
    });
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
        clipboard.copy(text); // To trigger copied state for icon
      } else {
        notifications.show({ message: t("Failed to copy link"), color: "red" });
      }
    } catch (err) {
      console.error("回退复制方法失败:", err);
      notifications.show({ message: t("Failed to copy link"), color: "red" });
    }
  };

  const handleCopyShareLink = () => {
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(publicLink)
        .then(() => {
          notifications.show({ message: t("Link copied") });
          clipboard.copy(publicLink); // To trigger copied state for icon
        })
        .catch((error) => {
          console.error("复制失败:", error);
          fallbackCopyTextToClipboard(publicLink);
        });
    } else {
      fallbackCopyTextToClipboard(publicLink);
    }
  };

  const shareLink = useMemo(() => (
    <Group my="sm" gap={4} wrap="nowrap">
      <TextInput
        variant="filled"
        value={publicLink}
        readOnly
        rightSection={
          <Tooltip
            label={clipboard.copied ? t("Copied") : t("Copy")}
            withArrow
            position="right"
          >
            <ActionIcon
              color={clipboard.copied ? "teal" : "gray"}
              variant="subtle"
              onClick={handleCopyShareLink}
            >
              {clipboard.copied ? (
                <IconCheck size={16} />
              ) : (
                <IconCopy size={16} />
              )}
            </ActionIcon>
          </Tooltip>
        }
        style={{ width: "100%" }}
      />
      <ActionIcon
        component="a"
        variant="default"
        target="_blank"
        href={publicLink}
        size="sm"
      >
        <IconExternalLink size={16} />
      </ActionIcon>
    </Group>
  ), [publicLink, clipboard.copied, t, handleCopyShareLink]);

  return (
    <Popover width={350} position="bottom" withArrow shadow="md" opened={opened} onClose={onClose}>
      {!usedInMenu && (
        <Popover.Target>
          <Tooltip label={t("Share")} openDelay={250} withArrow>
            <ActionIcon
              style={{ border: "none" }}
              variant="default"
            >
              <IconShare size={20} stroke={1.5} color={isPagePublic ? "#0ca46a" : "currentColor"} />
            </ActionIcon>
          </Tooltip>
        </Popover.Target>
      )}
      <Popover.Dropdown style={{ userSelect: "none" }}>
        {isDescendantShared ? (
          <>
            <Text size="sm">{t("Inherits public sharing from")}</Text>
            <Anchor
              size="sm"
              underline="never"
              style={{
                cursor: "pointer",
                color: "var(--mantine-color-text)",
              }}
              component={Link}
              to={buildPageUrl(
                spaceSlug,
                share.sharedPage.slugId,
                share.sharedPage.title,
              )}
            >
              <Group gap="4" wrap="nowrap" my="sm">
                {getPageIcon(share.sharedPage.icon)}
                <div className={classes.shareLinkText}>
                  <Text fz="sm" fw={500} lineClamp={1}>
                    {share.sharedPage.title || t("untitled")}
                  </Text>
                </div>
              </Group>
            </Anchor>

            {shareLink}
          </>
        ) : (
          <>
            <Group justify="space-between" wrap="nowrap" gap="xl">
              <div>
                <Text size="sm">
                  {isPagePublic ? t("Shared to web") : t("Share to web")}
                </Text>
                <Text size="xs" c="dimmed">
                  {isPagePublic
                    ? t("Anyone with the link can view this page")
                    : t("Make this page publicly accessible")}
                </Text>
              </div>
              <Switch
                onChange={handleChange}
                defaultChecked={isPagePublic}
                disabled={readOnly}
                size="xs"
              />
            </Group>

            {pageIsShared && (
              <>
                {shareLink}
                <Group justify="space-between" wrap="nowrap" gap="xl">
                  <div>
                    <Text size="sm">{t("Include sub-pages")}</Text>
                    <Text size="xs" c="dimmed">
                      {t("Make sub-pages public too")}
                    </Text>
                  </div>

                  <Switch
                    onChange={handleSubPagesChange}
                    checked={share.includeSubPages}
                    size="xs"
                    disabled={readOnly}
                  />
                </Group>
                <Group justify="space-between" wrap="nowrap" gap="xl" mt="sm">
                  <div>
                    <Text size="sm">{t("Search engine indexing")}</Text>
                    <Text size="xs" c="dimmed">
                      {t("Allow search engines to index page")}
                    </Text>
                  </div>
                  <Switch
                    onChange={handleIndexSearchChange}
                    checked={share.searchIndexing}
                    size="xs"
                    disabled={readOnly}
                  />
                </Group>
              </>
            )}
          </>
        )}
      </Popover.Dropdown>
    </Popover>
  );
}
