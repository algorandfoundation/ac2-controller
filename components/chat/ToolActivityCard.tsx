import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '@/theme';
import type { Message } from '@/stores/messages';

// ─── Component ────────────────────────────────────────────────────────────────

// A durable "tool card": one tool/exec step the agent ran during a turn,
// rendered distinctly from chat bubbles. Collapsed by default — only the tool
// name (and a one-line command preview) shows, keeping a busy turn's exec
// activity from flooding the conversation. Tapping the header expands the card
// to reveal the full command and (potentially long) output.
export function ToolActivityCard({ message }: { message: Message }) {
  const [expanded, setExpanded] = useState(false);
  const toolName = message.tool || 'tool';
  const hasOutput = !!message.output && message.output.trim().length > 0;
  const hasCommand = !!message.command && message.command.trim().length > 0;
  const hasBody = hasOutput || hasCommand;

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={hasBody ? 0.6 : 1}
        disabled={!hasBody}
      >
        <MaterialIcons name="terminal" size={16} color={theme.colors.chat.accent} />
        <Text style={styles.name}>{toolName}</Text>
        {/* When collapsed, surface a compact one-line command preview so the
            user can tell what ran without expanding the whole card. */}
        {!expanded && hasCommand && (
          <Text style={styles.commandPreview} numberOfLines={1}>
            {message.command}
          </Text>
        )}
        <Text style={styles.time}>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
        {hasBody && (
          <MaterialIcons
            name={expanded ? 'expand-less' : 'expand-more'}
            size={18}
            color={theme.colors.chat.accentMuted}
          />
        )}
      </TouchableOpacity>
      {expanded && hasCommand && <Text style={styles.command}>{`$ ${message.command}`}</Text>}
      {expanded && hasOutput && <Text style={styles.output}>{message.output}</Text>}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    backgroundColor: theme.colors.chat.toolBg,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.chat.toolBorder,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.chat.accent,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs + 2,
    marginBottom: theme.spacing.xs + 2,
  },
  name: {
    fontSize: theme.typography.sizes.sm + 1,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.chat.toolName,
  },
  time: {
    fontFamily: theme.typography.fonts.regular,
    fontSize: 10,
    color: theme.colors.chat.toolMeta,
    marginLeft: 'auto',
  },
  command: {
    fontFamily: 'monospace',
    fontSize: theme.typography.sizes.sm + 1,
    color: theme.colors.chat.toolCommand,
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  commandPreview: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.chat.toolMeta,
  },
  output: {
    fontFamily: 'monospace',
    fontSize: theme.typography.sizes.sm + 1,
    color: theme.colors.chat.toolOutput,
  },
});
