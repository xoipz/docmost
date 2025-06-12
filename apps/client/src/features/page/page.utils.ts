import slugify from "@sindresorhus/slugify";
import { getExportUrl } from "@/lib/config.ts";

const buildPageSlug = (pageSlugId: string, pageTitle?: string): string => {
  const titleSlug = slugify(pageTitle?.substring(0, 70) || "untitled", {
    customReplacements: [
      ["♥", ""],
      ["🦄", ""],
    ],
  });

  return `${titleSlug}-${pageSlugId}`;
};

export const buildPageUrl = (
  spaceName: string,
  pageSlugId: string,
  pageTitle?: string,
): string => {
  if (spaceName === undefined) {
    return `/p/${buildPageSlug(pageSlugId, pageTitle)}`;
  }
  return `/s/${spaceName}/p/${buildPageSlug(pageSlugId, pageTitle)}`;
};

export const buildSharedPageUrl = (opts: {
  shareId: string;
  pageSlugId: string;
  pageTitle?: string;
}): string => {
  const { shareId, pageSlugId, pageTitle } = opts;
  if (!shareId) {
    console.log(`${getExportUrl()}/share/p/${buildPageSlug(pageSlugId, pageTitle)}`)
    return `${getExportUrl()}/share/p/${buildPageSlug(pageSlugId, pageTitle)}`;
  }

  return `${getExportUrl()}/share/${shareId}/p/${buildPageSlug(pageSlugId, pageTitle)}`;
};
