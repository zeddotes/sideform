import { createFileRoute, redirect } from "@tanstack/react-router";
import { getCurrentUserFn } from "@/server/auth";

export const Route = createFileRoute("/")({
  component: IndexPage,
  beforeLoad: async () => {
    const user = await getCurrentUserFn();
    if (user) {
      throw redirect({ to: "/dashboard" });
    }
    throw redirect({ to: "/login" });
  },
});

function IndexPage() {
  return null;
}
