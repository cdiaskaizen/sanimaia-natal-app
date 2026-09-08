import { db } from "./db.js";
import { requireSession } from "./auth.js";
import { AREAS, STATUS, GENERAL_NOTES } from "./seed-data.js";
import {
  uid, todayISO, parseISO, formatDatePT,
  effectiveStatus, escapeHtml,
} from "./utils.js";

const root = document.getElementById("app");
let CACHE = {};
let PHC = null; // snapshot mais recente do PHC (js/phc-snapshot.json), null se ainda não sincronizado

async function loadPhcSnapshot() {
  try {
    const res = await fetch(new URL("./phc-snapshot.json", import.meta.url), { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "grid" },
  { id: "actions", label: "Ações", icon: "check" },
  { id: "warehouse", label: "Armazém & Fornecedores", icon: "box" },
  { id: "marketing", label: "Marketing", icon: "megaphone" },
  { id: "windows", label: "Montras", icon: "window" },
  { id: "lessons", label: "Lições 2025", icon: "book" },
];

async function loadAll() {
  const [actions, suppliers, stores, marketingPosts, windowJobs, windowTeam, restockRules, restockShipments, lessons, stockItems] =
    await Promise.all([
      db.actions.list(), db.suppliers.list(), db.stores.list(),
      db.marketingPosts.list(), db.windowJobs.list(), db.windowTeam.list(),
      db.restockRules.list(), db.restockShipments.list(), db.lessons.list(), db.stockItems.list(),
    ]);
  CACHE = { actions, suppliers, stores, marketingPosts, windowJobs, windowTeam, restockRules, restockShipments, lessons, stockItems };
}

function iconSvg(name) {
  const icons = {
    grid: '<path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>',
    calendar: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    megaphone: '<path d="M3 11v2a1 1 0 0 0 1 1h1l3 6h2l-1-6h6l5 3V5l-5 3H8L5 7H4a1 1 0 0 0-1 1z"/>',
    gift: '<rect x="3" y="8" width="18" height="13" rx="1"/><path d="M12 8v13M3 12h18M12 8c-2 0-4-1.5-4-3.5S9.5 1 11 2c1 .7 1 3 1 6zm0 0c2 0 4-1.5 4-3.5S13.5 1 12 2c-1 .7-1 3-1 6z"/>',
    window: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18M3 12h18"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[name] || ""}</svg>`;
}

function currentRoute() {
  return (location.hash.replace("#", "") || "dashboard").split("?")[0];
}

function shell() {
  const route = currentRoute();
  return `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">
          <img class="brand-logo" src="./assets/logo.png" alt="Sanimaia"
               onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'brand-mark',textContent:'SN'}))" />
          <div>
            <div class="brand-title">Sanimaia</div>
            <div class="brand-sub">Planeamento Natal 2026</div>
          </div>
        </div>
        <nav class="nav">
          ${NAV.map((n) => `
            <a href="#${n.id}" class="nav-item ${route === n.id ? "active" : ""}">
              <span class="nav-icon">${iconSvg(n.icon)}</span>${n.label}
            </a>`).join("")}
        </nav>
      </aside>
      <main class="content" id="view"></main>
    </div>
    <div id="modal-root"></div>
    <div id="toast-root"></div>
  `;
}

function daysLeft(iso) {
  const d = Math.round((parseISO(iso) - parseISO(todayISO())) / 86400000);
  return d;
}

// ---------- DASHBOARD ----------
function renderDashboard() {
  const { actions, stores, suppliers } = CACHE;
  const withEff = actions.map((a) => ({ ...a, eff: effectiveStatus(a) }));
  const total = withEff.length;
  const done = withEff.filter((a) => a.eff === "concluido").length;
  const late = withEff.filter((a) => a.eff === "atrasado").length;
  const inProgress = withEff.filter((a) => a.eff === "em_curso").length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const upcoming = withEff
    .filter((a) => a.eff !== "concluido" && a.due_date)
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
    .slice(0, 6);

  const nextStore = stores
    .filter((s) => daysLeft(s.opening_date) >= 0)
    .sort((a, b) => a.opening_date.localeCompare(b.opening_date))[0];

  const pending = suppliers.filter((s) => s.status === "por_definir").length;

  return `
    <header class="view-header">
      <div>
        <h1>Dashboard</h1>
        <p class="muted">Visão geral da época de Natal 2026 — Sanimaia Decoração</p>
      </div>
    </header>

    <section class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-value">${pct}%</div>
        <div class="kpi-label">Ações concluídas</div>
        <div class="kpi-bar"><div class="kpi-bar-fill" style="width:${pct}%"></div></div>
      </div>
      <div class="kpi-card kpi-danger">
        <div class="kpi-value">${late}</div>
        <div class="kpi-label">Ações atrasadas</div>
      </div>
      <div class="kpi-card kpi-info">
        <div class="kpi-value">${inProgress}</div>
        <div class="kpi-label">Em curso</div>
      </div>
      <div class="kpi-card kpi-warn">
        <div class="kpi-value">${pending}</div>
        <div class="kpi-label">Fornecedores por definir</div>
      </div>
    </section>

    <section class="two-col">
      <div class="panel">
        <div class="panel-header"><h2>Próximos prazos</h2><a href="#actions" class="link">Ver todas →</a></div>
        <div class="list">
          ${upcoming.length === 0 ? '<p class="muted">Sem prazos pendentes 🎄</p>' : upcoming.map((a) => `
            <div class="list-row">
              <span class="dot" style="background:${AREAS[a.area]?.color}"></span>
              <div class="list-row-main">
                <div class="list-row-title">${escapeHtml(a.title)}</div>
                <div class="list-row-sub">${escapeHtml(a.responsible)} · ${escapeHtml(a.due_raw)}</div>
              </div>
              <span class="badge badge-${a.eff}">${STATUS[a.eff]?.label}</span>
            </div>`).join("")}
        </div>
      </div>

      <div class="panel">
        <div class="panel-header"><h2>Aberturas de loja</h2></div>
        <div class="list">
          ${stores.sort((a, b) => a.opening_date.localeCompare(b.opening_date)).map((s) => {
            const dl = daysLeft(s.opening_date);
            return `<div class="list-row">
              <span class="dot" style="background:#103273"></span>
              <div class="list-row-main">
                <div class="list-row-title">${escapeHtml(s.name)}</div>
                <div class="list-row-sub">${formatDatePT(s.opening_date)}</div>
              </div>
              <span class="pill">${dl >= 0 ? `em ${dl} dias` : "concluída"}</span>
            </div>`;
          }).join("")}
        </div>
        ${nextStore ? `<div class="callout">Próxima abertura: <strong>${escapeHtml(nextStore.name)}</strong> em ${daysLeft(nextStore.opening_date)} dias.</div>` : ""}
      </div>
    </section>

    <section class="panel">
      <div class="panel-header"><h2>Por área</h2></div>
      <div class="area-grid">
        ${Object.entries(AREAS).filter(([k]) => k !== "GERAL").map(([key, meta]) => {
          const areaActions = withEff.filter((a) => a.area === key);
          const areaDone = areaActions.filter((a) => a.eff === "concluido").length;
          const areaLate = areaActions.filter((a) => a.eff === "atrasado").length;
          return `<div class="area-card" style="border-left-color:${meta.color}">
            <div class="area-card-title">${meta.label}</div>
            <div class="area-card-stats">${areaDone}/${areaActions.length} concluídas ${areaLate ? `· <span class="text-danger">${areaLate} atrasadas</span>` : ""}</div>
          </div>`;
        }).join("")}
      </div>
    </section>
  `;
}

// ---------- ACTIONS ----------
let actionFilters = { area: "all", responsibles: [], q: "" };

// "Teresa e Helena", "Rui + Ana", "Maria, Sandra" -> ["Teresa","Helena"] etc.
function parseResponsibles(str) {
  return (str || "")
    .split(/\s*(?:,|&|\+|\/| e )\s*/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

function allResponsiblesList() {
  const set = new Set();
  CACHE.actions.forEach((a) => parseResponsibles(a.responsible).forEach((r) => set.add(r)));
  return [...set].sort((a, b) => a.localeCompare(b, "pt"));
}

function renderActions() {
  // Planeado / Em Curso / Concluído são manuais (arrastar fica). Atrasado é
  // sempre automático (prazo passado + ainda não em curso/concluído).
  let list = CACHE.actions.map((a) => ({ ...a, eff: effectiveStatus(a) }));
  if (actionFilters.area !== "all") list = list.filter((a) => a.area === actionFilters.area);
  if (actionFilters.responsibles.length) {
    list = list.filter((a) => parseResponsibles(a.responsible).some((r) => actionFilters.responsibles.includes(r)));
  }
  if (actionFilters.q) {
    const q = actionFilters.q.toLowerCase();
    list = list.filter((a) => a.title.toLowerCase().includes(q) || a.responsible.toLowerCase().includes(q));
  }

  const columns = ["planeado", "em_curso", "atrasado", "concluido"];
  const areaTabs = [["all", "Todas"], ...Object.entries(AREAS).filter(([k]) => k !== "GERAL")];
  const people = allResponsiblesList();

  return `
    <header class="view-header">
      <div>
        <h1>Ações</h1>
        <p class="muted">${CACHE.actions.length} ações identificadas na reunião de planeamento</p>
      </div>
      <button class="btn btn-primary" id="btn-add-action">+ Nova ação</button>
    </header>

    <div class="area-tabs">
      ${areaTabs.map(([k, v]) => `<button class="area-tab ${actionFilters.area === k ? "active" : ""}" data-area-tab="${k}">${typeof v === "string" ? v : v.label}</button>`).join("")}
    </div>

    <div class="toolbar">
      <input type="text" id="action-search" placeholder="Pesquisar ação ou responsável…" value="${escapeHtml(actionFilters.q)}" />
      <div class="multiselect" id="responsible-multiselect">
        <button type="button" class="btn btn-ghost multiselect-toggle" id="responsible-toggle">
          ${actionFilters.responsibles.length ? `${actionFilters.responsibles.length} responsável(is) ▾` : "Todos os responsáveis ▾"}
        </button>
        <div class="multiselect-panel" id="responsible-panel" hidden>
          ${people.map((p) => `
            <label class="multiselect-option">
              <input type="checkbox" value="${escapeHtml(p)}" ${actionFilters.responsibles.includes(p) ? "checked" : ""} />
              <span class="multiselect-option-label">${escapeHtml(p)}</span>
            </label>
          `).join("") || '<p class="muted small" style="padding:8px 12px">Sem responsáveis ainda.</p>'}
        </div>
      </div>
    </div>

    <p class="muted small">Arrasta os cartões entre colunas. "Atrasado" é automático (prazo passado) — arrasta para Em Curso ou Concluído para o tirar de lá.</p>

    <div class="kanban">
      ${columns.map((col) => {
        const dropEnabled = col !== "atrasado";
        return `
        <div class="kanban-col">
          <div class="kanban-col-header"><span class="badge badge-${col}">${STATUS[col].label}</span><span class="muted">${list.filter((a) => a.eff === col).length}</span></div>
          <div class="kanban-col-body" data-status-col="${col}" data-drop-enabled="${dropEnabled}">
            ${list.filter((a) => a.eff === col).map((a) => `
              <div class="action-card" data-id="${a.id}" style="border-left-color:${AREAS[a.area]?.color}">
                <div class="action-card-area">${AREAS[a.area]?.label}</div>
                <div class="action-card-title">${escapeHtml(a.title)}</div>
                <div class="action-card-meta">
                  <span>${escapeHtml(a.responsible)}</span>
                  <span>${escapeHtml(a.due_raw)}</span>
                </div>
                ${a.comments && a.comments.length ? `<div class="comment-count">💬 ${a.comments.length}</div>` : ""}
                <div class="action-card-actions">
                  <button class="icon-btn" data-edit="${a.id}" title="Editar">✎</button>
                  <button class="icon-btn icon-btn-danger" data-del="${a.id}" title="Eliminar">🗑</button>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `;
      }).join("")}
    </div>
  `;
}

// Drag-and-drop próprio (mousedown/mousemove/mouseup), em vez da API nativa
// de drag do HTML5 — mais fiável dentro de painéis de browser embutidos, que
// nem sempre encaminham os eventos dragstart/dragover/drop corretamente.
function initKanbanDrag(view) {
  let sourceCard = null, sourceId = null, ghost = null, overCol = null;
  let startX = 0, startY = 0, dragging = false;

  function moveGhost(x, y) {
    ghost.style.left = `${x - ghost.offsetWidth / 2}px`;
    ghost.style.top = `${y - 16}px`;
  }

  function cleanup() {
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    if (ghost) ghost.remove();
    if (sourceCard) sourceCard.classList.remove("dragging-source");
    if (overCol) overCol.classList.remove("kanban-col-body-over");
    ghost = null; sourceCard = null; sourceId = null; overCol = null; dragging = false;
  }

  function onMove(e) {
    if (!dragging) {
      if (Math.abs(e.clientX - startX) < 4 && Math.abs(e.clientY - startY) < 4) return;
      dragging = true;
      const rect = sourceCard.getBoundingClientRect();
      ghost = sourceCard.cloneNode(true);
      ghost.className = "action-card kanban-ghost";
      ghost.style.width = `${rect.width}px`;
      document.body.appendChild(ghost);
      sourceCard.classList.add("dragging-source");
    }
    moveGhost(e.clientX, e.clientY);
    ghost.style.display = "none";
    const el = document.elementFromPoint(e.clientX, e.clientY);
    ghost.style.display = "";
    const col = el?.closest("[data-status-col]");
    const validCol = col && col.dataset.dropEnabled === "true" ? col : null;
    if (overCol && overCol !== validCol) overCol.classList.remove("kanban-col-body-over");
    if (validCol) validCol.classList.add("kanban-col-body-over");
    overCol = validCol;
  }

  async function onUp() {
    const targetCol = overCol;
    const id = sourceId;
    const wasDragging = dragging;
    cleanup();
    if (!wasDragging || !targetCol) return;
    const newStatus = targetCol.dataset.statusCol;
    const a = CACHE.actions.find((x) => x.id === id);
    if (!a || a.status === newStatus) return;
    await db.actions.update(id, { status: newStatus });
    toast(`Movido para "${STATUS[newStatus].label}".`);
    await refresh();
  }

  view.querySelectorAll(".action-card").forEach((card) => {
    card.addEventListener("mousedown", (e) => {
      if (e.button !== 0 || e.target.closest(".icon-btn")) return;
      sourceCard = card;
      sourceId = card.dataset.id;
      startX = e.clientX; startY = e.clientY;
      dragging = false;
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp, { once: true });
    });
  });
}

function renderCommentsList(comments) {
  const list = comments || [];
  if (!list.length) return '<p class="muted small">Sem comentários ainda.</p>';
  return list.slice().reverse().map((c) => `
    <div class="comment-row">
      <div class="comment-text">${escapeHtml(c.text)}</div>
      <div class="comment-meta">
        ${formatDateTimePT(c.created_at)}
        <button type="button" class="icon-btn icon-btn-danger comment-delete" data-comment-id="${c.id}" title="Eliminar comentário">🗑</button>
      </div>
    </div>
  `).join("");
}

function wireCommentBox(a) {
  const btn = document.getElementById("add-comment-btn");
  const input = document.getElementById("new-comment-input");
  const list = document.getElementById("comments-list");
  if (!btn || !input || !list) return;

  const persistAndRerender = async (updated) => {
    a.comments = updated;
    const cached = CACHE.actions.find((x) => x.id === a.id);
    if (cached) cached.comments = updated;
    await db.actions.update(a.id, { comments: updated });
    document.getElementById("comments-list").innerHTML = renderCommentsList(updated);
    bindCommentDeleteButtons(a);
  };

  const submit = async () => {
    const text = input.value.trim();
    if (!text) return;
    const comment = { id: uid(), text, created_at: new Date().toISOString() };
    await persistAndRerender([...(a.comments || []), comment]);
    input.value = "";
    input.focus();
  };
  btn.onclick = submit;
  input.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } };

  bindCommentDeleteButtons(a, persistAndRerender);
}

function bindCommentDeleteButtons(a, persistAndRerender) {
  document.querySelectorAll(".comment-delete").forEach((btn) => {
    btn.onclick = async () => {
      if (!window.confirm("Eliminar este comentário?")) return;
      const updated = (a.comments || []).filter((c) => c.id !== btn.dataset.commentId);
      await persistAndRerender(updated);
    };
  });
}

function openActionEditModal(a) {
  openModal({
    title: "Editar ação", bodyHtml: actionFormHtml(a),
    onSubmit: async (data) => { await db.actions.update(a.id, data); toast("Ação atualizada."); },
  });
  wireCommentBox(a);
}

function actionFormHtml(action) {
  const a = action || { area: "MKT", title: "", responsible: "", due_raw: "", due_date: "", due_precision: "day", status: "planeado", comments: [] };
  return `
    <label>Área
      <select name="area">${Object.entries(AREAS).map(([k, v]) => `<option value="${k}" ${a.area === k ? "selected" : ""}>${v.label}</option>`).join("")}</select>
    </label>
    <label>Ação
      <textarea name="title" rows="2" required>${escapeHtml(a.title)}</textarea>
    </label>
    <label>Responsável
      <input type="text" name="responsible" value="${escapeHtml(a.responsible)}" required />
    </label>
    <div class="form-row">
      <label>Data limite
        <input type="date" name="due_date" value="${a.due_date || ""}" />
      </label>
      <label>Precisão
        <select name="due_precision">
          <option value="day" ${a.due_precision === "day" ? "selected" : ""}>Dia exato</option>
          <option value="week" ${a.due_precision === "week" ? "selected" : ""}>Semana</option>
          <option value="month" ${a.due_precision === "month" ? "selected" : ""}>Mês</option>
        </select>
      </label>
    </div>
    <label>Prazo (texto original, ex: "out/2026")
      <input type="text" name="due_raw" value="${escapeHtml(a.due_raw)}" />
    </label>
    <label>Estado
      <select name="status">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${a.status === k ? "selected" : ""}>${v.label}</option>`).join("")}</select>
    </label>
    <div class="comments-section">
      <div class="job-card-section-title">Comentários</div>
      <div class="comments-list" id="comments-list">${renderCommentsList(a.comments)}</div>
      <div class="comment-add">
        <input type="text" id="new-comment-input" placeholder="Adicionar comentário…" />
        <button type="button" class="btn btn-sm" id="add-comment-btn">Adicionar</button>
      </div>
    </div>
  `;
}

// ---------- WAREHOUSE / SUPPLIERS ----------
function renderWarehouse() {
  const { suppliers, restockRules, restockShipments, stockItems } = CACHE;
  return `
    <header class="view-header">
      <div>
        <h1>Armazém & Fornecedores</h1>
        <p class="muted">Datas de receção previstas e o que já chegou à Sanimaia</p>
      </div>
      <button class="btn btn-primary" id="btn-add-supplier">+ Novo fornecedor</button>
    </header>

    ${renderPhcPanel()}

    <div class="table-wrap">
      <table>
        <thead><tr><th>Fornecedor</th><th>Categoria</th><th>Previsão</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          ${suppliers.map((s) => `
            <tr data-id="${s.id}">
              <td>${escapeHtml(s.name)}</td>
              <td>${escapeHtml(s.category || "—")}</td>
              <td>${escapeHtml(s.expected_label || (s.expected_date ? formatDatePT(s.expected_date) : "—"))}</td>
              <td><span class="badge badge-supplier-${s.status}">${supplierStatusLabel(s.status)}</span>${s.received_date ? `<div class="muted small">Recebido ${formatDatePT(s.received_date)}</div>` : ""}</td>
              <td class="row-actions">
                ${s.status !== "recebido" ? `<button class="btn btn-sm" data-receive="${s.id}">Marcar como recebido</button>` : ""}
                <button class="icon-btn" data-edit-supplier="${s.id}">✎</button>
                <button class="icon-btn icon-btn-danger" data-del-supplier="${s.id}">🗑</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>

    <section class="panel" style="margin-top:24px">
      <div class="panel-header">
        <h2>Processo de reposição por loja</h2>
        <button class="btn btn-sm" id="btn-add-restock-rule">+ Nova regra</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Loja</th><th>Frequência</th><th>Método</th><th>Responsável</th><th></th></tr></thead>
          <tbody>
            ${restockRules.map((r) => `<tr data-id="${r.id}">
              <td>${escapeHtml(r.store)}</td><td>${escapeHtml(r.frequency)}</td><td>${escapeHtml(r.method)}</td><td>${escapeHtml(r.responsible)}</td>
              <td class="row-actions">
                <button class="icon-btn" data-edit-rule="${r.id}">✎</button>
                <button class="icon-btn icon-btn-danger" data-del-rule="${r.id}">🗑</button>
              </td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel" style="margin-top:24px">
      <div class="panel-header">
        <h2>Envios de reposição — produtos a enviar</h2>
        <button class="btn btn-sm" id="btn-add-shipment">+ Novo envio</button>
      </div>
      ${restockShipments.length === 0 ? `<div class="empty-state">Ainda sem envios registados. Cria um envio por loja/data e adiciona os produtos que vão nele.</div>` : `
      <div class="hamper-grid">
        ${restockShipments.map((s) => `
          <div class="hamper-card" data-id="${s.id}">
            <div class="hamper-card-header">
              <div>
                <div class="job-card-title" style="font-size:0.95rem">${escapeHtml(s.store)}</div>
                <div class="muted small">${s.date ? formatDatePT(s.date) : "sem data"}</div>
              </div>
              <span class="badge badge-${s.status || "planeado"}">${STATUS[s.status || "planeado"]?.label}</span>
            </div>
            <div class="hamper-items">
              ${(s.items || []).map((it, idx) => `
                <div class="hamper-item">
                  <span>${escapeHtml(it.product)}${it.qty ? ` — ${escapeHtml(String(it.qty))}` : ""}</span>
                  <button class="icon-btn icon-btn-danger" data-remove-shipment-item="${s.id}" data-item-idx="${idx}">✕</button>
                </div>
              `).join("") || '<p class="muted small">Sem produtos definidos.</p>'}
            </div>
            <form class="item-list-form" data-shipment-id="${s.id}">
              <input type="text" name="product" placeholder="Produto" required />
              <input type="number" name="qty" placeholder="Qtd." min="0" />
              <button type="submit" class="btn btn-sm">Adicionar produto</button>
            </form>
            <div class="form-row" style="margin-top:8px">
              <label class="small">Estado
                <select data-shipment-status="${s.id}">
                  ${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${(s.status || "planeado") === k ? "selected" : ""}>${v.label}</option>`).join("")}
                </select>
              </label>
              <button class="icon-btn icon-btn-danger" data-del-shipment="${s.id}" style="align-self:end">🗑 Eliminar envio</button>
            </div>
          </div>
        `).join("")}
      </div>`}
    </section>

    ${PHC && PHC.leftover_2025 && PHC.leftover_2025.length ? `
    <section class="panel" style="margin-top:24px">
      <div class="panel-header"><h2>Sobras de stock 2025 — dados reais do PHC</h2></div>
      <div class="callout">
        Top ${PHC.leftover_2025.length} artigos da família de Natal com maior sobra (comprado − vendido
        em 2025), calculado a partir do PHC em ${formatDateTimePT(PHC.generated_at)}.
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Referência</th><th>Produto</th><th>Fornecedor</th><th>Comprado 2025</th><th>Vendido 2025</th><th>Sobra</th></tr></thead>
          <tbody>
            ${PHC.leftover_2025.map((it) => `
              <tr>
                <td>${escapeHtml(it.ref)}</td>
                <td>${escapeHtml(it.product)}</td>
                <td>${escapeHtml(it.supplier)}</td>
                <td>${it.qty_ordered}</td>
                <td>${it.qty_sold}</td>
                <td class="${it.leftover > 0 ? "text-danger" : ""}">${it.leftover}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>` : ""}

    <section class="panel" style="margin-top:24px">
      <div class="panel-header">
        <h2>Sobras de stock 2025 — outros produtos (manual)</h2>
        <button class="btn btn-sm" id="btn-add-stock">+ Adicionar produto</button>
      </div>
      <div class="callout">
        Lição de 2025: em novembro fez-se encomenda adicional do que vendia mais em vez de aproveitar
        stock existente de outras referências. Usa esta tabela para produtos fora da família "Natal"
        do PHC, ou correções manuais.
      </div>
      ${stockItems.length === 0 ? `<div class="empty-state">Ainda sem produtos registados manualmente.</div>` : `
      <div class="table-wrap">
        <table>
          <thead><tr><th>Produto</th><th>Categoria</th><th>Encomendado 2025</th><th>Vendido 2025</th><th>Sobra</th><th>Decisão</th><th></th></tr></thead>
          <tbody>
            ${stockItems.map((s) => {
              const remaining = (s.qty_ordered ?? 0) - (s.qty_sold ?? 0);
              return `<tr data-id="${s.id}">
                <td>${escapeHtml(s.product)}</td>
                <td>${escapeHtml(s.category || "—")}</td>
                <td>${s.qty_ordered ?? "—"}</td>
                <td>${s.qty_sold ?? "—"}</td>
                <td class="${remaining > 0 ? "text-danger" : ""}">${remaining}</td>
                <td>${escapeHtml(s.decision || "—")}</td>
                <td class="row-actions">
                  <button class="icon-btn" data-edit-stock="${s.id}">✎</button>
                  <button class="icon-btn icon-btn-danger" data-del-stock="${s.id}">🗑</button>
                </td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>`}
    </section>
  `;
}

function stockFormHtml(s) {
  const v = s || { product: "", category: "", qty_ordered: "", qty_sold: "", decision: "Reaproveitar em 2026", notes: "" };
  return `
    <label>Produto<input type="text" name="product" value="${escapeHtml(v.product)}" required /></label>
    <label>Categoria<input type="text" name="category" value="${escapeHtml(v.category || "")}" placeholder="ex: Azeite, Vinho, Decoração…" /></label>
    <div class="form-row">
      <label>Qtd. encomendada 2025<input type="number" name="qty_ordered" value="${v.qty_ordered ?? ""}" /></label>
      <label>Qtd. vendida 2025<input type="number" name="qty_sold" value="${v.qty_sold ?? ""}" /></label>
    </div>
    <label>Decisão
      <select name="decision">
        ${["Reaproveitar em 2026", "Promover / liquidar", "Devolver ao fornecedor", "Descontinuar"].map((d) => `<option ${v.decision === d ? "selected" : ""}>${d}</option>`).join("")}
      </select>
    </label>
    <label>Notas<textarea name="notes" rows="2">${escapeHtml(v.notes || "")}</textarea></label>
  `;
}

function renderPhcPanel() {
  if (!PHC) {
    return `
      <div class="callout callout-warn">
        Ainda sem dados do PHC nesta app. Corre <code>python scripts/sync_phc.py</code> neste portátil
        (precisa de estar na rede da Sanimaia / VPN, com acesso a 10.0.0.6) e recarrega a página —
        os dados ficam atualizados à data dessa sincronização, não em tempo real.
      </div>`;
  }
  const rows = Object.entries(PHC.suppliers || {});
  return `
    <div class="callout">
      Dados reais do PHC (SQL Server 10.0.0.6, família "Natal") — sincronizado em
      <strong>${formatDateTimePT(PHC.generated_at)}</strong>. Não é em tempo real: corre
      <code>python scripts/sync_phc.py</code> para atualizar.
    </div>
    <div class="table-wrap" style="margin-bottom:20px">
      <table>
        <thead><tr><th>Fornecedor (ata)</th><th>SKUs Natal no PHC</th><th>Stock atual</th><th>Recebido em 2026</th><th>Última receção</th></tr></thead>
        <tbody>
          ${rows.map(([label, s]) => `
            <tr>
              <td>${escapeHtml(label)}</td>
              <td>${s.error ? `<span class="text-danger">erro</span>` : s.skus_familia_natal}</td>
              <td>${s.error ? "—" : s.stock_atual}</td>
              <td>${s.error ? "—" : s.recebido_2026}</td>
              <td>${s.error ? "—" : (s.ultima_receção ? formatDatePT(s.ultima_receção.slice(0, 10)) : "sem receção registada em 2026")}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function restockRuleFormHtml(r) {
  const v = r || { store: "", frequency: "", method: "", responsible: "" };
  return `
    <label>Loja<input type="text" name="store" value="${escapeHtml(v.store)}" required /></label>
    <label>Frequência<input type="text" name="frequency" value="${escapeHtml(v.frequency || "")}" placeholder="ex: Diária, 2× por semana" /></label>
    <label>Método<input type="text" name="method" value="${escapeHtml(v.method || "")}" /></label>
    <label>Responsável<input type="text" name="responsible" value="${escapeHtml(v.responsible || "")}" /></label>
  `;
}

function shipmentFormHtml(s) {
  const v = s || { store: "", date: "", status: "planeado" };
  return `
    <label>Loja<input type="text" name="store" value="${escapeHtml(v.store)}" required /></label>
    <label>Data<input type="date" name="date" value="${v.date || ""}" /></label>
  `;
}

function supplierStatusLabel(s) {
  return { confirmado: "Confirmado", por_definir: "Por definir", recebido: "Recebido" }[s] || s;
}

function supplierFormHtml(s) {
  const v = s || { name: "", category: "Decoração", expected_label: "", expected_date: "", status: "por_definir" };
  return `
    <label>Fornecedor<input type="text" name="name" value="${escapeHtml(v.name)}" required /></label>
    <label>Categoria<input type="text" name="category" value="${escapeHtml(v.category)}" /></label>
    <label>Previsão (texto, ex: "Semana 34")<input type="text" name="expected_label" value="${escapeHtml(v.expected_label || "")}" /></label>
    <label>Data prevista<input type="date" name="expected_date" value="${v.expected_date || ""}" /></label>
    <label>Estado
      <select name="status">
        <option value="por_definir" ${v.status === "por_definir" ? "selected" : ""}>Por definir</option>
        <option value="confirmado" ${v.status === "confirmado" ? "selected" : ""}>Confirmado</option>
        <option value="recebido" ${v.status === "recebido" ? "selected" : ""}>Recebido</option>
      </select>
    </label>
  `;
}

// ---------- MARKETING ----------
function renderMarketing() {
  const { marketingPosts, stores } = CACHE;
  const sorted = [...marketingPosts].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  return `
    <header class="view-header">
      <div>
        <h1>Marketing</h1>
        <p class="muted">Posts e campanhas de Natal, coordenados com as aberturas de loja</p>
      </div>
      <button class="btn btn-primary" id="btn-add-post">+ Novo post/campanha</button>
    </header>

    <div class="callout">
      Aberturas de loja: ${stores.map((s) => `<strong>${escapeHtml(s.name)}</strong> — ${formatDatePT(s.opening_date)}`).join(" · ")}
    </div>

    ${sorted.length === 0 ? `<div class="empty-state">Ainda sem posts/campanhas planeados. Usa "+ Novo post/campanha" para começar (ex: sessão fotográfica de Natal, campanha de abertura da Foz, Black Friday).</div>` : `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Título</th><th>Tipo</th><th>Canal</th><th>Data</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          ${sorted.map((p) => `
            <tr data-id="${p.id}">
              <td>${escapeHtml(p.title)}</td>
              <td>${escapeHtml(p.type || "—")}</td>
              <td>${escapeHtml(p.channel || "—")}</td>
              <td>${p.date ? formatDatePT(p.date) : "—"}</td>
              <td><span class="badge badge-${p.status || "planeado"}">${STATUS[p.status || "planeado"]?.label}</span></td>
              <td class="row-actions">
                <button class="icon-btn" data-edit-post="${p.id}">✎</button>
                <button class="icon-btn icon-btn-danger" data-del-post="${p.id}">🗑</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>`}
  `;
}

function postFormHtml(p) {
  const v = p || { title: "", type: "Post", channel: "Instagram", date: "", status: "planeado", notes: "" };
  return `
    <label>Título<input type="text" name="title" value="${escapeHtml(v.title)}" required /></label>
    <div class="form-row">
      <label>Tipo
        <select name="type">
          ${["Post", "Campanha", "Sessão fotográfica", "Story", "Email"].map((t) => `<option ${v.type === t ? "selected" : ""}>${t}</option>`).join("")}
        </select>
      </label>
      <label>Canal
        <select name="channel">
          ${["Instagram", "Facebook", "Email", "Loja física", "Site", "Outro"].map((t) => `<option ${v.channel === t ? "selected" : ""}>${t}</option>`).join("")}
        </select>
      </label>
    </div>
    <label>Data<input type="date" name="date" value="${v.date || ""}" /></label>
    <label>Estado
      <select name="status">${Object.entries(STATUS).map(([k, val]) => `<option value="${k}" ${v.status === k ? "selected" : ""}>${val.label}</option>`).join("")}</select>
    </label>
    <label>Notas<textarea name="notes" rows="2">${escapeHtml(v.notes || "")}</textarea></label>
  `;
}

// ---------- WINDOWS (Montras) ----------
function renderWindows() {
  const { windowJobs, windowTeam } = CACHE;
  const sorted = [...windowJobs].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  return `
    <header class="view-header">
      <div>
        <h1>Montras</h1>
        <p class="muted">Alugueres e montagens de montras — o que levar para cada local, com imagens de inspiração</p>
      </div>
      <button class="btn btn-primary" id="btn-add-window">+ Novo trabalho</button>
    </header>

    <div class="callout">Tema visual de referência: <strong>Ralph Lauren</strong>. Decisão pendente: descontinuar os ursos de natal, reservando parte para montras.</div>

    <section class="panel" style="margin-bottom:20px">
      <div class="panel-header"><h2>Equipa de montagens</h2></div>
      <div class="chips-row">
        ${windowTeam.map((t) => `<span class="team-chip">${escapeHtml(t.name)}</span>`).join("")}
      </div>
    </section>

    ${sorted.length === 0 ? `<div class="empty-state">Ainda sem trabalhos de montras agendados.</div>` :
      sorted.map((w) => `
        <div class="job-card" data-id="${w.id}">
          <div class="job-card-header">
            <div>
              <div class="job-card-title">${escapeHtml(w.client)}</div>
              <div class="job-card-meta">${escapeHtml(w.theme || "sem tema")} · ${escapeHtml(w.assigned_to || "sem responsável")} · ${w.date ? formatDatePT(w.date) : "sem data"}</div>
            </div>
            <div style="display:flex;align-items:center;gap:6px">
              <span class="badge badge-${w.status || "planeado"}">${STATUS[w.status || "planeado"]?.label}</span>
              <button class="icon-btn" data-edit-window="${w.id}">✎</button>
              <button class="icon-btn icon-btn-danger" data-del-window="${w.id}">🗑</button>
            </div>
          </div>
          ${w.notes ? `<div class="muted small">${escapeHtml(w.notes)}</div>` : ""}

          <div class="job-card-section">
            <div class="job-card-section-title">O que levar</div>
            <div class="hamper-items">
              ${(w.items || []).map((it, idx) => `
                <div class="hamper-item">
                  <span>${escapeHtml(it.product)}${it.qty ? ` — ${escapeHtml(String(it.qty))}` : ""}</span>
                  <button class="icon-btn icon-btn-danger" data-remove-window-item="${w.id}" data-item-idx="${idx}">✕</button>
                </div>
              `).join("") || '<p class="muted small">Sem produtos definidos.</p>'}
            </div>
            <form class="item-list-form" data-window-items-id="${w.id}">
              <input type="text" name="product" placeholder="Produto / material" required />
              <input type="number" name="qty" placeholder="Qtd." min="0" />
              <button type="submit" class="btn btn-sm">Adicionar</button>
            </form>
          </div>

          <div class="job-card-section">
            <div class="job-card-section-title">Imagens de inspiração</div>
            <div class="image-gallery">
              ${(w.images || []).map((img, idx) => `
                <div class="image-thumb">
                  <img src="${img.dataUrl}" alt="${escapeHtml(img.name || "")}" />
                  <button class="icon-btn" data-remove-window-image="${w.id}" data-image-idx="${idx}">✕</button>
                </div>
              `).join("")}
              <label class="upload-label">+ Imagem
                <input type="file" accept="image/*" multiple data-window-image-input="${w.id}" />
              </label>
            </div>
          </div>
        </div>
      `).join("")}
  `;
}

function windowFormHtml(w) {
  const v = w || { client: "", theme: "", assigned_to: "", date: "", status: "planeado", notes: "" };
  return `
    <label>Cliente / Local<input type="text" name="client" value="${escapeHtml(v.client)}" required /></label>
    <label>Tema<input type="text" name="theme" value="${escapeHtml(v.theme || "")}" /></label>
    <label>Responsável<input type="text" name="assigned_to" value="${escapeHtml(v.assigned_to || "")}" /></label>
    <label>Data<input type="date" name="date" value="${v.date || ""}" /></label>
    <label>Estado
      <select name="status">${Object.entries(STATUS).map(([k, val]) => `<option value="${k}" ${v.status === k ? "selected" : ""}>${val.label}</option>`).join("")}</select>
    </label>
    <label>Notas<textarea name="notes" rows="2">${escapeHtml(v.notes || "")}</textarea></label>
  `;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ---------- LESSONS ----------
function renderLessons() {
  const { lessons } = CACHE;
  return `
    <header class="view-header">
      <div>
        <h1>Lições da Época 2025</h1>
        <p class="muted">O que correu mal em 2025 — orienta o planeamento de 2026</p>
      </div>
    </header>
    <div class="list">
      ${lessons.map((l) => `<div class="list-row"><span class="dot" style="background:#b5384d"></span><div class="list-row-main"><div class="list-row-title">${escapeHtml(l.text)}</div></div></div>`).join("")}
    </div>
    <section class="panel" style="margin-top:24px">
      <div class="panel-header"><h2>Notas e decisões gerais</h2></div>
      <div class="list">
        ${GENERAL_NOTES.map((n) => `<div class="list-row"><span class="dot" style="background:#103273"></span><div class="list-row-main"><div class="list-row-title">${escapeHtml(n)}</div></div></div>`).join("")}
      </div>
    </section>
  `;
}

// ---------- MODAL ----------
function openModal({ title, bodyHtml, onSubmit, submitLabel = "Guardar" }) {
  const modalRoot = document.getElementById("modal-root");
  modalRoot.innerHTML = `
    <div class="modal-overlay">
      <div class="modal">
        <div class="modal-header"><h3>${title}</h3><button class="icon-btn" id="modal-close">✕</button></div>
        <form id="modal-form" class="modal-body">${bodyHtml}</form>
        <div class="modal-footer">
          <button class="btn btn-ghost" id="modal-cancel">Cancelar</button>
          <button class="btn btn-primary" id="modal-submit">${submitLabel}</button>
        </div>
      </div>
    </div>
  `;
  const close = () => { modalRoot.innerHTML = ""; };
  document.getElementById("modal-close").onclick = close;
  document.getElementById("modal-cancel").onclick = close;
  const form = document.getElementById("modal-form");
  document.getElementById("modal-submit").onclick = async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form).entries());
    await onSubmit(data);
    close();
    await refresh();
  };
}

function toast(msg) {
  const t = document.getElementById("toast-root");
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  t.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

async function confirmDelete(msg) {
  return window.confirm(msg);
}

// ---------- ROUTER / EVENTS ----------
async function refresh() {
  await loadAll();
  render();
}

function formatDateTimePT(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function render() {
  root.innerHTML = shell();
  const view = document.getElementById("view");
  const route = currentRoute();

  const renderers = {
    dashboard: renderDashboard, actions: renderActions,
    warehouse: renderWarehouse, marketing: renderMarketing,
    windows: renderWindows, lessons: renderLessons,
  };
  view.innerHTML = (renderers[route] || renderDashboard)();
  bindEvents(route, view);
}

function bindEvents(route, view) {
  if (route === "actions") {
    document.getElementById("action-search").oninput = (e) => { actionFilters.q = e.target.value; render(); };
    view.querySelectorAll("[data-area-tab]").forEach((btn) => {
      btn.onclick = () => { actionFilters.area = btn.dataset.areaTab; render(); };
    });
    const toggle = document.getElementById("responsible-toggle");
    const panel = document.getElementById("responsible-panel");
    toggle.onclick = (e) => { e.stopPropagation(); panel.hidden = !panel.hidden; };
    panel.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.onchange = () => {
        const val = cb.value;
        if (cb.checked) actionFilters.responsibles.push(val);
        else actionFilters.responsibles = actionFilters.responsibles.filter((r) => r !== val);
        render();
        document.getElementById("responsible-panel").hidden = false;
      };
    });
    document.getElementById("btn-add-action").onclick = () => {
      openModal({
        title: "Nova ação", bodyHtml: actionFormHtml(null),
        onSubmit: async (data) => { await db.actions.insert(data); toast("Ação criada."); },
      });
    };
    view.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.onclick = () => {
        const a = CACHE.actions.find((x) => x.id === btn.dataset.edit);
        openActionEditModal(a);
      };
    });
    view.querySelectorAll("[data-del]").forEach((btn) => {
      btn.onclick = async () => {
        if (await confirmDelete("Eliminar esta ação?")) { await db.actions.remove(btn.dataset.del); toast("Ação eliminada."); await refresh(); }
      };
    });

    initKanbanDrag(view);
  }

  if (route === "warehouse") {
    document.getElementById("btn-add-supplier").onclick = () => {
      openModal({
        title: "Novo fornecedor", bodyHtml: supplierFormHtml(null),
        onSubmit: async (data) => { await db.suppliers.insert(data); toast("Fornecedor criado."); },
      });
    };
    view.querySelectorAll("[data-edit-supplier]").forEach((btn) => {
      btn.onclick = () => {
        const s = CACHE.suppliers.find((x) => x.id === btn.dataset.editSupplier);
        openModal({
          title: "Editar fornecedor", bodyHtml: supplierFormHtml(s),
          onSubmit: async (data) => { await db.suppliers.update(s.id, data); toast("Fornecedor atualizado."); },
        });
      };
    });
    view.querySelectorAll("[data-del-supplier]").forEach((btn) => {
      btn.onclick = async () => {
        if (await confirmDelete("Eliminar este fornecedor?")) { await db.suppliers.remove(btn.dataset.delSupplier); toast("Fornecedor eliminado."); await refresh(); }
      };
    });
    view.querySelectorAll("[data-receive]").forEach((btn) => {
      btn.onclick = async () => {
        await db.suppliers.update(btn.dataset.receive, { status: "recebido", received_date: todayISO() });
        toast("Marcado como recebido.");
        await refresh();
      };
    });

    document.getElementById("btn-add-stock").onclick = () => {
      openModal({
        title: "Novo produto — stock 2025", bodyHtml: stockFormHtml(null),
        onSubmit: async (data) => {
          await db.stockItems.insert({ ...data, qty_ordered: data.qty_ordered ? Number(data.qty_ordered) : null, qty_sold: data.qty_sold ? Number(data.qty_sold) : null });
          toast("Produto adicionado.");
        },
      });
    };
    view.querySelectorAll("[data-edit-stock]").forEach((btn) => {
      btn.onclick = () => {
        const s = CACHE.stockItems.find((x) => x.id === btn.dataset.editStock);
        openModal({
          title: "Editar produto", bodyHtml: stockFormHtml(s),
          onSubmit: async (data) => {
            await db.stockItems.update(s.id, { ...data, qty_ordered: data.qty_ordered ? Number(data.qty_ordered) : null, qty_sold: data.qty_sold ? Number(data.qty_sold) : null });
            toast("Produto atualizado.");
          },
        });
      };
    });
    view.querySelectorAll("[data-del-stock]").forEach((btn) => {
      btn.onclick = async () => {
        if (await confirmDelete("Eliminar este produto?")) { await db.stockItems.remove(btn.dataset.delStock); toast("Produto eliminado."); await refresh(); }
      };
    });

    document.getElementById("btn-add-restock-rule").onclick = () => {
      openModal({
        title: "Nova regra de reposição", bodyHtml: restockRuleFormHtml(null),
        onSubmit: async (data) => { await db.restockRules.insert(data); toast("Regra criada."); },
      });
    };
    view.querySelectorAll("[data-edit-rule]").forEach((btn) => {
      btn.onclick = () => {
        const r = CACHE.restockRules.find((x) => x.id === btn.dataset.editRule);
        openModal({
          title: "Editar regra", bodyHtml: restockRuleFormHtml(r),
          onSubmit: async (data) => { await db.restockRules.update(r.id, data); toast("Regra atualizada."); },
        });
      };
    });
    view.querySelectorAll("[data-del-rule]").forEach((btn) => {
      btn.onclick = async () => {
        if (await confirmDelete("Eliminar esta regra?")) { await db.restockRules.remove(btn.dataset.delRule); toast("Regra eliminada."); await refresh(); }
      };
    });

    document.getElementById("btn-add-shipment").onclick = () => {
      openModal({
        title: "Novo envio de reposição", bodyHtml: shipmentFormHtml(null),
        onSubmit: async (data) => { await db.restockShipments.insert({ ...data, status: "planeado", items: [] }); toast("Envio criado."); },
      });
    };
    view.querySelectorAll("[data-shipment-status]").forEach((sel) => {
      sel.onchange = async () => { await db.restockShipments.update(sel.dataset.shipmentStatus, { status: sel.value }); await refresh(); };
    });
    view.querySelectorAll("[data-del-shipment]").forEach((btn) => {
      btn.onclick = async () => {
        if (await confirmDelete("Eliminar este envio?")) { await db.restockShipments.remove(btn.dataset.delShipment); toast("Envio eliminado."); await refresh(); }
      };
    });
    view.querySelectorAll("[data-shipment-id]").forEach((form) => {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const shipmentId = form.dataset.shipmentId;
        const s = CACHE.restockShipments.find((x) => x.id === shipmentId);
        const fd = new FormData(form);
        const items = [...(s.items || []), { product: fd.get("product"), qty: fd.get("qty") || "" }];
        await db.restockShipments.update(shipmentId, { items });
        await refresh();
      };
    });
    view.querySelectorAll("[data-remove-shipment-item]").forEach((btn) => {
      btn.onclick = async () => {
        const shipmentId = btn.dataset.removeShipmentItem;
        const idx = Number(btn.dataset.itemIdx);
        const s = CACHE.restockShipments.find((x) => x.id === shipmentId);
        const items = (s.items || []).filter((_, i) => i !== idx);
        await db.restockShipments.update(shipmentId, { items });
        await refresh();
      };
    });
  }

  if (route === "marketing") {
    document.getElementById("btn-add-post").onclick = () => {
      openModal({
        title: "Novo post/campanha", bodyHtml: postFormHtml(null),
        onSubmit: async (data) => { await db.marketingPosts.insert(data); toast("Post criado."); },
      });
    };
    view.querySelectorAll("[data-edit-post]").forEach((btn) => {
      btn.onclick = () => {
        const p = CACHE.marketingPosts.find((x) => x.id === btn.dataset.editPost);
        openModal({
          title: "Editar post/campanha", bodyHtml: postFormHtml(p),
          onSubmit: async (data) => { await db.marketingPosts.update(p.id, data); toast("Post atualizado."); },
        });
      };
    });
    view.querySelectorAll("[data-del-post]").forEach((btn) => {
      btn.onclick = async () => {
        if (await confirmDelete("Eliminar este post?")) { await db.marketingPosts.remove(btn.dataset.delPost); toast("Post eliminado."); await refresh(); }
      };
    });
  }

  if (route === "windows") {
    document.getElementById("btn-add-window").onclick = () => {
      openModal({
        title: "Novo trabalho de montra", bodyHtml: windowFormHtml(null),
        onSubmit: async (data) => { await db.windowJobs.insert(data); toast("Trabalho criado."); },
      });
    };
    view.querySelectorAll("[data-edit-window]").forEach((btn) => {
      btn.onclick = () => {
        const w = CACHE.windowJobs.find((x) => x.id === btn.dataset.editWindow);
        openModal({
          title: "Editar trabalho", bodyHtml: windowFormHtml(w),
          onSubmit: async (data) => { await db.windowJobs.update(w.id, data); toast("Trabalho atualizado."); },
        });
      };
    });
    view.querySelectorAll("[data-del-window]").forEach((btn) => {
      btn.onclick = async () => {
        if (await confirmDelete("Eliminar este trabalho?")) { await db.windowJobs.remove(btn.dataset.delWindow); toast("Trabalho eliminado."); await refresh(); }
      };
    });
    view.querySelectorAll("[data-window-items-id]").forEach((form) => {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const jobId = form.dataset.windowItemsId;
        const w = CACHE.windowJobs.find((x) => x.id === jobId);
        const fd = new FormData(form);
        const items = [...(w.items || []), { product: fd.get("product"), qty: fd.get("qty") || "" }];
        await db.windowJobs.update(jobId, { items });
        await refresh();
      };
    });
    view.querySelectorAll("[data-remove-window-item]").forEach((btn) => {
      btn.onclick = async () => {
        const jobId = btn.dataset.removeWindowItem;
        const idx = Number(btn.dataset.itemIdx);
        const w = CACHE.windowJobs.find((x) => x.id === jobId);
        const items = (w.items || []).filter((_, i) => i !== idx);
        await db.windowJobs.update(jobId, { items });
        await refresh();
      };
    });
    view.querySelectorAll("[data-window-image-input]").forEach((input) => {
      input.onchange = async () => {
        const jobId = input.dataset.windowImageInput;
        const w = CACHE.windowJobs.find((x) => x.id === jobId);
        const files = Array.from(input.files || []);
        if (!files.length) return;
        const newImages = await Promise.all(files.map(async (f) => ({ name: f.name, dataUrl: await readFileAsDataUrl(f) })));
        await db.windowJobs.update(jobId, { images: [...(w.images || []), ...newImages] });
        await refresh();
      };
    });
    view.querySelectorAll("[data-remove-window-image]").forEach((btn) => {
      btn.onclick = async () => {
        const jobId = btn.dataset.removeWindowImage;
        const idx = Number(btn.dataset.imageIdx);
        const w = CACHE.windowJobs.find((x) => x.id === jobId);
        const images = (w.images || []).filter((_, i) => i !== idx);
        await db.windowJobs.update(jobId, { images });
        await refresh();
      };
    });
  }
}

window.addEventListener("hashchange", render);

// Fecha o dropdown de responsáveis ao clicar fora dele (registado uma única
// vez — o painel é recriado a cada render, mas o document nunca é).
document.addEventListener("click", (e) => {
  const panel = document.getElementById("responsible-panel");
  const toggle = document.getElementById("responsible-toggle");
  if (panel && !panel.hidden && !panel.contains(e.target) && e.target !== toggle) {
    panel.hidden = true;
  }
});

async function boot() {
  await requireSession(); // sem login — acesso aberto a toda a gente
  await loadAll();
  PHC = await loadPhcSnapshot();
  render();
  startLiveRefresh();
}

// Sem login nem WebSocket dedicado, mantemos a app "ao vivo" com um
// refrescamento periódico: qualquer alteração feita por outra pessoa
// aparece aqui pouco depois, sem precisar de recarregar a página. Não
// interrompe se houver um modal aberto (não queremos apagar o que a
// pessoa está a escrever).
function startLiveRefresh() {
  setInterval(async () => {
    const modalOpen = document.getElementById("modal-root")?.innerHTML.trim().length > 0;
    if (modalOpen) return;
    await loadAll();
    render();
  }, 15000);
}

boot();
