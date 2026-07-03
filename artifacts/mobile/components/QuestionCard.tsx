import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { Question } from "@workspace/api-client-react";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { fonts } from "@/constants/fonts";
import {
  difficultyLabels,
  difficultyTone,
  mediumLabels,
  questionTypeLabels,
} from "@/constants/labels";
import { useColors } from "@/hooks/useColors";

export function QuestionCard({ question }: { question: Question }) {
  const colors = useColors();
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.badges}>
          <Badge label={questionTypeLabels[question.type]} tone="primary" />
          <Badge
            label={difficultyLabels[question.difficulty]}
            tone={difficultyTone[question.difficulty]}
          />
        </View>
        <Text style={[styles.marks, { color: colors.mutedForeground }]}>
          {question.marks} {question.marks === 1 ? "mark" : "marks"}
        </Text>
      </View>

      <Text style={[styles.text, { color: colors.foreground }]} numberOfLines={4}>
        {question.text}
      </Text>

      {question.options && question.options.length > 0 ? (
        <View style={styles.options}>
          {question.options.slice(0, 4).map((opt, i) => (
            <Text
              key={i}
              style={[styles.option, { color: colors.mutedForeground }]}
              numberOfLines={1}
            >
              {String.fromCharCode(65 + i)}. {opt}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text style={[styles.meta, { color: colors.mutedForeground }]} numberOfLines={1}>
          {[question.className, question.subjectName, question.chapterName]
            .filter(Boolean)
            .join(" · ") || mediumLabels[question.medium]}
        </Text>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>
          {mediumLabels[question.medium]}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  badges: {
    flexDirection: "row",
    gap: 8,
  },
  marks: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  text: {
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 22,
  },
  options: {
    marginTop: 10,
    gap: 4,
  },
  option: {
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    flexShrink: 1,
  },
});
