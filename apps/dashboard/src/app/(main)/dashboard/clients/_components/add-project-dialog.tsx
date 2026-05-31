"use client";

import { useEffect, useState } from "react";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addProject } from "@/lib/db";
import type { Project } from "@/lib/types";

const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring";

type ProjectStatus = Project["status"];

type ProjectFormData = {
  name: string;
  address: string;
  status: ProjectStatus;
  budget: string;
  notes: string;
};

const EMPTY_PROJECT_FORM: ProjectFormData = {
  name: "",
  address: "",
  status: "Active",
  budget: "",
  notes: "",
};

interface AddProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  onCreated: (project: Project) => void;
}

/** Self-contained dialog for creating a new project space linked to a client. */
export function AddProjectDialog({ open, onOpenChange, clientId, clientName, onCreated }: AddProjectDialogProps) {
  const [form, setForm] = useState<ProjectFormData>(EMPTY_PROJECT_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setForm(EMPTY_PROJECT_FORM);
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Project title is required.");
      return;
    }

    setSubmitting(true);
    try {
      const newProj = await addProject({ clientId, ...form });
      onCreated(newProj);
      onOpenChange(false);
      toast.success("New design project successfully mapped to this client!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to initialize design project space.");
    } finally {
      setSubmitting(false);
    }
  };

  const LABEL_CLASS = "text-xs font-semibold tracking-wider uppercase text-muted-foreground";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md lg:max-w-2xl bg-popover/95 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle className="text-xl">Initialize Design Project</DialogTitle>
            <DialogDescription>
              Set up a new remodeling space, budget pool, and address pre-assigned to{" "}
              <span className="font-medium text-foreground">{clientName}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label className={LABEL_CLASS}>
                Project Title <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g. Penthouse Living Room, Coastal Kitchen"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className={LABEL_CLASS}>Project Budget Pool</Label>
                <Input
                  placeholder="e.g. $150,000"
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className={LABEL_CLASS}>Status</Label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}
                  className={SELECT_CLASS}
                >
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Paused">Paused</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className={LABEL_CLASS}>Site / Shipping Address</Label>
              <Input
                placeholder="e.g. 100 Ocean Drive, Newport, RI"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className={LABEL_CLASS}>Project Brief & Goals</Label>
              <Textarea
                placeholder="Warm organic minimalism, marble accent walls, gold hardware finish accents..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="flex items-center gap-2 cursor-pointer">
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Initialize Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
