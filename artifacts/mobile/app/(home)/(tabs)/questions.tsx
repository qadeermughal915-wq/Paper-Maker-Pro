import {
  useListClasses,
  useListQuestions,
  useListSubjects,
  type ListQuestionsParams,
  type QuestionType,
} from "@workspace/api-client-react";
import React from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { QuestionCard } from "@/components/QuestionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen } from "@/components/ui/Screen";
import { Skeleton } from "@/components/ui/Skeleton";
import { TextField } from "@/components/ui/TextField";
import { fonts } from "@/constants/fonts";
import { questionTypeLabels } from "@/constants/labels";
import { useColors } from "@/hooks/useColors";

const TYPES: QuestionType[] = [
  "mcq",
  "short",
  "long",
  "exercise",
  "conceptual",
  "past_paper",
];

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.primary : colors.card,
          borderColor: active ? colors.primary : colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: active ? "#FFFFFF" : colors.foreground },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function QuestionsScreen() {
  const colors = useColors();
  const [search, setSearch] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const [classId, setClassId] = React.useState<number | undefined>();
  const [subjectId, setSubjectId] = React.useState<number | undefined>();
  const [type, setType] = React.useState<QuestionType | undefined>();

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const classes = useListClasses();
  const subjects = useListSubjects(classId ? { classId } : undefined);

  const params: ListQuestionsParams = {
    ...(classId ? { classId } : {}),
    ...(subjectId ? { subjectId } : {}),
    ...(type ? { type } : {}),
    ...(debounced ? { search: debounced } : {}),
  };
  const questions = useListQuestions(params);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Question Bank
        </Text>
      </View>

      <View style={styles.searchWrap}>
        <TextField
          value={search}
          onChangeText={setSearch}
          placeholder="Search questions..."
          autoCapitalize="none"
          style={{ marginBottom: 0 }}
        />
      </View>

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <Chip
            label="All classes"
            active={!classId}
            onPress={() => {
              setClassId(undefined);
              setSubjectId(undefined);
            }}
          />
          {classes.data?.map((c) => (
            <Chip
              key={c.id}
              label={c.name}
              active={classId === c.id}
              onPress={() => {
                setClassId(c.id);
                setSubjectId(undefined);
              }}
            />
          ))}
        </ScrollView>
      </View>

      {classId ? (
        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            <Chip
              label="All subjects"
              active={!subjectId}
              onPress={() => setSubjectId(undefined)}
            />
            {subjects.data?.map((s) => (
              <Chip
                key={s.id}
                label={s.name}
                active={subjectId === s.id}
                onPress={() => setSubjectId(s.id)}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <Chip label="All types" active={!type} onPress={() => setType(undefined)} />
          {TYPES.map((t) => (
            <Chip
              key={t}
              label={questionTypeLabels[t]}
              active={type === t}
              onPress={() => setType(type === t ? undefined : t)}
            />
          ))}
        </ScrollView>
      </View>

      {questions.isLoading ? (
        <View style={styles.list}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={140} radius={16} style={{ marginBottom: 12 }} />
          ))}
        </View>
      ) : questions.data && questions.data.length > 0 ? (
        <FlatList
          data={questions.data}
          keyExtractor={(q) => String(q.id)}
          renderItem={({ item }) => <QuestionCard question={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={questions.isRefetching}
          onRefresh={() => questions.refetch()}
        />
      ) : (
        <EmptyState
          icon="search"
          title="No questions found"
          message="Try adjusting your filters or search terms."
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 26,
  },
  searchWrap: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  filterRow: {
    paddingHorizontal: 20,
    gap: 8,
    paddingVertical: 6,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  list: {
    padding: 20,
    paddingTop: 12,
  },
});
