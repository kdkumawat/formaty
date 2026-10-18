"use client";

import { useEffect, useState } from "react";
import type { SqlDialect } from "@/lib/json/core";

/** The SQL dialect is a standing preference: remembered across reloads, the same in every tab. */
export function usePersistedSqlDialect() {
  const [sqlDialect, setSqlDialect] = useState<SqlDialect>("sqlite");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("formaty-sql-dialect");
      if (saved === "sqlite" || saved === "postgres" || saved === "mysql") setSqlDialect(saved);
    } catch {
      /* storage blocked */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("formaty-sql-dialect", sqlDialect);
    } catch {
      /* storage blocked */
    }
  }, [sqlDialect]);
  return [sqlDialect, setSqlDialect] as const;
}
