import {
  BubbleMenu,
  BubbleMenuProps,
  isNodeSelection,
  useEditor,
} from "@tiptap/react";
import { FC, useEffect, useRef, useState, useCallback } from "react";
import {
  IconBold,
  IconCode,
  IconItalic,
  IconStrikethrough,
  IconUnderline,
  IconMessage,
  IconCopy,
  IconH1,
  IconH2,
  IconH3,
  IconList,
  IconListNumbers,
  IconTypography,
} from "@tabler/icons-react";
import clsx from "clsx";
import classes from "./bubble-menu.module.css";
import { ActionIcon, rem, Tooltip } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { ColorSelector } from "./color-selector";
import { NodeSelector } from "./node-selector";
import { TextAlignmentSelector } from "./text-alignment-selector";
import {
  draftCommentIdAtom,
  showCommentPopupAtom,
} from "@/features/comment/atoms/comment-atom";
import { useAtom } from "jotai";
import { v7 as uuid7 } from "uuid";
import { isCellSelection, isTextSelected } from "@docmost/editor-ext";
import { LinkSelector } from "@/features/editor/components/bubble-menu/link-selector.tsx";
import { useTranslation } from "react-i18next";
import { EditorMenuProps } from "@/features/editor/components/table/types/types.ts";

export interface BubbleMenuItem {
  name: string;
  isActive: () => boolean;
  command: () => void;
  icon: typeof IconBold;
}

type EditorBubbleMenuProps = Omit<BubbleMenuProps, "children" | "editor"> & {
  editor: ReturnType<typeof useEditor>;
};

export const EditorBubbleMenu: FC<EditorBubbleMenuProps> = (props) => {
  const { t } = useTranslation();
  const [showCommentPopup, setShowCommentPopup] = useAtom(showCommentPopupAtom);
  const [, setDraftCommentId] = useAtom(draftCommentIdAtom);
  const showCommentPopupRef = useRef(showCommentPopup);

  useEffect(() => {
    showCommentPopupRef.current = showCommentPopup;
  }, [showCommentPopup]);

  const items: BubbleMenuItem[] = [
    {
      name: "Bold",
      isActive: () => props.editor.isActive("bold"),
      command: () => props.editor.chain().focus().toggleBold().run(),
      icon: IconBold,
    },
    {
      name: "Italic",
      isActive: () => props.editor.isActive("italic"),
      command: () => props.editor.chain().focus().toggleItalic().run(),
      icon: IconItalic,
    },
    {
      name: "Underline",
      isActive: () => props.editor.isActive("underline"),
      command: () => props.editor.chain().focus().toggleUnderline().run(),
      icon: IconUnderline,
    },
    {
      name: "Strike",
      isActive: () => props.editor.isActive("strike"),
      command: () => props.editor.chain().focus().toggleStrike().run(),
      icon: IconStrikethrough,
    },
    {
      name: "Code",
      isActive: () => props.editor.isActive("code"),
      command: () => props.editor.chain().focus().toggleCode().run(),
      icon: IconCode,
    },
  ];

  const commentItem: BubbleMenuItem = {
    name: "Comment",
    isActive: () => props.editor.isActive("comment"),
    command: () => {
      const commentId = uuid7();

      props.editor.chain().focus().setCommentDecoration().run();
      setDraftCommentId(commentId);
      setShowCommentPopup(true);
    },
    icon: IconMessage,
  };

  const bubbleMenuProps: EditorBubbleMenuProps = {
    ...props,
    shouldShow: ({ state, editor }) => {
      const { selection } = state;
      const { empty } = selection;

      if (
        !editor.isEditable ||
        editor.isActive("image") ||
        empty ||
        isNodeSelection(selection) ||
        isCellSelection(selection) ||
        showCommentPopupRef?.current
      ) {
        return false;
      }
      return isTextSelected(editor);
    },
    tippyOptions: {
      moveTransition: "transform 0.15s ease-out",
      onHide: () => {
        setIsNodeSelectorOpen(false);
        setIsTextAlignmentOpen(false);
        setIsColorSelectorOpen(false);
        setIsLinkSelectorOpen(false);
      },
    },
  };

  const [isNodeSelectorOpen, setIsNodeSelectorOpen] = useState(false);
  const [isTextAlignmentSelectorOpen, setIsTextAlignmentOpen] = useState(false);
  const [isColorSelectorOpen, setIsColorSelectorOpen] = useState(false);
  const [isLinkSelectorOpen, setIsLinkSelectorOpen] = useState(false);

  const handleCopy = useCallback(() => {
    const { state, view } = props.editor;
    const { from, to } = state.selection;
    
    // 获取选中范围内的所有节点
    const nodes = [];
    state.doc.nodesBetween(from, to, (node) => {
      if (node.isText) {
        nodes.push(node.text);
      } else if (node.type.name === 'paragraph') {
        nodes.push('\n');
      }
      return true;
    });
    
    // 合并文本并保留换行
    const text = nodes.join('');
    
    navigator.clipboard.writeText(text).then(() => {
      showNotification({
        title: t("Success"),
        message: t("Text copied to clipboard"),
        color: "green",
        autoClose: 2000,
      });
    });
  }, [props.editor, t]);

  // TAG:BubbleMenu
  return (
    <BubbleMenu {...bubbleMenuProps}>
      <div className={classes.bubbleMenu}>
        <ActionIcon.Group>
          <Tooltip label={t("Copy")} openDelay={250} withArrow>
            <ActionIcon
              variant="default"
              size="lg"
              onClick={handleCopy}
            >
              <IconCopy size={18} />
            </ActionIcon>
          </Tooltip>

          <NodeSelector
            editor={props.editor}
            isOpen={isNodeSelectorOpen}
            setIsOpen={() => {
              setIsNodeSelectorOpen(!isNodeSelectorOpen);
              setIsTextAlignmentOpen(false);
              setIsColorSelectorOpen(false);
              setIsLinkSelectorOpen(false);
            }}
          />

          <TextAlignmentSelector
            editor={props.editor}
            isOpen={isTextAlignmentSelectorOpen}
            setIsOpen={() => {
              setIsTextAlignmentOpen(!isTextAlignmentSelectorOpen);
              setIsNodeSelectorOpen(false);
              setIsColorSelectorOpen(false);
              setIsLinkSelectorOpen(false);
            }}
          />

          <ActionIcon.Group>
            {items.map((item, index) => (
              <Tooltip key={index} label={t(item.name)} withArrow>
                <ActionIcon
                  key={index}
                  variant="default"
                  size="lg"
                  radius="0"
                  aria-label={t(item.name)}
                  className={clsx({ [classes.active]: item.isActive() })}
                  style={{ border: "none" }}
                  onClick={item.command}
                >
                  <item.icon style={{ width: rem(16) }} stroke={2} />
                </ActionIcon>
              </Tooltip>
            ))}
          </ActionIcon.Group>

          <LinkSelector
            editor={props.editor}
            isOpen={isLinkSelectorOpen}
            setIsOpen={() => {
              setIsLinkSelectorOpen(!isLinkSelectorOpen);
              setIsNodeSelectorOpen(false);
              setIsTextAlignmentOpen(false);
              setIsColorSelectorOpen(false);
            }}
          />

          <ColorSelector
            editor={props.editor}
            isOpen={isColorSelectorOpen}
            setIsOpen={() => {
              setIsColorSelectorOpen(!isColorSelectorOpen);
              setIsNodeSelectorOpen(false);
              setIsTextAlignmentOpen(false);
              setIsLinkSelectorOpen(false);
            }}
          />

          <ActionIcon
            variant="default"
            size="lg"
            radius="0"
            aria-label={t(commentItem.name)}
            style={{ border: "none" }}
            onClick={commentItem.command}
          >
            <IconMessage size={16} stroke={2} />
          </ActionIcon>
        </ActionIcon.Group>
      </div>
    </BubbleMenu>
  );
};
