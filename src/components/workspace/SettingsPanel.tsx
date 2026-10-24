"use client";

import { useState } from "react";
import { Button, NumberField, PanelGroup, PanelRow, Segmented, Switch } from "@/components/kit";
import { getInstantSettings, setInstantSettings, useInstantSettings } from "@/lib/instant/settingsBus";
import { GA_ENABLED, getGaConsent, setGaConsent } from "@/components/Analytics";

type ThemeMode = "system" | "dark" | "light";

interface SettingsPanelProps {
  themeMode: ThemeMode;
  onThemeMode: (m: ThemeMode) => void;
  liveTransform: boolean;
  onLiveTransform: (v: boolean) => void;
  autoFormatOnPaste: boolean;
  onAutoFormatOnPaste: (v: boolean) => void;
  lineWrap: boolean;
  onLineWrap: (v: boolean) => void;
  indent: number;
  onIndent: (n: number) => void;
  fontSize: number;
  onFontSize: (n: number) => void;
  onReset: () => void;
  onClearCache: () => void;
  /** Show the Instant group (only while the Utils Instant tool is open). */
  showInstant?: boolean;
}

function InstantRows() {
  const s = useInstantSettings();
  const set = (patch: Partial<typeof s>) => setInstantSettings({ ...getInstantSettings(), ...patch });
  return (
    <PanelGroup title="Instant">
      <PanelRow label="Days shown">
        <Segmented
          aria-label="Days shown"
          value={String(s.spanHours)}
          onChange={(v) => set({ spanHours: Number(v) as typeof s.spanHours })}
          options={[
            { value: "24", label: "1 day" },
            { value: "96", label: "4 days" },
          ]}
        />
      </PanelRow>
      <PanelRow label="Time format">
        <Segmented
          aria-label="Time format"
          value={s.timeFormat}
          onChange={(v) => set({ timeFormat: v })}
          options={[
            { value: "12h", label: "12h" },
            { value: "24h", label: "24h" },
          ]}
        />
      </PanelRow>
      <PanelRow label="Show seconds">
        <Switch aria-label="Show seconds" checked={s.showSeconds} onCheckedChange={(v) => set({ showSeconds: v })} />
      </PanelRow>
    </PanelGroup>
  );
}

function AnalyticsRow() {
  const [on, setOn] = useState(() => getGaConsent() !== "declined");
  return (
    <>
      <PanelRow label="Usage analytics">
        <Switch
          aria-label="Usage analytics"
          checked={on}
          onCheckedChange={(v) => {
            setGaConsent(v ? "accepted" : "declined");
            setOn(v);
          }}
        />
      </PanelRow>
      <p className="pt-1 text-[12px] text-[var(--workspace-text-muted)]">Anonymous page views and which tools ran. Never what you paste.</p>
    </>
  );
}

/** Body of the Settings side panel. */
export function SettingsPanel(p: SettingsPanelProps) {
  const [confirmClear, setConfirmClear] = useState(false);
  return (
    <div className="flex flex-col">
      <PanelGroup title="Appearance">
        <PanelRow label="Theme">
          <Segmented
            aria-label="Theme"
            value={p.themeMode}
            onChange={p.onThemeMode}
            options={[
              { value: "system", label: "System" },
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
          />
        </PanelRow>
      </PanelGroup>

      <PanelGroup title="Editor">
        <PanelRow label="Font size">
          <NumberField aria-label="Font size" value={p.fontSize} min={10} max={24} onChange={p.onFontSize} />
        </PanelRow>
        <PanelRow label="Wrap long lines">
          <Switch aria-label="Wrap long lines" checked={p.lineWrap} onCheckedChange={p.onLineWrap} />
        </PanelRow>
      </PanelGroup>

      <PanelGroup title="Transform">
        <PanelRow label="Live transform">
          <Switch aria-label="Live transform" checked={p.liveTransform} onCheckedChange={p.onLiveTransform} />
        </PanelRow>
        <PanelRow label="Format on paste">
          <Switch aria-label="Format on paste" checked={p.autoFormatOnPaste} onCheckedChange={p.onAutoFormatOnPaste} />
        </PanelRow>
        <PanelRow label="Indent width">
          <NumberField aria-label="Indent width" value={p.indent} min={0} max={10} onChange={p.onIndent} />
        </PanelRow>
      </PanelGroup>

      {p.showInstant && <InstantRows />}

      {GA_ENABLED && (
        <PanelGroup title="Privacy">
          <AnalyticsRow />
        </PanelGroup>
      )}

      <PanelGroup title="Data on this device">
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button variant="ghost" onClick={p.onReset}>
            Reset settings
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (!confirmClear) {
                setConfirmClear(true);
                window.setTimeout(() => setConfirmClear(false), 3000);
                return;
              }
              p.onClearCache();
            }}
          >
            {confirmClear ? "Press again to wipe" : "Clear all data"}
          </Button>
        </div>
        <p className="pt-1 text-[12px] text-[var(--workspace-text-muted)]">Removes saved sessions, settings and offline data, then reloads.</p>
      </PanelGroup>
    </div>
  );
}
