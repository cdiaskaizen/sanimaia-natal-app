// Configuração da aplicação Sanimaia · Planeamento de Natal
//
// Base de dados: projeto Supabase próprio "Planeamento Natal"
// (https://mkimdsuqqpvgsduvsqvq.supabase.co), criado pelo próprio utilizador.
// Acesso aberto a toda a gente, sem login — como pedido.
export const MOCK_MODE = false;

export const SUPABASE_URL = "https://mkimdsuqqpvgsduvsqvq.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable__TmGVjEWynOk1kKURvmQVw_OBmM-Plj";

// Prefixo de tabela (mantido por consistência com o schema.sql já escrito;
// este projeto é dedicado só a esta app, por isso não é estritamente
// necessário, mas não faz mal manter).
export const TABLE_PREFIX = "sanimaia_natal_";

export const TABLES = {
  actions: `${TABLE_PREFIX}actions`,
  suppliers: `${TABLE_PREFIX}suppliers`,
  stores: `${TABLE_PREFIX}stores`,
  events: `${TABLE_PREFIX}events`,
  marketing_posts: `${TABLE_PREFIX}marketing_posts`,
  hampers: `${TABLE_PREFIX}hampers`,
  window_jobs: `${TABLE_PREFIX}window_jobs`,
  restock_rules: `${TABLE_PREFIX}restock_rules`,
  restock_shipments: `${TABLE_PREFIX}restock_shipments`,
  lessons: `${TABLE_PREFIX}lessons`,
  stock_items: `${TABLE_PREFIX}stock_items`,
};
