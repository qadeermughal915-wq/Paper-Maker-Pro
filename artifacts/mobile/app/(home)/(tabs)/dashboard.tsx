import { useUser } from "@clerk/expo";
import {
  useGetMe,
  useGetRecentPapers,
  useGetSchoolStats,
} from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import React from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { PaperCard } from "@/components/PaperCard";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen } from "@/components/ui/Screen";
import { Skeleton } from "@/components/ui/Skeleton";
import { fonts } from "@/constants/fonts";
import { useColors } from "@/hooks/useColors";

export default function DashboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useUser();
  const { data: me } = useGetMe();
  const stats = useGetSchoolStats();
  const recent = useGetRecentPapers();

  const onRefresh = () => {
    stats.refetch();
    recent.refetch();
  };

  const refreshing = stats.isRefetching || recent.isRefetching;
  const firstName = user?.firstName || "there";

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
          Welcome back,
        </Text>
        <Text style={[styles.name, { color: colors.foreground }]}>{firstName} 👋</Text>
        {me?.school?.name ? (
          <Text style={[styles.school, { color: colors.primary }]}>
            {me.school.name}
          </Text>
        ) : null}

        <View style={styles.statsGrid}>
          {stats.isLoading ? (
            <>
              <Skeleton height={104} style={{ flex: 1 }} radius={16} />
              <Skeleton height={104} style={{ flex: 1 }} radius={16} />
            </>
          ) : (
            <>
              <StatCard
                icon="help-circle"
                label="Questions"
                value={stats.data?.questions ?? 0}
              />
              <StatCard
                icon="file-text"
                label="Papers"
                value={stats.data?.papers ?? 0}
              />
            </>
          )}
        </View>
        <View style={styles.statsGrid}>
          {stats.isLoading ? (
            <>
              <Skeleton height={104} style={{ flex: 1 }} radius={16} />
              <Skeleton height={104} style={{ flex: 1 }} radius={16} />
            </>
          ) : (
            <>
              <StatCard
                icon="layers"
                label="Classes"
                value={stats.data?.classes ?? 0}
              />
              <StatCard
                icon="book"
                label="Subjects"
                value={stats.data?.subjects ?? 0}
              />
            </>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Recent papers
          </Text>
        </View>

        {recent.isLoading ? (
          <Card>
            <Skeleton height={20} width="70%" />
            <Skeleton height={14} width="40%" style={{ marginTop: 10 }} />
          </Card>
        ) : recent.data && recent.data.length > 0 ? (
          recent.data.map((paper) => (
            <PaperCard
              key={paper.id}
              paper={paper}
              onPress={() =>
                router.push({
                  pathname: "/paper/[id]",
                  params: { id: String(paper.id) },
                })
              }
            />
          ))
        ) : (
          <Card>
            <EmptyState
              icon="file-text"
              title="No papers yet"
              message="Papers you create on paperz.pk will show up here."
            />
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  greeting: {
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 26,
    marginTop: 2,
  },
  school: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 28,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 18,
  },
});
