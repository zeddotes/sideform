import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/meetings/")({
  component: MeetingsPage,
});

function MeetingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 mb-4">Meetings</h1>
      <p className="text-zinc-600 mb-6">List of scheduled meetings.</p>
      <Link
        to="/meetings/new"
        className="inline-flex items-center px-4 py-2 bg-zinc-900 text-white rounded-md hover:bg-zinc-800"
      >
        Schedule meeting
      </Link>
    </div>
  );
}
