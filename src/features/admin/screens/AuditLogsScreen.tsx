import React, { useState } from 'react';
import { FlatList, View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { History, ArrowLeft, Database, User, Clock, ChevronRight, Filter } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, shadow } from '@/shared/theme';
import { useRouter } from 'expo-router';
import { useAuditLogs, AuditLog } from '../hooks/useAuditLogs';
import { AppModal } from '@/shared/components/ui/AppModal';

const formatDate = (dateString: string, formatStr: 'short' | 'long') => {
  const date = new Date(dateString);
  if (formatStr === 'short') {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date).replace(',', ' às');
  }
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'medium'
  }).format(date);
};

const ACTION_CONFIG = {
  INSERT: { color: colors.success, label: 'Criação' },
  UPDATE: { color: colors.primary, label: 'Alteração' },
  DELETE: { color: colors.danger, label: 'Exclusão' },
};

function LogRow({ log, onPress }: { log: AuditLog; onPress: () => void }) {
  const config = ACTION_CONFIG[log.action] || { color: colors.muted, label: log.action };
  
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.actionIndicator, { backgroundColor: config.color }]} />
      <View style={styles.logInfo}>
        <View style={styles.logHeader}>
          <Text style={styles.tableName}>{log.table_name.toUpperCase()}</Text>
          <Text style={styles.logDate}>
            {formatDate(log.executed_at, 'short')}
          </Text>
        </View>
        <View style={styles.logMeta}>
          <View style={styles.metaBadge}>
            <User size={12} color={colors.muted} />
            <Text style={styles.metaText}>{log.actor_role}</Text>
          </View>
          <View style={[styles.metaBadge, { backgroundColor: config.color + '15' }]}>
            <Text style={[styles.actionLabel, { color: config.color }]}>{config.label}</Text>
          </View>
        </View>
      </View>
      <ChevronRight size={20} color={colors.border} />
    </TouchableOpacity>
  );
}

export function AuditLogsScreen() {
  const router = useRouter();
  const { logs, isLoading, refresh } = useAuditLogs();
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const closeDetailModal = () => {
    setSelectedLog(null);
  };

  const renderDetailModal = () => (
    <AppModal visible={!!selectedLog} onClose={closeDetailModal} variant="center">
      <View style={styles.modalHeader}>
        <History color={colors.primary} size={24} />
        <Text style={styles.modalTitle}>Detalhes do Log</Text>
        <TouchableOpacity onPress={closeDetailModal} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>Fechar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.modalBody}>
        <View style={styles.detailRow}>
          <Database size={16} color={colors.muted} />
          <Text style={styles.detailLabel}>Tabela:</Text>
          <Text style={styles.detailValue}>{selectedLog?.table_name}</Text>
        </View>
        <View style={styles.detailRow}>
          <Clock size={16} color={colors.muted} />
          <Text style={styles.detailLabel}>Executado em:</Text>
          <Text style={styles.detailValue}>
            {selectedLog && formatDate(selectedLog.executed_at, 'long')}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Dados Alterados</Text>
        <View style={styles.jsonContainer}>
          <Text style={styles.jsonText}>
            {JSON.stringify(selectedLog?.new_data || selectedLog?.old_data, null, 2)}
          </Text>
        </View>
      </ScrollView>
    </AppModal>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Auditoria</Text>
          <Text style={styles.subtitle}>Histórico de alterações</Text>
        </View>
      </View>

      <FlatList
        data={logs}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <LogRow log={item} onPress={() => setSelectedLog(item)} />
        )}
        contentContainerStyle={styles.list}
        refreshing={isLoading}
        onRefresh={refresh}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <History size={48} color={colors.border} />
              <Text style={styles.emptyText}>Nenhum log encontrado.</Text>
            </View>
          ) : null
        }
      />

      {renderDetailModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.sm,
  },
  title: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: fontSize.sm },
  list: { padding: spacing.lg, gap: spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIndicator: {
    width: 4,
    height: '100%',
    borderRadius: radius.full,
    marginRight: spacing.md,
  },
  logInfo: { flex: 1 },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  tableName: { fontSize: fontSize.xs, fontWeight: '700', color: colors.primary },
  logDate: { fontSize: fontSize.xs, color: colors.muted },
  logMeta: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
  },
  metaText: { fontSize: 10, color: colors.muted, fontWeight: '600' },
  actionLabel: { fontSize: 10, fontWeight: '700' },
  empty: { padding: 100, alignItems: 'center', gap: spacing.md },
  emptyText: { color: colors.muted, fontSize: fontSize.md },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  modalTitle: { flex: 1, fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  closeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  closeBtnText: { color: colors.primary, fontWeight: '700' },
  modalBody: { maxHeight: '80%' },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  detailLabel: { fontSize: fontSize.sm, color: colors.muted, width: 100 },
  detailValue: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text, flex: 1 },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  jsonContainer: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  jsonText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: colors.primary,
  },
});
