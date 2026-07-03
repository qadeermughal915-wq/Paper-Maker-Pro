import { useListPapers } from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

import { PaperCard } from "@/components/PaperCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen } from "@/components/ui/Screen";
import { Skeleton } from "@/components/ui/Skeleton";
import { fonts } from "@/constants/fonts";
import { useColors } from "@/hooks/useColors";

export default function PapersScreen() {
  const colors = useColors();
  const router = useRouter();
  const papers = useListPapers();

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Papers</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Exam papers created for your school
        </Text>
      </View>

      {papers.isLoading ? (
        <View style={styles.list}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={92} radius={16} style={{ marginBottom: 12 }} />
          ))}
        </View>
      ) : papers.data && papers.data.length > 0 ? (
        <FlatList
          data={papers.data}
          keyExtractor={(p) => String(p.id)}
          renderItem={({ item }) => (
            <PaperCard
              paper={item}
              onPress={() =>
                router.push({
                  pathname: "/paper/[id]",
                  params: { id: String(item.id) },
                })
              }
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={papers.isRefetching}
          onRefresh={() => papers.refetch()}
        />
      ) : (
        <EmptyState
          icon="file-text"
          title="No papers yet"
          message="Create exam papers on paperz.pk and they'll appear here for export and sharing."
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 26,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    marginTop: 4,
  },
  list: {
    padding: 20,
    paddingTop: 12,
  },
});
