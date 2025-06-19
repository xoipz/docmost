// adapted from: https://github.com/aguingand/tiptap-markdown/blob/main/src/extensions/tiptap/clipboard.js - MIT
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { DOMParser } from "@tiptap/pm/model";
import { find } from "linkifyjs";
import { markdownToHtml } from "@docmost/editor-ext";

// Helper function to clean paragraphs (remove trailing <br> and empty paragraphs)
function cleanParagraph(p: HTMLParagraphElement): HTMLParagraphElement | null {
    if (!p) return null;
    while (p.lastChild && p.lastChild.nodeName === 'BR') {
        p.removeChild(p.lastChild);
    }
    // If paragraph is empty after cleaning BRs, or only contains whitespace text nodes
    let isEmpty = true;
    if (p.childNodes.length > 0) {
        for (const child of Array.from(p.childNodes)) {
            if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim() !== '') {
                isEmpty = false;
                break;
            }
            if (child.nodeType === Node.ELEMENT_NODE && child.nodeName !== 'BR') {
                isEmpty = false;
                break;
            }
        }
    }
    return isEmpty ? null : p;
}

// Pre-processes HTML to lift block images out of paragraphs
function preprocessHtmlForBlockImages(htmlString: string): string {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;
    const newNodesContainer = document.createElement('div');

    Array.from(tempDiv.childNodes).forEach(childNode => { // Iterate over top-level nodes (e.g., <p>)
        if (childNode.nodeName === 'P') {
            const pElement = childNode as HTMLParagraphElement;
            let currentSegmentP = document.createElement('p');

            Array.from(pElement.childNodes).forEach(innerNode => { // Iterate over children of the <p>
                if (innerNode.nodeName === 'IMG') { // Check for images (could be extended to other block elements)
                    const cleanedSegmentP = cleanParagraph(currentSegmentP);
                    if (cleanedSegmentP && cleanedSegmentP.childNodes.length > 0) {
                        newNodesContainer.appendChild(cleanedSegmentP);
                    }
                    newNodesContainer.appendChild(innerNode.cloneNode(true)); // Add the image itself
                    currentSegmentP = document.createElement('p'); // Reset paragraph for content after the image
                } else {
                    currentSegmentP.appendChild(innerNode.cloneNode(true));
                }
            });

            // Add any remaining content in the last segment paragraph
            const finalCleanedSegmentP = cleanParagraph(currentSegmentP);
            if (finalCleanedSegmentP && finalCleanedSegmentP.childNodes.length > 0) {
                newNodesContainer.appendChild(finalCleanedSegmentP);
            }
        } else { // If the top-level node is not a paragraph (e.g., already a standalone image or table)
            newNodesContainer.appendChild(childNode.cloneNode(true));
        }
    });
    return newNodesContainer.innerHTML;
}

export const MarkdownClipboard = Extension.create({
  name: "markdownClipboard",
  priority: 101,

  addOptions() {
    return {
      transformPastedText: false,
    };
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("markdownClipboard"),
        props: {
          handlePaste: (view, event, slice) => {
            if (!event.clipboardData) {
              return false;
            }

            const isActiveCodeBlock = this.editor.isActive("codeBlock");
            if (isActiveCodeBlock) {
              return false;
            }

            const text = event.clipboardData.getData("text/plain");
            const vscode = event.clipboardData.getData("vscode-editor-data");
            const vscodeData = vscode ? JSON.parse(vscode) : undefined;
            const language = vscodeData?.mode;

            if (language !== "markdown") {
              return false;
            }

            const { tr } = view.state;
            const { from, to } = view.state.selection;

            const rawHtml = markdownToHtml(text) as string; // Assuming sync result based on usage
            const processedHtml = preprocessHtmlForBlockImages(rawHtml);

            const domParser = DOMParser.fromSchema(this.editor.schema);
            const element = elementFromString(processedHtml);

            const contentNodes = domParser.parseSlice(element, {
              preserveWhitespace: true,
            });

            tr.replaceRange(from, to, contentNodes);
            tr.setMeta('paste', true)
            view.dispatch(tr);
            return true;
          },
          clipboardTextParser: (text, context, plainText) => {
            const link = find(text, {
              defaultProtocol: "http",
            }).find((item) => item.isLink && item.value === text);

            if (plainText || !this.options.transformPastedText || link) {
              return null;
            }

            // Also apply preprocessing to clipboardTextParser if it handles markdown-to-html
            const rawParsedHtml = markdownToHtml(text) as string;
            const processedParsedHtml = preprocessHtmlForBlockImages(rawParsedHtml);

            return DOMParser.fromSchema(this.editor.schema).parseSlice(
              elementFromString(processedParsedHtml),
              {
                preserveWhitespace: true,
                context,
              },
            );
          },
        },
      }),
    ];
  },
});

function elementFromString(value) {
  // add a wrapper to preserve leading and trailing whitespace
  const wrappedValue = `<body>${value}</body>`;

  return new window.DOMParser().parseFromString(wrappedValue, "text/html").body;
}
