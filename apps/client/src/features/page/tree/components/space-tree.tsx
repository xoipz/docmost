import { NodeApi, NodeRendererProps, Tree, TreeApi } from "react-arborist";
import { atom, useAtom } from "jotai";
import { treeApiAtom } from "@/features/page/tree/atoms/tree-api-atom.ts";
import {
  fetchAncestorChildren,
  useGetRootSidebarPagesQuery,
  usePageQuery,
  useUpdatePageMutation,
} from "@/features/page/queries/page-query.ts";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import classes from "@/features/page/tree/styles/tree.module.css";
import { ActionIcon, Box, Menu, rem } from "@mantine/core";
import {
  IconArrowRight,
  IconChevronDown,
  IconChevronRight,
  IconCopy,
  IconDotsVertical,
  IconFileDescription,
  IconFileExport,
  IconLink,
  IconPlus,
  IconPointFilled,
  IconTrash,
  IconExternalLink,
} from "@tabler/icons-react";
import { treeDataAtom } from "@/features/page/tree/atoms/tree-data-atom.ts";
import clsx from "clsx";
import EmojiPicker from "@/components/ui/emoji-picker.tsx";
import { useTreeMutation } from "@/features/page/tree/hooks/use-tree-mutation.ts";
import {
  appendNodeChildren,
  buildTree,
  buildTreeWithChildren,
  updateTreeNodeIcon,
} from "@/features/page/tree/utils/utils.ts";
import { SpaceTreeNode } from "@/features/page/tree/types.ts";
import {
  getPageBreadcrumbs,
  getPageById,
  getSidebarPages,
} from "@/features/page/services/page-service.ts";
import { IPage, SidebarPagesParams } from "@/features/page/types/page.types.ts";
import { queryClient } from "@/main.tsx";
import { OpenMap } from "react-arborist/dist/main/state/open-slice";
import {
  useClipboard,
  useDisclosure,
  useElementSize,
  useMergedRef,
} from "@mantine/hooks";
import { dfs } from "react-arborist/dist/module/utils";
import { useQueryEmit } from "@/features/websocket/use-query-emit.ts";
import { buildPageUrl } from "@/features/page/page.utils.ts";
import { notifications } from "@mantine/notifications";
import { getAppUrl } from "@/lib/config.ts";
import { extractPageSlugId } from "@/lib";
import { useDeletePageModal } from "@/features/page/hooks/use-delete-page-modal.tsx";
import { useTranslation } from "react-i18next";
import ExportModal from "@/components/common/export-modal";
import MovePageModal from "../../components/move-page-modal.tsx";
import { mobileSidebarAtom } from "@/components/layouts/global/hooks/atoms/sidebar-atom.ts";
import { useToggleSidebar } from "@/components/layouts/global/hooks/hooks/use-toggle-sidebar.ts";
import CopyPageModal from "../../components/copy-page-modal.tsx";

interface SpaceTreeProps {
  spaceId: string;
  readOnly: boolean;
}

const openTreeNodesAtom = atom<OpenMap>({});

export default function SpaceTree({ spaceId, readOnly }: SpaceTreeProps) {
  const { pageSlug } = useParams();
  const { data, setData, controllers } =
    useTreeMutation<TreeApi<SpaceTreeNode>>(spaceId);
  const {
    data: pagesData,
    hasNextPage,
    fetchNextPage,
    isFetching,
  } = useGetRootSidebarPagesQuery({
    spaceId,
  });
  const [, setTreeApi] = useAtom<TreeApi<SpaceTreeNode>>(treeApiAtom);
  const treeApiRef = useRef<TreeApi<SpaceTreeNode>>();
  const [openTreeNodes, setOpenTreeNodes] = useAtom<OpenMap>(openTreeNodesAtom);
  const rootElement = useRef<HTMLDivElement>();
  const { ref: sizeRef, width, height } = useElementSize();
  const mergedRef = useMergedRef(rootElement, sizeRef);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const { data: currentPage } = usePageQuery({
    pageId: extractPageSlugId(pageSlug),
  });

  useEffect(() => {
    if (hasNextPage && !isFetching) {
      fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage, isFetching, spaceId]);

  useEffect(() => {
    if (pagesData?.pages && !hasNextPage) {
      const allItems = pagesData.pages.flatMap((page) => page.items);
      const treeData = buildTree(allItems);

      if (data.length < 1 || data?.[0].spaceId !== spaceId) {
        //Thoughts
        // don't reset if there is data in state
        // we only expect to call this once on initial load
        // even if we decide to refetch, it should only update
        // and append root pages instead of resetting the entire tree
        // which looses async loaded children too
        setData(treeData);
        setIsDataLoaded(true);
        setOpenTreeNodes({});
      }
    }
  }, [pagesData, hasNextPage]);

  useEffect(() => {
    const fetchData = async () => {
      if (isDataLoaded && currentPage) {
        // check if pageId node is present in the tree
        const node = dfs(treeApiRef.current?.root, currentPage.id);
        if (node) {
          // if node is found, no need to traverse its ancestors
          return;
        }

        // if not found, fetch and build its ancestors and their children
        if (!currentPage.id) return;
        const ancestors = await getPageBreadcrumbs(currentPage.id);

        if (ancestors && ancestors?.length > 1) {
          let flatTreeItems = [...buildTree(ancestors)];

          const fetchAndUpdateChildren = async (ancestor: IPage) => {
            // we don't want to fetch the children of the opened page
            if (ancestor.id === currentPage.id) {
              return;
            }
            const children = await fetchAncestorChildren({
              pageId: ancestor.id,
              spaceId: ancestor.spaceId,
            });

            flatTreeItems = [
              ...flatTreeItems,
              ...children.filter(
                (child) => !flatTreeItems.some((item) => item.id === child.id),
              ),
            ];
          };

          const fetchPromises = ancestors.map((ancestor) =>
            fetchAndUpdateChildren(ancestor),
          );

          // Wait for all fetch operations to complete
          Promise.all(fetchPromises).then(() => {
            // build tree with children
            const ancestorsTree = buildTreeWithChildren(flatTreeItems);
            // child of root page we're attaching the built ancestors to
            const rootChild = ancestorsTree[0];

            // attach built ancestors to tree
            const updatedTree = appendNodeChildren(
              data,
              rootChild.id,
              rootChild.children,
            );
            setData(updatedTree);

            setTimeout(() => {
              // focus on node and open all parents
              treeApiRef.current.select(currentPage.id);
            }, 100);
          });
        }
      }
    };

    fetchData();
  }, [isDataLoaded, currentPage?.id]);

  useEffect(() => {
    if (currentPage?.id) {
      setTimeout(() => {
        // focus on node and open all parents
        treeApiRef.current?.select(currentPage.id, { align: "auto" });
      }, 200);
    } else {
      treeApiRef.current?.deselectAll();
    }
  }, [currentPage?.id]);

  useEffect(() => {
    if (treeApiRef.current) {
      // @ts-ignore
      setTreeApi(treeApiRef.current);
    }
  }, [treeApiRef.current]);

  return (
    <div ref={mergedRef} className={classes.treeContainer}>
      {rootElement.current && (
        <Tree
          data={data.filter((node) => node?.spaceId === spaceId)}
          disableDrag={readOnly}
          disableDrop={readOnly}
          disableEdit={readOnly}
          {...controllers}
          width={width}
          height={rootElement.current.clientHeight}
          ref={treeApiRef}
          openByDefault={false}
          disableMultiSelection={true}
          className={classes.tree}
          rowClassName={classes.row}
          rowHeight={30}
          overscanCount={10}
          dndRootElement={rootElement.current}
          onToggle={() => {
            setOpenTreeNodes(treeApiRef.current?.openState);
          }}
          initialOpenState={openTreeNodes}
        >
          {Node}
        </Tree>
      )}
    </div>
  );
}

function Node({ node, style, dragHandle, tree }: NodeRendererProps<any>) {
  const { t } = useTranslation();
  const updatePageMutation = useUpdatePageMutation();
  const [treeData, setTreeData] = useAtom(treeDataAtom);
  const emit = useQueryEmit();
  const { spaceSlug } = useParams();
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const [menuOpened, { open: openMenu, close: closeMenu }] = useDisclosure(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [mobileSidebarOpened] = useAtom(mobileSidebarAtom);
  const toggleMobileSidebar = useToggleSidebar(mobileSidebarAtom);

  const prefetchPage = () => {
    timerRef.current = setTimeout(() => {
      queryClient.prefetchQuery({
        queryKey: ["pages", node.data.slugId],
        queryFn: () => getPageById({ pageId: node.data.slugId }),
        staleTime: 5 * 60 * 1000,
      });
    }, 150);
  };

  const cancelPagePrefetch = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  async function handleLoadChildren(node: NodeApi<SpaceTreeNode>) {
    if (!node.data.hasChildren) return;
    if (node.data.children && node.data.children.length > 0) {
      return;
    }

    try {
      const params: SidebarPagesParams = {
        pageId: node.data.id,
        spaceId: node.data.spaceId,
      };

      const newChildren = await queryClient.fetchQuery({
        queryKey: ["sidebar-pages", params],
        queryFn: () => getSidebarPages(params),
        staleTime: 10 * 60 * 1000,
      });

      const childrenTree = buildTree(newChildren.items);

      const updatedTreeData = appendNodeChildren(
        treeData,
        node.data.id,
        childrenTree,
      );

      setTreeData(updatedTreeData);
    } catch (error) {
      console.error("Failed to fetch children:", error);
    }
  }

  const handleClick = () => {
    // 如果节点有子节点，且当前未展开，则展开子节点
    if ((node.children.length > 0 || node.data.hasChildren) && node.isClosed) {
      node.toggle();
      handleLoadChildren(node);
    }
    
    // 导航到页面
    const pageUrl = buildPageUrl(spaceSlug, node.data.slugId, node.data.name);
    navigate(pageUrl);
  };

  const handleUpdateNodeIcon = (nodeId: string, newIcon: string) => {
    const updatedTree = updateTreeNodeIcon(treeData, nodeId, newIcon);
    setTreeData(updatedTree);
  };

  const handleEmojiIconClick = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleEmojiSelect = (emoji: { native: string }) => {
    handleUpdateNodeIcon(node.id, emoji.native);
    updatePageMutation.mutateAsync({ pageId: node.id, icon: emoji.native });

    setTimeout(() => {
      emit({
        operation: "updateOne",
        spaceId: node.data.spaceId,
        entity: ["pages"],
        id: node.id,
        payload: { icon: emoji.native },
      });
    }, 50);
  };

  const handleRemoveEmoji = () => {
    handleUpdateNodeIcon(node.id, null);
    updatePageMutation.mutateAsync({ pageId: node.id, icon: null });

    setTimeout(() => {
      emit({
        operation: "updateOne",
        spaceId: node.data.spaceId,
        entity: ["pages"],
        id: node.id,
        payload: { icon: null },
      });
    }, 50);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuPosition({ x: e.clientX, y: e.clientY });
    openMenu();
  };

  const handleMenuButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({ x: rect.right, y: rect.top });
    openMenu();
  };

  if (
    node.willReceiveDrop &&
    node.isClosed &&
    (node.children.length > 0 || node.data.hasChildren)
  ) {
    handleLoadChildren(node);
    setTimeout(() => {
      if (node.state.willReceiveDrop) {
        node.open();
      }
    }, 650);
  }

  const pageUrl = buildPageUrl(spaceSlug, node.data.slugId, node.data.name);

  return (
    <>
      <Box
        style={style}
        className={clsx(classes.node, node.state)}
        component={Link}
        to={pageUrl}
        // @ts-ignore
        ref={dragHandle}
        onClick={(e) => {
          e.preventDefault();
          handleClick();
          // if (mobileSidebarOpened) {
          //   toggleMobileSidebar();
          // }
        }}
        onMouseEnter={prefetchPage}
        onMouseLeave={cancelPagePrefetch}
        onContextMenu={handleContextMenu}
      >
        <PageArrow node={node} onExpandTree={() => handleLoadChildren(node)} />

        <div onClick={handleEmojiIconClick} style={{ marginRight: "4px" }}>
          <EmojiPicker
            onEmojiSelect={handleEmojiSelect}
            icon={
              node.data.icon ? (
                node.data.icon
              ) : (
                <IconFileDescription size="18" />
              )
            }
            readOnly={tree.props.disableEdit as boolean}
            removeEmojiAction={handleRemoveEmoji}
          />
        </div>

        <span className={classes.text}>{node.data.name || t("untitled")}</span>

        <div className={classes.actions}>
          <NodeMenu 
            node={node} 
            treeApi={tree} 
            opened={menuOpened}
            onClose={closeMenu}
            position={menuPosition}
            onMenuButtonClick={handleMenuButtonClick}
            onExpandTree={() => handleLoadChildren(node)}
          />

          {!tree.props.disableEdit && (
            <CreateNode
              node={node}
              treeApi={tree}
              onExpandTree={() => handleLoadChildren(node)}
            />
          )}
        </div>
      </Box>
    </>
  );
}

interface CreateNodeProps {
  node: NodeApi<SpaceTreeNode>;
  treeApi: TreeApi<SpaceTreeNode>;
  onExpandTree?: () => void;
}

function CreateNode({ node, treeApi, onExpandTree }: CreateNodeProps) {
  function handleCreate() {
    if (node.data.hasChildren && node.children.length === 0) {
      node.toggle();
      onExpandTree();

      setTimeout(() => {
        treeApi?.create({ type: "internal", parentId: node.id, index: 0 });
      }, 500);
    } else {
      treeApi?.create({ type: "internal", parentId: node.id });
    }
  }

  return (
    <ActionIcon
      variant="transparent"
      c="gray"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleCreate();
      }}
    >
      <IconPlus style={{ width: rem(20), height: rem(20) }} stroke={2} />
    </ActionIcon>
  );
}

interface NodeMenuProps {
  node: NodeApi<SpaceTreeNode>;
  treeApi: TreeApi<SpaceTreeNode>;
  opened: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  onMenuButtonClick: (e: React.MouseEvent) => void;
  onExpandTree?: () => void;
}

function NodeMenu({ node, treeApi, opened, onClose, position, onMenuButtonClick, onExpandTree }: NodeMenuProps): JSX.Element {
  const { t } = useTranslation();
  const clipboard = useClipboard({ timeout: 500 });
  const { spaceSlug } = useParams();
  const { openDeleteModal } = useDeletePageModal();
  const [exportOpened, { open: openExportModal, close: closeExportModal }] =
    useDisclosure(false);
  const [
    movePageModalOpened,
    { open: openMovePageModal, close: closeMoveSpaceModal },
  ] = useDisclosure(false);
  const [
    copyPageModalOpened,
    { open: openCopyPageModal, close: closeCopySpaceModal },
  ] = useDisclosure(false);

  const handleCopyLink = () => {
    const pageUrl =
      getAppUrl() + buildPageUrl(spaceSlug, node.data.slugId, node.data.name);
    
    // 检查clipboard API是否可用
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(pageUrl)
        .then(() => {
          notifications.show({ message: t("Link copied") });
        })
        .catch((error) => {
          console.error("复制失败:", error);
          fallbackCopyTextToClipboard(pageUrl);
        });
    } else {
      // 使用fallback方法
      fallbackCopyTextToClipboard(pageUrl);
    }
  };

  // Fallback方法：通过创建临时textarea元素来复制文本
  const fallbackCopyTextToClipboard = (text: string) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      
      // 避免滚动到底部
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      
      if (successful) {
        notifications.show({ message: t("Link copied") });
      } else {
        notifications.show({ message: t("Failed to copy link"), color: "red" });
      }
    } catch (err) {
      console.error("回退复制方法失败:", err);
      notifications.show({ message: t("Failed to copy link"), color: "red" });
    }
  };

  const menuItems = (
    <>
      <Menu.Item
        leftSection={<IconExternalLink size={16} />}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const pageUrl = buildPageUrl(spaceSlug, node.data.slugId, node.data.name);
          window.open(pageUrl, '_blank');
          onClose();
        }}
      >
        {t("在新页面打开")}
      </Menu.Item>

      <Menu.Item
        leftSection={<IconPlus size={16} />}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (node.data.hasChildren && node.children.length === 0) {
            node.toggle();
            onExpandTree?.();
            setTimeout(() => {
              treeApi?.create({ type: "internal", parentId: node.id, index: 0 });
            }, 500);
          } else {
            treeApi?.create({ type: "internal", parentId: node.id });
          }
          onClose();
        }}
      >
        {t("新建文件")}
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        leftSection={<IconLink size={16} />}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleCopyLink();
          onClose();
        }}
      >
        {t("Copy link")}
      </Menu.Item>

      <Menu.Item
        leftSection={<IconFileExport size={16} />}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          openExportModal();
          onClose();
        }}
      >
        {t("Export page")}
      </Menu.Item>

      {!(treeApi.props.disableEdit as boolean) && (
        <>
          <Menu.Item
            leftSection={<IconArrowRight size={16} />}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openMovePageModal();
              onClose();
            }}
          >
            {t("Move")}
          </Menu.Item>

          <Menu.Item
            leftSection={<IconCopy size={16} />}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openCopyPageModal();
              onClose();
            }}
          >
            {t("Copy")}
          </Menu.Item>

          <Menu.Divider />
          <Menu.Item
            c="red"
            leftSection={<IconTrash size={16} />}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openDeleteModal({ onConfirm: () => treeApi?.delete(node) });
              onClose();
            }}
          >
            {t("Delete")}
          </Menu.Item>
        </>
      )}
    </>
  );

  return (
    <>
      <Menu 
        shadow="md" 
        width={200}
        opened={opened}
        onChange={(isOpened) => {
          if (!isOpened) {
            onClose();
          }
        }}
        position="right-start"
        offset={0}
        closeOnItemClick
        withinPortal={true}
        zIndex={1000}
        styles={{
          dropdown: {
            maxHeight: "calc(100vh - 20px)",
            overflow: "auto",
            position: "fixed",
            left: position.x,
            top: Math.min(
              position.y,
              window.innerHeight - 240 // 确保至少有300px的空间显示菜单
            ),
          }
        }}
      >
        <Menu.Target>
          <ActionIcon
            variant="transparent"
            c="gray"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMenuButtonClick(e);
            }}
          >
            <IconDotsVertical
              style={{ width: rem(20), height: rem(20) }}
              stroke={2}
            />
          </ActionIcon>
        </Menu.Target>

        <Menu.Dropdown>
          {menuItems}
        </Menu.Dropdown>
      </Menu>

      <MovePageModal
        pageId={node.id}
        slugId={node.data.slugId}
        currentSpaceSlug={spaceSlug}
        onClose={closeMoveSpaceModal}
        open={movePageModalOpened}
      />

      <CopyPageModal
        pageId={node.id}
        currentSpaceSlug={spaceSlug}
        onClose={closeCopySpaceModal}
        open={copyPageModalOpened}
      />

      <ExportModal
        type="page"
        id={node.id}
        open={exportOpened}
        onClose={closeExportModal}
      />
    </>
  );
}

interface PageArrowProps {
  node: NodeApi<SpaceTreeNode>;
  onExpandTree?: () => void;
}

function PageArrow({ node, onExpandTree }: PageArrowProps): JSX.Element {
  return (
    <ActionIcon
      size={20}
      variant="subtle"
      c="gray"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        node.toggle();
        onExpandTree?.();
      }}
    >
      {node.isInternal ? (
        node.children && (node.children.length > 0 || node.data.hasChildren) ? (
          node.isOpen ? (
            <IconChevronDown stroke={2} size={18} />
          ) : (
            <IconChevronRight stroke={2} size={18} />
          )
        ) : (
          <IconPointFilled size={8} />
        )
      ) : null}
    </ActionIcon>
  );
}
