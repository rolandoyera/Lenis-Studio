"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { formatDistanceToNow } from "date-fns";
import { Loader2, MessageSquarePlus, Trash2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ActivityActor, ClientNote, NoteDeleteReason } from "@/lib/types";

const DELETE_REASONS: { value: NoteDeleteReason; label: string }[] = [
  { value: "created_in_error", label: "Created in error" },
  { value: "duplicate", label: "Duplicate" },
  { value: "no_longer_relevant", label: "No longer relevant" },
  { value: "other", label: "Other" },
];

const noteSchema = z.object({
  body: z.string().trim().min(1, "Write something first."),
});

type NoteFormData = z.infer<typeof noteSchema>;

interface ClientNotesLogCardProps {
  notes: ClientNote[];
  /** The signed-in user — only the creator of a note may delete it. */
  currentActor: ActivityActor;
  onAddNote: (body: string) => Promise<void>;
  onDeleteNote: (noteId: string, reason: NoteDeleteReason) => Promise<void>;
}

/**
 * Append-only notes log for a client. Distinct from the single-string "Design
 * Brief & Studio Notes" card: each entry here is an individual, timestamped,
 * immutable record. Notes can't be edited; the author can soft-delete their own
 * with a reason. Backed by the `clients/{clientId}/notes` subcollection.
 */
export function ClientNotesLogCard({
  notes,
  currentActor,
  onAddNote,
  onDeleteNote,
}: ClientNotesLogCardProps) {
  const { control, handleSubmit, reset, formState } = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: { body: "" },
  });

  const submit = async (data: NoteFormData) => {
    await onAddNote(data.body.trim());
    reset({ body: "" });
  };

  return (
    <Card className="pt-0">
      <CardHeader className="bg-muted/50 flex items-center h-15">
        <CardTitle>
          <MessageSquarePlus className="icons" />
          Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-2">
          <Controller
            control={control}
            name="body"
            render={({ field, fieldState }) => (
              <>
                <Textarea
                  {...field}
                  placeholder="Add a note. Notes can't be edited once saved."
                  aria-invalid={fieldState.invalid}
                  className="min-h-[72px]"
                />
                <div className="flex items-center justify-between">
                  <span className="text-destructive text-xs">
                    {fieldState.error?.message}
                  </span>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={formState.isSubmitting}
                    className="flex items-center gap-1.5"
                  >
                    {formState.isSubmitting && (
                      <Loader2 className="size-3.5 animate-spin" />
                    )}
                    Add Note
                  </Button>
                </div>
              </>
            )}
          />
        </form>

        {notes.length === 0 ? (
          <p className="py-4 text-center text-muted-foreground text-xs italic">
            No notes logged yet for this client.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {notes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                isOwn={note.createdBy.id === currentActor.id}
                onDelete={onDeleteNote}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

interface NoteItemProps {
  note: ClientNote;
  /** Whether the signed-in user authored this note (drives "You" + delete rights). */
  isOwn: boolean;
  onDelete: (noteId: string, reason: NoteDeleteReason) => Promise<void>;
}

function NoteItem({ note, isOwn, onDelete }: NoteItemProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<NoteDeleteReason | "">("");
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    if (!reason) return;
    setDeleting(true);
    try {
      await onDelete(note.id, reason);
      setOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <li className="rounded-lg border border-border/40 bg-background/25 p-3 shadow-inner">
      <p className="whitespace-pre-wrap text-foreground text-sm leading-relaxed">
        {note.body}
      </p>
      <div className="mt-2 flex items-center justify-between text-muted-foreground text-xs">
        <span>
          {isOwn ? "You" : note.createdBy.name} ·{" "}
          {formatDistanceToNow(note.createdAt, { addSuffix: true })}
        </span>
        {isOwn && (
          <AlertDialog open={open} onOpenChange={setOpen}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(true)}
              className="h-6 gap-1 px-2 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
              Delete
            </Button>
            <AlertDialogContent className="sm:max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this note?</AlertDialogTitle>
                <AlertDialogDescription>
                  Notes are kept for the record, so this is a soft delete — it
                  hides the note but preserves the audit trail. Choose a reason
                  to continue.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Select
                value={reason}
                onValueChange={(v) => setReason(v as NoteDeleteReason)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {DELETE_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <AlertDialogFooter className="mt-2">
                <AlertDialogCancel disabled={deleting}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    void handleConfirm();
                  }}
                  disabled={!reason || deleting}
                  className="flex items-center gap-1.5 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting && <Loader2 className="size-4 animate-spin" />}
                  Delete Note
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </li>
  );
}
