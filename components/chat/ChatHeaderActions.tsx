import { theme } from '@/theme';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

// ─── Component ────────────────────────────────────────────────────────────────

// Right-hand header controls for a connected conversation: a transient
// heartbeat pulse, a clear-history action, and a disconnect action. Rendered as
// the navigation header's `headerRight`.
export function ChatHeaderActions({
  isHeartbeatVisible,
  onClear,
  onDisconnect,
  onTrace,
}: {
  isHeartbeatVisible: boolean;
  onClear: () => void;
  onDisconnect: () => void;
  onTrace: () => void;
}) {
  return (
    <View style={styles.container}>
      {isHeartbeatVisible && (
        <MaterialIcons
          name="favorite"
          size={16}
          color={theme.colors.chat.heartbeat}
          style={styles.heartbeat}
        />
      )}
      <TouchableOpacity onPress={onTrace} style={styles.action}>
        <MaterialIcons name="shield" size={22} color={theme.colors.chat.headerClear} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onClear} style={styles.action}>
        <MaterialIcons name="delete-outline" size={24} color={theme.colors.chat.headerClear} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onDisconnect} style={styles.action}>
        <MaterialIcons name="link-off" size={24} color={theme.colors.chat.headerDisconnect} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heartbeat: {
    marginRight: theme.spacing.sm + 2,
  },
  action: {
    marginRight: theme.spacing.base - 1,
  },
});
