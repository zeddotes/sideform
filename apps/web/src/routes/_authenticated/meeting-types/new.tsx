import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { createMeetingTypeFn } from "@/server/meetingTypes";

export const Route = createFileRoute("/_authenticated/meeting-types/new")({
  component: NewMeetingTypePage,
});

type FieldState = { label: string; placeholder: string; helperText: string };
type FreeformBlockState = { label: string; placeholder: string };
type SectionState = {
  title: string;
  fields: FieldState[];
  freeformBlocks: FreeformBlockState[];
};

const emptyField = (): FieldState => ({
  label: "",
  placeholder: "",
  helperText: "",
});
const emptyFreeformBlock = (): FreeformBlockState => ({
  label: "",
  placeholder: "",
});
const emptySection = (): SectionState => ({
  title: "",
  fields: [],
  freeformBlocks: [],
});

function NewMeetingTypePage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sections, setSections] = useState<SectionState[]>([emptySection()]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const addSection = () => {
    setSections((prev) => [...prev, emptySection()]);
  };
  const removeSection = (index: number) => {
    setSections((prev) => prev.filter((_, i) => i !== index));
  };
  const updateSection = (index: number, updates: Partial<SectionState>) => {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...updates } : s))
    );
  };
  const addField = (sectionIndex: number) => {
    setSections((prev) =>
      prev.map((s, i) =>
        i === sectionIndex
          ? { ...s, fields: [...s.fields, emptyField()] }
          : s
      )
    );
  };
  const removeField = (sectionIndex: number, fieldIndex: number) => {
    setSections((prev) =>
      prev.map((s, i) =>
        i === sectionIndex
          ? { ...s, fields: s.fields.filter((_, j) => j !== fieldIndex) }
          : s
      )
    );
  };
  const updateField = (
    sectionIndex: number,
    fieldIndex: number,
    updates: Partial<FieldState>
  ) => {
    setSections((prev) =>
      prev.map((s, i) =>
        i === sectionIndex
          ? {
              ...s,
              fields: s.fields.map((f, j) =>
                j === fieldIndex ? { ...f, ...updates } : f
              ),
            }
          : s
      )
    );
  };
  const addFreeformBlock = (sectionIndex: number) => {
    setSections((prev) =>
      prev.map((s, i) =>
        i === sectionIndex
          ? { ...s, freeformBlocks: [...s.freeformBlocks, emptyFreeformBlock()] }
          : s
      )
    );
  };
  const removeFreeformBlock = (sectionIndex: number, blockIndex: number) => {
    setSections((prev) =>
      prev.map((s, i) =>
        i === sectionIndex
          ? {
              ...s,
              freeformBlocks: s.freeformBlocks.filter((_, j) => j !== blockIndex),
            }
          : s
      )
    );
  };
  const updateFreeformBlock = (
    sectionIndex: number,
    blockIndex: number,
    updates: Partial<FreeformBlockState>
  ) => {
    setSections((prev) =>
      prev.map((s, i) =>
        i === sectionIndex
          ? {
              ...s,
              freeformBlocks: s.freeformBlocks.map((b, j) =>
                j === blockIndex ? { ...b, ...updates } : b
              ),
            }
          : s
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        sections: sections.map((s, i) => ({
          title: s.title.trim(),
          orderIndex: i,
          fields: s.fields.map((f, j) => ({
            label: f.label.trim(),
            placeholder: f.placeholder.trim() || null,
            helperText: f.helperText.trim() || null,
            orderIndex: j,
          })),
          freeformBlocks: s.freeformBlocks.map((b, j) => ({
            label: b.label.trim(),
            placeholder: b.placeholder.trim() || null,
            orderIndex: j,
          })),
        })),
      };
      const result = await createMeetingTypeFn({ data: payload });
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.id) {
        navigate({ to: "/meeting-types/$meetingTypeId/edit", params: { meetingTypeId: result.id } });
      } else {
        navigate({ to: "/meeting-types" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create meeting type");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-3 py-2 border border-zinc-300 rounded-md";

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold text-zinc-900 mb-4">
        New meeting type
      </h1>
      <p className="text-zinc-600 mb-6">
        Add sections and fields for this template.
      </p>
      <Link
        to="/meeting-types"
        className="inline-flex items-center px-4 py-2 border border-zinc-300 rounded-md hover:bg-zinc-100 mb-6"
      >
        Back to meeting types
      </Link>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-1">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-zinc-700 mb-1">
            Description (optional)
          </label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-zinc-900">Sections</h2>
          {sections.map((section, sectionIndex) => (
            <div
              key={sectionIndex}
              className="border border-zinc-200 rounded-md p-4 bg-white space-y-4"
            >
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-zinc-700">
                  Section title
                </label>
                {sections.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeSection(sectionIndex);
                    }}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Remove section
                  </button>
                )}
              </div>
              <input
                type="text"
                value={section.title}
                onChange={(e) =>
                  updateSection(sectionIndex, { title: e.target.value })
                }
                placeholder="Section title"
                className={inputClass}
              />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-700">Fields</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      addField(sectionIndex);
                    }}
                    className="text-sm text-zinc-600 hover:underline"
                  >
                    Add field
                  </button>
                </div>
                {section.fields.map((field, fieldIndex) => (
                  <div
                    key={fieldIndex}
                    className="pl-4 border-l-2 border-zinc-200 space-y-2"
                  >
                    <div className="flex justify-between">
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) =>
                          updateField(sectionIndex, fieldIndex, {
                            label: e.target.value,
                          })
                        }
                        placeholder="Field label"
                        className={`${inputClass} flex-1 mr-2`}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeField(sectionIndex, fieldIndex);
                        }}
                        className="text-sm text-red-600 hover:underline shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      type="text"
                      value={field.placeholder}
                      onChange={(e) =>
                        updateField(sectionIndex, fieldIndex, {
                          placeholder: e.target.value,
                        })
                      }
                      placeholder="Placeholder (optional)"
                      className={inputClass}
                    />
                    <input
                      type="text"
                      value={field.helperText}
                      onChange={(e) =>
                        updateField(sectionIndex, fieldIndex, {
                          helperText: e.target.value,
                        })
                      }
                      placeholder="Helper text (optional)"
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-700">
                    Freeform blocks
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      addFreeformBlock(sectionIndex);
                    }}
                    className="text-sm text-zinc-600 hover:underline"
                  >
                    Add freeform block
                  </button>
                </div>
                {section.freeformBlocks.map((block, blockIndex) => (
                  <div
                    key={blockIndex}
                    className="pl-4 border-l-2 border-zinc-200 flex gap-2 items-center"
                  >
                    <input
                      type="text"
                      value={block.label}
                      onChange={(e) =>
                        updateFreeformBlock(sectionIndex, blockIndex, {
                          label: e.target.value,
                        })
                      }
                      placeholder="Block label (e.g. Notes)"
                      className={`${inputClass} flex-1`}
                    />
                    <input
                      type="text"
                      value={block.placeholder}
                      onChange={(e) =>
                        updateFreeformBlock(sectionIndex, blockIndex, {
                          placeholder: e.target.value,
                        })
                      }
                      placeholder="Placeholder (optional)"
                      className={`${inputClass} flex-1`}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeFreeformBlock(sectionIndex, blockIndex);
                      }}
                      className="text-sm text-red-600 hover:underline shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addSection();
            }}
            className="px-4 py-2 border border-zinc-300 rounded-md hover:bg-zinc-100"
          >
            Add section
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-zinc-900 text-white rounded-md hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create meeting type"}
        </button>
      </form>
    </div>
  );
}
