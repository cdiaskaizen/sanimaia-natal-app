# Prompt para criar este projeto no Lovable

Cola isto num projeto novo em https://lovable.dev (tal como `ferias-sanimaia` e
`auditorias-sanimaia`, o Lovable cria automaticamente um projeto Supabase dedicado).

---

Cria uma aplicação web de gestão de projeto para o planeamento da época de Natal 2026 da
Sanimaia (loja de decoração). Nome do projeto: "sanimaia-natal". Usa React + Vite + TypeScript +
Tailwind + shadcn/ui, com Supabase para autenticação e dados (magic link / OTP por email, sem
password). Estilo visual: fundo creme quente (hsl(30 20% 97%)), cor primária rosé/mauve
(hsl(340 35% 55%)), títulos em Playfair Display, texto em Inter, cantos arredondados (radius
0.75rem), cards brancos com sombra suave — o mesmo sistema visual dos projetos irmãos
`ferias-sanimaia` e `auditorias-sanimaia`.

## Navegação (sidebar)
Dashboard, Calendário, Ações, Armazém & Fornecedores, Marketing, Cabazes, Montras, Lições 2025.

## Dashboard
KPIs: % ações concluídas, nº atrasadas, nº em curso, nº fornecedores por definir. Lista dos
próximos prazos. Lista de aberturas de loja com contagem de dias. Resumo por área.

## Calendário
Vista mensal navegável (mês anterior/seguinte) mostrando num único calendário: prazos de ações
(dia exato), aberturas de loja, eventos gerais, posts de marketing. Itens com precisão "mês" (sem
dia exato) aparecem numa lista lateral "sem data exata este mês" em vez de num dia fixo, para não
sugerir falsa precisão.

## Ações
Quadro kanban com 4 colunas: Planeado / Em Curso / Atrasado / Concluído. CRUD completo (criar,
editar responsável/prazo/estado, eliminar). Filtros por área e por estado, pesquisa por texto.
Estado "Atrasado" é sugerido automaticamente quando a data-limite passa e a ação não está
concluída (mas o utilizador pode sempre alterar o estado manualmente).

Áreas: Marketing (MKT), Armazéns e Logística (ARZ), Gama de Produtos (GAM), Cabazes (CAB),
Alugueres e Montras (ALU), Black Friday (BF), Materiais de Construção (MC).

## Armazém & Fornecedores
Tabela de fornecedores com nome, categoria, data prevista de receção, estado (Confirmado / Por
definir / Recebido) e botão "marcar como recebido" (regista data de receção). CRUD completo.
Tabela de processo de reposição por loja (loja, frequência, método, responsável).
Secção "Sobras de stock 2025": tabela de produtos com quantidade encomendada 2025, quantidade
vendida 2025, sobra calculada, e campo de decisão (Reaproveitar / Promover / Devolver /
Descontinuar) — para cruzar o que sobrou da época passada com o plano de compras 2026.

## Marketing
Lista/tabela de posts e campanhas (título, tipo, canal, data, estado), CRUD completo, mostrando as
datas de abertura de loja como referência de coordenação.

## Cabazes
6 cartões editáveis ("Cabaz 1" a "Cabaz 6"), cada um com: nome editável, preço, embalagem, estado
(Por definir / Fechado), e lista de produtos (categoria + marca/produto) com adicionar/remover.
Categorias de referência: Azeite, Vinho, Bolachas, Tostas, Compotas, Mel, Vinagres, Conservas,
Queijos, Frutos secos.

## Montras
Lista da equipa de montagens (chips). Tabela de trabalhos (cliente/local, tema, responsável, data,
estado) com CRUD completo.

## Lições 2025
Lista simples (read-only) de aprendizagens da época anterior.

## Dados iniciais (seed)
Usa exatamente os dados abaixo como carga inicial da base de dados (ações, fornecedores, lojas,
processo de reposição, lições, equipa de montras) — ver `sql/schema.sql` e `js/seed-data.js` deste
repositório para a lista completa e literal extraída da ata de reunião. Não inventes números de
vendas/stock — a secção de stock 2025 deve começar vazia, pronta para preenchimento manual.

## Autenticação
Login por magic link / código OTP de email (sem password). Restringir o acesso aos domínios de
email da Sanimaia e da Kaizen (perguntar ao utilizador quais domínios/emails exatos antes de
fixar a lista).
