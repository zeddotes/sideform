import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 mb-4">Dashboard</h1>
      <p className="text-zinc-600 mb-6">Upcoming meetings and quick actions.</p>
      <div className="flex gap-4">
        <Link
          to="/meetings/new"
          className="inline-flex items-center px-4 py-2 bg-zinc-900 text-white rounded-md hover:bg-zinc-800"
        >
          Create meeting
        </Link>
        <Link
          to="/meeting-types"
          className="inline-flex items-center px-4 py-2 border border-zinc-300 rounded-md hover:bg-zinc-100"
        >
          Meeting types
        </Link>
      </div>
    </div>
  );
}
