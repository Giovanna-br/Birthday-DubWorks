"use strict";

(() => {
  const eventId = "dubworks-1-ano-2026";
  const liveId = "live-dia-pau";
  const field = id => document.getElementById(id);
  const progress = field("attendance-progress");
  const message = field("attendance-message");
  if (!window.supabase) {
    progress.textContent = "O passaporte está indisponível no momento.";
    return;
  }

  const client = window.supabase.createClient(
    "https://ieafsidoadmqmurdgvki.supabase.co",
    "sb_publishable_SSXE8vucRzmqvC5CMMfsKw_RYmwqnoy"
  );
  const open = field("attendance-open");
  const checkIn = field("check-in");
  const checkOut = field("check-out");
  const claim = field("attendance-claim");
  const exit = field("attendance-exit");
  const liveClaim = field("attendance-live-claim");
  let session = null;
  let passport = null;
  let loading = false;
  let busy = false;
  let refreshId = 0;

  function currentWindow() {
    const now = Date.now();
    return passport?.windows.find(window =>
      now >= Date.parse(window.abre_em) && now < Date.parse(window.fecha_em));
  }

  function render() {
    const slot = currentWindow();
    const today = slot && passport?.presence.find(p => p.dia === slot.dia);
    open.hidden = !!session;
    exit.hidden = !session;
    checkIn.hidden = !session || !slot || !!today;
    checkOut.hidden = !session || !today || !!today.saida_em;
    claim.hidden = !session || !passport?.eligible || passport?.earned;
    liveClaim.hidden = !session || !passport?.liveEligible;
    [checkIn, checkOut, claim, liveClaim, exit].forEach(button => { button.disabled = busy || loading; });
    const status = loading ? "Carregando passaporte…"
      : !session ? "Entre com Google para consultar suas medalhas e registrar presença."
      : !passport ? "Não foi possível consultar suas presenças."
      : `${passport.presence.length} de 7 presenças. ${slot
        ? today ? today.saida_em ? "Check-out registrado." : "Check-in registrado." : "Check-in aberto."
        : "Nenhum check-in aberto agora."}`;
    if (progress.textContent !== status) progress.textContent = status;
  }

  async function refresh() {
    const id = ++refreshId;
    loading = !!session;
    passport = null;
    render();
    const medalList = field("attendance-medals");
    medalList.replaceChildren();
    if (!session) return;

    try {
      const results = await Promise.all([
        client.from("janelas_check_in").select("dia,abre_em,fecha_em").eq("evento_id", eventId),
        client.from("presencas").select("dia,saida_em").eq("evento_id", eventId),
        client.from("medalhas").select("id,nome,check_ins_necessarios").eq("id", eventId).maybeSingle(),
        client.from("medalhas_conquistadas").select("medalha_id,medalhas(nome)"),
        client.from("medalhas_liberadas").select("medalha_id").eq("medalha_id", liveId).maybeSingle()
      ]);
      if (id !== refreshId) return;
      const failed = results.find(result => result.error);
      if (failed) throw failed.error;

      const [windows, presence, medal, awards, liveApproval] = results.map(result => result.data);
      passport = {
        windows, presence,
        eligible: !!medal?.check_ins_necessarios && presence.length >= medal.check_ins_necessarios,
        earned: awards.some(award => award.medalha_id === eventId),
        liveEligible: !!liveApproval && !awards.some(award => award.medalha_id === liveId)
      };
      medalList.replaceChildren(...awards.map(award => {
        const item = document.createElement("li");
        item.textContent = `🏅 ${award.medalhas?.nome ?? "Medalha conquistada"}`;
        return item;
      }));
    } catch {
      if (id === refreshId) message.textContent = "Não conseguimos carregar o passaporte. Tente recarregar a página.";
    } finally {
      if (id === refreshId) {
        loading = false;
        render();
      }
    }
  }

  async function run(button, task, failure) {
    if (busy) return;
    busy = true;
    button.disabled = true;
    message.textContent = "";
    render();
    try {
      await task();
    } catch {
      message.textContent = failure;
    } finally {
      busy = false;
      button.disabled = false;
      render();
    }
  }

  open.addEventListener("click", () => run(open, async () => {
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: location.origin + location.pathname }
    });
    if (error) throw error;
  }, "O login com Google ainda não está disponível. Tente novamente mais tarde."));

  function record(action, button) {
    const slot = currentWindow();
    if (!slot) return;
    run(button, async () => {
      const { error } = await client.rpc("registrar_presenca", {
        p_evento: eventId, p_dia: slot.dia, p_acao: action
      });
      if (error) throw error;
      await refresh();
    }, "Não foi possível registrar a presença. Confira se a janela ainda está aberta.");
  }

  checkIn.addEventListener("click", () => record("entrada", checkIn));
  checkOut.addEventListener("click", () => record("saida", checkOut));
  function claimMedal(button, medalId) {
    return run(button, async () => {
    const { data, error } = await client.rpc("reivindicar_medalha", { p_medalha: medalId });
    if (error) throw error;
    message.textContent = data === "nao_elegivel" ? "Essa medalha ainda não está liberada para sua conta."
      : data === "ja_reivindicada" ? "Essa medalha já está no seu passaporte."
      : "Medalha conquistada!";
    await refresh();
    }, "Não foi possível reivindicar a medalha. Tente novamente.");
  }
  claim.addEventListener("click", () => claimMedal(claim, eventId));
  liveClaim.addEventListener("click", () => claimMedal(liveClaim, liveId));
  exit.addEventListener("click", () => run(exit, async () => {
    const { error } = await client.auth.signOut({ scope: "local" });
    if (error) throw error;
  }, "Não foi possível sair do passaporte. Tente novamente."));

  client.auth.onAuthStateChange((event, next) => {
    const changed = event === "INITIAL_SESSION" || session?.user.id !== next?.user.id;
    session = next;
    if (changed) setTimeout(refresh, 0);
  });

  document.addEventListener("visibilitychange", () => {
    if (session && !document.hidden) refresh();
  });
  setInterval(render, 1000);
})();
