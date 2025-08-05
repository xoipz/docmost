import classes from "@/components/settings/settings.module.css";
import { Text } from "@mantine/core";
import React from "react";
import { useTranslation } from "react-i18next";

export default function AppVersion() {
  const { t } = useTranslation();
  const buildTime = new Date(BUILD_TIME).toLocaleString();

  return (
    <div className={classes.text}>
      <Text size="sm" c="dimmed">
        v{APP_VERSION} - {t("Built at")}: {buildTime}
      </Text>
    </div>
  );
}
