import React from 'react';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, StyleSheet } from 'react-native';
import type {
  AC2KeyRequest as KeyRequestMessage,
  AC2SigningRequest as SigningRequestMessage,
} from '@algorandfoundation/ac2-sdk/schema';
import { theme } from '@/theme';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { ToolActivityCard } from './ToolActivityCard';
import { Ac2MessageCard } from './Ac2MessageCard';
import type { TimelineEntry } from './timeline';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatTimelineProps {
  timeline: TimelineEntry[];
  listRef: React.RefObject<FlatList<TimelineEntry> | null>;
  // Request ids that already have a matching outbound response/rejection.
  actionedRequestIds: Set<string>;
  isConnected: boolean;
  onApproveSigning: (req: SigningRequestMessage) => void;
  onRejectSigning: (req: SigningRequestMessage) => void;
  onApproveKey: (req: KeyRequestMessage) => void;
  onRejectKey: (req: KeyRequestMessage) => void;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onScrollBeginDrag: () => void;
  onScrollEndDrag: () => void;
  onMomentumScrollEnd: () => void;
  onContentSizeChange: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

// Scrolling conversation view. Each timeline entry is dispatched to its
// dedicated renderer (text bubble, typing indicator, tool card, or AC2 card).
// Scroll/keyboard behaviour is driven by handlers owned by the screen.
export function ChatTimeline({
  timeline,
  listRef,
  actionedRequestIds,
  isConnected,
  onApproveSigning,
  onRejectSigning,
  onApproveKey,
  onRejectKey,
  onScroll,
  onScrollBeginDrag,
  onScrollEndDrag,
  onMomentumScrollEnd,
  onContentSizeChange,
}: ChatTimelineProps) {
  const renderItem = ({ item }: { item: TimelineEntry }) => {
    if (item.kind === 'text') {
      const m = item.data;
      // Durable tool-activity card — render the agent's tool/exec step (command
      // + output) as a distinct, expandable card rather than a chat bubble.
      if (m.kind === 'tool') return <ToolActivityCard message={m} />;
      return (
        <MessageBubble
          text={m.text}
          sender={m.sender === 'me' ? 'me' : 'peer'}
          timestamp={m.timestamp}
        />
      );
    }

    if (item.kind === 'typing') {
      return <TypingIndicator text={item.text} presence={item.presence} detail={item.detail} />;
    }

    // AC2 protocol envelope. A request is "actioned" once a matching outbound
    // response/rejection exists on the same `thid`; "expired" once its
    // `expires_time` has passed.
    const entry = item.data;
    const actionable =
      entry.direction !== 'outbound' &&
      (entry.envelope.type === 'ac2/SigningRequest' || entry.envelope.type === 'ac2/KeyRequest')
        ? (entry.envelope as SigningRequestMessage | KeyRequestMessage)
        : null;
    const actioned = actionable ? actionedRequestIds.has(actionable.id) : false;
    const expired =
      actionable?.expires_time !== undefined && actionable.expires_time * 1000 < Date.now();

    return (
      <Ac2MessageCard
        entry={entry}
        timestamp={item.timestamp}
        actioned={actioned}
        expired={expired}
        isConnected={isConnected}
        onApproveSigning={onApproveSigning}
        onRejectSigning={onRejectSigning}
        onApproveKey={onApproveKey}
        onRejectKey={onRejectKey}
      />
    );
  };

  return (
    <FlatList
      ref={listRef}
      data={timeline}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      onScroll={onScroll}
      onScrollBeginDrag={onScrollBeginDrag}
      onScrollEndDrag={onScrollEndDrag}
      onMomentumScrollEnd={onMomentumScrollEnd}
      scrollEventThrottle={16}
      onContentSizeChange={onContentSizeChange}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  list: {
    padding: theme.spacing.base,
    // Extra bottom breathing room so the last bubble — especially the live
    // "thinking…/typing…/running…" indicator that appears while the agent is
    // actively replying or executing a tool — is never clipped against the
    // input bar after an auto-scroll-to-end.
    paddingBottom: 48,
    flexGrow: 1,
  },
});
