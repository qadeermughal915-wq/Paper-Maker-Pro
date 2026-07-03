import { useSignUp } from "@clerk/expo";
import { Link, useRouter } from "expo-router";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { GoogleButton } from "@/components/GoogleButton";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { TextField } from "@/components/ui/TextField";
import { fonts } from "@/constants/fonts";
import { useColors } from "@/hooks/useColors";

export default function SignUpScreen() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const router = useRouter();
  const colors = useColors();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [code, setCode] = React.useState("");

  const busy = fetchStatus === "fetching";

  const handleSubmit = async () => {
    const { error } = await signUp.password({ emailAddress, password });
    if (error) return;
    await signUp.verifications.sendEmailCode();
  };

  const handleVerify = async () => {
    await signUp.verifications.verifyEmailCode({ code });
    if (signUp.status === "complete") {
      await signUp.finalize({
        navigate: ({ session }) => {
          if (session?.currentTask) return;
          router.replace("/");
        },
      });
    }
  };

  const awaitingCode =
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address") &&
    signUp.missingFields.length === 0;

  if (awaitingCode) {
    return (
      <Screen style={styles.screen}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Verify your email
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            We sent a code to {emailAddress}
          </Text>
          <View style={styles.form}>
            <TextField
              label="Verification code"
              value={code}
              onChangeText={setCode}
              placeholder="123456"
              keyboardType="numeric"
              error={errors.fields.code?.message}
            />
            <Button label="Verify & continue" onPress={handleVerify} loading={busy} />
            <Button
              label="Resend code"
              variant="outline"
              onPress={() => signUp.verifications.sendEmailCode()}
              style={{ marginTop: 12 }}
            />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
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
            Create your account
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Start building exam papers on the go
          </Text>

          <View style={styles.form}>
            <TextField
              label="Email"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={emailAddress}
              onChangeText={setEmailAddress}
              placeholder="you@school.edu"
              error={errors.fields.emailAddress?.message}
            />
            <TextField
              label="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              error={errors.fields.password?.message}
            />

            {errors.raw && errors.raw.length > 0 ? (
              <Text style={[styles.error, { color: colors.destructive }]}>
                {(errors.raw[0] as { message?: string }).message}
              </Text>
            ) : null}

            <Button
              label="Sign up"
              onPress={handleSubmit}
              loading={busy}
              disabled={!emailAddress || !password}
            />

            <View style={styles.divider}>
              <View style={[styles.line, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>
                or
              </Text>
              <View style={[styles.line, { backgroundColor: colors.border }]} />
            </View>

            <GoogleButton />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
              Already have an account?{" "}
            </Text>
            <Link href="/sign-in">
              <Text style={[styles.footerLink, { color: colors.primary }]}>
                Sign in
              </Text>
            </Link>
          </View>

          <View nativeID="clerk-captcha" />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
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
  },
  form: {
    marginTop: 32,
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: 13,
    marginBottom: 12,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    gap: 12,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 32,
    alignItems: "center",
  },
  footerText: {
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  footerLink: {
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
});
