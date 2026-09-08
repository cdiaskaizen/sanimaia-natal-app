export const MONTHS_PT = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function parseISO(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatDatePT(iso) {
  if (!iso) return "—";
  const d = parseISO(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export function formatMonthLabel(iso) {
  const d = parseISO(iso);
  return `${MONTHS_PT[d.getMonth()]} ${d.getFullYear()}`;
}

// Devolve a data (segunda-feira) da semana ISO N de um dado ano.
export function isoWeekToDate(year, week) {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const isoMonday = new Date(simple);
  if (dow <= 4) isoMonday.setDate(simple.getDate() - simple.getDay() + 1);
  else isoMonday.setDate(simple.getDate() + 8 - simple.getDay());
  return isoMonday;
}

export function daysBetween(aISO, bISO) {
  const a = parseISO(aISO);
  const b = parseISO(bISO);
  return Math.round((b - a) / 86400000);
}

// Estado "efetivo" para apresentação/kanban: "Concluído" e "Em Curso" são
// sempre estados manuais — quem os arrasta para lá, fica lá, mesmo que o
// prazo já tenha passado (confiamos que a pessoa está mesmo a tratar disso).
// "Atrasado" é sempre automático: só aparece quando ninguém marcou nada e o
// prazo já passou. Não é um sítio para onde se arrasta — é um alerta.
export function effectiveStatus(item, todayIso = todayISO()) {
  if (item.status === "concluido" || item.status === "em_curso") return item.status;
  if (!item.due_date) return item.status || "planeado";

  let deadline = item.due_date;
  if (item.due_precision === "month") {
    const d = parseISO(item.due_date);
    deadline = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
  } else if (item.due_precision === "week") {
    const d = parseISO(item.due_date);
    const end = new Date(d);
    end.setDate(end.getDate() + 6);
    deadline = end.toISOString().slice(0, 10);
  }

  if (daysBetween(deadline, todayIso) > 0) return "atrasado";
  return item.status || "planeado";
}

export function statusBadgeClass(status) {
  return `badge badge-${status}`;
}

export function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

export function groupBy(arr, keyFn) {
  const out = {};
  for (const item of arr) {
    const k = keyFn(item);
    (out[k] ||= []).push(item);
  }
  return out;
}
