/**
 * SmartBottleCard Component
 *
 * Purpose:
 *   Displays IoT SmartBottle connection status and last hydration reading.
 *   Receives all state via props — does not instantiate useSmartBottle internally.
 *   The parent screen owns the hook and passes connect/disconnect handlers.
 *
 * Props:
 *   - status: SmartBottleStatus — current MQTT connection state
 *   - lastReading: SmartBottleReading | null — most recent valid reading
 *   - onConnect: () => void — trigger MQTT connection
 *   - onDisconnect: () => void — trigger MQTT disconnection
 *   - error: string | null — error message to display inline
 *
 * Dependencies:
 *   - shared/theme
 *   - shared/components/ui/InlineStatus
 *   - lucide-react-native icons
 */

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Wifi, WifiOff, Droplets } from 'lucide-react-native';
import { appStyles, colors, fontSize, radius, spacing } from '@/shared/theme';
import { InlineStatus } from '@/shared/components/ui/InlineStatus';
import type { SmartBottleStatus, SmartBottleReading } from '../../hooks/useSmartBottle';

interface SmartBottleCardProps {
  status: SmartBottleStatus;
  lastReading: SmartBottleReading | null;
  onConnect: () => void;
  onDisconnect: () => void;
  error: string | null;
}

export function SmartBottleCard({
  status,
  lastReading,
  onConnect,
  onDisconnect,
  error,
}: SmartBottleCardProps) {
  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';

  const statusColor =
    isConnected ? colors.success
    : status === 'error' ? colors.danger
    : colors.muted;

  const statusLabel =
    status === 'connected' ? 'Online'
    : status === 'connecting' ? 'Conectando...'
    : status === 'error' ? 'Erro'
    : 'Desconectada';

  return (
    <View style={[appStyles.dashboardCard, styles.card]}>
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: colors.waterAccent + '22' }]}>
          <Droplets size={18} color={colors.waterAccent} />
        </View>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>SmartBottle IoT</Text>
          <View style={styles.statusRow}>
            {isConnected
              ? <Wifi size={12} color={statusColor} />
              : <WifiOff size={12} color={statusColor} />}
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.btn, isConnected ? styles.btnDisconnect : styles.btnConnect]}
          onPress={isConnected ? onDisconnect : onConnect}
          disabled={isConnecting}
          activeOpacity={0.7}
        >
          <Text style={styles.btnText}>
            {isConnecting ? 'Aguarde...' : isConnected ? 'Desconectar' : 'Conectar'}
          </Text>
        </TouchableOpacity>
      </View>

      {error ? <InlineStatus variant="error" message={error} /> : null}

      {lastReading && (
        <View style={styles.reading}>
          <Text style={styles.readingLabel}>Último gole</Text>
          <Text style={styles.readingValue}>{lastReading.amountMl}ml</Text>
          <Text style={styles.readingTime}>
            {new Date(lastReading.timestamp).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      )}

      {!lastReading && isConnected && (
        <Text style={styles.waiting}>Aguardando leituras da garrafa...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: { flex: 1, gap: 2 },
  title: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusText: { fontSize: fontSize.xs, fontWeight: '600' },
  btn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  btnConnect: {
    backgroundColor: colors.waterAccent + '22',
    borderWidth: 1,
    borderColor: colors.waterAccent + '55',
  },
  btnDisconnect: {
    backgroundColor: colors.danger + '15',
    borderWidth: 1,
    borderColor: colors.danger + '33',
  },
  btnText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.text },
  reading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  readingLabel: { color: colors.muted, fontSize: fontSize.xs },
  readingValue: { color: colors.waterAccent, fontSize: fontSize.md, fontWeight: '800' },
  readingTime: { color: colors.muted, fontSize: fontSize.xs },
  waiting: {
    color: colors.muted,
    fontSize: fontSize.sm,
    textAlign: 'center',
    paddingVertical: spacing.xs,
  },
});
