/**
 * Minimal in-memory stand-in for the exact subset of the supabase-js
 * service-role client chain used by lib/admin/translationWorkflow.ts:
 * `.from(table).update(patch).eq(col, val).in(col, vals).select(cols)`,
 * either awaited directly (array result) or terminated with
 * `.maybeSingle()` (single-row result), plus a bare `.insert(rows)` for
 * the append-only history table. Not a general Postgrest mock — only
 * supports update-then-select and insert, which is all this workflow
 * module ever does.
 */

export type FakeRow = Record<string, unknown>;

export function makeFakeServiceClient(tables: Record<string, FakeRow[]>) {
  function builder(table: string) {
    let patch: Record<string, unknown> | null = null;
    const predicates: Array<(row: FakeRow) => boolean> = [];

    function matched(): FakeRow[] {
      const rows = tables[table] ?? [];
      return rows.filter((r) => predicates.every((p) => p(r)));
    }

    function applyPatchAndReturn(): FakeRow[] {
      const rows = matched();
      if (patch) {
        for (const row of rows) Object.assign(row, patch);
      }
      return rows;
    }

    const api = {
      update(p: Record<string, unknown>) {
        patch = p;
        return api;
      },
      eq(col: string, val: unknown) {
        predicates.push((row) => row[col] === val);
        return api;
      },
      in(col: string, vals: unknown[]) {
        predicates.push((row) => vals.includes(row[col] as unknown));
        return api;
      },
      select(_cols?: string) {
        return {
          maybeSingle() {
            const rows = applyPatchAndReturn();
            return Promise.resolve({ data: rows[0] ?? null, error: null });
          },
          then(onFulfilled?: ((v: { data: FakeRow[]; error: null }) => unknown) | null, onRejected?: ((r: unknown) => unknown) | null) {
            const rows = applyPatchAndReturn();
            return Promise.resolve({ data: rows, error: null }).then(onFulfilled, onRejected);
          },
        };
      },
      insert(rows: FakeRow | FakeRow[]) {
        tables[table] = [...(tables[table] ?? []), ...(Array.isArray(rows) ? rows : [rows])];
        return Promise.resolve({ data: null, error: null });
      },
    };
    return api;
  }

  return {
    from(table: string) {
      return builder(table);
    },
  };
}
