import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/join/$meetingId")({
  component: JoinPage,
});

function JoinPage() {
  const { meetingId } = Route.useParams();
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-zinc-900 mb-2">Join meeting</h1>
        <p className="text-zinc-600">Meeting ID: {meetingId}</p>
        <p className="text-sm text-zinc-500 mt-4">Use the invite link with token (e.g. ?t=...) to join.</p>
      </div>
    </div>
  );
}
