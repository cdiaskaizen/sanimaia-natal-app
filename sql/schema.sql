-- Sanimaia · Planeamento Natal 2026
-- Schema para o projeto Supabase próprio "Planeamento Natal"
-- (https://mkimdsuqqpvgsduvsqvq.supabase.co) — acesso aberto, sem login.
--
-- COMO APLICAR: colar este ficheiro inteiro no SQL Editor do Supabase e
-- correr (Run). Cria as tabelas, ativa RLS com políticas abertas, dá
-- permissões ao papel "anon" (necessário porque "Automatically expose new
-- tables" ficou desligado na criação do projeto) e carrega os dados da ata.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Ações (plano de ações consolidado da ata)
-- ---------------------------------------------------------------------------
create table if not exists sanimaia_natal_actions (
  id uuid primary key default gen_random_uuid(),
  area text not null check (area in ('MKT','ARZ','GAM','CAB','ALU','BF','MC','GERAL')),
  title text not null,
  responsible text not null,
  due_raw text,
  due_date date,
  due_precision text check (due_precision in ('day','week','month')) default 'day',
  status text not null check (status in ('planeado','em_curso','concluido','atrasado')) default 'planeado',
  comments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Fornecedores (armazém / receção de mercadoria)
-- ---------------------------------------------------------------------------
create table if not exists sanimaia_natal_suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  expected_label text,
  expected_date date,
  iso_week int,
  status text not null check (status in ('confirmado','por_definir','recebido')) default 'por_definir',
  received_date date,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Lojas (aberturas)
-- ---------------------------------------------------------------------------
create table if not exists sanimaia_natal_stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  opening_date date not null,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Eventos gerais (festa de abertura, etc.)
-- ---------------------------------------------------------------------------
create table if not exists sanimaia_natal_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date not null,
  flagged boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Marketing — posts / campanhas
-- ---------------------------------------------------------------------------
create table if not exists sanimaia_natal_marketing_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text,
  channel text,
  date date,
  status text not null check (status in ('planeado','em_curso','concluido','atrasado')) default 'planeado',
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Cabazes
-- ---------------------------------------------------------------------------
create table if not exists sanimaia_natal_hampers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric,
  packaging text,
  status text not null check (status in ('por_definir','confirmado')) default 'por_definir',
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Montras — trabalhos e equipa
-- ---------------------------------------------------------------------------
create table if not exists sanimaia_natal_window_jobs (
  id uuid primary key default gen_random_uuid(),
  client text not null,
  theme text,
  assigned_to text,
  date date,
  status text not null check (status in ('planeado','em_curso','concluido','atrasado')) default 'planeado',
  notes text,
  items jsonb not null default '[]'::jsonb,
  images jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists sanimaia_natal_window_jobs_team (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  created_at timestamptz not null default now()
);

-- Nota: as imagens de inspiração ficam em base64 dentro de "images" no modo
-- local (localStorage). Em produção no Supabase, trocar para o Storage
-- (bucket) e guardar aqui só o URL público — evita rows gigantes na tabela.

-- ---------------------------------------------------------------------------
-- Processo de reposição por loja
-- ---------------------------------------------------------------------------
create table if not exists sanimaia_natal_restock_rules (
  id uuid primary key default gen_random_uuid(),
  store text not null,
  frequency text,
  method text,
  responsible text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Envios de reposição — produtos enviados por loja/data
-- ---------------------------------------------------------------------------
create table if not exists sanimaia_natal_restock_shipments (
  id uuid primary key default gen_random_uuid(),
  store text not null,
  date date,
  status text not null check (status in ('planeado','em_curso','concluido','atrasado')) default 'planeado',
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Lições da época anterior
-- ---------------------------------------------------------------------------
create table if not exists sanimaia_natal_lessons (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Stock sobrante 2025 (encomendado vs. vendido) — preenchimento manual até
-- existir ligação direta ao PHC
-- ---------------------------------------------------------------------------
create table if not exists sanimaia_natal_stock_items (
  id uuid primary key default gen_random_uuid(),
  product text not null,
  category text,
  qty_ordered numeric,
  qty_sold numeric,
  decision text,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Acesso — aberto a toda a gente (sem login), como pedido: qualquer pessoa
-- com o link lê e escreve. RLS fica ligado (boa prática / trava de
-- segurança), mas com políticas permissivas; e como "Automatically expose
-- new tables" ficou desligado na criação do projeto, é preciso dar
-- explicitamente ao papel "anon" (pedidos sem login) acesso a cada tabela.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'sanimaia_natal_actions', 'sanimaia_natal_suppliers', 'sanimaia_natal_stores',
    'sanimaia_natal_events', 'sanimaia_natal_marketing_posts', 'sanimaia_natal_hampers',
    'sanimaia_natal_window_jobs', 'sanimaia_natal_window_jobs_team',
    'sanimaia_natal_restock_rules', 'sanimaia_natal_restock_shipments',
    'sanimaia_natal_lessons', 'sanimaia_natal_stock_items'
  ])
  loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy %I on %I for select using (true)', t || '_read', t);
    execute format('create policy %I on %I for insert with check (true)', t || '_insert', t);
    execute format('create policy %I on %I for update using (true) with check (true)', t || '_update', t);
    execute format('create policy %I on %I for delete using (true)', t || '_delete', t);
    execute format('grant select, insert, update, delete on %I to anon, authenticated', t);
  end loop;
  execute 'grant usage on schema public to anon, authenticated';
end $$;

-- ---------------------------------------------------------------------------
-- Seed — dados extraídos da Ata de Reunião · Planeamento de Natal 2026
-- ---------------------------------------------------------------------------
insert into sanimaia_natal_actions (area, title, responsible, due_raw, due_date, due_precision) values
  ('MKT', 'Sugerir fornecedor/designer para embrulhos/sacos de oferta', 'Mónica', '30/06', '2026-06-30', 'day'),
  ('MKT', 'Pesquisar todos os materiais de comunicação (6 itens): etiqueta, fita, autocolante, sacos, porta-faturas, voucher', 'Mónica', '30/06', '2026-06-30', 'day'),
  ('MKT', 'Coordenar publicações de natal com aberturas de loja', 'Mónica', 'out/2026', '2026-10-01', 'month'),
  ('MKT', 'Sessão fotográfica de natal', 'Mónica', '1ª semana out/2026', '2026-10-01', 'week'),
  ('MKT', 'Avaliar tema de árvores de influencers: contactar os que temos atualmente/possíveis novas parcerias', 'Mónica', 'set/2026', '2026-09-01', 'month'),
  ('MKT', 'Confirmar equipa completa de montagens (4.º elemento)', 'D. Helena', 'jul/2026', '2026-07-01', 'month'),
  ('ARZ', 'Confirmar datas de 8 fornecedores em aberto', 'Maria', '16/06', '2026-06-16', 'day'),
  ('ARZ', 'Solicitar fotografias a fornecedores principais; garantir encomendas antes do verão', 'Maria', '16/06', '2026-06-16', 'day'),
  ('ARZ', 'Garantir info de paletes por marca para planeamento de armazém', 'Maria', '16/06', '2026-06-16', 'day'),
  ('ARZ', 'Definir processo de reposição por loja', 'Sandra', '30/06', '2026-06-30', 'day'),
  ('ARZ', 'Criar calendário de acompanhamento de vendas e posicionamento em loja', 'Sandra', '30/06', '2026-06-30', 'day'),
  ('ARZ', 'Definir necessidades de RH (Porto + pessoa de montagens)', 'Sandra', '30/06', '2026-06-30', 'day'),
  ('ARZ', 'Definir processo de receção de mercadoria (local e espaços)', 'Sandra', '30/06', '2026-06-30', 'day'),
  ('GAM', 'Finalizar ajustes de detalhe da gama', 'Teresa', '30/06', '2026-06-30', 'day'),
  ('GAM', 'Novas compras complementares (presentes e artigos diferentes)', 'D. Helena', 'setembro/2026', '2026-09-01', 'month'),
  ('CAB', 'Avaliar novas embalagens e comparar fornecedores', 'Sandra', 'setembro 2026', '2026-09-01', 'month'),
  ('CAB', 'Definir produtos, marcas e fornecedores por categoria', 'Sandra', 'setembro 2026', '2026-09-01', 'month'),
  ('CAB', 'Planear montagem com linha balanceada no armazém Decoração', 'Sandra', 'setembro/2026', '2026-09-01', 'month'),
  ('CAB', 'Fechar os 6 cabazes-base para a época', 'Sandra', 'setembro/2026', '2026-09-01', 'month'),
  ('ALU', 'Calendarizar montagens de montras para clientes', 'D. Helena', 'out/2026', '2026-10-01', 'month'),
  ('ALU', 'Avaliar capacidade de equipa e necessidade de taskforce', 'D. Helena', 'jul/2026', '2026-07-01', 'month'),
  ('ALU', 'Definir plano semanal de montagens (horários e frequência)', 'Sandra', 'out/2026', '2026-10-01', 'month'),
  ('BF', 'Garantir stock único online/físico — reunião Skrey', 'Teresa', 'set/2026', '2026-09-01', 'month'),
  ('BF', 'Definir processo de separação e embalagem de encomendas', 'Sandra', 'set/2026', '2026-09-01', 'month'),
  ('BF', 'Integração transportador no PHC com sistema de envio', 'Mónica', 'set/2026', '2026-09-01', 'month'),
  ('BF', 'Garantir disponibilidade da equipa de marketing na BF', 'Teresa', 'out/2026', '2026-10-01', 'month'),
  ('MC', 'Definir apoio de Materiais de Construção à Decoração na época', 'António', 'set/2026', '2026-09-01', 'month'),
  ('MC', 'Libertar espaços comuns (corredor) para operação de Decoração', 'Sandra', 'jun/2026', '2026-06-01', 'month');

insert into sanimaia_natal_suppliers (name, category, expected_label, expected_date, iso_week, status) values
  ('Andrea Bizzotto', 'Decoração', '13/07/2026', '2026-07-13', null, 'confirmado'),
  ('Nuvole di Stoffa', 'Decoração', '25/08/2026', '2026-08-25', null, 'confirmado'),
  ('Becky''s', 'Decoração', '01/09/2026', '2026-09-01', null, 'confirmado'),
  ('Boltze', 'Decoração', 'Semana 34', null, 34, 'confirmado'),
  ('Räder', 'Decoração', 'Semana 35', null, 35, 'confirmado'),
  ('Cartai Bassanesi', 'Decoração', 'Por definir', null, null, 'por_definir'),
  ('Shishi', 'Decoração', 'Por definir', null, null, 'por_definir'),
  ('Ellegift', 'Decoração', 'Por definir', null, null, 'por_definir'),
  ('Vetur', 'Decoração', 'Por definir', null, null, 'por_definir'),
  ('EDG', 'Decoração', 'Por definir', null, null, 'por_definir'),
  ('Coopman', 'Decoração', 'Por definir', null, null, 'por_definir'),
  ('Royal Christmas / Van der', 'Decoração', 'Por definir', null, null, 'por_definir'),
  ('La Galleria', 'Decoração', 'Por definir', null, null, 'por_definir');

insert into sanimaia_natal_stores (name, opening_date, notes) values
  ('Sanimaia Foz (Porto)', '2026-10-16', 'Alterações de loja previstas 3 semanas após a abertura.'),
  ('Sanimaia Lisboa', '2026-10-23', 'Deslocação a Lisboa requer 3 dias. Alterações de loja previstas 3 semanas após a abertura.'),
  ('Sanimaia Trofa', '2026-10-30', 'Alterações de loja previstas 3 semanas após a abertura.');

insert into sanimaia_natal_events (title, date, flagged, notes) values
  ('Festa de Abertura', '2026-12-07', true, 'Data divergente na ata: secção Marketing indica 7 de dezembro, secção Notas Gerais indica 7 de novembro. Confirmar com a equipa.');

insert into sanimaia_natal_hampers (name, status) values
  ('Cabaz 1', 'por_definir'), ('Cabaz 2', 'por_definir'), ('Cabaz 3', 'por_definir'),
  ('Cabaz 4', 'por_definir'), ('Cabaz 5', 'por_definir'), ('Cabaz 6', 'por_definir');

insert into sanimaia_natal_window_jobs_team (name, role) values
  ('Célia', 'Montagens'),
  ('Nela', 'Montagens'),
  ('Ricardo', 'Montagens'),
  ('4.º elemento (a confirmar)', 'Montagens — contratação externa ou colaborador interno, a cargo de D. Helena');

insert into sanimaia_natal_restock_rules (store, frequency, method, responsible) values
  ('Porto (Foz)', 'Diária', 'Logística transporta e apoia; colaborador de loja repõe', 'D. Helena'),
  ('Lisboa', '2× por semana', '1 palete por transportador', 'A definir'),
  ('Trofa', 'Diária', 'Logística Decoração repõe de manhã', 'Logística Decoração');

insert into sanimaia_natal_lessons (text) values
  ('Falhas de reposição em loja — mercadoria em armazém sem chegar à prateleira a tempo.'),
  ('Stress elevado na montagem de cabazes — falta de planeamento e espaço dedicado.'),
  ('Imprevistos de última hora com impacto operacional significativo.'),
  ('Planeamento de compras comprometido porque fornecedores não respeitaram as datas acordadas (mercadoria a chegar em dezembro, já fora da janela útil).'),
  ('Em novembro analisou-se o que se tinha vendido mais e fez-se encomenda adicional em vez de aproveitar stock existente de outras referências — ineficiência a evitar.');
