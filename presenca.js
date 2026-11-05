"use strict";

const attendanceDays = days.filter(day => day <= 25);
const attendanceProgress = document.querySelector("#attendance-progress");
const attendanceBadge = document.querySelector("#attendance-badge");
const checkIn = document.querySelector("#check-in");
const checkOut = document.querySelector("#check-out");
const attendanceKey = (day, action) => `dubworks:2026:${dateKey(day)}:${action}`;
const attendanceDay = now => attendanceDays.find(day => now >= midnight(day) && now < midnight(day + 1));
const recorded = (day, action) => localStorage.getItem(attendanceKey(day, action)) !== null;

function renderAttendance() {
  const today = attendanceDay(Date.now());
  try {
    const count = attendanceDays.filter(day => recorded(day, "in")).length;
    const arrived = today !== undefined && recorded(today, "in");
    const departed = arrived && recorded(today, "out");
    checkIn.hidden = today === undefined || arrived;
    checkOut.hidden = !arrived || departed;
    attendanceBadge.hidden = count !== attendanceDays.length;
    const note = today === undefined ? "Check-in disponível nas datas da festa."
      : departed ? "Check-out registrado hoje."
      : arrived ? "Check-in registrado hoje."
      : "O check-in de hoje está aberto.";
    const message = `${count} de ${attendanceDays.length} presenças. ${note}`;
    if (attendanceProgress.textContent !== message) attendanceProgress.textContent = message;
  } catch {
    checkIn.hidden = true;
    checkOut.hidden = true;
    attendanceBadge.hidden = true;
    const message = "Este navegador não conseguiu acessar o registro de presença.";
    if (attendanceProgress.textContent !== message) attendanceProgress.textContent = message;
  }
}

function registerAttendance(action) {
  const now = Date.now();
  const today = attendanceDay(now);
  if (today === undefined) return;
  try {
    if (action === "out" && !recorded(today, "in")) return;
    if (!recorded(today, action)) localStorage.setItem(attendanceKey(today, action), new Date(now).toISOString());
    renderAttendance();
  } catch {
    attendanceProgress.textContent = "Não foi possível salvar a presença neste navegador.";
  }
}

checkIn.addEventListener("click", () => registerAttendance("in"));
checkOut.addEventListener("click", () => registerAttendance("out"));
window.addEventListener("storage", renderAttendance);
setInterval(renderAttendance, 1000);
renderAttendance();
