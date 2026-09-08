# Sanimaia · Planeamento Natal 2026

Aplicação de gestão do plano de ações da época de Natal 2026, gerada a partir da
ata `Sanimaia_ATA_Planeamento_Natal_2026_1.docx`. Cobre: plano de ações por área
(estados Planeado/Em Curso/Concluído/Atrasado, arrastar-e-largar, comentários),
calendário com aberturas de loja e prazos, armazém/fornecedores com o que já
chegou (ligado ao PHC), sobras de stock 2025, marketing (posts/campanhas),
cabazes, montras (com lista de produtos e imagens de inspiração) e lições 2025.

## Estado atual

- **Base de dados**: projeto Supabase próprio "Planeamento Natal"
  (`js/config.js`), acesso aberto — sem login, qualquer pessoa com o link lê e
  escreve. Esquema completo em [`sql/schema.sql`](sql/schema.sql).
- **Site**: publicado via GitHub Pages a partir deste repositório.
- **Sem login**: decisão explícita — o link é público para toda a equipa.

## Correr localmente

```bash
python -m http.server 8791
```
depois abrir http://localhost:8791

## Ligar ao PHC (sincronização manual, só leitura)

`scripts/sync_phc.py` liga ao SQL Server do PHC (rede interna da Sanimaia),
cruza os fornecedores da ata com a família de artigos de Natal, e escreve
`js/phc-snapshot.json` (lido pela app). As credenciais NUNCA ficam no código —
vêm de variáveis de ambiente:

```powershell
$env:PHC_USER = "Kaizen"
$env:PHC_PASSWORD = "a-tua-password"
python scripts/sync_phc.py
```

Depois de correr, publicar o `js/phc-snapshot.json` atualizado (`git add`,
`commit`, `push`) para o site refletir os dados novos.

## Atualizar o site publicado

Qualquer alteração ao código: `git add`, `commit`, `push` para `main` — o
GitHub Pages atualiza sozinho em 1-2 minutos. Os dados da app em si (ações,
fornecedores, etc.) não precisam disto — vêm sempre do Supabase, em direto.
