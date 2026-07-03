import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { PaperSummary } from "@workspace/api-client-react";

import { Card } from "@/components/ui/Card";
import { fonts } from "@/constants/fonts";
import { mediumLabels } from "@/constants/labels";
import { useColors } from "@/hooks/useColors";

export function PaperCard({
  paper,
  onPress,
}: {
  paper: PaperSummary;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
    >
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primaryTint }]}>
            <Feather name="file-text" size={20} color={colors.primary} />
          </View>
          <View style={styles.body}>
            <Text
              style={[styles.title, { color: colors.foreground }]}
              numberOfLines={2}
            >
              {paper.title}
            </Text>
            <Text style={[styles.meta, { color: colors.mutedForeground }]} numberOfLines={1}>
              {[paper.className, paper.subjectName].filter(Boolean).join(" · ")}
            </Text>
            <View style={styles.stats}>
              <Text style={[styles.stat, { color: colors.mutedForeground }]}>
                {paper.totalMarks} marks
              </Text>
              {typeof paper.questionCount === "number" ? (
                <Text style={[styles.stat, { color: colors.mutedForeground }]}>
                  · {paper.questionCount} questions
                </Text>
              ) : null}
              {paper.medium ? (
                <Text style={[styles.stat, { color: colors.mutedForeground }]}>
                  · {mediumLabels[paper.medium]}
                </Text>
              ) : null}
            </View>
          </View>
          <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 20,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 13,
    marginTop: 2,
  },
  stats: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
    gap: 4,
  },
  stat: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
});
