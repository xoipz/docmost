import { Modal, Group, Text, Switch, Stack } from "@mantine/core";
import { useAtom } from "jotai";
import { pageHeaderButtonsAtom } from "@/features/page/atoms/page-header-atoms.ts";
import { defaultOpenTocAtom } from "@/components/layouts/global/hooks/atoms/sidebar-atom.ts";
import { useTranslation } from "react-i18next";
import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconMessage,
  IconList,
  IconArrowsHorizontal,
  IconKeyboard,
} from "@tabler/icons-react";

interface PageHeaderSettingsModalProps {
  opened: boolean;
  onClose: () => void;
}

export default function PageHeaderSettingsModal({
  opened,
  onClose,
}: PageHeaderSettingsModalProps) {
  const { t } = useTranslation();
  const [headerButtons, setHeaderButtons] = useAtom(pageHeaderButtonsAtom);
  const [defaultOpenToc, setDefaultOpenToc] = useAtom(defaultOpenTocAtom);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t("Header Settings")}
      size="sm"
    >
      <Stack>
        <Group wrap="nowrap" justify="space-between" w="100%">
          <Group gap="xs">
            <IconArrowBackUp size={16} />
            <Text>{t("Show undo button")}</Text>
          </Group>
          <Switch
            checked={headerButtons.showUndo}
            onChange={(e) => {
              setHeaderButtons({ ...headerButtons, showUndo: e.currentTarget.checked });
            }}
            size="sm"
          />
        </Group>

        <Group wrap="nowrap" justify="space-between" w="100%">
          <Group gap="xs">
            <IconArrowForwardUp size={16} />
            <Text>{t("Show redo button")}</Text>
          </Group>
          <Switch
            checked={headerButtons.showRedo}
            onChange={(e) => {
              setHeaderButtons({ ...headerButtons, showRedo: e.currentTarget.checked });
            }}
            size="sm"
          />
        </Group>

        <Group wrap="nowrap" justify="space-between" w="100%">
          <Group gap="xs">
            <IconMessage size={16} />
            <Text>{t("Show comments button")}</Text>
          </Group>
          <Switch
            checked={headerButtons.showComments}
            onChange={(e) => {
              setHeaderButtons({ ...headerButtons, showComments: e.currentTarget.checked });
            }}
            size="sm"
          />
        </Group>

        <Group wrap="nowrap" justify="space-between" w="100%">
          <Group gap="xs">
            <IconKeyboard size={16} />
            <Text>{t("Show quick input bar")}</Text>
          </Group>
          <Switch
            checked={headerButtons.showQuickInputBar}
            onChange={(e) => {
              setHeaderButtons({ ...headerButtons, showQuickInputBar: e.currentTarget.checked });
            }}
            size="sm"
          />
        </Group>

        <Group wrap="nowrap" justify="space-between" w="100%">
          <Group gap="xs">
            <IconList size={16} />
            <Text>{t("Show outline button")}</Text>
          </Group>
          <Switch
            checked={headerButtons.showToc}
            onChange={(e) => {
              setHeaderButtons({ ...headerButtons, showToc: e.currentTarget.checked });
            }}
            size="sm"
          />
        </Group>

        <Group wrap="nowrap" justify="space-between" w="100%">
          <Group gap="xs">
            <IconList size={16} />
            <Text>{t("Default open outline")}</Text>
          </Group>
          <Switch
            checked={defaultOpenToc}
            onChange={(e) => {
              setDefaultOpenToc(e.currentTarget.checked);
            }}
            size="sm"
          />
        </Group>

        <Group wrap="nowrap" justify="space-between" w="100%">
          <Group gap="xs">
            <IconArrowsHorizontal size={16} />
            <Text>{t("Full width")}</Text>
          </Group>
          <Switch
            checked={headerButtons.fullWidth}
            onChange={(e) => {
              setHeaderButtons({ ...headerButtons, fullWidth: e.currentTarget.checked });
            }}
            size="sm"
          />
        </Group>
      </Stack>
    </Modal>
  );
} 