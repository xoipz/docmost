import "@/features/editor/styles/index.css";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
import {
  tabActionsAtom,
  multiWindowTabsAtom,
} from "@/features/editor/atoms/multi-window-atoms";
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
import SearchAndReplaceDialog from "@/features/editor/components/search-and-replace/search-and-replace-dialog.tsx";
import { useDebouncedCallback, useDocumentVisibility } from "@mantine/hooks";
import { useIdle } from "@/hooks/use-idle.ts";
import { queryClient } from "@/main.tsx";
import { IPage } from "@/features/page/types/page.types.ts";
import { useParams } from "react-router-dom";
import { extractPageSlugId } from "@/lib";
import { FIVE_MINUTES } from "@/lib/constants.ts";
import { PageEditMode } from "@/features/user/types/user.types.ts";
import { jwtDecode } from "jwt-decode";
import { TextSelection } from "@tiptap/pm/state";
import { pageHeaderButtonsAtom } from "@/features/page/atoms/page-header-atoms";
import { QuickInputBar } from "./components/quick-input-bar/quick-input-bar";
import { MultiWindowTabs } from "./components/multi-window-tabs/multi-window-tabs";
import {
  globalBottomToolbarAtom,
  syncBottomToolbarAtom,
} from "./atoms/bottom-toolbar-atoms";
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
  const ydocRef = useRef<Y.Doc | null>(null);
  if (!ydocRef.current) {
    ydocRef.current = new Y.Doc();
  }
  const ydoc = ydocRef.current;
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
  const [keyboardShortcutsStatus, setKeyboardShortcutsStatus] = useAtom(
    keyboardShortcutsStatusAtom,
  );
  const [, dispatchTabAction] = useAtom(tabActionsAtom);
  const tabs = useAtomValue(multiWindowTabsAtom);
  const isMountedRef = useRef(false);
  const userPageEditMode =
    currentUser?.user?.settings?.preferences?.pageEditMode ?? PageEditMode.Edit;

  useEffect(() => {
    isMountedRef.current = true;

    setShowLoadingState(true);
    setIsCollabReady(false);

    const maxLoadingTimeout = setTimeout(() => {
      if (isMountedRef.current) {
        setShowLoadingState(false);
      }
    }, 3000);

    return () => {
      isMountedRef.current = false;
      clearTimeout(maxLoadingTimeout);
    };
  }, [pageId]);

  useEffect(() => {
    const syncTimeout = setTimeout(() => {
      syncBottomToolbar({
        showMultiWindow: headerButtons.showMultiWindow,
        showQuickInputBar: headerButtons.showQuickInputBar,
      });
    }, 0);

    return () => clearTimeout(syncTimeout);
  }, [
    headerButtons.showMultiWindow,
    headerButtons.showQuickInputBar,
    syncBottomToolbar,
  ]);

  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const currentPageId = slugId || pageSlug;
        if (currentPageId) {
          const currentTab = tabs.find((tab) => tab.id === currentPageId);
          if (currentTab && currentTab.isActive) {
            const scrollY = window.scrollY;
            dispatchTabAction({
              type: "UPDATE_SCROLL_POSITION",
              payload: { tabId: currentPageId, scrollPosition: scrollY },
            });
          }
        }
      }, 100);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [slugId, pageSlug, dispatchTabAction, tabs]);

  const providersRef = useRef<{
    local: IndexeddbPersistence;
    remote: HocuspocusProvider;
  } | null>(null);
  const [providersReady, setProvidersReady] = useState(false);

  const remoteProvider = providersRef.current?.remote;

  const [collabReady, setCollabReady] = useState(false);
  useEffect(() => {
    if (
      remoteProvider?.status === WebSocketStatus.Connected &&
      isLocalSynced &&
      isRemoteSynced
    ) {
      setCollabReady(true);
    }
  }, [remoteProvider?.status, isLocalSynced, isRemoteSynced]);

  useEffect(() => {
    if (!providersRef.current) {
      const local = new IndexeddbPersistence(documentName, ydoc);
      local.on("synced", () => {
        if (isMountedRef.current) {
          setLocalSynced(true);
        }
      });
      const remote = new HocuspocusProvider({
        name: documentName,
        url: collaborationURL,
        document: ydoc,
        token: collabQuery?.token,
        connect: true,
        preserveConnection: false,
        onAuthenticationFailed: (auth: onAuthenticationFailedParameters) => {
          const payload = jwtDecode(collabQuery?.token);
          const now = Date.now().valueOf() / 1000;
          const isTokenExpired = now >= payload.exp;
          if (isTokenExpired) {
            refetchCollabToken().then((result) => {
              if (result.data?.token) {
                remote.disconnect();
                setTimeout(() => {
                  remote.configuration.token = result.data.token;
                  remote.connect();
                }, 100);
              }
            });
          }
        },
        onStatus: (status) => {
          if (status.status === "connected") {
            if (isMountedRef.current) {
              setYjsConnectionStatus(status.status);
            }
          }
        },
      });
      remote.on("synced", () => {
        if (isMountedRef.current) {
          setRemoteSynced(true);
        }
      });
      remote.on("disconnect", () => {
        if (isMountedRef.current) {
          setYjsConnectionStatus(WebSocketStatus.Disconnected);
        }
      });
      providersRef.current = { local, remote };
      setProvidersReady(true);
    } else {
      setProvidersReady(true);
    }
    return () => {
      providersRef.current?.remote.destroy();
      providersRef.current?.local.destroy();
      providersRef.current = null;
    };
  }, [pageId]);

  useEffect(() => {
    if (!providersReady || !providersRef.current) return;
    const remoteProvider = providersRef.current.remote;
    if (
      isIdle &&
      documentState === "hidden" &&
      remoteProvider.status === WebSocketStatus.Connected
    ) {
      remoteProvider.disconnect();
      setIsCollabReady(false);
      return;
    }
    if (
      documentState === "visible" &&
      remoteProvider.status === WebSocketStatus.Disconnected
    ) {
      resetIdle();
      remoteProvider.connect();
      setTimeout(() => setIsCollabReady(true), 500);
    }
  }, [isIdle, documentState, providersReady, resetIdle]);

  const extensions = useMemo(() => {
    if (!remoteProvider || !currentUser?.user) return mainExtensions;
    return [
      ...mainExtensions,
      ...collabExtensions(remoteProvider, currentUser?.user),
    ];
  }, [remoteProvider, currentUser?.user]);

  const editor = useEditor(
    {
      extensions,
      editable,
      immediatelyRender: true,
      shouldRerenderOnTransaction: true,
      editorProps: {
        scrollThreshold: 80,
        scrollMargin: 80,
        handleDOMEvents: {
          keydown: (_view, event) => {
            setKeyboardShortcutsStatus((prev) => ({
              ...prev,
              lastActivity: Date.now(),
            }));

            if (
              (event.ctrlKey || event.metaKey) &&
              (event.key === "s" || event.key === "t")
            ) {
              event.preventDefault();
              setKeyboardShortcutsStatus((prev) => ({ ...prev, enabled: true }));
              return true;
            }

            if ((event.ctrlKey || event.metaKey) && event.key === "x") {
              const { state } = _view;
              const { selection } = state;
              const { empty, $from } = selection;

              if (empty) {
                const node = $from.node();
                if (node && node.textContent.trim() === "") {
                  const tr = state.tr;
                  tr.delete($from.before(), $from.after());
                  _view.dispatch(tr);
                  setKeyboardShortcutsStatus((prev) => ({
                    ...prev,
                    enabled: true,
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
            return false;
          },
        },
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
        debouncedUpdateContent(editorJson);
      },
    },
    [pageId, editable, remoteProvider],
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
    setAsideState((prev) => ({ ...prev, tab: "", isAsideOpen: false }));
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
        }
      }
    }, 500);
    return () => clearTimeout(collabReadyTimeout);
  }, [
    isRemoteSynced,
    isLocalSynced,
    remoteProvider?.status,
    isCollabReady,
    isSynced,
  ]);

  useEffect(() => {
    if (!showLoadingState) return;

    const shouldCloseLoading =
      isCollabReady ||
      (editor && isLocalSynced) ||
      (isLocalSynced && isRemoteSynced);

    if (shouldCloseLoading) {
      const closeTimeout = setTimeout(() => {
        if (isMountedRef.current) {
          setShowLoadingState(false);
        }
      }, 200);

      return () => clearTimeout(closeTimeout);
    }
  }, [showLoadingState, isCollabReady, editor, isLocalSynced, isRemoteSynced]);

  useEffect(() => {
    if (editor) {
      if (userPageEditMode && editable) {
        if (userPageEditMode === PageEditMode.Edit) {
          editor.setEditable(true);
        } else if (userPageEditMode === PageEditMode.Read) {
          editor.setEditable(false);
        }
      } else {
        editor.setEditable(false);
      }
    }
  }, [userPageEditMode, editor, editable]);

  return (
    <div>
      {headerButtons.showLoading && showLoadingState && (
        <Center
          py="xl"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1000,
          }}
        >
          <Loader size="md" />
        </Center>
      )}

      {isCollabReady ? (
        <div
          style={{
            opacity: headerButtons.showLoading && showLoadingState ? 0.3 : 1,
            transition: "opacity 0.2s ease-in-out",
          }}
        >
          <div ref={menuContainerRef}>
            <EditorContent editor={editor} />

            {editor && (
              <SearchAndReplaceDialog editor={editor} editable={editable} />
            )}

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

            {showCommentPopup && (
              <CommentDialog editor={editor} pageId={pageId} />
            )}
          </div>

          <div
            onClick={() => {
              if (editor) {
                editor.commands.focus("end");
                const { state } = editor.view;
                const { tr } = state;
                tr.setSelection(
                  TextSelection.create(state.doc, state.doc.content.size),
                );
                editor.view.dispatch(tr);
              }
            }}
            style={{ paddingBottom: "20vh" }}
          ></div>
        </div>
      ) : (
        <Box
          style={{
            opacity:
              headerButtons.showLoading && showLoadingState ? 0.3 : 0.6,
            transition: "opacity 0.2s ease-in-out",
          }}
        >
          <EditorProvider
            editable={false}
            immediatelyRender={true}
            extensions={mainExtensions}
            content={content}
          ></EditorProvider>
        </Box>
      )}

      <div>
        {bottomToolbar.showMultiWindow && <MultiWindowTabs />}
        {bottomToolbar.showQuickInputBar && <QuickInputBar />}
      </div>
    </div>
  );
}