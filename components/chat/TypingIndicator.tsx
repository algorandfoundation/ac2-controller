import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { bubbleStyles } from './MessageBubble';

// ─── Component ────────────────────────────────────────────────────────────────

// Ephemeral peer-side indicator shown while the agent is working on a reply:
//   - thinking — model running, no tokens yet
//   - tool     — running an operation (optionally named via `detail`)
//   - typing   — streaming reply, with a live preview of `text` so far
export function TypingIndicator({
  text,
  presence,
  detail,
}: {
  text: string;
  presence: 'thinking' | 'tool' | 'typing';
  detail?: string | null;
}) {
  const iconName =
    presence === 'thinking' ? 'psychology' : presence === 'tool' ? 'build' : 'more-horiz';
  const label =
    presence === 'thinking'
      ? 'Agent is thinking…'
      : presence === 'tool'
        ? detail
          ? `Agent is running ${detail}…`
          : 'Agent is working…'
        : 'Agent is typing…';

  return (
    <View style={[bubbleStyles.bubble, bubbleStyles.peerMessage]}>
      {text.trim().length > 0 && (
        <Text style={[bubbleStyles.text, bubbleStyles.peerText]}>{text}</Text>
      )}
      <View style={styles.header}>
        <MaterialIcons name={iconName} size={18} color={theme.colors.chat.accent} />
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  label: {
    fontSize: theme.typography.sizes.md,
    fontStyle: 'italic',
    color: theme.colors.chat.accent,
  },
});
