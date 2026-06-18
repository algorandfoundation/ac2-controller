import type { Message } from '@/stores/messages';
import type { Ac2MessageEntry } from '@/stores/ac2Messages';

// ─── Types ────────────────────────────────────────────────────────────────────

// Unified timeline entry — keeps free-text chat and AC2 protocol messages
// in the same scroll view while preserving their distinct typing/rendering.
export type TimelineEntry =
  | { kind: 'text'; id: string; timestamp: number; data: Message }
  | { kind: 'ac2'; id: string; timestamp: number; data: Ac2MessageEntry }
  | {
      kind: 'typing';
      id: string;
      timestamp: number;
      text: string;
      presence: 'thinking' | 'tool' | 'typing';
      detail?: string | null;
    };

export type AgentPresence = 'thinking' | 'tool' | 'typing' | null;

// ─── Builder ──────────────────────────────────────────────────────────────────

interface BuildTimelineArgs {
  textMessages: Message[];
  ac2Messages: Ac2MessageEntry[];
  // The agent's live presence (out-of-band frames). `null` while idle.
  agentPresence: AgentPresence;
  // Partial reply text accumulated while the agent streams its response.
  activeStreamText: string;
  agentPresenceDetail?: string | null;
}

// Merge the active conversation's text messages and AC2 envelopes into a single
// chronologically-sorted timeline, appending an ephemeral "thinking/typing/
// working" indicator while the agent is actively replying.
export function buildTimeline({
  textMessages,
  ac2Messages,
  agentPresence,
  activeStreamText,
  agentPresenceDetail,
}: BuildTimelineArgs): TimelineEntry[] {
  const timeline: TimelineEntry[] = [
    ...textMessages.map(
      (m): TimelineEntry => ({
        kind: 'text',
        id: `t-${m.id}`,
        timestamp: m.timestamp,
        data: m,
      }),
    ),
    ...ac2Messages.map(
      (m): TimelineEntry => ({
        kind: 'ac2',
        id: `a-${m.id}`,
        timestamp: m.receivedAt,
        data: m,
      }),
    ),
  ].sort((a, b) => a.timestamp - b.timestamp);

  // While the agent is working on a reply, render an ephemeral indicator
  // instead of a final message bubble:
  //   - "Agent is thinking…" once the agent has acked the message and the
  //     model is running (no tokens yet);
  //   - "Agent is typing…" (with a live preview of the partial text) once
  //     the reply starts streaming.
  // Both are driven by the agent's out-of-band presence frames; we also fall
  // back to `typing` whenever partial stream text exists. Once the stream
  // goes idle the accumulated text is committed as a normal peer message by
  // `useConnection`.
  const presence: 'thinking' | 'tool' | 'typing' | null = activeStreamText
    ? 'typing'
    : agentPresence;
  if (presence) {
    timeline.push({
      kind: 'typing',
      id: 'active-stream',
      timestamp: Date.now(),
      text: activeStreamText,
      presence,
      detail: agentPresenceDetail,
    });
  }

  return timeline;
}
