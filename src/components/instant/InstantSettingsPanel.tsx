"use client";

import {
  getInstantSettings,
  setInstantSettings,
  useInstantSettings,
} from "@/lib/instant/settingsBus";
import type { TimeFormat, TimelineSpanHours } from "@/lib/instant/types";
import { SettingsRow, SettingsRule, SettingsStepper } from "@/components/workspace/settings";

/**
 * Instant settings slot — lives inside the workspace's settings panel
 * (Utils tab). Reads from the bus; writes go straight back through it.
 * The standalone /utils/instant page doesn't host this — that page has no
 * settings panel so its own Instant header should not duplicate the gear
 * (no need: there's no other chrome to collide with).
 */
export function InstantSettingsPanel() {
  const settings = useInstantSettings();
  const set = (patch: Partial<typeof settings>) =>
    setInstantSettings({ ...getInstantSettings(), ...patch });
  const days = settings.spanHours / 24;
  return (
    <>
      <SettingsRule title="Instant (timezones)" />
      <div className="mt-1 space-y-px">
        <SettingsRow label="Days shown">
          <SettingsStepper
            value={days}
            decLabel="Fewer days"
            incLabel="More days"
            resetLabel="Reset to 1 day"
            minWidth="min-w-[1.5rem]"
            onDec={() => set({ spanHours: Math.max(24, settings.spanHours - 24) as TimelineSpanHours })}
            onInc={() => set({ spanHours: Math.min(14 * 24, settings.spanHours + 24) as TimelineSpanHours })}
            onReset={() => set({ spanHours: 24 })}
          />
        </SettingsRow>
        <SettingsRow label="Time">
          <div className="inline-flex overflow-hidden rounded-md border border-[var(--workspace-border)]/60 bg-muted/50">
            {(["12h", "24h"] as TimeFormat[]).map((f) => (
              <button
                key={f}
                type="button"
                className={`flex h-7 min-w-[2.25rem] items-center justify-center px-2 text-xs font-medium transition-colors ${
                  settings.timeFormat === f
                    ? "bg-primary/15 text-primary"
                    : "text-[var(--workspace-text-muted)] hover:bg-primary/5 hover:text-[var(--workspace-text)]"
                }`}
                onClick={() => set({ timeFormat: f })}
              >
                {f}
              </button>
            ))}
          </div>
        </SettingsRow>
        <SettingsRow label="Seconds">
          <label className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md border border-[var(--workspace-border)]/60 bg-muted/30 px-2 text-xs font-medium text-[var(--workspace-text)] transition-colors hover:border-primary/30 hover:bg-primary/5 has-[[data-state=checked]]:border-primary/40 has-[[data-state=checked]]:bg-primary/10">
            <input
              type="checkbox"
              checked={settings.showSeconds}
              onChange={(e) => set({ showSeconds: e.target.checked })}
              className="h-3 w-3 cursor-pointer accent-primary"
              aria-label="Show seconds"
            />
            Show
          </label>
        </SettingsRow>
      </div>
    </>
  );
}
