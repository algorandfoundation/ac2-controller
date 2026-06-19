import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '@/theme';

// ─── Component ────────────────────────────────────────────────────────────────

// A single free-text chat bubble. `me` messages align right (filled accent);
// peer messages align left (muted surface).
export function MessageBubble({
  text,
  sender,
  timestamp,
}: {
  text: string;
  sender: 'me' | 'peer';
  timestamp: number;
}) {
  const isMe = sender === 'me';
  return (
    <View style={[styles.bubble, isMe ? styles.myMessage : styles.peerMessage]}>
      <Text style={[styles.text, isMe ? styles.myText : styles.peerText]}>{text}</Text>
      <Text style={[styles.timestamp, isMe && styles.myTimestamp]}>
        {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

export const bubbleStyles = StyleSheet.create({
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.sm + 2,
    borderRadius: 18,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.chat.bubbleMe,
    borderBottomRightRadius: 4,
    borderTopRightRadius: theme.borderRadius.lg,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderBottomLeftRadius: theme.borderRadius.lg,
  },
  peerMessage: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.chat.bubblePeer,
    borderBottomLeftRadius: 4,
    borderTopRightRadius: theme.borderRadius.lg,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderBottomRightRadius: theme.borderRadius.lg,
  },
  text: {
    fontFamily: theme.typography.fonts.regular,
    fontSize: theme.typography.sizes.lg - 1,
    lineHeight: 22,
  },
  myText: {
    color: theme.colors.chat.bubbleMeText,
  },
  peerText: {
    color: theme.colors.chat.bubblePeerText,
  },
  timestamp: {
    fontFamily: theme.typography.fonts.regular,
    fontSize: 10,
    marginTop: theme.spacing.xs,
    alignSelf: 'flex-end',
    color: theme.colors.chat.timestamp,
  },
  myTimestamp: {
    color: theme.colors.chat.timestampInverse,
  },
});

const styles = bubbleStyles;
