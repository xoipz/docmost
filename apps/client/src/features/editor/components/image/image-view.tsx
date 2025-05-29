import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { useMemo } from "react";
import { Image, Box } from "@mantine/core";
import { getFileUrl } from "@/lib/config.ts";
import clsx from "clsx";

export default function ImageView(props: NodeViewProps) {
  const { node, editor, selected } = props;
  const { src, width, align, title, alt } = node.attrs;

  const alignClass = useMemo(() => {
    if (align === "left") return "alignLeft";
    if (align === "right") return "alignRight";
    if (align === "center") return "alignCenter";
    return "alignCenter";
  }, [align]);

  return (
    <NodeViewWrapper data-drag-handle>
      <Image
        radius="md"
        fit="contain"
        w={width}
        src={getFileUrl(src)}
        alt={alt || title}
        className={clsx(selected ? "ProseMirror-selectednode" : "", alignClass)}
        style={{ cursor: editor.isEditable ? "pointer" : "default" }}
      />
    </NodeViewWrapper>
  );
}
