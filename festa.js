"use strict";

const days = [7, 10, 13, 16, 19, 22, 25, 28];
const dateKey = day => `2026-11-${String(day).padStart(2, "0")}`;
const midnight = day => Date.parse(`${dateKey(day)}T00:00:00-03:00`);
const opening = day => midnight(day) + (day === 7 ? 12 * 60 * 60 * 1000 : 0);
const dialog = document.querySelector("#detail");
const confetti = document.querySelector("#confetti");
const clock = document.querySelector("#clock");
const published = window.dubworksSurpresas ?? {};
const checkInCode = document.querySelector("#check-in-code");
const checkInFeedback = document.querySelector("#check-in-feedback");
let visibleStates = "";
let activeDay;

document.querySelector("#view-check-in-dates").addEventListener("click", event => {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  const heading = document.querySelector("#board-title");
  heading.focus({preventScroll: true});
  heading.scrollIntoView({block: "start"});
});

function attendanceState(day, now) {
  if (now < opening(day)) return "future";
  if (now >= midnight(day) + 86400000) return "closed";
  return "open";
}

function renderAttendance(day, now) {
  const state = attendanceState(day, now);
  document.querySelector("#check-in-status").textContent = {
    future: day === 7
      ? "O desafio de dublagem e o check-in abrem em 07/11 às 12h, no horário de Brasília."
      : "Abre nesta data, à meia-noite no horário de Brasília.",
    open: "Copie o código e envie o formulário com sua conta Google até o fim do dia.",
    closed: "O check-in desta data foi encerrado."
  }[state];
  document.querySelector("#check-in-actions").hidden = state !== "open";
  checkInCode.value = state === "open" ? `DUB-1ANO-${String(day).padStart(2, "0")}` : "";
  checkInFeedback.textContent = "";
}

document.querySelector("#check-in-copy").addEventListener("click", async () => {
  if (attendanceState(activeDay, Date.now()) !== "open") {
    renderAttendance(activeDay, Date.now());
    return;
  }
  try {
    await navigator.clipboard.writeText(checkInCode.value);
    checkInFeedback.textContent = "Código copiado. Agora cole e envie no formulário.";
  } catch {
    checkInCode.focus();
    checkInCode.select();
    checkInFeedback.textContent = "Código selecionado. Copie pelo menu do seu aparelho.";
  }
});

function surprise(day, now) {
  const entry = published[dateKey(day)];
  if (now >= opening(day) && entry?.titulo?.trim() && entry?.texto?.trim()) return entry;
  return null;
}

function celebrate() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  confetti.replaceChildren();
  const colors = ["#ffd639", "#ff67d5", "#29ecff", "#9c59ff", "#ffffff"];
  for (let index = 0; index < 52; index++) {
    const piece = document.createElement("i");
    piece.className = "piece";
    piece.style.setProperty("--color", colors[index % colors.length]);
    piece.style.setProperty("--x", `${Math.random() * 95 - 47.5}vw`);
    piece.style.setProperty("--y", `${Math.random() * 85 - 12}vh`);
    piece.style.setProperty("--r", `${Math.random() * 900 - 450}deg`);
    confetti.append(piece);
    setTimeout(() => piece.remove(), 1300);
  }
}

function openCard(day, animate = true) {
  const now = Date.now();
  const entry = surprise(day, now);
  activeDay = day;
  renderAttendance(day, now);
  document.querySelector("#detail-date").textContent = `${day} DE NOVEMBRO DE 2026`;
  document.querySelector("#detail-icon").textContent = entry ? "🎉" : "🔒";
  document.querySelector("#detail-title").textContent = entry?.titulo ?? "Surpresa bloqueada";
  document.querySelector("#detail-text").textContent = entry?.texto ?? (
    day === 7 && now < opening(day)
      ? "A abertura está marcada para 07/11 às 12h, no horário de Brasília. Volte nesse horário para participar!"
      : now >= opening(day)
      ? "A data chegou! A novidade ainda aguarda liberação pela DubWorks."
      : "Volte nesta data para conferir. A novidade aparece quando a DubWorks liberar."
  );
  const links = document.querySelector("#detail-links");
  links.replaceChildren();
  for (const link of Array.isArray(entry?.links) ? entry.links : []) {
    if (typeof link?.rotulo !== "string" || !link.rotulo.trim()) continue;
    let url;
    try {
      url = new URL(link.url);
    } catch {
      continue;
    }
    if (url.protocol !== "https:") continue;
    const anchor = document.createElement("a");
    anchor.href = url.href;
    anchor.className = "cta";
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.textContent = link.rotulo;
    links.append(anchor);
  }
  links.hidden = !links.children.length;
  if (!dialog.open) dialog.showModal();
  if (entry && animate) {
    dialog.append(confetti);
    celebrate();
  }
}

function renderCards(now) {
  const states = days.map(day => Boolean(surprise(day, now)));
  const attendance = days.map(day => attendanceState(day, now));
  const surprisesChanged = visibleStates.split("|")[0] !== states.join();
  const signature = `${states.join()}|${attendance.join()}`;
  if (visibleStates === signature) return;
  visibleStates = signature;
  const cards = document.querySelector("#cards");
  const focusedDay = document.activeElement?.dataset.day;
  cards.replaceChildren(...days.map((day, index) => {
    const special = day === 25;
    const unlocked = states[index];
    const date = `${String(day).padStart(2, "0")}/11`;
    const status = day === 7 && now >= midnight(day) && now < opening(day) ? "🔒 Abre às 12h"
      : attendance[index] === "open" ? "✓ Check-in de hoje"
      : unlocked ? "🎉 Ver novidade" : special ? "🔒 Dia do aniversário" : "🔒 Bloqueado";
    const card = document.createElement("button");
    card.type = "button";
    card.className = special ? "card special" : "card";
    card.dataset.day = day;
    card.innerHTML = `<span class="date">${date}</span><span class="mystery" aria-hidden="true">${unlocked ? "🎉" : special ? "🎁 ???" : "???"}</span><span class="status">${status}</span>`;
    card.addEventListener("click", () => openCard(day));
    return card;
  }));
  if (focusedDay) cards.querySelector(`[data-day="${focusedDay}"]`)?.focus();
  if (dialog.open) openCard(activeDay, surprisesChanged);
}

const clockUnits = ["dias", "horas", "min", "seg"].map(label => {
  const tile = document.createElement("span");
  tile.innerHTML = `<b>00</b><small>${label}</small>`;
  clock.append(tile);
  return tile.firstElementChild;
});

function update() {
  const now = Date.now();
  const left = Math.max(0, Math.ceil((midnight(25) - now) / 1000));
  if (left > 0) {
    const values = [Math.floor(left / 86400), Math.floor(left / 3600) % 24, Math.floor(left / 60) % 60, left % 60];
    clockUnits.forEach((unit, index) => {
      unit.textContent = String(values[index]).padStart(2, "0");
    });
  } else {
    clock.hidden = true;
    document.querySelector("#count-title").textContent = now < midnight(26)
      ? "Hoje é o aniversário da DubWorks!"
      : "A DubWorks completou 1 ano!";
  }
  renderCards(now);
}

update();
setInterval(update, 1000);
