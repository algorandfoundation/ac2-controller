import { Button } from '@/components/Button';
import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet';
import { AppText as Text } from '../Text';

import type { Ac2MessageEntry } from '@/stores/ac2Messages';
import { palette, theme } from '@/theme';
import type { AC2SigningResponse } from '@algorandfoundation/ac2-sdk/schema';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { forwardRef, useCallback, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

interface AC2TelemetryTraceModalProps {
  /**
   * AC2 protocol envelopes to display in the telemetry trace, each tagged with
   * its local direction/timestamp metadata (`Ac2MessageEntry`).
   */
  entries: Ac2MessageEntry[];
  /** Human-facing label for the active conversation thread, shown as a subtitle. */
  threadLabel?: string;
  onDismiss?: () => void;
}

// Local receive/send time (ms) — compact format for the header row.
function formatTimestamp(ms: number): string {
  const d = new Date(ms);
  const date = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
  const time = d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return `${date} ${time}`;
}
// The base64 signature carried by an `ac2/SigningResponse`, or `null` for any
// other envelope type.
function getSignature(entry: Ac2MessageEntry): string | null {
  if (entry.envelope.type !== 'ac2/SigningResponse') return null;
  return (entry.envelope as AC2SigningResponse).body.signature ?? null;
}

async function copyToClipboard(value: string, label: string) {
  try {
    await Clipboard.setStringAsync(value);
    Alert.alert('Copied', `${label} copied to clipboard.`);
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    Alert.alert('Copy failed', 'Could not copy to the clipboard.');
  }
}

function MessageCard({ entry }: { entry: Ac2MessageEntry }) {
  const [jsonVisible, setJsonVisible] = useState(false);
  const styles = stylesheet;

  const isOutbound = entry.direction === 'outbound';
  const { envelope } = entry;
  const signature = getSignature(entry);

  return (
    <View style={[styles.card, isOutbound ? styles.cardOutbound : styles.cardInbound]}>
      {/* Direction + type + timestamp header */}
      <View style={styles.cardHeader}>
        <View
          style={[styles.directionBadge, isOutbound ? styles.badgeOutbound : styles.badgeInbound]}
        >
          <MaterialIcons
            name={isOutbound ? 'north-east' : 'south-west'}
            size={11}
            style={isOutbound ? styles.badgeIconOutbound : styles.badgeIconInbound}
          />
          <Text style={isOutbound ? styles.badgeLabelOutbound : styles.badgeLabelInbound}>
            {isOutbound ? 'OUTBOUND' : 'INBOUND'}
          </Text>
        </View>
        <Text style={styles.meta} bold numberOfLines={1}>
          {envelope.type}
        </Text>
        <Text style={styles.timestamp}>{formatTimestamp(entry.receivedAt)}</Text>
      </View>

      <Text style={styles.detail} numberOfLines={1} ellipsizeMode="middle">
        From: {envelope.from}
      </Text>
      {entry.thid && (
        <Text style={styles.detail} numberOfLines={1} ellipsizeMode="middle">
          Thread: {entry.thid}
        </Text>
      )}
      {envelope.id && <Text style={styles.id}>ID: {envelope.id.slice(0, 16)}...</Text>}

      {/* Signature (ac2/SigningResponse) */}
      {signature && (
        <View style={styles.sigBox}>
          <View style={styles.sigHeader}>
            <MaterialIcons name="verified" size={13} style={styles.sigIcon} />
            <Text style={styles.sigTitle}>Signature</Text>
            <Button
              label="Copy"
              onPress={() => copyToClipboard(signature, 'Signature')}
              variant="ghost"
              size="sm"
              leftIcon={
                <MaterialIcons name="content-copy" size={13} color={theme.colors.fg.muted} />
              }
            />
          </View>
          <Text style={styles.sigValue} numberOfLines={2} ellipsizeMode="middle">
            {signature}
          </Text>
        </View>
      )}

      <Button
        label={jsonVisible ? 'Hide JSON' : 'View JSON'}
        onPress={() => setJsonVisible((v) => !v)}
        variant="outline"
        size="sm"
        leftIcon={<MaterialIcons name="code" size={14} color={theme.colors.fg.inverse} />}
        style={styles.toggleBtn}
      />
      {jsonVisible && (
        <ScrollView horizontal style={styles.jsonBox} showsHorizontalScrollIndicator={false}>
          <Text style={styles.json}>{JSON.stringify(envelope, null, 2)}</Text>
        </ScrollView>
      )}
    </View>
  );
}

export const AC2TelemetryTraceModal = forwardRef<BottomSheetModal, AC2TelemetryTraceModalProps>(
  ({ entries, threadLabel, onDismiss }, ref) => {
    const renderBackdrop = useCallback(
      (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
        />
      ),
      [],
    );

    // Chronological order (oldest first) for both the trace list and the export.
    const sortedEntries = useMemo(
      () => [...entries].sort((a, b) => a.receivedAt - b.receivedAt),
      [entries],
    );

    const handleExport = useCallback(async () => {
      if (sortedEntries.length === 0) {
        Alert.alert('Nothing to export', 'There are no AC2 messages to export yet.');
        return;
      }
      try {
        const json = JSON.stringify(sortedEntries, null, 2);
        const filename = `ac2-telemetry-${new Date().toISOString().replace(/:/g, '-')}.json`;
        const fileUri = `${FileSystem.documentDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(fileUri, json);

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/json',
            dialogTitle: 'Export AC2 Telemetry Trace',
            UTI: 'public.json',
          });
        } else {
          Alert.alert('Export saved', `Saved telemetry trace to ${filename}.`);
        }
      } catch (error) {
        console.error('Failed to export AC2 telemetry trace:', error);
        Alert.alert('Export failed', 'Could not export the telemetry trace.');
      }
    }, [sortedEntries]);

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={['75%']}
        index={0}
        enablePanDownToClose
        enableDynamicSizing={false}
        backdropComponent={renderBackdrop}
        backgroundStyle={stylesheet.shell}
        handleComponent={null}
      >
        <View style={stylesheet.body}>
          {/** Header */}
          <View style={stylesheet.header}>
            <View style={stylesheet.headerTitleRow}>
              <MaterialIcons name="shield" size={20} style={stylesheet.shieldIcon} />
              <View style={stylesheet.headerTitleText}>
                <Text style={stylesheet.title} numberOfLines={1}>
                  AC2 Telemetry Trace
                </Text>
                {threadLabel && (
                  <Text style={stylesheet.subtitle} numberOfLines={1}>
                    Thread: {threadLabel}
                  </Text>
                )}
              </View>
            </View>
            <View style={stylesheet.headerButtonRow}>
              <Button label="Export JSON" onPress={handleExport} variant="white" size="sm" />
              <Pressable onPress={() => onDismiss?.()} hitSlop={8} style={stylesheet.closeButton}>
                <MaterialIcons name="keyboard-arrow-down" size={24} style={stylesheet.closeIcon} />
              </Pressable>
            </View>
          </View>
          {/** Content */}
          <BottomSheetFlatList
            style={stylesheet.scroll}
            data={sortedEntries}
            keyExtractor={(entry) => entry.id}
            renderItem={({ item }) => <MessageCard entry={item} />}
            contentContainerStyle={stylesheet.container}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          />
        </View>
      </BottomSheetModal>
    );
  },
);

AC2TelemetryTraceModal.displayName = 'AC2 TelemetryTraceModal';

// ─── Styles ───────────────────────────────────────────────────────────────────

const mono = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

const stylesheet = StyleSheet.create({
  shell: {
    backgroundColor: theme.colors.bg.darkAlt,
  },
  body: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.bg.dark,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flexShrink: 1,
  },
  headerTitleText: {
    flexShrink: 1,
    flexDirection: 'column',
  },
  shieldIcon: {
    color: theme.colors.fg.primary,
  },
  headerButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  closeButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    color: theme.colors.fg.inverse,
  },

  title: {
    flexShrink: 1,
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.fonts.bold,
    fontWeight: 'bold',
    color: theme.colors.fg.inverse,
  },
  subtitle: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.fonts.regular,
    color: palette.neutral[400],
    marginTop: 1,
  },
  card: {
    backgroundColor: palette.neutral[800],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: palette.neutral[700],
  },
  cardInbound: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.chat.accent,
  },
  cardOutbound: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.fg.success,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    flexWrap: 'nowrap',
  },
  timestamp: {
    fontSize: theme.typography.sizes.sm,
    color: palette.neutral[300],
    fontFamily: mono,
    flexShrink: 1,
    textAlign: 'right',
    fontWeight: '500',
  },
  directionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: theme.borderRadius.xs,
    paddingVertical: 2,
    paddingHorizontal: theme.spacing.xs,
    borderWidth: 1,
  },
  badgeInbound: {
    borderColor: theme.colors.chat.accent,
  },
  badgeOutbound: {
    borderColor: theme.colors.fg.success,
  },
  badgeIconInbound: {
    color: theme.colors.chat.accent,
  },
  badgeIconOutbound: {
    color: theme.colors.fg.success,
  },
  badgeLabelInbound: {
    fontSize: theme.typography.sizes.xs,
    fontFamily: mono,
    fontWeight: 'bold',
    color: theme.colors.chat.accent,
  },
  badgeLabelOutbound: {
    fontSize: theme.typography.sizes.xs,
    fontFamily: mono,
    fontWeight: 'bold',
    color: theme.colors.fg.success,
  },
  meta: {
    flex: 1,
    fontSize: theme.typography.sizes.md,
    color: palette.neutral[200],
    fontFamily: mono,
    fontWeight: 'bold',
  },
  detail: {
    fontSize: theme.typography.sizes.sm,
    color: palette.neutral[400],
    marginBottom: theme.spacing.xs,
    fontFamily: mono,
  },
  id: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.fg.success,
    marginBottom: theme.spacing.sm,
    fontFamily: mono,
    fontWeight: 'bold',
  },
  sigBox: {
    backgroundColor: theme.colors.bg.dark,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  sigHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  sigIcon: {
    color: theme.colors.fg.success,
  },
  sigTitle: {
    flex: 1,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.fg.inverse,
    fontFamily: mono,
    fontWeight: 'bold',
  },

  sigValue: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.fg.success,
    fontFamily: mono,
  },
  toggleBtn: {
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  jsonBox: {
    backgroundColor: theme.colors.bg.dark,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
  },
  json: {
    fontSize: theme.typography.sizes.xs,
    lineHeight: theme.typography.sizes.xs * 1.4,
    color: palette.green[400],
    fontFamily: mono,
  },
});
