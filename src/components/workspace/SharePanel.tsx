"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, CopyButton, PanelGroup, Segmented, StatusText, TextField } from "@/components/kit";
import { MAX_SHARE_HASH_CHARS, SHARE_TOO_LARGE } from "@/lib/shareState";

interface SharePanelProps {
  /** True while the panel is open: the link is only encoded then. */
  open: boolean;
  tabCount: number;
  /** Encoded state for the hash link (SHARE_TOO_LARGE when it does not fit). */
  buildHash: (allTabs: boolean) => string;
  /** The only call that sends data anywhere. Resolves to the short link, or null on failure. */
  onUpload: (allTabs: boolean) => Promise<string | null>;
  /** Short link already created for this workspace, if any. */
  sharedUrl: string | null;
  onDeleteShared: () => Promise<void>;
}

const muted = "text-[12px] text-[var(--workspace-text-muted)]";

/** Body of the Share side panel. */
export function SharePanel({ open, tabCount, buildHash, onUpload, sharedUrl, onDeleteShared }: SharePanelProps) {
  const [allTabs, setAllTabs] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setAllTabs(false);
      setUploadError(null);
    }
  }, [open]);

  // Rebuilt only while open: encoding a large workspace is not free.
  const hashLink = useMemo(() => {
    if (!open) return { url: "", chars: 0, tooLarge: false };
    const hash = buildHash(allTabs);
    if (hash === SHARE_TOO_LARGE) return { url: "", chars: 0, tooLarge: true };
    const url = `${window.location.origin}${window.location.pathname}#${hash}`;
    return { url, chars: url.length, tooLarge: url.length > MAX_SHARE_HASH_CHARS };
    // buildHash closes over live workspace state; rebuilding on open/scope change is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, allTabs]);

  return (
    <div className="flex flex-col gap-1">
      {tabCount > 1 && (
        <Segmented
          aria-label="What to share"
          value={allTabs ? "all" : "this"}
          onChange={(v) => setAllTabs(v === "all")}
          options={[
            { value: "this", label: "This tab" },
            { value: "all", label: `All ${tabCount} tabs` },
          ]}
          className="mb-2 self-start"
        />
      )}

      <PanelGroup title="Link that carries the data">
        <p className={muted}>Nothing is uploaded. The content is packed into the link itself, so the link is long.</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className={`text-[12px] tabular-nums ${hashLink.tooLarge ? "text-bad" : "text-[var(--workspace-text-muted)]"}`}>
            {hashLink.tooLarge && !hashLink.chars ? "Too large" : `${hashLink.chars.toLocaleString()} characters`}
          </span>
          <CopyButton variant="secondary" label="Copy link" getText={() => hashLink.url} disabled={hashLink.tooLarge} />
        </div>
        {hashLink.tooLarge && (
          <StatusText tone="bad" className="mt-1">
            Too large for a link. Use a short link instead.
          </StatusText>
        )}
      </PanelGroup>

      <PanelGroup title="Short link">
        <p className={muted}>
          Uploads {allTabs ? `all ${tabCount} tabs` : "this tab"} to Formaty&apos;s server. This is the only action that sends your data anywhere.
        </p>
        <div className="mt-2 flex flex-col gap-2">
          {sharedUrl ? (
            <>
              <TextField readOnly aria-label="Short link" value={sharedUrl} wrapperClassName="w-full" className="font-mono" onFocus={(e) => e.currentTarget.select()} />
              <div className="flex flex-wrap items-center gap-2">
                <CopyButton variant="secondary" label="Copy link" getText={() => sharedUrl} />
                <Button
                  variant="danger"
                  loading={deleting}
                  onClick={async () => {
                    setDeleting(true);
                    await onDeleteShared();
                    setDeleting(false);
                  }}
                >
                  Delete from server
                </Button>
              </div>
            </>
          ) : (
            <Button
              variant="secondary"
              className="self-start"
              loading={uploading}
              onClick={async () => {
                setUploading(true);
                setUploadError(null);
                const url = await onUpload(allTabs);
                setUploading(false);
                if (!url) setUploadError("Upload failed. Check your connection and try again.");
              }}
            >
              Upload and create short link
            </Button>
          )}
          {uploadError && <StatusText tone="bad">{uploadError}</StatusText>}
        </div>
      </PanelGroup>
    </div>
  );
}
