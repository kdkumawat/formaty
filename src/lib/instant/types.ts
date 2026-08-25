export type Instant = number;

export type DayPeriod = "night" | "morning" | "afternoon" | "evening";

export type TimeFormat = "12h" | "24h";

export interface Location {
  id: string;
  iana: string;
  city: string;
  country: string;
  countryCode: string;
  isPrimary: boolean;
}

export interface LocalWallTime {
  timeZone: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second?: number;
  millisecond?: number;
}

export interface ZonedProjection {
  timeZone: string;
  epochMs: number;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
  weekday: number;
  offsetMinutes: number;
  offsetLabel: string;
  abbreviation: string;
  dayPeriod: DayPeriod;
}

export type LocalTimeResolve =
  | {
      status: "ok";
      epochMs: number;
      offsetLabel: string;
      abbreviation: string;
    }
  | {
      status: "nonexistent";
      message: string;
      nearestEpochMs: number;
    }
  | {
      status: "ambiguous";
      earlierEpochMs: number;
      laterEpochMs: number;
      earlierOffsetLabel: string;
      laterOffsetLabel: string;
      earlierAbbreviation: string;
      laterAbbreviation: string;
    };

export type TimelineSpanHours = 24 | 96;

export type InstantMode = "instant" | "range";

export interface InstantSnapshot {
  selectedInstant: number;
  primaryTimezone: string;
  locations: Location[];
  mode: InstantMode;
  range: { start: number; end: number } | null;
  timeFormat: TimeFormat;
  showSeconds: boolean;
  spanHours: TimelineSpanHours;
}

export interface InstantState {
  primaryTimezone: string;
  locations: Location[];
  selectedInstant: Instant;
  timelineWindow: { start: Instant; end: Instant };
  timelineSpanHours: TimelineSpanHours;
  isLive: boolean;
  showSeconds: boolean;
  timeFormat: TimeFormat;
  hoverInstant: Instant | null;
}
