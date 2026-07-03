import { useCallback } from "react";
import { useClerk, useSession } from "@clerk/react";
import {
  useStartImpersonation,
  useStopImpersonation,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const ADMIN_SESSION_KEY = "paperz:impersonation:admin-session-id";

export function useImpersonation() {
  const clerk = useClerk();
  const { session } = useSession();
  const queryClient = useQueryClient();
  const startMutation = useStartImpersonation();
  const stopMutation = useStopImpersonation();

  const actor = session?.actor as { sub?: string; type?: string } | null | undefined;
  const isImpersonating = !!actor && actor.type !== "agent";
  const actorSub = actor?.sub ?? null;

  const startImpersonation = useCallback(
    async (userId: number) => {
      const adminSessionId = clerk.session?.id;
      if (adminSessionId) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, adminSessionId);
      }

      const result = await startMutation.mutateAsync({ userId });

      const signIn = await clerk.client?.signIn.create({
        strategy: "ticket",
        ticket: result.signInToken,
      });

      if (signIn?.createdSessionId) {
        await clerk.setActive({ session: signIn.createdSessionId });
        await queryClient.invalidateQueries();
      }

      return result;
    },
    [clerk, startMutation, queryClient],
  );

  const stopImpersonation = useCallback(async () => {
    await stopMutation.mutateAsync();

    const adminSessionId = sessionStorage.getItem(ADMIN_SESSION_KEY);
    sessionStorage.removeItem(ADMIN_SESSION_KEY);

    if (adminSessionId) {
      await clerk.setActive({ session: adminSessionId });
    } else {
      await clerk.signOut();
    }
    await queryClient.invalidateQueries();
  }, [clerk, stopMutation, queryClient]);

  return {
    isImpersonating,
    actorSub,
    startImpersonation,
    stopImpersonation,
    isStarting: startMutation.isPending,
    isStopping: stopMutation.isPending,
  };
}
