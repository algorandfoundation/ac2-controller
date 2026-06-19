import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '@/theme';

// ─── Component ────────────────────────────────────────────────────────────────

interface ThreadBarProps {
  threads: string[];
  activeThid: string;
  // The thread id treated as the connection's primary/"Main" conversation.
  defaultThid: string;
  isConnected: boolean;
  // Human-facing label for a thread chip.
  threadLabel: (thid: string) => string;
  onOpenThread: (thid: string) => void;
  onCloseThread: (thid: string) => void;
  onNewThread: () => void;
}

// Conversation switcher — one connection multiplexes several threads. Tapping a
// chip switches the active conversation (and sends ac2/ConversationOpen so the
// agent follows); the "New" chip opens a brand-new conversation. Long-pressing
// a non-default chip prompts to close that conversation.
export function ThreadBar({
  threads,
  activeThid,
  defaultThid,
  isConnected,
  threadLabel,
  onOpenThread,
  onCloseThread,
  onNewThread,
}: ThreadBarProps) {
  return (
    <View style={styles.bar}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {threads.map((thid) => {
          const isActive = thid === activeThid;
          return (
            <TouchableOpacity
              key={thid}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => {
                if (!isActive) onOpenThread(thid);
              }}
              onLongPress={() => {
                if (thid !== defaultThid) {
                  Alert.alert('Close conversation?', `Close "${threadLabel(thid)}"?`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Close', style: 'destructive', onPress: () => onCloseThread(thid) },
                  ]);
                }
              }}
            >
              <MaterialIcons
                name={thid === defaultThid ? 'forum' : 'chat-bubble-outline'}
                size={14}
                color={isActive ? theme.colors.chat.chipTextActive : theme.colors.chat.accent}
              />
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {threadLabel(thid)}
              </Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity style={styles.newChip} onPress={onNewThread} disabled={!isConnected}>
          <MaterialIcons name="add" size={16} color={theme.colors.chat.newChipText} />
          <Text style={styles.newChipText}>New</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  bar: {
    backgroundColor: theme.colors.bg.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.chat.divider,
  },
  content: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs + 2,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.chat.chipBg,
    borderWidth: 1,
    borderColor: theme.colors.chat.chipBorder,
  },
  chipActive: {
    backgroundColor: theme.colors.chat.chipActiveBg,
    borderColor: theme.colors.chat.chipActiveBg,
  },
  chipText: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.chat.chipText,
  },
  chipTextActive: {
    color: theme.colors.chat.chipTextActive,
  },
  newChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs + 2,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.chat.newChipBorder,
    borderStyle: 'dashed',
    backgroundColor: theme.colors.chat.newChipBg,
  },
  newChipText: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.chat.newChipText,
  },
});
