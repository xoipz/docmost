import { useParams, useLocation } from "react-router-dom";
import { usePageQuery } from "@/features/page/queries/page-query";
import { FullEditor } from "@/features/editor/full-editor";
import HistoryModal from "@/features/page-history/components/history-modal";
import { Helmet } from "react-helmet-async";
import PageHeader from "@/features/page/components/header/page-header.tsx";
import { extractPageSlugId } from "@/lib";
import { useGetSpaceBySlugQuery } from "@/features/space/queries/space-query.ts";
import { useSpaceAbility } from "@/features/space/permissions/use-space-ability.ts";
import {
  SpaceCaslAction,
  SpaceCaslSubject,
} from "@/features/space/permissions/permissions.type.ts";
import { useTranslation } from "react-i18next";
import React, { useEffect } from "react";
import { mobileSidebarAtom } from "@/components/layouts/global/hooks/atoms/sidebar-atom.ts";
import { useToggleSidebar } from "@/components/layouts/global/hooks/hooks/use-toggle-sidebar.ts";
import { useAtom } from "jotai";

const MemoizedFullEditor = React.memo(FullEditor);
const MemoizedPageHeader = React.memo(PageHeader);
const MemoizedHistoryModal = React.memo(HistoryModal);

export default function Page() {
  const { t } = useTranslation();
  const { pageSlug } = useParams();
  const location = useLocation();
  const [mobileSidebarOpened] = useAtom(mobileSidebarAtom);
  const toggleMobileSidebar = useToggleSidebar(mobileSidebarAtom);
  
  const {
    data: page,
    isLoading,
    isError,
    error,
  } = usePageQuery({ pageId: extractPageSlugId(pageSlug) });
  const { data: space } = useGetSpaceBySlugQuery(page?.space?.slug);

  const spaceRules = space?.membership?.permissions;
  const spaceAbility = useSpaceAbility(spaceRules);

  // 检测是否是新创建的页面
  const isNewPage = location.state?.isNewPage === true || (page?.title === null || page?.title === "");
  
  // 如果是新页面且在移动端，关闭侧边栏
  useEffect(() => {
    if (isNewPage && mobileSidebarOpened && window.innerWidth < 768) {
      const timer = setTimeout(() => {
        toggleMobileSidebar();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isNewPage, mobileSidebarOpened, toggleMobileSidebar]);

  if (isLoading) {
    return <></>;
  }

  if (isError || !page) {
    if ([401, 403, 404].includes(error?.["status"])) {
      return <div>{t("Page not found")}</div>;
    }
    return <div>{t("Error fetching page data.")}</div>;
  }

  if (!space) {
    return <></>;
  }

  return (
    page && (
      <div>
        <Helmet>
          <title>{`${page?.icon || ""}  ${page?.title || t("untitled")}`}</title>
        </Helmet>

        <MemoizedPageHeader
          readOnly={spaceAbility.cannot(
            SpaceCaslAction.Manage,
            SpaceCaslSubject.Page,
          )}
        />

        <MemoizedFullEditor
          key={page.id}
          pageId={page.id}
          title={page.title}
          content={page.content}
          slugId={page.slugId}
          spaceSlug={page?.space?.slug}
          editable={spaceAbility.can(
            SpaceCaslAction.Manage,
            SpaceCaslSubject.Page,
          )}
          autoFocusTitle={isNewPage}
        />
        <MemoizedHistoryModal pageId={page.id} />
      </div>
    )
  );
}
