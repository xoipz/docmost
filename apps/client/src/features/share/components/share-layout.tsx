import { Outlet } from "react-router-dom";
import ShareShell from "@/features/share/components/share-shell.tsx";
import { useEffect } from "react";
import i18n from "../../../i18n";

export default function ShareLayout() {
  useEffect(() => {
    // 获取浏览器语言
    const browserLang = navigator.language;
    // 检测语言并设置
    const supportedLanguages = ["zh-CN", "en-US", "de-DE", "fr-FR", "ja-JP", "ko-KR", "nl-NL", "pt-BR", "ru-RU", "es-ES", "it-IT"];
    const langPrefix = browserLang.split("-")[0].toLowerCase();
    
    // 查找匹配的语言
    let matchedLang = "en-US"; // 默认英语
    
    // 先尝试完全匹配
    if (supportedLanguages.includes(browserLang)) {
      matchedLang = browserLang;
    } else {
      // 尝试前缀匹配
      for (const lang of supportedLanguages) {
        if (lang.toLowerCase().startsWith(langPrefix)) {
          matchedLang = lang;
          break;
        }
      }
    }
    
    // 设置语言
    i18n.changeLanguage(matchedLang);
  }, []);

  return (
    <ShareShell>
      <Outlet />
    </ShareShell>
  );
}
