import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { getMeetingTypeFn, type MeetingTypeWithDetails } from "@/server/meetingTypes";

export const Route = createFileRoute(
  "/_authenticated/meeting-types/$meetingTypeId/preview"
)({
  loader: async ({ params }): Promise<MeetingTypeWithDetails> => {
    const meetingTypeId = params.meetingTypeId;
    const mt = await (getMeetingTypeFn as unknown as (opts: {
      data: { meetingTypeId: string };
    }) => Promise<MeetingTypeWithDetails | null>)({ data: { meetingTypeId } });
    if (!mt) throw redirect({ to: "/meeting-types" });
    return mt;
  },
  component: PreviewMeetingTypePage,
});

function initialNotesState(mt: MeetingTypeWithDetails) {
  return mt.sections.map((s) => ({
    fieldValues: s.fields.map(() => ""),
    freeformValues: s.freeformBlocks.map(() => ""),
  }));
}

function PreviewMeetingTypePage() {
  const { meetingTypeId } = Route.useParams();
  const mt = Route.useLoaderData();
  const [notesState, setNotesState] = useState(() => initialNotesState(mt));

  const setFieldValue = (sectionIndex: number, fieldIndex: number, value: string) => {
    setNotesState((prev) =>
      prev.map((s, i) =>
        i === sectionIndex
          ? {
              ...s,
              fieldValues: s.fieldValues.map((v, j) =>
                j === fieldIndex ? value : v
              ),
            }
          : s
      )
    );
  };

  const setFreeformValue = (
    sectionIndex: number,
    blockIndex: number,
    value: string
  ) => {
    setNotesState((prev) =>
      prev.map((s, i) =>
        i === sectionIndex
          ? {
              ...s,
              freeformValues: s.freeformValues.map((v, j) =>
                j === blockIndex ? value : v
              ),
            }
          : s
      )
    );
  };

  const inputClass = "w-full px-3 py-2 border border-zinc-300 rounded-md";

  return (
    <div className="fixed inset-0 flex flex-col bg-zinc-50">
      {/* Top bar */}
      <header className="flex items-center justify-between shrink-0 h-14 px-4 bg-zinc-900 text-white border-b border-zinc-700">
        <div className="flex items-center gap-4">
          <span className="font-medium truncate max-w-[200px]" title={mt.name}>
            {mt.name}
          </span>
          <span className="text-zinc-400 text-sm font-mono">0:00</span>
          <span className="text-zinc-500 text-sm">Preview</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/meeting-types"
            className="px-3 py-1.5 text-sm border border-zinc-600 rounded-md hover:bg-zinc-800"
          >
            Leave preview
          </Link>
          <Link
            to="/meeting-types/$meetingTypeId/edit"
            params={{ meetingTypeId }}
            className="px-3 py-1.5 text-sm border border-zinc-600 rounded-md hover:bg-zinc-800"
          >
            Edit meeting type
          </Link>
        </div>
      </header>

      {/* Two-panel: video left, notes right */}
      <div className="flex-1 flex min-h-0">
        {/* Left: video placeholder */}
        <div className="w-[40%] shrink-0 flex flex-col gap-2 p-4 bg-zinc-100 border-r border-zinc-200">
          <div className="flex-1 min-h-0 rounded-lg bg-zinc-300 flex items-center justify-center text-zinc-500 text-sm">
            Video
          </div>
          <div className="rounded-lg bg-zinc-300 aspect-video flex items-center justify-center text-zinc-500 text-sm">
            You
          </div>
        </div>

        {/* Right: notes pane */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="overflow-y-auto p-4">
            {mt.description && (
              <p className="text-sm text-zinc-600 mb-4">{mt.description}</p>
            )}
            <div className="space-y-6 max-w-2xl">
              {mt.sections.map((section, sectionIndex) => (
                <div
                  key={section.id}
                  className="border border-zinc-200 rounded-md p-4 bg-white space-y-4"
                >
                  <h2 className="text-lg font-medium text-zinc-900">
                    {section.title}
                  </h2>
                  <div className="space-y-3">
                    {section.fields.map((field, fieldIndex) => (
                      <div key={field.id} className="space-y-1">
                        <label className="block text-sm font-medium text-zinc-700">
                          {field.label}
                        </label>
                        {field.helperText && (
                          <p className="text-xs text-zinc-500">
                            {field.helperText}
                          </p>
                        )}
                        <input
                          type="text"
                          value={notesState[sectionIndex]?.fieldValues[fieldIndex] ?? ""}
                          onChange={(e) =>
                            setFieldValue(
                              sectionIndex,
                              fieldIndex,
                              e.target.value
                            )
                          }
                          placeholder={field.placeholder ?? ""}
                          className={inputClass}
                        />
                      </div>
                    ))}
                    {section.freeformBlocks.map((block, blockIndex) => (
                      <div key={block.id} className="space-y-1">
                        <label className="block text-sm font-medium text-zinc-700">
                          {block.label}
                        </label>
                        <textarea
                          value={
                            notesState[sectionIndex]?.freeformValues[
                              blockIndex
                            ] ?? ""
                          }
                          onChange={(e) =>
                            setFreeformValue(
                              sectionIndex,
                              blockIndex,
                              e.target.value
                            )
                          }
                          placeholder={block.placeholder ?? ""}
                          rows={4}
                          className={inputClass}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
