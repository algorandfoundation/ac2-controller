import { Button } from '@/components/Button';
import { ChatRow, ChatThread } from '@/components/ChatRow';
import { MenuDrawer, MenuDrawerHandle } from '@/components/MenuDrawer';
import { AppText } from '@/components/Text';
import { WarningBanner } from '@/components/WarningBanner';
import { messagesStore } from '@/stores/messages';
import { sessionsStore, type Session } from '@/stores/sessions';
import { palette, theme } from '@/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useStore } from '@tanstack/react-store';
import { Stack, useRouter } from 'expo-router';
import React, { useMemo, useRef } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ServiceSecretKeyVaultModal } from '@/components/ServiceSecretKeyVaultModal';
// dummy required actions for demo purposes
const REQUIRED_ACTIONS = ['Backup Mnemonic'];

// Avatar color pairs cycled deterministically per connection so a given agent
// keeps a stable look across renders. Drawn from the shared palette.
const AVATAR_COLORS: { color: string; bg: string }[] = [
  { color: palette.blue[500], bg: palette.blue[100] },
  { color: palette.green[500], bg: '#e6f4ea' },
  { color: palette.red[500], bg: '#fce8e6' },
  { color: palette.indigo[500], bg: palette.indigo[50] },
  { color: palette.yellow[500], bg: palette.yellow[100] },
];

/** Stable avatar palette pick from a connection origin. */
function avatarFor(origin: string): { color: string; bg: string } {
  let hash = 0;
  for (let i = 0; i < origin.length; i++) hash = (hash * 31 + origin.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/** Human-friendly host label from a connection origin. */
function hostFromOrigin(origin: string): string {
  try {
    return new URL(origin).host;
  } catch {
    return origin.replace(/^https?:\/\//, '');
  }
}

/** Relative "time ago" label for the most recent activity on a connection. */
function formatRelative(ms: number): string {
  if (!ms) return '';
  const diff = Date.now() - ms;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

/** Fallback preview text for a connection that has no chat messages yet. */
function statusPreview(status: Session['status']): string {
  switch (status) {
    case 'active':
      return 'Connected · no messages yet';
    case 'failed':
      return 'Connection failed';
    default:
      return 'Disconnected · tap to reconnect';
  }
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function LandingScreen() {
  const hasRequiredActions = REQUIRED_ACTIONS.length > 0;
  const drawerRef = useRef<MenuDrawerHandle>(null);
  const vaultModalRef = useRef<BottomSheetModal>(null);
  const connectNewAgentModalRef = useRef<BottomSheetModal>(null);

  const router = useRouter();

  const sessions = useStore(sessionsStore, (state) => state.sessions);
  const messages = useStore(messagesStore, (state) => state.messages);

  // One chat row per persisted connection, most recently active first. The
  // preview is the connection's latest chat message (falling back to a status
  // line) and the timestamp tracks last activity.
  const chats = useMemo(() => {
    return [...sessions]
      .sort((a, b) => b.lastActivity - a.lastActivity)
      .map((session) => {
        const lastMessage = messages
          .filter((m) => m.origin === session.origin && m.requestId === session.id && m.text.trim())
          .sort((a, b) => b.timestamp - a.timestamp)[0];
        const { color, bg } = avatarFor(session.origin);
        const thread: ChatThread = {
          id: `${session.origin}-${session.id}`,
          name: hostFromOrigin(session.origin),
          preview: lastMessage?.text ?? statusPreview(session.status),
          timestamp: formatRelative(session.lastActivity),
          avatarColor: color,
          avatarBg: bg,
        };
        return { session, thread };
      });
  }, [sessions, messages]);

  return (
    <MenuDrawer ref={drawerRef}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />

        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <Pressable style={styles.menuButton} onPress={() => drawerRef.current?.openDrawer()}>
              <MaterialIcons name="menu" size={22} color={theme.colors.fg.inverse} />
            </Pressable>

            <AppText variant="h3" color="inverse" bold>
              AC2 Controller
            </AppText>
          </View>

          <View style={styles.actions}>
            <Button
              label="Vault"
              onPress={() => vaultModalRef.current?.present()}
              variant="white"
              size="sm"
              leftIcon={<MaterialIcons name="key" size={16} color={theme.colors.fg.onLight} />}
              style={styles.topActionButton}
            />

            <Button
              label="New"
              onPress={() => router.navigate('/scan')}
              variant="pill"
              size="sm"
              color="primary"
              leftIcon={<MaterialIcons name="add" size={16} color={theme.colors.fg.inverse} />}
              style={styles.topActionButton}
            />
          </View>
        </View>

        {hasRequiredActions ? <WarningBanner message="Action Required: Backup Mnemonic" /> : null}

        <FlatList
          data={chats}
          keyExtractor={(item) => item.thread.id}
          renderItem={({ item }) => (
            <ChatRow
              item={item.thread}
              onPress={() =>
                router.navigate({
                  pathname: '/chat',
                  params: { origin: item.session.origin, requestId: item.session.id },
                })
              }
            />
          )}
          contentContainerStyle={chats.length === 0 ? styles.emptyContent : styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="forum" size={40} color={theme.colors.fg.muted} />
              <AppText variant="label" color="muted" style={styles.emptyText}>
                No chats available yet
              </AppText>
              <AppText variant="caption" color="muted" style={styles.emptySubtext}>
                Pair with an agent to start a conversation.
              </AppText>
            </View>
          }
        />

        <ServiceSecretKeyVaultModal
          ref={vaultModalRef}
          onDismiss={() => vaultModalRef.current?.dismiss()}
        />
      </SafeAreaView>
    </MenuDrawer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg.app,
  },
  topBar: {
    minHeight: 64,
    backgroundColor: theme.colors.bg.header,
    paddingLeft: theme.spacing.sm,
    paddingRight: theme.spacing.base,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  topActionButton: {
    height: 36,
    paddingHorizontal: theme.spacing.md,
    minWidth: 84,
  },
  listContent: {
    paddingBottom: theme.spacing.sm,
  },
  emptyContent: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
});
