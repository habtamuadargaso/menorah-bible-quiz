/**
 * Minimal in-memory stand-in for the supabase-js surface lib/liveBattleRoom.ts
 * actually uses: `.from(table).select(...).eq(...).maybeSingle()/.order()`
 * (awaited directly), `.insert(row).select().single()`, a head-count select,
 * and `.rpc(name, args)`. Not a general Postgrest mock — only supports what
 * these call sites use. Every insert/update/rpc call is also recorded so
 * tests can assert on exactly what was sent to the database.
 */

export interface FakeRoomRow {
  id: string;
  code: string;
  host_id: string;
  status: string;
  max_players: number;
  language: string;
  [key: string]: unknown;
}

export interface FakeRoomPlayerRow {
  id: string;
  room_id: string;
  player_id: string;
  display_name: string;
  score: number;
  is_ready: boolean;
  current_streak: number;
  last_seen_at: string;
  joined_at: string;
  language_code: string;
}

export interface FakeLiveBattleFixture {
  authUserId: string;
  rooms: FakeRoomRow[];
  roomPlayers: FakeRoomPlayerRow[];
  /** rpc name -> handler returning { data, error } */
  rpcHandlers?: Record<string, (args: Record<string, unknown>) => { data: unknown; error: { message: string } | null }>;
}

export interface FakeLiveBattleClient {
  auth: {
    getUser: () => Promise<{ data: { user: { id: string } | null }; error: null }>;
    signInAnonymously: () => Promise<{ data: { user: { id: string } }; error: null }>;
  };
  from: (table: string) => unknown;
  rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
  inserts: Record<string, Record<string, unknown>[]>;
  rpcCalls: { name: string; args: Record<string, unknown> }[];
}

function matches(row: Record<string, unknown>, filters: Record<string, unknown>): boolean {
  return Object.entries(filters).every(([k, v]) => row[k] === v);
}

export function makeFakeLiveBattleClient(fixture: FakeLiveBattleFixture): FakeLiveBattleClient {
  const inserts: Record<string, Record<string, unknown>[]> = {};
  const rpcCalls: { name: string; args: Record<string, unknown> }[] = [];

  const tables: Record<string, Record<string, unknown>[]> = {
    rooms: fixture.rooms as unknown as Record<string, unknown>[],
    room_players: fixture.roomPlayers as unknown as Record<string, unknown>[],
  };

  function builder(table: string) {
    const filters: Record<string, unknown> = {};
    let wantsCount = false;

    const api = {
      select(_cols?: string, opts?: { count?: string; head?: boolean }) {
        if (opts?.count) wantsCount = true;
        return api;
      },
      eq(col: string, val: unknown) {
        filters[col] = val;
        return api;
      },
      order() {
        return api;
      },
      maybeSingle() {
        const rows = (tables[table] ?? []).filter((r) => matches(r, filters));
        return Promise.resolve({ data: rows[0] ?? null, error: null });
      },
      insert(payload: Record<string, unknown> | Record<string, unknown>[]) {
        const rows = Array.isArray(payload) ? payload : [payload];
        inserts[table] = [...(inserts[table] ?? []), ...rows];
        tables[table] = [...(tables[table] ?? []), ...rows];
        return {
          select() {
            return {
              single() {
                return Promise.resolve({ data: rows[0], error: null });
              },
            };
          },
          then(onFulfilled?: (v: { data: null; error: null }) => unknown) {
            return Promise.resolve({ data: null, error: null }).then(onFulfilled);
          },
        };
      },
      upsert() {
        return Promise.resolve({ data: null, error: null });
      },
      delete() {
        return { eq: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }) };
      },
      then(onFulfilled?: (v: { data: unknown; error: null; count?: number }) => unknown) {
        const rows = (tables[table] ?? []).filter((r) => matches(r, filters));
        if (wantsCount) {
          return Promise.resolve({ data: null, error: null, count: rows.length }).then(onFulfilled);
        }
        return Promise.resolve({ data: rows, error: null }).then(onFulfilled);
      },
    };
    return api;
  }

  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: { id: fixture.authUserId } }, error: null }),
      signInAnonymously: () => Promise.resolve({ data: { user: { id: fixture.authUserId } }, error: null }),
    },
    from(table: string) {
      return builder(table);
    },
    rpc(name: string, args: Record<string, unknown>) {
      rpcCalls.push({ name, args });
      const handler = fixture.rpcHandlers?.[name];
      if (handler) return Promise.resolve(handler(args));
      return Promise.resolve({ data: null, error: null });
    },
    inserts,
    rpcCalls,
  };
}
