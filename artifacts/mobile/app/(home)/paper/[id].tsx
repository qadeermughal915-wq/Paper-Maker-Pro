import { useAuth } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import { useGetPaper } from "@workspace/api-client-react";
import * as FileSystem from "expo-file-system/legacy";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { PaperQuestion } from "@workspace/api-client-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { Skeleton } from "@/components/ui/Skeleton";
import { apiBaseUrl } from "@/constants/config";
import { fonts } from "@/constants/fonts";
import { mediumLabels, questionTypeLabels } from "@/constants/labels";
import { useColors } from "@/hooks/useColors";

function groupBySection(questions: PaperQuestion[]) {
  const map = new Map<string, PaperQuestion[]>();
  for (const q of [...questions].sort((a, b) => a.order - b.order)) {
    const key = q.section || "Section";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(q);
  }
  return Array.from(map.entries());
}

export default function PaperDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const paperId = Number(id);
  const { getToken } = useAuth();
  const [sharing, setSharing] = React.useState(false);

  const { data: paper, isLoading, isError } = useGetPaper(paperId);

  const handleExport = async () => {
    if (!paper) return;
    setSharing(true);
    try {
      const token = await getToken();
      const safeTitle = (paper.title || "paper").replace(/[^a-z0-9]+/gi, "_");
      const target = `${FileSystem.cacheDirectory}${safeTitle}.pdf`;
      const url = `${apiBaseUrl}/api/papers/${paperId}/pdf`;

      const result = await FileSystem.downloadAsync(url, target, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (result.status !== 200) {
        throw new Error(`Server returned ${result.status}`);
      }

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Sharing unavailable", "Sharing is not available on this device.");
        return;
      }

      await Sharing.shareAsync(result.uri, {
        mimeType: "application/pdf",
        UTI: "com.adobe.pdf",
        dialogTitle: paper.title,
      });
    } catch (err) {
      Alert.alert(
        "Export failed",
        "We couldn't generate the PDF. Please try again.",
      );
      console.error("PDF export error:", err);
    } finally {
      setSharing(false);
    }
  };

  return (
    <Screen>
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backBtn}
        >
          <Feather name="chevron-left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.topTitle, { color: colors.foreground }]} numberOfLines={1}>
          Paper
        </Text>
        <View style={styles.backBtn} />
      </View>

      {isLoading ? (
        <View style={styles.content}>
          <Skeleton height={28} width="80%" />
          <Skeleton height={16} width="50%" style={{ marginTop: 12 }} />
          <Skeleton height={120} radius={16} style={{ marginTop: 20 }} />
        </View>
      ) : isError || !paper ? (
        <View style={styles.content}>
          <Text style={[styles.errorText, { color: colors.mutedForeground }]}>
            This paper couldn't be loaded.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {paper.title}
          </Text>
          <View style={styles.metaRow}>
            {paper.className ? <Badge label={paper.className} tone="primary" /> : null}
            {paper.subjectName ? <Badge label={paper.subjectName} /> : null}
            <Badge label={mediumLabels[paper.medium]} />
          </View>

          <Card style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.foreground }]}>
                  {paper.totalMarks}
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                  Total marks
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.foreground }]}>
                  {paper.questions.length}
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                  Questions
                </Text>
              </View>
              {paper.durationMinutes ? (
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: colors.foreground }]}>
                    {paper.durationMinutes}m
                  </Text>
                  <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                    Duration
                  </Text>
                </View>
              ) : null}
            </View>
          </Card>

          {paper.instructions ? (
            <Card style={styles.section}>
              <Text style={[styles.sectionHeading, { color: colors.foreground }]}>
                Instructions
              </Text>
              <Text style={[styles.instructions, { color: colors.mutedForeground }]}>
                {paper.instructions}
              </Text>
            </Card>
          ) : null}

          {groupBySection(paper.questions).map(([section, items]) => (
            <View key={section} style={styles.section}>
              <Text style={[styles.sectionHeading, { color: colors.foreground }]}>
                {section}
              </Text>
              {items.map((q, idx) => (
                <Card key={q.id ?? `${section}-${idx}`} style={styles.qCard}>
                  <View style={styles.qHeader}>
                    <Text style={[styles.qNum, { color: colors.primary }]}>
                      Q{q.order}
                    </Text>
                    <View style={styles.qBadges}>
                      <Badge label={questionTypeLabels[q.type]} tone="primary" />
                      <Text style={[styles.qMarks, { color: colors.mutedForeground }]}>
                        {q.marks} {q.marks === 1 ? "mark" : "marks"}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.qText, { color: colors.foreground }]}>
                    {q.text}
                  </Text>
                  {q.options && q.options.length > 0 ? (
                    <View style={styles.qOptions}>
                      {q.options.map((opt, i) => (
                        <Text
                          key={i}
                          style={[styles.qOption, { color: colors.mutedForeground }]}
                        >
                          {String.fromCharCode(65 + i)}. {opt}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                </Card>
              ))}
            </View>
          ))}
        </ScrollView>
      )}

      {paper && !isLoading ? (
        <View
          style={[
            styles.footer,
            { backgroundColor: colors.card, borderTopColor: colors.border },
          ]}
        >
          <Button
            label="Export & Share PDF"
            onPress={handleExport}
            loading={sharing}
            icon={<Feather name="share" size={18} color="#FFFFFF" />}
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  errorText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    textAlign: "center",
    marginTop: 40,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 30,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  summaryCard: {
    marginTop: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryValue: {
    fontFamily: fonts.bold,
    fontSize: 22,
  },
  summaryLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: 2,
  },
  section: {
    marginTop: 24,
  },
  sectionHeading: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    marginBottom: 12,
  },
  instructions: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
  },
  qCard: {
    marginBottom: 12,
  },
  qHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  qNum: {
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  qBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  qMarks: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  qText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 22,
  },
  qOptions: {
    marginTop: 10,
    gap: 6,
  },
  qOption: {
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
