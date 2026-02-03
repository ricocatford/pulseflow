"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SignalForm } from "./SignalForm";
import type { Signal } from "@prisma/client";

interface SignalFormDialogProps {
  children?: React.ReactNode;
  signal?: Signal;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SignalFormDialog({
  children,
  signal,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: SignalFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  // Support both controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const onOpenChange = isControlled ? controlledOnOpenChange : setInternalOpen;

  const isEditing = !!signal;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Signal" : "Create New Signal"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the configuration for this signal."
              : "Set up a new signal to monitor web content changes."}
          </DialogDescription>
        </DialogHeader>
        <SignalForm signal={signal} onSuccess={() => onOpenChange?.(false)} />
      </DialogContent>
    </Dialog>
  );
}
