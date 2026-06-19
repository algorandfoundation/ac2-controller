import { AC2TelemetryTraceModal } from '@/components/ac2/TelemetryTraceModal';
import { ChatHeaderActions } from '@/components/chat/ChatHeaderActions';
import { AppText } from '@/components/Text';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatTimeline } from '@/components/chat/ChatTimeline';
import { ThreadBar } from '@/components/chat/ThreadBar';
import { buildTimeline, type TimelineEntry } from '@/components/chat/timeline';
import { useAc2Responders } from '@/hooks/useAc2Responders';
import { useConnection } from '@/hooks/useConnection';
import { ac2MessagesStore, clearAc2Messages } from '@/stores/ac2Messages';
import { clearMessages, messagesStore } from '@/stores/messages';
import { theme } from '@/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useStore } from '@tanstack/react-store';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// Thread id used for messages persisted before multi-conversation support.
const DEFAULT_THID = 'default';

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ origin: string; requestId: string }>();
  const [inputText, setInputText] = useState('');
  const {
    isConnected,
    isLoading,
    isError,
    send,
    sendAc2,
    lastHeartbeat,
    reset,
    address,
    activeStreamText,
    agentPresence,
    agentPresenceDetail,
    activeThid,
    openConversation,
    closeConversation,
    remoteThreads,
  } = useConnection(params.origin || '', params.requestId || '');
  const {
    approveSigning: handleApprove,
    rejectSigning: handleReject,
    approveKey: handleApproveKey,
    rejectKey: handleRejectKey,
  } = useAc2Responders({
    address,
    sendAc2,
    origin: params.origin || '',
    requestId: params.requestId || '',
  });

  // All chat messages on this connection across every conversation thread —
  // used to derive the thread switcher. Legacy messages carry no `thid` and
  // are treated as the `default` thread.
  const connectionTextMessages = useStore(messagesStore, (state) =>
    state.messages.filter(
      (m) =>
        m.origin === params.origin &&
        m.requestId === params.requestId &&
        (address ? m.address === address : true),
    ),
  );

  // Only the active conversation's messages are shown in the timeline.
  const textMessages = useMemo(
    () => connectionTextMessages.filter((m) => (m.thid ?? DEFAULT_THID) === activeThid),
    [connectionTextMessages, activeThid],
  );

  // The set of conversation threads on this connection (most-recent first),
  // always including the active thread and the default thread so the switcher
  // can render them even before any message has landed.
  const threads = useMemo(() => {
    const lastSeen = new Map<string, number>();
    for (const m of connectionTextMessages) {
      const t = m.thid ?? DEFAULT_THID;
      const prev = lastSeen.get(t) ?? 0;
      if (m.timestamp > prev) lastSeen.set(t, m.timestamp);
    }
    // Merge in threads the agent reported it already holds (a reconnecting /
    // fresh controller may have no local messages for them yet). Opening such
    // a thread triggers the agent to replay its history.
    for (const rt of remoteThreads) {
      if (!lastSeen.has(rt.thid)) lastSeen.set(rt.thid, rt.updatedAt ?? 0);
    }
    if (!lastSeen.has(DEFAULT_THID)) lastSeen.set(DEFAULT_THID, 0);
    if (!lastSeen.has(activeThid)) lastSeen.set(activeThid, Date.now());
    return Array.from(lastSeen.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([thid]) => thid);
  }, [connectionTextMessages, activeThid, remoteThreads]);

  // A short, human-facing label for a thread chip: the default thread reads
  // "Main"; others fall back to a truncated id.
  const threadLabel = (thid: string): string => {
    if (thid === DEFAULT_THID) return 'Main';
    const remote = remoteThreads.find((r) => r.thid === thid);
    if (remote?.title)
      return remote.title.length > 18 ? `${remote.title.slice(0, 18)}…` : remote.title;
    return thid.length > 12 ? `${thid.slice(0, 12)}…` : thid;
  };

  // All AC2 protocol envelopes on this connection across every conversation
  // thread — used to derive request/response "actioned" state, which is keyed
  // by the envelope's own `thid` (request id) and so is thread-independent.
  const ac2Messages = useStore(ac2MessagesStore, (state) =>
    state.messages.filter((m) => m.origin === params.origin && m.requestId === params.requestId),
  );

  // Only the active conversation's AC2 envelopes are shown in the timeline.
  // Legacy entries carry no `thid` and are treated as the `default` thread.
  const threadAc2Messages = useMemo(
    () => ac2Messages.filter((m) => (m.thid ?? DEFAULT_THID) === activeThid),
    [ac2Messages, activeThid],
  );

  // A SigningRequest is "actioned" once we have a matching outbound response
  // or rejection on the same `thid` (the SDK builders thread `thid = request.id`).
  // This survives reloads because it's derived from the persisted ac2 store.
  const actionedRequestIds = useMemo(() => {
    const set = new Set<string>();
    for (const m of ac2Messages) {
      if (m.direction !== 'outbound') continue;
      const t = m.envelope.type;
      if (t === 'ac2/SigningResponse' || t === 'ac2/SigningRejected' || t === 'ac2/KeyResponse') {
        if (m.envelope.thid) set.add(m.envelope.thid);
      }
    }
    return set;
  }, [ac2Messages]);

  const timeline: TimelineEntry[] = buildTimeline({
    textMessages,
    ac2Messages: threadAc2Messages,
    agentPresence,
    activeStreamText,
    agentPresenceDetail,
  });

  const flatListRef = useRef<FlatList<TimelineEntry>>(null);
  const telemetryModalRef = useRef<BottomSheetModal>(null);
  // Whether the list is currently scrolled to (near) the bottom. We only
  // auto-scroll on new content when the user is already at the bottom, so
  // scrolling up to read earlier messages / expand a tool card is never
  // yanked back down by a streaming reply or an incoming message.
  const isAtBottomRef = useRef(true);
  // Whether the latest scrolling is driven by the user (a drag / fling) rather
  // than by our own programmatic `scrollToEnd`. Programmatic scrolls fire
  // `onScroll` with transient/intermediate `contentSize` values while the list
  // is still growing during streaming, which could momentarily compute a large
  // `distanceFromBottom` and wrongly flip `isAtBottomRef` to false —
  // permanently stopping auto-scroll mid-reply. We only trust scroll offsets
  // for the "at bottom" decision while the user is actually scrolling.
  const userScrollingRef = useRef(false);

  const [isHeartbeatVisible, setIsHeartbeatVisible] = useState(false);

  // Height of the on-screen keyboard, driven by the OS keyboard events. Because
  // edge-to-edge is enabled the Android window does NOT resize when the keyboard
  // opens, so we lift the composer ourselves with a state-driven spacer below it
  // (see the render). This is owned here, at the screen, rather than inside
  // ChatInput — and because it's plain state it always resets to 0 on hide, with
  // no residual padding left behind (the failure mode of KeyboardAvoidingView in
  // this RN/new-arch/edge-to-edge combination).
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (isConnected) {
      setIsHeartbeatVisible(true);
      const timer = setTimeout(() => setIsHeartbeatVisible(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [lastHeartbeat, isConnected]);

  // Track how far the list is from the bottom so auto-scroll only kicks in
  // when the user hasn't deliberately scrolled up.
  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    // Only trust scroll offsets when the user is driving the scroll. This keeps
    // programmatic `scrollToEnd` events (fired while content is still growing
    // during streaming) from corrupting the "at bottom" state and stalling
    // auto-scroll.
    if (!userScrollingRef.current) return;
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);
    isAtBottomRef.current = distanceFromBottom < 80;
  };

  // The user grabbed the list — start trusting scroll offsets.
  const handleScrollBeginDrag = () => {
    userScrollingRef.current = true;
  };

  // The user let go and any fling momentum has settled — stop trusting scroll
  // offsets so subsequent programmatic scrolls don't flip the bottom state.
  const handleMomentumScrollEnd = () => {
    userScrollingRef.current = false;
  };

  // Scroll to the bottom without animation (animated scrolls fight rapid
  // streaming updates and feel janky), but only when already pinned there.
  const maybeScrollToEnd = () => {
    if (isAtBottomRef.current) {
      flatListRef.current?.scrollToEnd({ animated: false });
    }
  };

  // Track the keyboard so the screen-level spacer can lift the composer above
  // it, and snap the list to the bottom as it opens. iOS exposes the `Will`
  // events (smoother, fire before the animation); Android only the `Did` events.
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      flatListRef.current?.scrollToEnd({ animated: true });
    });
    const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardHeight(0));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleDisconnect = () => {
    reset();
    router.back();
  };

  const handleClear = () => {
    if (address) {
      clearMessages(address, params.origin || '', params.requestId || '');
    }
    clearAc2Messages(address || '', params.origin || '', params.requestId || '');
  };

  const handleSend = () => {
    if (inputText.trim()) {
      send(inputText.trim());
      setInputText('');
    }
  };

  const headerTitle = isConnected
    ? 'Connected'
    : isLoading
      ? 'Connecting...'
      : isError
        ? 'Error'
        : 'Disconnected';

  // Height of the spacer that sits below the composer. While the keyboard is
  // open we lift the composer to its top; while it's closed we just clear the
  // nav bar / home indicator. On Android with edge-to-edge the keyboard's
  // reported height excludes the navigation bar inset, so the keys overlap the
  // composer by that amount unless we add it back.
  const composerSpacer =
    keyboardHeight > 0
      ? keyboardHeight + (Platform.OS === 'android' ? insets.bottom : 0)
      : insets.bottom;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.chat.headerBack} />
        </TouchableOpacity>

        <AppText variant="h3" color="inverse" bold style={styles.headerTitle} numberOfLines={1}>
          {headerTitle}
        </AppText>

        {isConnected ? (
          <ChatHeaderActions
            isHeartbeatVisible={isHeartbeatVisible}
            onClear={handleClear}
            onDisconnect={handleDisconnect}
            onTrace={() => telemetryModalRef.current?.present()}
          />
        ) : (
          <View style={styles.headerRight} />
        )}
      </View>

      {/* NOTE: do NOT wrap this body in a TouchableWithoutFeedback to dismiss
          the keyboard — that wrapper steals the touch responder and prevents
          the FlatList below from ever receiving scroll/pan gestures (the list
          would only scroll after focusing the input reshuffled the
          responder). The keyboard is dismissed via the FlatList's
          keyboardDismissMode/keyboardShouldPersistTaps instead. */}
      <View style={styles.flex}>
        <ThreadBar
          threads={threads}
          activeThid={activeThid}
          defaultThid={DEFAULT_THID}
          isConnected={isConnected}
          threadLabel={threadLabel}
          onOpenThread={(thid) => openConversation(thid)}
          onCloseThread={closeConversation}
          onNewThread={() => openConversation()}
        />

        <ChatTimeline
          timeline={timeline}
          listRef={flatListRef}
          actionedRequestIds={actionedRequestIds}
          isConnected={isConnected}
          onApproveSigning={handleApprove}
          onRejectSigning={handleReject}
          onApproveKey={handleApproveKey}
          onRejectKey={handleRejectKey}
          onScroll={handleScroll}
          onScrollBeginDrag={handleScrollBeginDrag}
          onScrollEndDrag={handleMomentumScrollEnd}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          onContentSizeChange={maybeScrollToEnd}
        />

        <ChatInput
          value={inputText}
          onChangeText={setInputText}
          onSend={handleSend}
          isConnected={isConnected}
        />

        {/* Lifts the composer above the keyboard while it's open, and clears the
            nav bar / home indicator while it's closed (see composerSpacer).
            Plain state, so it resets cleanly on hide. */}
        <View style={{ height: composerSpacer, backgroundColor: theme.colors.bg.white }} />
      </View>

      <AC2TelemetryTraceModal
        ref={telemetryModalRef}
        entries={threadAc2Messages}
        threadLabel={threadLabel(activeThid)}
        onDismiss={() => telemetryModalRef.current?.dismiss()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.chat.appBg,
  },
  flex: {
    flex: 1,
  },
  header: {
    minHeight: 64,
    backgroundColor: theme.colors.bg.header,
    paddingLeft: theme.spacing.sm,
    paddingRight: theme.spacing.base,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBack: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.bg.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.sm,
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: theme.spacing.sm,
  },
  headerRight: {
    width: 36,
  },
});
