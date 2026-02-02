import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/meetings/new")({
  component: NewMeetingPage,
});

function NewMeetingPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 mb-4">Schedule meeting</h1>
      <p className="text-zinc-600 mb-6">Select meeting type, client, and time.</p>
      <Link
        to="/meetings"
        className="inline-flex items-center px-4 py-2 border border-zinc-300 rounded-md hover:bg-zinc-100"
      >
        Back to meetings
      </Link>
    </div>
  );
}
