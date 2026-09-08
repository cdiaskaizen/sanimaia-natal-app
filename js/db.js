import { MOCK_MODE, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, TABLES } from "./config.js";
import { uid } from "./utils.js";
import {
  SEED_ACTIONS, SEED_SUPPLIERS, SEED_STORES, SEED_EVENTS,
  SEED_RESTOCK_RULES, SEED_LESSONS_2025, SEED_HAMPERS, SEED_WINDOW_TEAM,
  SEED_STOCK_ITEMS,
} from "./seed-data.js";

const LS_KEY = "sanimaia_natal_v1";

function defaultSeed() {
  return {
    actions: SEED_ACTIONS.map((a) => ({ id: uid(), status: "planeado", ...a })),
    suppliers: SEED_SUPPLIERS.map((s) => ({ id: uid(), ...s })),
    stores: SEED_STORES.map((s) => ({ id: uid(), ...s })),
    events: SEED_EVENTS.map((e) => ({ id: uid(), ...e })),
    marketing_posts: [],
    hampers: SEED_HAMPERS.map((h) => ({ id: uid(), ...h })),
    window_jobs: [],
    window_team: SEED_WINDOW_TEAM.map((t) => ({ id: uid(), ...t })),
    restock_rules: SEED_RESTOCK_RULES.map((r) => ({ id: uid(), ...r })),
    restock_shipments: [],
    lessons: SEED_LESSONS_2025.map((text) => ({ id: uid(), text })),
    stock_items: SEED_STOCK_ITEMS.map((s) => ({ id: uid(), ...s })),
  };
}

function loadLocal() {
  const raw = localStorage.getItem(LS_KEY);
  const defaults = defaultSeed();
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      // Preenche coleções novas que ainda não existiam quando os dados foram
      // gravados (evita quebrar sessões com localStorage de versões antigas).
      let changed = false;
      for (const key of Object.keys(defaults)) {
        if (!Array.isArray(parsed[key])) { parsed[key] = defaults[key]; changed = true; }
      }
      if (changed) localStorage.setItem(LS_KEY, JSON.stringify(parsed));
      return parsed;
    } catch { /* fall through to reseed */ }
  }
  localStorage.setItem(LS_KEY, JSON.stringify(defaults));
  return defaults;
}

let state = loadLocal();

function persist() {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

function mockApi(collection) {
  return {
    async list() {
      return [...state[collection]];
    },
    async insert(row) {
      const withId = { id: uid(), ...row };
      state[collection].push(withId);
      persist();
      return withId;
    },
    async update(id, patch) {
      const idx = state[collection].findIndex((r) => r.id === id);
      if (idx === -1) throw new Error("Registo não encontrado");
      state[collection][idx] = { ...state[collection][idx], ...patch };
      persist();
      return state[collection][idx];
    },
    async remove(id) {
      state[collection] = state[collection].filter((r) => r.id !== id);
      persist();
    },
  };
}

let supabaseClient = null;
async function getSupabase() {
  if (supabaseClient) return supabaseClient;
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  return supabaseClient;
}

function liveApi(tableName) {
  return {
    async list() {
      const sb = await getSupabase();
      const { data, error } = await sb.from(tableName).select("*").order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    async insert(row) {
      const sb = await getSupabase();
      const { data, error } = await sb.from(tableName).insert(row).select().single();
      if (error) throw error;
      return data;
    },
    async update(id, patch) {
      const sb = await getSupabase();
      const { data, error } = await sb.from(tableName).update(patch).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    async remove(id) {
      const sb = await getSupabase();
      const { error } = await sb.from(tableName).delete().eq("id", id);
      if (error) throw error;
    },
  };
}

function api(collection, tableName) {
  return MOCK_MODE ? mockApi(collection) : liveApi(tableName);
}

export const db = {
  actions: api("actions", TABLES.actions),
  suppliers: api("suppliers", TABLES.suppliers),
  stores: api("stores", TABLES.stores),
  events: api("events", TABLES.events),
  marketingPosts: api("marketing_posts", TABLES.marketing_posts),
  hampers: api("hampers", TABLES.hampers),
  windowJobs: api("window_jobs", TABLES.window_jobs),
  windowTeam: MOCK_MODE ? mockApi("window_team") : liveApi(`${TABLES.window_jobs}_team`),
  restockRules: api("restock_rules", TABLES.restock_rules),
  restockShipments: api("restock_shipments", TABLES.restock_shipments),
  lessons: api("lessons", TABLES.lessons),
  stockItems: api("stock_items", TABLES.stock_items),
};

export function resetMockData() {
  localStorage.removeItem(LS_KEY);
  state = loadLocal();
}
