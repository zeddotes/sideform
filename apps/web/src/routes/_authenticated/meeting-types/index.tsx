import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { listMeetingTypesFn } from "@/server/meetingTypes";

export const Route = createFileRoute("/_authenticated/meeting-types/")({
  loader: async () => {
    return listMeetingTypesFn();
  },
  component: MeetingTypesPage,
});

function MeetingTypesPage() {
  const meetingTypes = Route.useLoaderData();
  const navigate = useNavigate();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold text-zinc-900 mb-4">
        Meeting types
      </h1>
      <p className="text-zinc-600 mb-6">Manage templates for meetings.</p>
      <Link
        to="/meeting-types/new"
        className="inline-flex items-center px-4 py-2 bg-zinc-900 text-white rounded-md hover:bg-zinc-800 mb-6"
      >
        New meeting type
      </Link>
      {meetingTypes.length === 0 ? (
        <p className="text-zinc-500">No meeting types yet. Create one to get started.</p>
      ) : (
        <ul className="space-y-4">
          {meetingTypes.map((mt) => (
            <li
              key={mt.id}
              className="border border-zinc-200 rounded-md p-4 bg-white flex items-center justify-between"
            >
              <div>
                <h2 className="font-medium text-zinc-900">{mt.name}</h2>
                {mt.description && (
                  <p className="text-sm text-zinc-600 mt-1">{mt.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() =>
                  navigate({
                    to: "/meeting-types/$meetingTypeId/edit",
                    params: { meetingTypeId: mt.id },
                  })
                }
                className="px-4 py-2 border border-zinc-300 rounded-md hover:bg-zinc-100 text-sm font-medium text-zinc-700"
              >
                Edit
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
