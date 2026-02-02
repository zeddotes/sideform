import { createFileRoute, redirect } from "@tanstack/react-router";
import { logoutFn } from "@/server/auth";

export const Route = createFileRoute("/logout")({
  component: LogoutPage,
  beforeLoad: async () => {
    await logoutFn();
    throw redirect({ to: "/login" });
  },
});

function LogoutPage() {
  return null;
}
