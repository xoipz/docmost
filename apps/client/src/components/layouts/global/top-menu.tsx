import {
  Group,
  Menu,
  UnstyledButton,
  Text,
  useMantineColorScheme,
  Box,
} from "@mantine/core";
import {
  IconBrightnessFilled,
  IconBrush,
  IconCheck,
  IconChevronDown,
  IconDeviceDesktop,
  IconLayoutNavbar,
  IconLogout,
  IconMoon,
  IconSettings,
  IconSun,
  IconUserCircle,
  IconUsers,
} from "@tabler/icons-react";
import { useAtom } from "jotai";
import { currentUserAtom } from "@/features/user/atoms/current-user-atom.ts";
import { Link } from "react-router-dom";
import APP_ROUTE from "@/lib/app-route.ts";
import useAuth from "@/features/auth/hooks/use-auth.ts";
import { CustomAvatar } from "@/components/ui/custom-avatar.tsx";
import { useTranslation } from "react-i18next";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import PageHeaderSettingsModal from "@/features/page/components/header/page-header-settings-modal.tsx";

export default function TopMenu() {
  const { t } = useTranslation();
  const [currentUser] = useAtom(currentUserAtom);
  const { logout } = useAuth();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const [
    settingsOpened,
    { open: openSettingsModal, close: closeSettingsModal },
  ] = useDisclosure(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const user = currentUser?.user;
  const workspace = currentUser?.workspace;

  if (!user || !workspace) {
    return <></>;
  }

  // TAG:App-Header:修改头像和工作区部分
  return (
    <>
      <Menu width={250} position="bottom-end" withArrow shadow={"lg"}>
        <Menu.Target>
          <UnstyledButton>
            <Group gap={7} wrap={"nowrap"}>
              <CustomAvatar
                avatarUrl={user?.avatarUrl}
                name={user?.name}
                variant="filled"
                size="sm"
              />
              {!isMobile && (
                <>
                  <Text fw={500} size="sm" mr={3} lineClamp={1}>
                    {user?.name}
                  </Text>
                  <Box>
                    <IconChevronDown size={16} />
                  </Box>
                </>
              )}
            </Group>
          </UnstyledButton>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>
            <Group wrap={"nowrap"}>
              <div style={{ width: 240 }}>
                <Text size="sm" fw={500} lineClamp={1}>
                  {workspace.name} {t("Workspace")}
                </Text>
              </div>
            </Group>
          </Menu.Label>

          <Menu.Item
            component={Link}
            to={APP_ROUTE.SETTINGS.WORKSPACE.GENERAL}
            leftSection={<IconSettings size={16} />}
          >
            {t("Workspace settings")}
          </Menu.Item>

          <Menu.Item
            component={Link}
            to={APP_ROUTE.SETTINGS.WORKSPACE.MEMBERS}
            leftSection={<IconUsers size={16} />}
          >
            {t("Manage members")}
          </Menu.Item>

          <Menu.Divider />

          <Menu.Label>{t("Account")}</Menu.Label>
          <Menu.Item component={Link} to={APP_ROUTE.SETTINGS.ACCOUNT.PROFILE}>
            <Group wrap={"nowrap"}>
              <CustomAvatar
                size={"sm"}
                avatarUrl={user.avatarUrl}
                name={user.name}
              />

              <div style={{ width: 190 }}>
                <Text size="sm" fw={500} lineClamp={1}>
                  {user.name}
                </Text>
                <Text size="xs" c="dimmed" truncate="end">
                  {user.email}
                </Text>
              </div>
            </Group>
          </Menu.Item>
          <Menu.Item
            component={Link}
            to={APP_ROUTE.SETTINGS.ACCOUNT.PROFILE}
            leftSection={<IconUserCircle size={16} />}
          >
            {t("My profile")}
          </Menu.Item>

          <Menu.Item
            component={Link}
            to={APP_ROUTE.SETTINGS.ACCOUNT.PREFERENCES}
            leftSection={<IconBrush size={16} />}
          >
            {t("My preferences")}
          </Menu.Item>

          <Menu.Item
            leftSection={<IconLayoutNavbar size={16} />}
            onClick={openSettingsModal}
          >
            {t("笔记顶栏设置")}
          </Menu.Item>

          <Menu.Sub>
            <Menu.Sub.Target>
              <Menu.Item leftSection={<IconBrightnessFilled size={16} />}>
                {t("Theme")}
              </Menu.Item>
            </Menu.Sub.Target>

            <Menu.Sub.Dropdown>
              <Menu.Item
                onClick={() => setColorScheme("light")}
                leftSection={<IconSun size={16} />}
                rightSection={
                  colorScheme === "light" ? <IconCheck size={16} /> : null
                }
              >
                {t("Light")}
              </Menu.Item>
              <Menu.Item
                onClick={() => setColorScheme("dark")}
                leftSection={<IconMoon size={16} />}
                rightSection={
                  colorScheme === "dark" ? <IconCheck size={16} /> : null
                }
              >
                {t("Dark")}
              </Menu.Item>
              <Menu.Item
                onClick={() => setColorScheme("auto")}
                leftSection={<IconDeviceDesktop size={16} />}
                rightSection={
                  colorScheme === "auto" ? <IconCheck size={16} /> : null
                }
              >
                {t("System settings")}
              </Menu.Item>
            </Menu.Sub.Dropdown>
          </Menu.Sub>

          <Menu.Divider />

          <Menu.Item onClick={logout} leftSection={<IconLogout size={16} />}>
            {t("Logout")}
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>

      <PageHeaderSettingsModal
        opened={settingsOpened}
        onClose={closeSettingsModal}
      />
    </>
  );
}
