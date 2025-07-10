import "@/features/editor/styles/index.css";
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { IndexeddbPersistence } from "y-indexeddb";
import * as Y from "yjs";
import {
  HocuspocusProvider,
  onAuthenticationFailedParameters,
  WebSocketStatus,
} from "@hocuspocus/provider";
import { EditorContent, EditorProvider, useEditor } from "@tiptap/react";
import {
  collabExtensions,
  mainExtensions,
} from "@/features/editor/extensions/extensions";
import { useAtom, useAtomValue } from "jotai";
import useCollaborationUrl from "@/features/editor/hooks/use-collaboration-url";
import { currentUserAtom } from "@/features/user/atoms/current-user-atom";
import {
  pageEditorAtom,
  yjsConnectionStatusAtom,
  keyboardShortcutsStatusAtom,
} from "@/features/editor/atoms/editor-atoms";
import { asideStateAtom } from "@/components/layouts/global/hooks/atoms/sidebar-atom";
import { tabActionsAtom, multiWindowTabsAtom } from "@/features/editor/atoms/multi-window-atoms";
import {
  activeCommentIdAtom,
  showCommentPopupAtom,
} from "@/features/comment/atoms/comment-atom";
import CommentDialog from "@/features/comment/components/comment-dialog";
import { EditorBubbleMenu } from "@/features/editor/components/bubble-menu/bubble-menu";
import TableCellMenu from "@/features/editor/components/table/table-cell-menu.tsx";
import TableMenu from "@/features/editor/components/table/table-menu.tsx";
import ImageMenu from "@/features/editor/components/image/image-menu.tsx";
import CalloutMenu from "@/features/editor/components/callout/callout-menu.tsx";
import VideoMenu from "@/features/editor/components/video/video-menu.tsx";
import {
  handleFileDrop,
  handlePaste,
} from "@/features/editor/components/common/editor-paste-handler.tsx";
import LinkMenu from "@/features/editor/components/link/link-menu.tsx";
import ExcalidrawMenu from "./components/excalidraw/excalidraw-menu";
import DrawioMenu from "./components/drawio/drawio-menu";
import { useCollabToken } from "@/features/auth/queries/auth-query.tsx";
import { useDebouncedCallback, useDocumentVisibility } from "@mantine/hooks";
import { useIdle } from "@/hooks/use-idle.ts";
import { queryClient } from "@/main.tsx";
import { IPage } from "@/features/page/types/page.types.ts";
import { useParams } from "react-router-dom";
import { extractPageSlugId } from "@/lib";
import { FIVE_MINUTES } from "@/lib/constants.ts";
import { jwtDecode } from "jwt-decode";
import { TextSelection } from "@tiptap/pm/state";
import { pageHeaderButtonsAtom } from "@/features/page/atoms/page-header-atoms";
import { QuickInputBar } from "./components/quick-input-bar/quick-input-bar";
import { MultiWindowTabs } from "./components/multi-window-tabs/multi-window-tabs";
import { globalBottomToolbarAtom, syncBottomToolbarAtom } from "./atoms/bottom-toolbar-atoms";
import { Loader, Center, Box } from "@mantine/core";

interface PageEditorProps {
  pageId: string;
  editable: boolean;
  content: any;
}

export default function PageEditor({
  pageId,
  editable,
  content,
}: PageEditorProps) {
  const collaborationURL = useCollaborationUrl();
  const [currentUser] = useAtom(currentUserAtom);
  const [, setEditor] = useAtom(pageEditorAtom);
  const [, setAsideState] = useAtom(asideStateAtom);
  const [, setActiveCommentId] = useAtom(activeCommentIdAtom);
  const [showCommentPopup, setShowCommentPopup] = useAtom(showCommentPopupAtom);
  const ydoc = useMemo(() => new Y.Doc(), [pageId]);
  const [isLocalSynced, setLocalSynced] = useState(false);
  const [isRemoteSynced, setRemoteSynced] = useState(false);
  const [yjsConnectionStatus, setYjsConnectionStatus] = useAtom(
    yjsConnectionStatusAtom,
  );
  const menuContainerRef = useRef(null);
  const documentName = `page.${pageId}`;
  const { data: collabQuery, refetch: refetchCollabToken } = useCollabToken();
  const { isIdle, resetIdle } = useIdle(FIVE_MINUTES, { initialState: false });
  const documentState = useDocumentVisibility();
  const [isCollabReady, setIsCollabReady] = useState(false);
  const [showLoadingState, setShowLoadingState] = useState(true);
  const { pageSlug } = useParams();
  const slugId = extractPageSlugId(pageSlug);
  const headerButtons = useAtomValue(pageHeaderButtonsAtom);
  const bottomToolbar = useAtomValue(globalBottomToolbarAtom);
  const [, syncBottomToolbar] = useAtom(syncBottomToolbarAtom);
  const [keyboardShortcutsStatus, setKeyboardShortcutsStatus] = useAtom(keyboardShortcutsStatusAtom);
  const [, dispatchTabAction] = useAtom(tabActionsAtom);
  const tabs = useAtomValue(multiWindowTabsAtom);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    
    // 页面切换时显示加载状态
    setShowLoadingState(true);
    setIsCollabReady(false);
    
    // 设置最大加载时间，防止loading一直显示
    const maxLoadingTimeout = setTimeout(() => {
      if (isMountedRef.current) {
        setShowLoadingState(false);
      }
    }, 3000); // 最多3秒后强制隐藏loading
    
    return () => {
      isMountedRef.current = false;
      clearTimeout(maxLoadingTimeout);
    };
  }, [pageId]); // 当 pageId 变化时重置加载状态

  // 同步页面设置到全局底部工具栏状态 - 避免频繁更新导致闪烁
  useEffect(() => {
    // 使用 setTimeout 延迟同步，避免在页面切换时的闪烁
    const syncTimeout = setTimeout(() => {
      syncBottomToolbar({
        showMultiWindow: headerButtons.showMultiWindow,
        showQuickInputBar: headerButtons.showQuickInputBar,
      });
    }, 0);

    return () => clearTimeout(syncTimeout);
  }, [headerButtons.showMultiWindow, headerButtons.showQuickInputBar, syncBottomToolbar]);

  // 管理多窗口标签 - 移除自动添加逻辑
  // 现在只有用户点击"+"按钮才会添加当前页面到标签栏

  // 监听滚动位置变化，自动保存当前激活标签的滚动位置
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const currentPageId = slugId || pageSlug;
        if (currentPageId) {
          // 只有当前页面是激活标签时才保存滚动位置
          const currentTab = tabs.find(tab => tab.id === currentPageId);
          if (currentTab && currentTab.isActive) {
            const scrollY = window.scrollY;
            dispatchTabAction({
              type: "UPDATE_SCROLL_POSITION",
              payload: { tabId: currentPageId, scrollPosition: scrollY }
            });
          }
        }
      }, 100); // 防抖，避免过于频繁的更新
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [slugId, pageSlug, dispatchTabAction, tabs]);

  const localProvider = useMemo(() => {
    const provider = new IndexeddbPersistence(documentName, ydoc);

    provider.on("synced", () => {
      if (isMountedRef.current) {
        setLocalSynced(true);
      }
    });

    return provider;
  }, [pageId, ydoc]);

  const remoteProvider = useMemo(() => {
    const provider = new HocuspocusProvider({
      name: documentName,
      url: collaborationURL,
      document: ydoc,
      token: collabQuery?.token,
      connect: false,
      preserveConnection: false,
      onAuthenticationFailed: (auth: onAuthenticationFailedParameters) => {
        const payload = jwtDecode(collabQuery?.token);
        const now = Date.now().valueOf() / 1000;
        const isTokenExpired = now >= payload.exp;
        if (isTokenExpired) {
          refetchCollabToken();
        }
      },
      onStatus: (status) => {
        if (status.status === "connected") {
          if (isMountedRef.current) {
            setTimeout(() => {
              if (isMountedRef.current) {
                setYjsConnectionStatus(status.status);
              }
            }, 50);
          }
        }
      },
    });

    provider.on("synced", () => {
      if (isMountedRef.current) {
        setRemoteSynced(true);
      }
    });

    provider.on("disconnect", () => {
      if (isMountedRef.current) {
        setTimeout(() => {
          if (isMountedRef.current) {
            setYjsConnectionStatus(WebSocketStatus.Disconnected);
          }
        }, 50);
      }
    });

    return provider;
  }, [ydoc, pageId, collabQuery?.token]);

  useLayoutEffect(() => {
    const timeoutId = setTimeout(() => {
      remoteProvider.connect();
    });
    return () => {
      clearTimeout(timeoutId);
      setRemoteSynced(false);
      setLocalSynced(false);
      remoteProvider.destroy();
      localProvider.destroy();
    };
  }, [remoteProvider, localProvider]);

  const extensions = useMemo(() => {
    return [
      ...mainExtensions,
      ...collabExtensions(remoteProvider, currentUser?.user),
    ];
  }, [ydoc, pageId, remoteProvider, currentUser?.user]);

  const editor = useEditor(
    {
      extensions,
      editable,
      immediatelyRender: true,
      shouldRerenderOnTransaction: true,
      editorProps: {
        scrollThreshold: 80,
        scrollMargin: 80,
        handleDOMEvents: {},
        handlePaste: (view, event, slice) =>
          handlePaste(view, event, pageId, currentUser?.user.id),
        handleDrop: (view, event, _slice, moved) =>
          handleFileDrop(view, event, moved, pageId),
      },
      onCreate({ editor }) {
        if (editor) {
          // @ts-ignore
          setEditor(editor);
          editor.storage.pageId = pageId;
        }
      },
      onUpdate({ editor }) {
        if (editor.isEmpty) return;
        const editorJson = editor.getJSON();
        //update local page cache to reduce flickers
        debouncedUpdateContent(editorJson);
      },
    },
    [pageId, editable, remoteProvider?.status],
  );

  const debouncedUpdateContent = useDebouncedCallback((newContent: any) => {
    const pageData = queryClient.getQueryData<IPage>(["pages", slugId]);

    if (pageData) {
      queryClient.setQueryData(["pages", slugId], {
        ...pageData,
        content: newContent,
        updatedAt: new Date(),
      });
    }
  }, 3000);

  const handleActiveCommentEvent = (event) => {
    const { commentId } = event.detail;
    setActiveCommentId(commentId);
    setAsideState({ tab: "comments", isAsideOpen: true });

    //wait if aside is closed
    setTimeout(() => {
      const selector = `div[data-comment-id="${commentId}"]`;
      const commentElement = document.querySelector(selector);
      commentElement?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 400);
  };

  useEffect(() => {
    document.addEventListener("ACTIVE_COMMENT_EVENT", handleActiveCommentEvent);
    return () => {
      document.removeEventListener(
        "ACTIVE_COMMENT_EVENT",
        handleActiveCommentEvent,
      );
    };
  }, []);

  useEffect(() => {
    setActiveCommentId(null);
    setShowCommentPopup(false);
    // 只在需要时重置侧边栏，避免影响底部工具栏状态
    setAsideState(prev => ({ ...prev, tab: "", isAsideOpen: false }));
  }, [pageId]);

  useEffect(() => {
    if (remoteProvider?.status === WebSocketStatus.Connecting) {
      const timeout = setTimeout(() => {
        if (isMountedRef.current) {
          setYjsConnectionStatus(WebSocketStatus.Disconnected);
        }
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [remoteProvider?.status]);

  useEffect(() => {
    if (
      isIdle &&
      documentState === "hidden" &&
      remoteProvider?.status === WebSocketStatus.Connected
    ) {
      remoteProvider.disconnect();
      setIsCollabReady(false);
      return;
    }

    if (
      documentState === "visible" &&
      remoteProvider?.status === WebSocketStatus.Disconnected
    ) {
      resetIdle();
      remoteProvider.connect();
      setTimeout(() => {
        if (isMountedRef.current) {
          setIsCollabReady(true);
        }
      }, 600);
    }
  }, [isIdle, documentState, remoteProvider]);

  const isSynced = isLocalSynced && isRemoteSynced;

  useEffect(() => {
    const collabReadyTimeout = setTimeout(() => {
      if (
        !isCollabReady &&
        isSynced &&
        remoteProvider?.status === WebSocketStatus.Connected
      ) {
        if (isMountedRef.current) {
          setIsCollabReady(true);
          // loading关闭由上面的统一逻辑处理
        }
      }
    }, 500);
    return () => clearTimeout(collabReadyTimeout);
  }, [isRemoteSynced, isLocalSynced, remoteProvider?.status, isCollabReady, isSynced]);

  // 简化的loading关闭逻辑 - 多个条件任意一个满足就关闭
  useEffect(() => {
    if (!showLoadingState) return;

    const shouldCloseLoading = 
      isCollabReady || // 协作准备就绪
      (editor && isLocalSynced) || // 编辑器创建且本地同步完成
      (isLocalSynced && isRemoteSynced); // 本地和远程都同步完成

    if (shouldCloseLoading) {
      console.log('Loading关闭条件满足:', {
        isCollabReady,
        hasEditor: !!editor,
        isLocalSynced,
        isRemoteSynced
      });
      
      const closeTimeout = setTimeout(() => {
        if (isMountedRef.current) {
          setShowLoadingState(false);
          console.log('Loading已关闭');
        }
      }, 200); // 短暂延迟确保渲染稳定
      
      return () => clearTimeout(closeTimeout);
    }
  }, [showLoadingState, isCollabReady, editor, isLocalSynced, isRemoteSynced]);

  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // 更新快捷键活动状态
      setKeyboardShortcutsStatus(prev => ({
        ...prev,
        lastActivity: Date.now()
      }));

      if ((event.ctrlKey || event.metaKey) && (event.key === 's' || event.key === 't')) {
        event.preventDefault();
        // 检测快捷键是否生效
        setKeyboardShortcutsStatus(prev => ({
          ...prev,
          enabled: true
        }));
        return true;
      }

      if ((event.ctrlKey || event.metaKey) && event.key === 'x') {
        const { state } = editor;
        const { selection } = state;
        const { empty, $from } = selection;

        if (empty) {
          const node = $from.node();
          if (node && node.textContent.trim() === '') {
            const tr = state.tr;
            tr.delete($from.before(), $from.after());
            editor.view.dispatch(tr);
            // 检测快捷键是否生效
            setKeyboardShortcutsStatus(prev => ({
              ...prev,
              enabled: true
            }));
            return true;
          }
        }
      }

      if (["ArrowUp", "ArrowDown", "Enter"].includes(event.key)) {
        const slashCommand = document.querySelector("#slash-command");
        if (slashCommand) {
          return true;
        }
      }
      if (
        [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "Enter",
        ].includes(event.key)
      ) {
        const emojiCommand = document.querySelector("#emoji-command");
        if (emojiCommand) {
          return true;
        }
      }
    };

    // 设置一个定期检查的定时器，如果长时间没有快捷键活动响应，标记为禁用
    const shortcutCheckInterval = setInterval(() => {
      const { enabled, lastActivity } = keyboardShortcutsStatus;
      const now = Date.now();
      // 如果超过3秒没有快捷键活动，且当前状态为启用，则可能是失效了
      if (enabled && now - lastActivity > 3000) {
        // 尝试测试快捷键是否响应
        try {
          const testEvent = new KeyboardEvent('keydown', { 
            key: 's', 
            ctrlKey: true,
            bubbles: true
          });
          const handled = handleKeyDown(testEvent);
          // 如果没有正确处理，标记为禁用
          if (!handled) {
            setKeyboardShortcutsStatus(prev => ({
              ...prev,
              enabled: false
            }));
          }
        } catch (e) {
          console.error('快捷键测试失败', e);
          setKeyboardShortcutsStatus(prev => ({
            ...prev,
            enabled: false
          }));
        }
      }
    }, 5000);

    editor.view.dom.addEventListener('keydown', handleKeyDown);
    return () => {
      editor.view.dom.removeEventListener('keydown', handleKeyDown);
      clearInterval(shortcutCheckInterval);
    };
  }, [editor, keyboardShortcutsStatus]);

  // TAG:Page-editor
  return (
    <div>
      {headerButtons.showLoading && showLoadingState && (
        <Center py="xl" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000 }}>
          <Loader size="md" />
        </Center>
      )}
      
      {isCollabReady ? (
        <div style={{ opacity: (headerButtons.showLoading && showLoadingState) ? 0.3 : 1, transition: 'opacity 0.2s ease-in-out' }}>
          <div ref={menuContainerRef}>
            <EditorContent editor={editor} />

            {editor && editor.isEditable && (
              <div>
                <EditorBubbleMenu editor={editor} />
                <TableMenu editor={editor} />
                <TableCellMenu editor={editor} appendTo={menuContainerRef} />
                <ImageMenu editor={editor} />
                <VideoMenu editor={editor} />
                <CalloutMenu editor={editor} />
                <ExcalidrawMenu editor={editor} />
                <DrawioMenu editor={editor} />
                <LinkMenu editor={editor} appendTo={menuContainerRef} />
              </div>
            )}

            {showCommentPopup && <CommentDialog editor={editor} pageId={pageId} />}
          </div>

          <div
            onClick={() => {
              editor.commands.focus("end");
              // 确保光标在最后一个节点之后
              const { state } = editor.view;
              const { tr } = state;
              tr.setSelection(TextSelection.create(state.doc, state.doc.content.size));
              editor.view.dispatch(tr);
            }}
            style={{ paddingBottom: "20vh" }}
          ></div>
        </div>
      ) : (
        <Box style={{ opacity: (headerButtons.showLoading && showLoadingState) ? 0.3 : 0.6, transition: 'opacity 0.2s ease-in-out' }}>
          <EditorProvider
            editable={false}
            immediatelyRender={true}
            extensions={mainExtensions}
            content={content}
          ></EditorProvider>
        </Box>
      )}

      {/* 底部工具栏始终显示，保持一致性 */}
      <div>
        {bottomToolbar.showMultiWindow && <MultiWindowTabs />}
        {bottomToolbar.showQuickInputBar && <QuickInputBar />}
      </div>
    </div>
  );
}
