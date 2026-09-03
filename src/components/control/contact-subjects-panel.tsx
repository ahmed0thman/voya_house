"use client";

import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { toast } from "sonner";
import {
  useContactSubjects,
  useDeleteContactSubject,
  useReorderContactSubjects,
} from "@/hooks/use-contact";
import { Skeleton } from "@/components/ui/skeleton";
import { ContactSubjectFormDialog } from "./contact-subject-form-dialog";
import { DeleteConfirmButton } from "./delete-confirm-button";
import { cn } from "@/lib/utils";

export function ContactSubjectsPanel() {
  const { data: subjects, isLoading, isError } = useContactSubjects();
  const deleteSubject = useDeleteContactSubject();
  const reorderSubjects = useReorderContactSubjects();

  const move = (index: number, direction: -1 | 1) => {
    if (!subjects) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= subjects.length) return;
    const orderedIds = subjects.map((s) => s.id);
    [orderedIds[index], orderedIds[targetIndex]] = [
      orderedIds[targetIndex],
      orderedIds[index],
    ];
    reorderSubjects.mutate(
      { orderedIds },
      { onError: (error) => toast.error(error.message) },
    );
  };

  return (
    <div className="rounded-xl border">
      <div className="flex items-center justify-between border-b p-4">
        <div>
          <h2 className="font-medium">Contact subjects</h2>
          <p className="text-sm text-muted-foreground">
            Shown as topic chips on the landing page&apos;s contact form.
          </p>
        </div>
        <ContactSubjectFormDialog mode="create" />
      </div>

      {isLoading ? (
        <div className="space-y-2 p-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : isError ? (
        <p className="p-6 text-center text-sm text-destructive">
          Couldn&apos;t load subjects.
        </p>
      ) : !subjects?.length ? (
        <p className="p-6 text-center text-sm text-muted-foreground">
          No subjects yet.
        </p>
      ) : (
        <ul className="divide-y">
          {subjects.map((subject, index) => (
            <li key={subject.id} className="flex items-center gap-1 p-2">
              <div className="flex flex-col shrink-0">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  aria-label="Move up"
                >
                  <ArrowUpIcon className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === subjects.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ArrowDownIcon className="size-3.5" />
                </button>
              </div>

              <div className="flex flex-1 items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm">
                <span
                  className={cn(
                    "truncate",
                    !subject.isActive && "text-muted-foreground line-through",
                  )}
                >
                  {subject.label}
                  {subject.labelAr && (
                    <span className="text-muted-foreground" dir="rtl">
                      {" "}
                      · {subject.labelAr}
                    </span>
                  )}
                </span>
              </div>

              <div className="flex shrink-0 items-center">
                <ContactSubjectFormDialog mode="edit" subject={subject} />
                <DeleteConfirmButton
                  title="Delete this subject?"
                  description={`"${subject.label}" will be permanently removed. Past messages that used it keep their own copy of the label.`}
                  isPending={deleteSubject.isPending}
                  onConfirm={() =>
                    deleteSubject.mutate(
                      { id: subject.id },
                      { onError: (error) => toast.error(error.message) },
                    )
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
