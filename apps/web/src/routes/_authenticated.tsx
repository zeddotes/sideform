import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getCurrentUserFn } from "@/server/auth";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
  beforeLoad: async () => {
    const user = await getCurrentUserFn();
    if (!user) {
      throw redirect({ to: "/login" });
    }
    return { user };
  },
});

function AuthenticatedLayout() {
  const { user } = Route.useRouteContext();
  return (
    <div className="min-h-screen bg-zinc-50">
      <nav className="border-b border-zinc-200 bg-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="font-medium text-zinc-900">
            Sideform
          </Link>
          <Link to="/dashboard" className="text-sm text-zinc-600 hover:text-zinc-900">
            Dashboard
          </Link>
          <Link to="/meeting-types" className="text-sm text-zinc-600 hover:text-zinc-900">
            Meeting types
          </Link>
        </div>
        <span className="text-sm text-zinc-500">{user.email}</span>
        <Link to="/logout" className="text-sm text-zinc-600 hover:text-zinc-900">
          Log out
        </Link>
      </nav>
      <main className="p-4">
        <Outlet />
      </main>
    </div>
  );
}
