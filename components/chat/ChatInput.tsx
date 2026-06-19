import React from 'react';
import { Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '@/theme';

// ─── Component ────────────────────────────────────────────────────────────────

// Message composer pinned to the bottom of the conversation. The send button
// is disabled while empty or while the connection is down.
export function ChatInput({
  value,
  onChangeText,
  onSend,
  isConnected,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isConnected: boolean;
}) {
  const canSend = !!value.trim() && isConnected;
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={isConnected ? 'Type a message...' : 'Connecting...'}
        placeholderTextColor={theme.colors.chat.placeholder}
        editable={isConnected}
      />
      <TouchableOpacity
        style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
        onPress={onSend}
        disabled={!canSend}
      >
        <MaterialIcons name="send" size={24} color={theme.colors.fg.inverse} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.bg.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.chat.divider,
    alignItems: 'flex-end',
    paddingBottom: Platform.OS === 'ios' ? theme.spacing.sm : theme.spacing.md,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.chat.inputBg,
    borderRadius: 22,
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.sm + 2,
    marginRight: theme.spacing.sm + 2,
    fontFamily: theme.typography.fonts.regular,
    fontSize: theme.typography.sizes.lg - 1,
    maxHeight: 120,
    color: theme.colors.chat.inputText,
  },
  sendButton: {
    backgroundColor: theme.colors.chat.sendBg,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.chat.sendDisabled,
  },
});
