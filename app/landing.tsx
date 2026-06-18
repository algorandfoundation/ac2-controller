import { Button } from '@/components/Button';
import { ChatRow } from '@/components/ChatRow';
import { MenuDrawer, MenuDrawerHandle } from '@/components/MenuDrawer';
import { AppText } from '@/components/Text';
import { WarningBanner } from '@/components/WarningBanner';
import { theme } from '@/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Stack, useRouter } from 'expo-router';
import React, { useRef } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// mock chat threads to display demo
import { mockChatThreads } from '@/__fixtures__/chat-threads';
import { ServiceSecretKeyVaultModal } from '@/components/ServiceSecretKeyVaultModal';
// dummy required actions for demo purposes
const REQUIRED_ACTIONS = ['Backup Mnemonic'];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function LandingScreen() {
  const hasRequiredActions = REQUIRED_ACTIONS.length > 0;
  const drawerRef = useRef<MenuDrawerHandle>(null);
  const vaultModalRef = useRef<BottomSheetModal>(null);
  const connectNewAgentModalRef = useRef<BottomSheetModal>(null);

  const router = useRouter();

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
          data={mockChatThreads}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatRow
              item={item}
              onPress={(thread) =>
                Alert.alert(`Opening chat with ${thread.name}`, `Navigating to: ${thread.name}`)
              }
            />
          )}
          contentContainerStyle={styles.listContent}
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
});
