import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { fonts } from "@/constants/fonts";
import { useColors } from "@/hooks/useColors";

interface StatCardProps {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  value: number | string;
}

export function StatCard({ icon, label, value }: StatCardProps) {
  const colors = useColors();
  return (
    <Card style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: colors.primaryTint }]}>
        <Feather name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={[styles.value, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  value: {
    fontFamily: fonts.bold,
    fontSize: 24,
  },
  label: {
    fontFamily: fonts.regular,
    fontSize: 13,
    marginTop: 2,
  },
});
