/**
 * SmartBottleCard Component
 *
 * Displays real-time hydration data from connected SmartBottles.
 * Shows device status (battery, signal), last intake, and manual log fallback.
 *
 * Features:
 *   - Real-time status display (battery, signal strength)
 *   - Last hydration timestamp
 *   - Manual hydration log button (fallback)
 *   - Responsive design with collapsible details
 *   - Error boundary
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { appStyles, colors, spacing, radius, fontSize } from "@/shared/theme";
import { useSmartBottle } from "@/features/patient/hooks/useSmartBottle";

interface SmartBottleCardProps {
  onLogHydration?: (ml: number) => void;
  brokerUrl?: string;
}

export function SmartBottleCard({
  onLogHydration,
  brokerUrl,
}: SmartBottleCardProps) {
  const [isLogging, setIsLogging] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { status, isConnected, isLoading, error, logHydration } =
    useSmartBottle({
      brokerUrl,
      onError: (err: Error) => {
        console.warn("[SmartBottleCard] Error:", err.message);
      },
    });

  const handleManualLog = useCallback(
    async (ml: number) => {
      try {
        setIsLogging(true);
        await logHydration(ml);
        if (onLogHydration) {
          onLogHydration(ml);
        }
      } catch (err) {
        console.error("[SmartBottleCard] Log failed:", err);
      } finally {
        setIsLogging(false);
      }
    },
    [logHydration, onLogHydration]
  );

  const formatTime = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return "just now";
      if (diffMins < 60) return `${diffMins}m ago`;

      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;

      return date.toLocaleDateString();
    } catch {
      return isoString;
    }
  };

  const formatSignal = (rssi: number): string => {
    // RSSI in dBm: -30 = excellent, -70 = poor, -100 = disconnected
    if (rssi > -50) return "Excellent";
    if (rssi > -70) return "Good";
    if (rssi > -80) return "Fair";
    return "Poor";
  };

  const getBatteryColor = (level: number): string => {
    if (level >= 60) return colors.success;
    if (level >= 30) return colors.warning;
    return colors.danger;
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>SmartBottle Connection Error</Text>
          <Text style={styles.errorMessage}>{error.message}</Text>
          <View style={styles.fallbackButtons}>
            <TouchableOpacity
              style={styles.fallbackButton}
              onPress={() => handleManualLog(250)}
              disabled={isLogging}
            >
              <Text style={styles.fallbackButtonText}>Log 250ml</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.fallbackButton}
              onPress={() => handleManualLog(500)}
              disabled={isLogging}
            >
              <Text style={styles.fallbackButtonText}>Log 500ml</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (!status) {
    return (
      <View style={styles.container}>
        <View style={styles.waitingBox}>
          <Text style={styles.waitingTitle}>SmartBottle Waiting...</Text>
          <Text style={styles.waitingMessage}>
            Waiting for hydration data from your device
          </Text>
          <Text style={styles.waitingHint}>
            Make sure your SmartBottle is powered on and nearby
          </Text>
          <View style={styles.fallbackButtons}>
            <TouchableOpacity
              style={styles.fallbackButton}
              onPress={() => handleManualLog(250)}
              disabled={isLogging}
            >
              <Text style={styles.fallbackButtonText}>
                {isLogging ? "Logging..." : "Log 250ml"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.header,
          { borderLeftColor: isConnected ? colors.success : colors.danger },
        ]}
        onPress={() => setShowDetails(!showDetails)}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>SmartBottle</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: isConnected ? colors.success : colors.danger },
            ]}
          >
            <Text style={styles.statusBadgeText}>
              {isConnected ? "Connected" : "Disconnected"}
            </Text>
          </View>
        </View>

        <View style={styles.mainInfo}>
          <Text style={styles.hydrationValue}>{status.hydrationMl}ml</Text>
          <Text style={styles.hydrationLabel}>last intake</Text>
          <Text style={styles.timestamp}>{formatTime(status.lastUpdate)}</Text>
        </View>
      </TouchableOpacity>

      {showDetails && (
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Device</Text>
            <Text style={styles.detailValue}>{status.bottleMac}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Battery</Text>
            <View style={styles.batteryBar}>
              <View
                style={[
                  styles.batteryFill,
                  {
                    width: `${status.batteryLevel}%`,
                    backgroundColor: getBatteryColor(status.batteryLevel),
                  },
                ]}
              />
            </View>
            <Text style={styles.detailValue}>{status.batteryLevel}%</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Signal</Text>
            <Text style={styles.detailValue}>
              {formatSignal(status.signalStrength)} ({status.signalStrength} dBm)
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Last Update</Text>
            <Text style={styles.detailValue}>
              {new Date(status.lastUpdate).toLocaleTimeString()}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButton_250]}
          onPress={() => handleManualLog(250)}
          disabled={isLogging}
        >
          <Text style={styles.actionButtonText}>
            {isLogging ? "..." : "Log 250ml"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButton_500]}
          onPress={() => handleManualLog(500)}
          disabled={isLogging}
        >
          <Text style={styles.actionButtonText}>
            {isLogging ? "..." : "Log 500ml"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButton_750]}
          onPress={() => handleManualLog(750)}
          disabled={isLogging}
        >
          <Text style={styles.actionButtonText}>
            {isLogging ? "..." : "Log 750ml"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: spacing.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },

  header: {
    padding: spacing.md,
    borderLeftWidth: 4,
  },

  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },

  title: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.text,
  },

  statusBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
  },

  statusBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.surface,
  },

  mainInfo: {
    marginTop: spacing.sm,
  },

  hydrationValue: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.primary,
  },

  hydrationLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },

  timestamp: {
    fontSize: fontSize.xs,
    color: colors.muted,
    marginTop: 4,
  },

  details: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },

  detailLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },

  detailValue: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },

  batteryBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.background,
    borderRadius: 3,
    marginHorizontal: spacing.sm,
    overflow: "hidden",
  },

  batteryFill: {
    height: "100%",
  },

  actions: {
    flexDirection: "row",
    padding: spacing.md,
    gap: spacing.xs,
  },

  actionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  actionButton_250: {
    backgroundColor: colors.primary,
  },

  actionButton_500: {
    backgroundColor: colors.secondary,
  },

  actionButton_750: {
    backgroundColor: colors.info,
  },

  actionButtonText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.surface,
  },

  errorBox: {
    padding: spacing.md,
  },

  errorTitle: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.danger,
    marginBottom: spacing.xs,
  },

  errorMessage: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },

  waitingBox: {
    padding: spacing.md,
  },

  waitingTitle: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.xs,
  },

  waitingMessage: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },

  waitingHint: {
    fontSize: fontSize.xs,
    color: colors.muted,
    marginBottom: spacing.md,
    fontStyle: "italic",
  },

  fallbackButtons: {
    flexDirection: "row",
    gap: spacing.xs,
  },

  fallbackButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  fallbackButtonText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.surface,
  },
});
