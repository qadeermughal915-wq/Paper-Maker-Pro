import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { fonts } from "@/constants/fonts";
import { useColors } from "@/hooks/useColors";

interface BadgeProps {
  label: string;
  tone?: "neutral" | "primary" | "success" | "warning" | "danger";
}

export function Badge({ label, tone = "neutral" }: BadgeProps) {
  const colors = useColors();

  const palette: Record<string, { bg: string; fg: string }> = {
    neutral: { bg: colors.muted, fg: colors.mutedForeground },
    primary: { bg: colors.primaryTint, fg: colors.primary },
    success: { bg: "#DCFCE7", fg: "#15803D" },
    warning: { bg: "#FEF3C7", fg: "#B45309" },
    danger: { bg: "#FEE2E2", fg: "#B91C1C" },
  };

  const { bg, fg } = palette[tone];

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  text: {
    fontFamily: fonts.medium,
    fontSize: 12,
    letterSpacing: 0.2,
  },
});
