import {
  BubbleMenu as BaseBubbleMenu,
  findParentNode,
  posToDOMRect,
  isNodeSelection,
} from "@tiptap/react";
import React, { useCallback, useState, useEffect } from "react";
import { sticky } from "tippy.js";
import { Node as PMNode } from "prosemirror-model";
import {
  EditorMenuProps,
  ShouldShowProps,
} from "@/features/editor/components/table/types/types.ts";
import { ActionIcon, Tooltip, TextInput, Group, Button, Stack } from "@mantine/core";
import {
  IconLayoutAlignCenter,
  IconLayoutAlignLeft,
  IconLayoutAlignRight,
  IconCheck,
} from "@tabler/icons-react";
import { NodeWidthResize } from "@/features/editor/components/common/node-width-resize.tsx";
import { useTranslation } from "react-i18next";

export function ImageMenu({ editor }: EditorMenuProps) {
  const { t } = useTranslation();
  const [imageUrl, setImageUrl] = useState("");

  const shouldShow = useCallback(
    ({ state }: ShouldShowProps) => {
      if (!state) {
        return false;
      }
      const { selection } = state;
      if (isNodeSelection(selection) && selection.node.type.name === "image") {
        return true;
      }
      return editor.isActive("image");
    },
    [editor],
  );

  useEffect(() => {
    if (editor.isActive("image")) {
      const currentSrc = editor.getAttributes("image").src;
      setImageUrl(currentSrc || "");
    }
  }, [editor, editor.state.selection]);

  const getReferenceClientRect = useCallback(() => {
    const { selection } = editor.state;
    const predicate = (node: PMNode) => node.type.name === "image";
    const parent = findParentNode(predicate)(selection);
    if (parent) {
      const dom = editor.view.nodeDOM(parent?.pos) as HTMLElement;
      return dom.getBoundingClientRect();
    }
    return posToDOMRect(editor.view, selection.from, selection.to);
  }, [editor]);

  const alignImageLeft = useCallback(() => { editor.chain().focus(undefined, { scrollIntoView: false }).setImageAlign("left").run(); }, [editor]);
  const alignImageCenter = useCallback(() => { editor.chain().focus(undefined, { scrollIntoView: false }).setImageAlign("center").run(); }, [editor]);
  const alignImageRight = useCallback(() => { editor.chain().focus(undefined, { scrollIntoView: false }).setImageAlign("right").run(); }, [editor]);
  const onWidthChange = useCallback((value: number) => { editor.chain().focus(undefined, { scrollIntoView: false }).setImageWidth(value).run(); }, [editor]);

  const handleUpdateImageUrl = useCallback(() => {
    editor.chain().focus(undefined, { scrollIntoView: false }).updateAttributes("image", { src: imageUrl }).run();
  }, [editor, imageUrl]);

  if (!editor.isEditable) {
    return null;
  }

  return (
    <BaseBubbleMenu
      editor={editor}
      pluginKey={`image-menu`}
      updateDelay={0}
      tippyOptions={{
        getReferenceClientRect,
        offset: [0, 8],
        zIndex: 99,
        popperOptions: {
          modifiers: [{ name: "flip", enabled: false }],
        },
        plugins: [sticky],
        sticky: "popper",
      }}
      shouldShow={shouldShow}
    >
      <Stack gap="xs" p="xs" style={{ background: 'var(--mantine-color-body)', borderRadius: 'var(--mantine-radius-sm)', boxShadow: 'var(--mantine-shadow-md)' }}>
        <Group wrap="nowrap" gap="xs" style={{ width: '100%' }}>
          <TextInput
            size="xs"
            placeholder={t("Enter image URL")}
            value={imageUrl}
            onChange={(event) => setImageUrl(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleUpdateImageUrl();
              }
            }}
            style={{ flexGrow: 1, minWidth: '150px' }}
          />
          <Tooltip position="top" label={t("Update image URL")}>
            <ActionIcon onClick={handleUpdateImageUrl} size="lg" variant="default" aria-label={t("Update image URL")}>
              <IconCheck size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>

        <Group wrap="nowrap" gap="xs">
          <ActionIcon.Group>
            <Tooltip position="top" label={t("Align left")}>
              <ActionIcon onClick={alignImageLeft} size="lg" variant={editor.isActive("image", { align: "left" }) ? "light" : "default"} aria-label={t("Align left")}>
                <IconLayoutAlignLeft size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip position="top" label={t("Align center")}>
              <ActionIcon onClick={alignImageCenter} size="lg" variant={editor.isActive("image", { align: "center" }) ? "light" : "default"} aria-label={t("Align center")}>
                <IconLayoutAlignCenter size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip position="top" label={t("Align right")}>
              <ActionIcon onClick={alignImageRight} size="lg" variant={editor.isActive("image", { align: "right" }) ? "light" : "default"} aria-label={t("Align right")}>
                <IconLayoutAlignRight size={18} />
              </ActionIcon>
            </Tooltip>
          </ActionIcon.Group>

          {editor.getAttributes("image")?.width != null && (
            <NodeWidthResize onChange={onWidthChange} value={parseInt(editor.getAttributes("image").width as string || "100")} />
          )}
        </Group>
      </Stack>
    </BaseBubbleMenu>
  );
}

export default ImageMenu;
