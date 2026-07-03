import { useQueryClient } from "@tanstack/react-query";
import {
  getGetMeQueryKey,
  useOnboardSchool,
} from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { TextField } from "@/components/ui/TextField";
import { fonts } from "@/constants/fonts";
import { useColors } from "@/hooks/useColors";

export default function OnboardingScreen() {
  const colors = useColors();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const onboard = useOnboardSchool({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        router.replace("/dashboard");
      },
      onError: () => {
        setError("Couldn't save your school. Please try again.");
      },
    },
  });

  const handleSubmit = () => {
    setError(null);
    onboard.mutate({
      data: {
        name: name.trim(),
        ...(address.trim() ? { address: address.trim() } : {}),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
      },
    });
  };

  return (
    <Screen style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.logo, { backgroundColor: colors.primary }]}>
            <Text style={styles.logoText}>P</Text>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Set up your school
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Tell us about your school to get started. You can change this later.
          </Text>

          <View style={styles.form}>
            <TextField
              label="School name"
              value={name}
              onChangeText={setName}
              placeholder="e.g. City Grammar School"
            />
            <TextField
              label="Address (optional)"
              value={address}
              onChangeText={setAddress}
              placeholder="Street, city"
            />
            <TextField
              label="Phone (optional)"
              value={phone}
              onChangeText={setPhone}
              placeholder="+92 ..."
              keyboardType="phone-pad"
            />

            {error ? (
              <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
            ) : null}

            <Button
              label="Continue"
              onPress={handleSubmit}
              loading={onboard.isPending}
              disabled={name.trim().length === 0}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  logoText: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: "#FFFFFF",
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 28,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 15,
    marginTop: 6,
    lineHeight: 22,
  },
  form: {
    marginTop: 32,
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: 13,
    marginBottom: 12,
  },
});
