import { Modal, Group, Text, Switch, Stack, Divider, Select, Button, Collapse } from "@mantine/core";
import { useAtom } from "jotai";
import { pageHeaderButtonsAtom } from "@/features/page/atoms/page-header-atoms.ts";
import { headerVisibleAtom } from "@/components/layouts/global/hooks/atoms/sidebar-atom.ts";
import { useTranslation } from "react-i18next";
import {
  IconArrowBackUp,   
  IconArrowForwardUp,
  IconMessage,
  IconList,
  IconArrowsHorizontal,
  IconKeyboard,
  IconLayoutNavbar,
  IconShare,
  IconLayout,
  IconLoader,
  IconEdit,
  IconRectangle,
  IconStar,
  IconChevronDown,
  IconChevronUp,
  IconClick,
} from "@tabler/icons-react";
import { bubbleMenuVisibleAtom } from "@/features/editor/atoms/bubble-menu-atoms.ts";
import { FavoriteButtonsSettings } from "./favorite-buttons-settings";
import { useState } from "react";

interface PageHeaderSettingsModalProps {
  opened: boolean;
  onClose: () => void;
}

// TAG:顶栏设置
export default function PageHeaderSettingsModal({
  opened,
  onClose,
}: PageHeaderSettingsModalProps) {
  const { t } = useTranslation();
  const [headerButtons, setHeaderButtons] = useAtom(pageHeaderButtonsAtom);
  const [headerVisible, setHeaderVisible] = useAtom(headerVisibleAtom);
  const [bubbleMenuVisible, setBubbleMenuVisible] = useAtom(bubbleMenuVisibleAtom);
  const [showFavoriteSettings, setShowFavoriteSettings] = useState(false);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t("Header Settings")}
      size="sm"
    >
      <Stack>
        {/* 页面布局设置 */}
        <Text fw={500} size="sm">{t("Layout Settings")}</Text>
        
        <Group wrap="nowrap" justify="space-between" w="100%">
          <Group gap="xs">
            <IconLayoutNavbar size={16} />
            <Text>{t("Default show header")}</Text>
          </Group>
          <Switch
            checked={headerVisible}
            onChange={(e) => {
              setHeaderVisible(e.currentTarget.checked);
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

        <Divider my="xs" />

        {/* 工具栏按钮设置 */}
        <Text fw={500} size="sm">{t("Toolbar Buttons")}</Text>

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
            <IconRectangle size={16} />
            <Text>{t("Show bubble menu button")}</Text>
          </Group>
          <Switch
            checked={headerButtons.showBubbleMenu}
            onChange={(e) => {
              setHeaderButtons({ ...headerButtons, showBubbleMenu: e.currentTarget.checked });
            }}
            size="sm"
          />
        </Group>

        {headerButtons.showBubbleMenu && (
          <Group wrap="nowrap" justify="space-between" w="100%" pl="md">
            <Text size="sm" c="dimmed">{t("Enable bubble menu")}</Text>
            <Switch
              checked={bubbleMenuVisible}
              onChange={(e) => {
                setBubbleMenuVisible(e.currentTarget.checked);
              }}
              size="sm"
            />
          </Group>
        )}


        <Group wrap="nowrap" justify="space-between" w="100%">
          <Group gap="xs">
            <IconEdit size={16} />
            <Text>{t("Show page state control")}</Text>
          </Group>
          <Switch
            checked={headerButtons.showPageState}
            onChange={(e) => {
              setHeaderButtons({ ...headerButtons, showPageState: e.currentTarget.checked });
            }}
            size="sm"
          />
        </Group>

        <Group wrap="nowrap" justify="space-between" w="100%">
          <Group gap="xs">
            <IconShare size={16} />
            <Text>{t("Directly display Share button in header")}</Text>
          </Group>
          <Switch
            checked={!headerButtons.showShareButton}
            onChange={(e) => {
              setHeaderButtons({ ...headerButtons, showShareButton: !e.currentTarget.checked });
            }}
            size="sm"
          />
        </Group>

        <Divider my="xs" />

        {/* 其他功能设置 */}
        <Text fw={500} size="sm">{t("Other Features")}</Text>

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

        {headerButtons.showQuickInputBar && (
          <Stack pl="md" gap="xs">
            <Button
              variant="subtle"
              size="sm"
              leftSection={<IconStar size={16} />}
              rightSection={showFavoriteSettings ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
              onClick={() => setShowFavoriteSettings(!showFavoriteSettings)}
              justify="space-between"
              fullWidth
            >
              {t("设置常用快捷键")}
            </Button>
            
            <Collapse in={showFavoriteSettings}>
              <FavoriteButtonsSettings />
            </Collapse>
          </Stack>
        )}

        <Group wrap="nowrap" justify="space-between" w="100%">
          <Group gap="xs">
            <IconLayout size={16} />
            <Text>{t("Show multi-window tabs")}</Text>
          </Group>
          <Switch
            checked={headerButtons.showMultiWindow}
            onChange={(e) => {
              setHeaderButtons({ ...headerButtons, showMultiWindow: e.currentTarget.checked });
            }}
            size="sm"
          />
        </Group>

        <Group wrap="nowrap" justify="space-between" w="100%">
          <Group gap="xs">
            <IconLoader size={16} />
            <Text>{t("Show loading indicator")}</Text>
          </Group>
          <Switch
            checked={headerButtons.showLoading}
            onChange={(e) => {
              setHeaderButtons({ ...headerButtons, showLoading: e.currentTarget.checked });
            }}
            size="sm"
          />
        </Group>

        {headerButtons.showLoading && (
          <Group wrap="nowrap" justify="space-between" w="100%" pl="md">
            <Text size="sm" c="dimmed">{t("Loading indicator type")}</Text>
            <Select
              value={headerButtons.loadingIndicatorType}
              onChange={(value) => {
                setHeaderButtons({ 
                  ...headerButtons, 
                  loadingIndicatorType: value as "gray" | "loader" 
                });
              }}
              data={[
                { value: "gray", label: t("Gray overlay") },
                { value: "loader", label: t("Loading spinner") }
              ]}
              size="sm"
              w={140}
            />
          </Group>
        )}

        <Group wrap="nowrap" justify="space-between" w="100%">
          <Group gap="xs">
            <IconClick size={16} />
            <Text>{t("双击进入笔记")}</Text>
          </Group>
          <Switch
            checked={headerButtons.requireDoubleClickToEnterPage}
            onChange={(e) => {
              setHeaderButtons({ ...headerButtons, requireDoubleClickToEnterPage: e.currentTarget.checked });
            }}
            size="sm"
          />
        </Group>

      </Stack>
    </Modal>
  );
} 