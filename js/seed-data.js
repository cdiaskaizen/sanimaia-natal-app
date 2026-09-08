// Dados extraídos da Ata de Reunião — Planeamento de Natal 2026 (Sanimaia)
// Usados como carga inicial (seed). Em modo Supabase, este ficheiro só é usado
// para gerar o sql/schema.sql; os dados reais vêm da base de dados partilhada.

export const AREAS = {
  MKT: { label: "Marketing", color: "#b5384d" },
  ARZ: { label: "Armazéns e Logística", color: "#2f6f4f" },
  GAM: { label: "Gama de Produtos", color: "#8a6d1d" },
  CAB: { label: "Cabazes", color: "#6b4226" },
  ALU: { label: "Alugueres e Montras", color: "#3a5a8c" },
  BF: { label: "Black Friday", color: "#1f1f1f" },
  MC: { label: "Materiais de Construção", color: "#5a5a5a" },
  GERAL: { label: "Notas Gerais", color: "#103273" },
};

export const STATUS = {
  planeado: { label: "Planeado", color: "#6b7280" },
  em_curso: { label: "Em Curso", color: "#2563eb" },
  concluido: { label: "Concluído", color: "#16a34a" },
  atrasado: { label: "Atrasado", color: "#dc2626" },
};

// due_precision: 'day' | 'week' | 'month'
// due_date: melhor estimativa em ISO (usada para ordenar/calendarizar)
export const SEED_ACTIONS = [
  { area: "MKT", title: "Sugerir fornecedor/designer para embrulhos/sacos de oferta", responsible: "Mónica", due_raw: "30/06", due_date: "2026-06-30", due_precision: "day" },
  { area: "MKT", title: "Pesquisar todos os materiais de comunicação (6 itens): etiqueta, fita, autocolante, sacos, porta-faturas, voucher", responsible: "Mónica", due_raw: "30/06", due_date: "2026-06-30", due_precision: "day" },
  { area: "MKT", title: "Coordenar publicações de natal com aberturas de loja", responsible: "Mónica", due_raw: "out/2026", due_date: "2026-10-01", due_precision: "month" },
  { area: "MKT", title: "Sessão fotográfica de natal", responsible: "Mónica", due_raw: "1ª semana out/2026", due_date: "2026-10-01", due_precision: "week" },
  { area: "MKT", title: "Avaliar tema de árvores de influencers: contactar os que temos atualmente/possíveis novas parcerias", responsible: "Mónica", due_raw: "set/2026", due_date: "2026-09-01", due_precision: "month" },
  { area: "MKT", title: "Confirmar equipa completa de montagens (4.º elemento)", responsible: "D. Helena", due_raw: "jul/2026", due_date: "2026-07-01", due_precision: "month" },

  { area: "ARZ", title: "Confirmar datas de 8 fornecedores em aberto", responsible: "Maria", due_raw: "16/06", due_date: "2026-06-16", due_precision: "day" },
  { area: "ARZ", title: "Solicitar fotografias a fornecedores principais; garantir encomendas antes do verão", responsible: "Maria", due_raw: "16/06", due_date: "2026-06-16", due_precision: "day" },
  { area: "ARZ", title: "Garantir info de paletes por marca para planeamento de armazém", responsible: "Maria", due_raw: "16/06", due_date: "2026-06-16", due_precision: "day" },
  { area: "ARZ", title: "Definir processo de reposição por loja", responsible: "Sandra", due_raw: "30/06", due_date: "2026-06-30", due_precision: "day" },
  { area: "ARZ", title: "Criar calendário de acompanhamento de vendas e posicionamento em loja", responsible: "Sandra", due_raw: "30/06", due_date: "2026-06-30", due_precision: "day" },
  { area: "ARZ", title: "Definir necessidades de RH (Porto + pessoa de montagens)", responsible: "Sandra", due_raw: "30/06", due_date: "2026-06-30", due_precision: "day" },
  { area: "ARZ", title: "Definir processo de receção de mercadoria (local e espaços)", responsible: "Sandra", due_raw: "30/06", due_date: "2026-06-30", due_precision: "day" },

  { area: "GAM", title: "Finalizar ajustes de detalhe da gama", responsible: "Teresa", due_raw: "30/06", due_date: "2026-06-30", due_precision: "day" },
  { area: "GAM", title: "Novas compras complementares (presentes e artigos diferentes)", responsible: "D. Helena", due_raw: "setembro/2026", due_date: "2026-09-01", due_precision: "month" },

  { area: "CAB", title: "Avaliar novas embalagens e comparar fornecedores", responsible: "Sandra", due_raw: "setembro 2026", due_date: "2026-09-01", due_precision: "month" },
  { area: "CAB", title: "Definir produtos, marcas e fornecedores por categoria", responsible: "Sandra", due_raw: "setembro 2026", due_date: "2026-09-01", due_precision: "month" },
  { area: "CAB", title: "Planear montagem com linha balanceada no armazém Decoração", responsible: "Sandra", due_raw: "setembro/2026", due_date: "2026-09-01", due_precision: "month" },
  { area: "CAB", title: "Fechar os 6 cabazes-base para a época", responsible: "Sandra", due_raw: "setembro/2026", due_date: "2026-09-01", due_precision: "month" },

  { area: "ALU", title: "Calendarizar montagens de montras para clientes", responsible: "D. Helena", due_raw: "out/2026", due_date: "2026-10-01", due_precision: "month" },
  { area: "ALU", title: "Avaliar capacidade de equipa e necessidade de taskforce", responsible: "D. Helena", due_raw: "jul/2026", due_date: "2026-07-01", due_precision: "month" },
  { area: "ALU", title: "Definir plano semanal de montagens (horários e frequência)", responsible: "Sandra", due_raw: "out/2026", due_date: "2026-10-01", due_precision: "month" },

  { area: "BF", title: "Garantir stock único online/físico — reunião Skrey", responsible: "Teresa", due_raw: "set/2026", due_date: "2026-09-01", due_precision: "month" },
  { area: "BF", title: "Definir processo de separação e embalagem de encomendas", responsible: "Sandra", due_raw: "set/2026", due_date: "2026-09-01", due_precision: "month" },
  { area: "BF", title: "Integração transportador no PHC com sistema de envio", responsible: "Mónica", due_raw: "set/2026", due_date: "2026-09-01", due_precision: "month" },
  { area: "BF", title: "Garantir disponibilidade da equipa de marketing na BF", responsible: "Teresa", due_raw: "out/2026", due_date: "2026-10-01", due_precision: "month" },

  { area: "MC", title: "Definir apoio de Materiais de Construção à Decoração na época", responsible: "António", due_raw: "set/2026", due_date: "2026-09-01", due_precision: "month" },
  { area: "MC", title: "Libertar espaços comuns (corredor) para operação de Decoração", responsible: "Sandra", due_raw: "jun/2026", due_date: "2026-06-01", due_precision: "month" },
];

export const SEED_SUPPLIERS = [
  { name: "Andrea Bizzotto", category: "Decoração", expected_label: "13/07/2026", expected_date: "2026-07-13", status: "confirmado" },
  { name: "Nuvole di Stoffa", category: "Decoração", expected_label: "25/08/2026", expected_date: "2026-08-25", status: "confirmado" },
  { name: "Becky's", category: "Decoração", expected_label: "01/09/2026", expected_date: "2026-09-01", status: "confirmado" },
  { name: "Boltze", category: "Decoração", expected_label: "Semana 34", expected_date: null, iso_week: 34, status: "confirmado" },
  { name: "Räder", category: "Decoração", expected_label: "Semana 35", expected_date: null, iso_week: 35, status: "confirmado" },
  { name: "Cartai Bassanesi", category: "Decoração", expected_label: "Por definir", expected_date: null, status: "por_definir" },
  { name: "Shishi", category: "Decoração", expected_label: "Por definir", expected_date: null, status: "por_definir" },
  { name: "Ellegift", category: "Decoração", expected_label: "Por definir", expected_date: null, status: "por_definir" },
  { name: "Vetur", category: "Decoração", expected_label: "Por definir", expected_date: null, status: "por_definir" },
  { name: "EDG", category: "Decoração", expected_label: "Por definir", expected_date: null, status: "por_definir" },
  { name: "Coopman", category: "Decoração", expected_label: "Por definir", expected_date: null, status: "por_definir" },
  { name: "Royal Christmas / Van der", category: "Decoração", expected_label: "Por definir", expected_date: null, status: "por_definir" },
  { name: "La Galleria", category: "Decoração", expected_label: "Por definir", expected_date: null, status: "por_definir" },
];

// Nota: existe uma divergência na ata original entre a secção de Marketing
// ("festa de abertura a 7 de dezembro") e a secção de Notas Gerais
// ("Festa de abertura: 7 de novembro"). Fica sinalizada — precisa de confirmação.
export const SEED_STORES = [
  { name: "Sanimaia Foz (Porto)", opening_date: "2026-10-16", notes: "Alterações de loja previstas 3 semanas após a abertura." },
  { name: "Sanimaia Lisboa", opening_date: "2026-10-23", notes: "Deslocação a Lisboa requer 3 dias. Alterações de loja previstas 3 semanas após a abertura." },
  { name: "Sanimaia Trofa", opening_date: "2026-10-30", notes: "Alterações de loja previstas 3 semanas após a abertura." },
];

export const SEED_EVENTS = [
  { title: "Festa de Abertura", date: "2026-12-07", flagged: true, notes: "⚠ Data divergente na ata: secção Marketing indica 7 de dezembro, secção Notas Gerais indica 7 de novembro. Confirmar com a equipa." },
];

export const SEED_RESTOCK_RULES = [
  { store: "Porto (Foz)", frequency: "Diária", method: "Logística transporta e apoia; colaborador de loja repõe", responsible: "D. Helena" },
  { store: "Lisboa", frequency: "2× por semana", method: "1 palete por transportador", responsible: "A definir" },
  { store: "Trofa", frequency: "Diária", method: "Logística Decoração repõe de manhã", responsible: "Logística Decoração" },
];

export const SEED_LESSONS_2025 = [
  "Falhas de reposição em loja — mercadoria em armazém sem chegar à prateleira a tempo.",
  "Stress elevado na montagem de cabazes — falta de planeamento e espaço dedicado.",
  "Imprevistos de última hora com impacto operacional significativo.",
  "Planeamento de compras comprometido porque fornecedores não respeitaram as datas acordadas (mercadoria a chegar em dezembro, já fora da janela útil).",
  "Em novembro analisou-se o que se tinha vendido mais e fez-se encomenda adicional em vez de aproveitar stock existente de outras referências — ineficiência a evitar.",
];

export const HAMPER_CATEGORIES = [
  "Azeite", "Vinho", "Bolachas", "Tostas", "Compotas", "Mel", "Vinagres", "Conservas", "Queijos", "Frutos secos",
];

// 6 cabazes-base a fechar (ainda sem conteúdo definido na ata — a preencher na app)
export const SEED_HAMPERS = [1, 2, 3, 4, 5, 6].map((n) => ({
  name: `Cabaz ${n}`,
  price: null,
  packaging: "",
  status: "por_definir",
  items: [],
}));

export const SEED_WINDOW_TEAM = [
  { name: "Célia", role: "Montagens" },
  { name: "Nela", role: "Montagens" },
  { name: "Ricardo", role: "Montagens" },
  { name: "4.º elemento (a confirmar)", role: "Montagens — contratação externa ou colaborador interno, a cargo de D. Helena" },
];

// Sem dados reais de SKU disponíveis na ata (dependem do PHC) — a secção fica
// pronta para preenchimento manual e para, mais tarde, ser alimentada
// automaticamente pela query de vendas vs. compras 2025 do PHC.
export const SEED_STOCK_ITEMS = [];

export const GENERAL_NOTES = [
  "Descontinuar os ursos de natal — definir o que fica reservado para montras.",
  "Selecionar tema visual para montras (referência: Ralph Lauren).",
  "Preparar algo diferente para o mercado de natal — brainstorming alargado a toda a equipa (data a definir).",
  "Comunicação interna: garantir fluxo de informação claro, atempado e transparente para todas as equipas.",
  "Garantir que todas as localizações de loja e armazém estão prontas antes do arranque da época.",
];
