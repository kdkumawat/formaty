"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";

export interface DeleteConfirmDialogProps {
  open: boolean;
  count: number;
  confirming: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteConfirmDialog({
  open,
  count,
  confirming,
  onOpenChange,
  onConfirm,
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <AlertDialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-[calc(100vw-2rem)] max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex flex-col space-y-1.5">
            <AlertDialog.Title className="text-base font-semibold leading-none tracking-tight text-[var(--workspace-text)]">
              Delete {count === 1 ? "this feedback item" : `${count} feedback items`}?
            </AlertDialog.Title>
            <AlertDialog.Description className="text-sm leading-relaxed text-[var(--workspace-text-muted)]">
              This permanently removes {count === 1 ? "it" : "them"} from the inbox. You can
              undo within a few seconds after deleting.
            </AlertDialog.Description>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel
              disabled={confirming}
              className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
            >
              Cancel
            </AlertDialog.Cancel>
            <AlertDialog.Action
              disabled={confirming}
              onClick={(e) => {
                e.preventDefault();
                onConfirm();
              }}
              className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow transition-colors hover:bg-destructive/90 disabled:pointer-events-none disabled:opacity-50"
            >
              {confirming ? "Deleting…" : count === 1 ? "Delete" : `Delete ${count}`}
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
