"use client";

import * as React from "react";
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from "web-vitals";

const STORAGE_KEY = "weft-web-vitals";

type Snapshot = { value: number; recordedAt: string };
type Snapshots = Record<string, Snapshot>;
type Store = { snapshots: Snapshots; started: boolean };

const ORDER = ["LCP", "INP", "CLS", "FCP", "TTFB"] as const;
const GOOD: Record<(typeof ORDER)[number], number> = {
  LCP: 2500,
  INP: 200,
  CLS: 0.1,
  FCP: 1800,
  TTFB: 800,
};

let store: Store = { snapshots: {}, started: false };
const listeners = new Set<() => void>();

function emit(next: Store) {
  store = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return store;
}

function getServerSnapshot(): Store {
  return { snapshots: {}, started: false };
}

function format(name: (typeof ORDER)[number], value: number) {
  if (name === "CLS") return value.toFixed(3);
  return value >= 1000 ? `${(value / 1000).toFixed(2)} s` : `${Math.round(value)} ms`;
}

export function BrowserVitals() {
  const { snapshots, started } = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  React.useEffect(() => {
    let loaded: Snapshots = {};
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) loaded = JSON.parse(raw) as Snapshots;
    } catch {
      loaded = {};
    }

    const report = (metric: Metric) => {
      const next: Snapshots = {
        ...store.snapshots,
        [metric.name]: { value: metric.value, recordedAt: new Date().toISOString() },
      };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Storage can be disabled; values still render in memory.
      }
      emit({ snapshots: next, started: true });
    };

    emit({ snapshots: loaded, started: true });
    onLCP(report);
    onINP(report);
    onCLS(report);
    onFCP(report);
    onTTFB(report);
  }, []);

  return (
    <div className="rounded-lg border border-line bg-surface p-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11.5px] font-semibold">Measured in this browser</p>
        <span className="text-[9px] uppercase tracking-[0.08em] text-faint">
          {started ? "live" : "starting"}
        </span>
      </div>
      <p className="mt-1 text-[10px] leading-4 text-muted">
        Real browser Web Vitals from the <code>web-vitals</code> library, stored locally. No field
        aggregate is claimed.
      </p>
      <dl className="mt-3 space-y-1.5">
        {ORDER.map((name) => {
          const snapshot = snapshots[name];
          const good = snapshot ? snapshot.value <= GOOD[name] : null;
          return (
            <div key={name} className="flex items-baseline justify-between gap-x-2 text-[10.5px]">
              <dt className="text-muted">{name}</dt>
              <dd className="numeric font-medium">
                {snapshot ? format(name, snapshot.value) : "—"}
                {good !== null ? (
                  <span className={good ? "text-positive" : "text-warning"}>
                    {" "}
                    · {good ? "good" : "review"}
                  </span>
                ) : null}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
