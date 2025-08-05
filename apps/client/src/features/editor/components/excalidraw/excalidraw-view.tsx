import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import {
  ActionIcon,
  Button,
  Card,
  Group,
  Image,
  Text,
  useComputedColorScheme,
  Tooltip,
} from "@mantine/core";
import { useState, useEffect } from "react";
import { uploadFile } from "@/features/page/services/page-service.ts";
import { svgStringToFile } from "@/lib";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { getFileUrl } from "@/lib/config.ts";
import "@excalidraw/excalidraw/index.css";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { IAttachment } from "@/lib/types";
import ReactClearModal from "react-clear-modal";
import clsx from "clsx";
import { IconEdit, IconSun, IconMoon, IconMaximize, IconMinimize } from "@tabler/icons-react";
import { lazy } from "react";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { useHandleLibrary } from "@excalidraw/excalidraw";
import { localStorageLibraryAdapter } from "@/features/editor/components/excalidraw/excalidraw-utils.ts";

const Excalidraw = lazy(() =>
  import("@excalidraw/excalidraw").then((module) => ({
    default: module.Excalidraw,
  })),
);

export default function ExcalidrawView(props: NodeViewProps) {
  const { t } = useTranslation();
  const { node, updateAttributes, editor, selected } = props;
  const { src, title, width, attachmentId } = node.attrs;

  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI>(null);
  useHandleLibrary({
    excalidrawAPI,
    adapter: localStorageLibraryAdapter,
  });
  const [excalidrawData, setExcalidrawData] = useState<any>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const computedColorScheme = useComputedColorScheme();
  const [selectedTheme, setSelectedTheme] = useState<string>(computedColorScheme);
  const [isWebFullscreen, setIsWebFullscreen] = useState(true);

  const toggleTheme = () => {
    setSelectedTheme(selectedTheme === 'light' ? 'dark' : 'light');
  };

  const toggleWebFullscreen = () => {
    setIsWebFullscreen(!isWebFullscreen);
  };

  const handleExitWithConfirm = () => {
    modals.openConfirmModal({
      title: t('Exit without saving?'),
      children: t('Are you sure you want to exit without saving your changes? All unsaved changes will be lost.'),
      labels: { confirm: t('Exit'), cancel: t('Cancel') },
      confirmProps: { color: 'red' },
      onConfirm: close,
    });
  };

  const handleOpen = async () => {
    if (!editor.isEditable) {
      return;
    }

    try {
      if (src) {
        const url = getFileUrl(src);
        const request = await fetch(url, {
          credentials: "include",
          cache: "no-store",
        });

        const { loadFromBlob } = await import("@excalidraw/excalidraw");

        const data = await loadFromBlob(await request.blob(), null, null);
        setExcalidrawData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      open();
    }
  };

  const handleSave = async () => {
    if (!excalidrawAPI) {
      return;
    }

    const { exportToSvg } = await import("@excalidraw/excalidraw");

    const svg = await exportToSvg({
      elements: excalidrawAPI?.getSceneElements(),
      appState: {
        exportEmbedScene: true,
        exportWithDarkMode: false,
      },
      files: excalidrawAPI?.getFiles(),
    });

    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svg);

    svgString = svgString.replace(
      /https:\/\/unpkg\.com\/@excalidraw\/excalidraw@undefined/g,
      "https://unpkg.com/@excalidraw/excalidraw@latest",
    );

    const fileName = "diagram.excalidraw.svg";
    const excalidrawSvgFile = await svgStringToFile(svgString, fileName);

    const pageId = editor.storage?.pageId;

    let attachment: IAttachment = null;
    if (attachmentId) {
      attachment = await uploadFile(excalidrawSvgFile, pageId, attachmentId);
    } else {
      attachment = await uploadFile(excalidrawSvgFile, pageId);
    }

    updateAttributes({
      src: `/api/files/${attachment.id}/${attachment.fileName}?t=${new Date(attachment.updatedAt).getTime()}`,
      title: attachment.fileName,
      size: attachment.fileSize,
      attachmentId: attachment.id,
    });

    close();
  };

  return (
    <NodeViewWrapper>
      <ReactClearModal
        style={{
          backgroundColor: selectedTheme === 'dark' ? "rgba(0, 0, 0, 0.8)" : "rgba(0, 0, 0, 0.5)",
          padding: 0,
          zIndex: 200,
        }}
        isOpen={opened}
        onRequestClose={close}
        disableCloseOnBgClick={true}
        contentProps={{
          style: {
            padding: 0,
            width: isWebFullscreen ? "100vw" : "90vw",
            height: isWebFullscreen ? "100vh" : "auto",
            maxWidth: isWebFullscreen ? "none" : undefined,
            maxHeight: isWebFullscreen ? "none" : undefined,
            position: isWebFullscreen ? "fixed" : "relative",
            top: isWebFullscreen ? 0 : undefined,
            left: isWebFullscreen ? 0 : undefined,
            borderRadius: isWebFullscreen ? 0 : undefined,
            backgroundColor: selectedTheme === 'dark' ? '#1a1a1a' : '#ffffff',
            border: selectedTheme === 'dark' ? '1px solid #333333' : '1px solid #e0e0e0',
          },
        }}
      >
        <Group
          justify="space-between"
          wrap="nowrap"
          style={{
            backgroundColor: selectedTheme === 'dark' ? '#1a1a1a' : '#ffffff',
            borderBottom: selectedTheme === 'dark' ? '1px solid #333333' : '1px solid #e0e0e0',
          }}
          p="xs"
        >
          <Group wrap="nowrap">
            <Tooltip label={t('Toggle Theme')}>
              <ActionIcon
                onClick={toggleTheme}
                variant="light"
                size="sm"
              >
                {selectedTheme === 'light' ? <IconMoon size={16} /> : <IconSun size={16} />}
              </ActionIcon>
            </Tooltip>
            <Tooltip label={isWebFullscreen ? t('Exit Fullscreen') : t('Enter Fullscreen')}>
              <ActionIcon
                onClick={toggleWebFullscreen}
                variant="light"
                size="sm"
              >
                {isWebFullscreen ? <IconMinimize size={16} /> : <IconMaximize size={16} />}
              </ActionIcon>
            </Tooltip>
          </Group>
          <Group wrap="nowrap">
            <Button onClick={handleExitWithConfirm} color="red" size={"compact-sm"}>
              {t("Exit")}
            </Button>
            <Button onClick={handleSave} size={"compact-sm"}>
              {t("Save & Exit")}
            </Button>
          </Group>
        </Group>
        <div style={{ height: isWebFullscreen ? "calc(100vh - 60px)" : "90vh" }}>
          <Suspense fallback={null}>
            <Excalidraw
              excalidrawAPI={(api) => setExcalidrawAPI(api)}
              initialData={{
                ...excalidrawData,
                scrollToContent: true,
              }}
              theme={selectedTheme}
              langCode="zh-CN"
            />
          </Suspense>
        </div>
      </ReactClearModal>

      {src ? (
        <div style={{ position: "relative" }}>
          <Image
            onClick={(e) => e.detail === 2 && handleOpen()}
            radius="md"
            fit="contain"
            w={width}
            src={getFileUrl(src)}
            alt={title}
            className={clsx(
              selected ? "ProseMirror-selectednode" : "",
              "alignCenter",
            )}
          />

          {selected && editor.isEditable && (
            <ActionIcon
              onClick={handleOpen}
              variant="default"
              color="gray"
              mx="xs"
              style={{
                position: "absolute",
                top: 8,
                right: 8,
              }}
            >
              <IconEdit size={18} />
            </ActionIcon>
          )}
        </div>
      ) : (
        <Card
          radius="md"
          onClick={(e) => e.detail === 2 && handleOpen()}
          p="xs"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          withBorder
          className={clsx(selected ? "ProseMirror-selectednode" : "")}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <ActionIcon variant="transparent" color="gray">
              <IconEdit size={18} />
            </ActionIcon>

            <Text component="span" size="lg" c="dimmed">
              {t("Double-click to edit Excalidraw diagram")}
            </Text>
          </div>
        </Card>
      )}
    </NodeViewWrapper>
  );
}
