import { useAuth, useUser } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import { useGetMe } from "@workspace/api-client-react";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { fonts } from "@/constants/fonts";
import { useColors } from "@/hooks/useColors";

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  value?: string | null;
}) {
  const colors = useColors();
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={[styles.rowIcon, { backgroundColor: colors.primaryTint }]}>
        <Feather name={icon} size={16} color={colors.primary} />
      </View>
      <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.foreground }]} numberOfLines={1}>
        {value || "—"}
      </Text>
    </View>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const { signOut } = useAuth();
  const { user } = useUser();
  const { data: me } = useGetMe();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>

        <Card style={styles.section}>
          <View style={styles.profile}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {(user?.firstName?.[0] || me?.email?.[0] || "?").toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.foreground }]}>
                {me?.name || user?.fullName || "Teacher"}
              </Text>
              <Text style={[styles.email, { color: colors.mutedForeground }]}>
                {me?.email || user?.primaryEmailAddress?.emailAddress}
              </Text>
            </View>
          </View>
        </Card>

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          SCHOOL
        </Text>
        <Card padded={false} style={styles.section}>
          <Row icon="home" label="Name" value={me?.school?.name} />
          <Row icon="user" label="Role" value={me?.role ?? undefined} />
          <Row icon="map-pin" label="Address" value={me?.school?.address} />
          <Row icon="phone" label="Phone" value={me?.school?.phone} />
        </Card>

        <Button
          label="Sign out"
          variant="outline"
          onPress={() => signOut()}
          icon={<Feather name="log-out" size={18} color={colors.foreground} />}
          style={styles.signOut}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 26,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: "#FFFFFF",
  },
  name: {
    fontFamily: fonts.semibold,
    fontSize: 17,
  },
  email: {
    fontFamily: fonts.regular,
    fontSize: 14,
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  rowValue: {
    fontFamily: fonts.medium,
    fontSize: 14,
    flex: 1,
    textAlign: "right",
  },
  signOut: {
    marginTop: 8,
  },
});
