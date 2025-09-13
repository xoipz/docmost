import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';

export interface MindMapOptions {
  HTMLAttributes: Record<string, any>;
  view: any;
}

export interface MindMapAttributes {
  src?: string;
  title?: string;
  size?: number;
  width?: string;
  align?: string;
  attachmentId?: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mindmap: {
      setMindMap: (attributes?: MindMapAttributes) => ReturnType;
    };
  }
}

export const MindMap = Node.create<MindMapOptions>({
  name: 'mindmap',
  inline: false,
  group: 'block',
  isolating: true,
  atom: true,
  defining: true,
  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      view: null,
    };
  },

  addAttributes() {
    return {
      src: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-src'),
        renderHTML: (attributes) => ({
          'data-src': attributes.src,
        }),
      },
      title: {
        default: undefined,
        parseHTML: (element) => element.getAttribute('data-title'),
        renderHTML: (attributes: MindMapAttributes) => ({
          'data-title': attributes.title,
        }),
      },
      width: {
        default: '100%',
        parseHTML: (element) => element.getAttribute('data-width'),
        renderHTML: (attributes: MindMapAttributes) => ({
          'data-width': attributes.width,
        }),
      },
      size: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-size'),
        renderHTML: (attributes: MindMapAttributes) => ({
          'data-size': attributes.size,
        }),
      },
      align: {
        default: 'center',
        parseHTML: (element) => element.getAttribute('data-align'),
        renderHTML: (attributes: MindMapAttributes) => ({
          'data-align': attributes.align,
        }),
      },
      attachmentId: {
        default: undefined,
        parseHTML: (element) => element.getAttribute('data-attachment-id'),
        renderHTML: (attributes: MindMapAttributes) => ({
          'data-attachment-id': attributes.attachmentId,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: `div[data-type="${this.name}"]`,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(
        { 'data-type': this.name },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      ['img', { src: HTMLAttributes['data-src'], alt: HTMLAttributes['data-title'], width: HTMLAttributes['data-width'] }],
    ];
  },

  addCommands() {
    return {
      setMindMap:
        (attrs: MindMapAttributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: 'mindmap',
            attrs: attrs,
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(this.options.view);
  },
});