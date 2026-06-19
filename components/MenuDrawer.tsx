import { Button } from '@/components/Button';
import { AppText } from '@/components/Text';
import { useProvider } from '@/hooks/useProvider';
import { identitiesStore } from '@/stores/identities';
import { theme } from '@/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useStore } from '@tanstack/react-store';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import DrawerLayout, {
  DrawerLayoutMethods,
} from 'react-native-gesture-handler/ReanimatedDrawerLayout';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MenuDrawerHandle {
  openDrawer: () => void;
  closeDrawer: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const MenuDrawer = forwardRef<MenuDrawerHandle, { children: React.ReactNode }>(
  function MenuDrawer({ children }, ref) {
    const drawerRef = useRef<DrawerLayoutMethods>(null);
    const router = useRouter();
    const { key, account, identity, passkey, sessions } = useProvider();
    const identities = useStore(identitiesStore, (state) => state.identities);
    const activeIdentity = identities.length > 0 ? identities[0] : null;

    useImperativeHandle(ref, () => ({
      openDrawer: () => drawerRef.current?.openDrawer(),
      closeDrawer: () => drawerRef.current?.closeDrawer(),
    }));

    return (
      <DrawerLayout
        ref={drawerRef}
        drawerWidth={280}
        renderNavigationView={() => (
          <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left']}>
            <View style={styles.panel}>
              <View style={styles.header}>
                <AppText variant="h3" bold>
                  AC2 Controller
                </AppText>
              </View>

              <View style={styles.body}>
                {activeIdentity && (
                  <View style={styles.didCard}>
                    <AppText variant="label" style={styles.cardLabel}>
                      Controller DID
                    </AppText>
                    <View style={styles.didRow}>
                      <AppText style={styles.didText} numberOfLines={1} ellipsizeMode="middle">
                        {activeIdentity.did || 'No identity found'}
                      </AppText>
                      <Pressable
                        style={styles.copyButton}
                        onPress={async () => {
                          await Clipboard.setStringAsync(activeIdentity.did || '');
                          Alert.alert('Copied', 'DID copied to clipboard');
                        }}
                      >
                        <MaterialIcons
                          name="content-copy"
                          size={16}
                          color={theme.colors.fg.muted}
                        />
                      </Pressable>
                    </View>
                  </View>
                )}
                <View style={styles.menu}>
                  <Pressable
                    style={styles.menuItem}
                    onPress={() => {
                      drawerRef.current?.closeDrawer();
                      router.push('/connections');
                    }}
                  >
                    <MaterialIcons name="insights" size={20} color={theme.colors.fg.muted} />
                    <AppText variant="label">Diagnostics</AppText>
                    <AppText variant="label" style={styles.menuItemBadge}>
                      {sessions.length} connection{sessions.length === 1 ? '' : 's'}
                    </AppText>
                  </Pressable>
                </View>
              </View>

              <View style={styles.footer}>
                <Button
                  label="Reset Wallet"
                  variant="ghost"
                  color="error"
                  fullWidth
                  leftIcon={
                    <MaterialIcons name="lock-reset" size={20} color={theme.colors.fg.danger} />
                  }
                  onPress={() =>
                    Alert.alert(
                      'Reset Wallet',
                      'Are you sure you want to reset your wallet? This action cannot be undone.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Reset',
                          style: 'destructive',
                          onPress: async () => {
                            await key.store.clear();
                            await account.store.clear();
                            await identity.store.clear();
                            await passkey.store.clear();
                            router.replace('/onboarding');
                          },
                        },
                      ],
                    )
                  }
                />
              </View>
            </View>
          </SafeAreaView>
        )}
      >
        {children}
      </DrawerLayout>
    );
  },
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Transparent so the panel only fills the app window (within safe-area insets)
  // rather than bleeding behind the status bar / home indicator.
  safeArea: {
    flex: 1,
  },
  panel: {
    flex: 1,
    backgroundColor: theme.colors.bg.surface,
    paddingHorizontal: theme.spacing.base,
  },
  header: {
    paddingVertical: theme.spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.default,
    marginBottom: theme.spacing.md,
  },
  body: {
    flex: 1,
  },
  footer: {
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.default,
  },
  didCard: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.bg.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  cardLabel: {
    fontSize: 12,
    marginBottom: theme.spacing.sm,
    color: theme.colors.fg.muted,
  },
  didRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  didText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.fg.default,
    fontFamily: 'monospace',
  },
  copyButton: {
    padding: theme.spacing.xs,
  },
  menu: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  menuItemBadge: {
    marginLeft: 'auto',
    color: theme.colors.fg.muted,
  },
});
