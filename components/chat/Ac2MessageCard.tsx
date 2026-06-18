import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type {
  AC2KeyRequest as KeyRequestMessage,
  AC2SigningRequest as SigningRequestMessage,
} from '@algorandfoundation/ac2-sdk/schema';
import { theme } from '@/theme';
import { Button } from '@/components/Button';
import type { Ac2MessageEntry } from '@/stores/ac2Messages';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Ac2MessageCardProps {
  entry: Ac2MessageEntry;
  timestamp: number;
  // Whether this request already has a matching outbound response/rejection.
  actioned: boolean;
  // Whether the request's `expires_time` has passed.
  expired: boolean;
  isConnected: boolean;
  onApproveSigning: (req: SigningRequestMessage) => void;
  onRejectSigning: (req: SigningRequestMessage) => void;
  onApproveKey: (req: KeyRequestMessage) => void;
  onRejectKey: (req: KeyRequestMessage) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

// An AC2 protocol envelope rendered as a distinct, monospaced card so the
// protocol surface is visually obvious in the reference UI. Inbound signing /
// key requests gain approve/reject actions until they're actioned or expired.
export function Ac2MessageCard({
  entry,
  timestamp,
  actioned,
  expired,
  isConnected,
  onApproveSigning,
  onRejectSigning,
  onApproveKey,
  onRejectKey,
}: Ac2MessageCardProps) {
  const isOutbound = entry.direction === 'outbound';
  const isInboundSigningRequest = !isOutbound && entry.envelope.type === 'ac2/SigningRequest';
  const isInboundKeyRequest = !isOutbound && entry.envelope.type === 'ac2/KeyRequest';
  const req = isInboundSigningRequest ? (entry.envelope as SigningRequestMessage) : null;
  const keyReq = isInboundKeyRequest ? (entry.envelope as KeyRequestMessage) : null;

  return (
    <View style={[styles.bubble, isOutbound ? styles.outbound : styles.inbound]}>
      <View style={styles.header}>
        <MaterialIcons name="vpn-key" size={14} color={theme.colors.chat.accent} />
        <Text style={styles.type}>{entry.envelope.type}</Text>
        <Text style={styles.direction}>{isOutbound ? '→ peer' : 'peer →'}</Text>
      </View>

      {req && <Text style={styles.description}>{req.body.description}</Text>}
      {keyReq && (
        <Text style={styles.description}>
          The agent is requesting an identity key ({keyReq.body.key_type}) for{' '}
          {keyReq.body.for_operation}.
        </Text>
      )}

      <Text style={styles.body} numberOfLines={6}>
        {JSON.stringify(entry.envelope.body, null, 2)}
      </Text>

      {req && (
        <RequestActions
          actioned={actioned}
          expired={expired}
          isConnected={isConnected}
          rejectLabel="Reject"
          approveLabel="Approve & Sign"
          onReject={() => onRejectSigning(req)}
          onApprove={() => onApproveSigning(req)}
        />
      )}
      {keyReq && (
        <RequestActions
          actioned={actioned}
          expired={expired}
          isConnected={isConnected}
          rejectLabel="Reject"
          approveLabel="Grant Identity"
          onReject={() => onRejectKey(keyReq)}
          onApprove={() => onApproveKey(keyReq)}
        />
      )}

      <Text style={styles.timestamp}>
        {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );
}

// Approve/reject footer — collapses to an "Actioned"/"Expired" status line once
// the request can no longer be acted on.
function RequestActions({
  actioned,
  expired,
  isConnected,
  rejectLabel,
  approveLabel,
  onReject,
  onApprove,
}: {
  actioned: boolean;
  expired: boolean;
  isConnected: boolean;
  rejectLabel: string;
  approveLabel: string;
  onReject: () => void;
  onApprove: () => void;
}) {
  if (actioned) return <Text style={styles.actioned}>Actioned</Text>;
  if (expired) return <Text style={styles.expired}>Expired</Text>;
  return (
    <View style={styles.actions}>
      <Button
        label={rejectLabel}
        size="sm"
        color="error"
        disabled={!isConnected}
        onPress={onReject}
        leftIcon={<MaterialIcons name="close" size={16} color={theme.colors.fg.inverse} />}
      />
      <Button
        label={approveLabel}
        size="sm"
        color="success"
        disabled={!isConnected}
        onPress={onApprove}
        leftIcon={<MaterialIcons name="check" size={16} color={theme.colors.fg.inverse} />}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  bubble: {
    alignSelf: 'stretch',
    backgroundColor: theme.colors.chat.ac2Surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.chat.ac2Border,
  },
  inbound: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.chat.accent,
  },
  outbound: {
    borderRightWidth: 4,
    borderRightColor: theme.colors.chat.accent,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs + 2,
    marginBottom: theme.spacing.xs + 2,
  },
  type: {
    fontSize: theme.typography.sizes.sm + 1,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.chat.ac2Title,
    flex: 1,
  },
  direction: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.chat.accent,
    fontWeight: theme.typography.weights.semiBold,
  },
  body: {
    fontFamily: 'monospace',
    fontSize: theme.typography.sizes.sm + 1,
    color: theme.colors.chat.ac2Text,
  },
  description: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.chat.ac2Text,
    marginBottom: theme.spacing.xs + 2,
    fontWeight: theme.typography.weights.medium,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  actioned: {
    fontSize: theme.typography.sizes.sm + 1,
    fontWeight: theme.typography.weights.semiBold,
    color: theme.colors.chat.actioned,
    fontStyle: 'italic',
  },
  expired: {
    fontSize: theme.typography.sizes.sm + 1,
    fontWeight: theme.typography.weights.semiBold,
    color: theme.colors.chat.expired,
    fontStyle: 'italic',
  },
  timestamp: {
    fontSize: 10,
    marginTop: theme.spacing.xs,
    alignSelf: 'flex-end',
    color: theme.colors.chat.timestamp,
  },
});
