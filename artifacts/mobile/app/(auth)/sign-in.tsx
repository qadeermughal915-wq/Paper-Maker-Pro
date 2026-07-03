import { useSignIn } from "@clerk/expo";
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

export default function SignInScreen() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();
  const colors = useColors();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [code, setCode] = React.useState("");

  const busy = fetchStatus === "fetching";

  const finalize = () =>
    signIn.finalize({
      navigate: ({ session }) => {
        if (session?.currentTask) return;
        router.replace("/");
      },
    });

  const handleSubmit = async () => {
    const { error } = await signIn.password({ emailAddress, password });
    if (error) return;

    if (signIn.status === "complete") {
      await finalize();
    } else if (signIn.status === "needs_client_trust") {
      const emailFactor = signIn.supportedSecondFactors.find(
        (f) => f.strategy === "email_code",
      );
      if (emailFactor) await signIn.mfa.sendEmailCode();
    }
  };

  const handleVerify = async () => {
    await signIn.mfa.verifyEmailCode({ code });
    if (signIn.status === "complete") await finalize();
  };

  if (signIn.status === "needs_client_trust") {
    return (
      <Screen style={styles.screen}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Verify it's you
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Enter the code we emailed you.
          </Text>
          <TextField
            label="Verification code"
            value={code}
            onChangeText={setCode}
            placeholder="123456"
            keyboardType="numeric"
          />
          {errors.fields.code ? (
            <Text style={[styles.error, { color: colors.destructive }]}>
              {errors.fields.code.message}
            </Text>
          ) : null}
          <Button label="Verify" onPress={handleVerify} loading={busy} />
          <Button
            label="Send a new code"
            variant="outline"
            onPress={() => signIn.mfa.sendEmailCode()}
            style={{ marginTop: 12 }}
          />
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
            Welcome back
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Sign in to your paperz.pk account
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
              error={errors.fields.identifier?.message}
            />
            <TextField
              label="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              error={errors.fields.password?.message}
            />

            {errors.raw && errors.raw.length > 0 ? (
              <Text style={[styles.error, { color: colors.destructive }]}>
                {(errors.raw[0] as { message?: string }).message}
              </Text>
            ) : null}

            <Button
              label="Sign in"
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
              Don't have an account?{" "}
            </Text>
            <Link href="/sign-up">
              <Text style={[styles.footerLink, { color: colors.primary }]}>
                Sign up
              </Text>
            </Link>
          </View>
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
