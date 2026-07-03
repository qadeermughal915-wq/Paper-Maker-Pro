import { useAuth } from "@clerk/expo";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { Redirect, Stack } from "expo-router";
import React from "react";

export default function HomeLayout() {
  const { isSignedIn, getToken } = useAuth();

  // Register synchronously during render so the token getter is in place
  // before any child screen's query observer fires its first request.
  setAuthTokenGetter(() => getToken());

  if (!isSignedIn) return <Redirect href="/sign-in" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="paper/[id]" />
    </Stack>
  );
}
