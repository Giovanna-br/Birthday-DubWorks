"use strict";
(() => {
  const el = id => document.getElementById(id);
  const login = el("login"), googleLogin = el("login-google");
  const logout = el("logout"), account = el("account");
  const status = el("status"), count = el("medal-count"), gallery = el("gallery");
  const filters = el("filters"), detail = el("item-detail");
  const labels = { medalha: "Medalha", carimbo: "Carimbo", adesivo: "Adesivo" };
  const palette = {
    medalha: ["#ffd86c", "#e7932e", "#9e4b1b"],
    carimbo: ["#9decff", "#4ac9ea", "#2964b5"],
    adesivo: ["#ffc9f5", "#f477cb", "#a73e9a"]
  };
  const icons = {
    mic: '<rect x="45" y="30" width="30" height="46" rx="15" fill="#fff5df"/><path d="M38 58v4a22 22 0 0 0 44 0v-4M60 84v12M50 96h20M47 45h12M47 54h10M47 63h8" fill="none" stroke="#55301e" stroke-width="5" stroke-linecap="round"/>',
    star: '<path d="m60 29 9 19 21 3-15 15 4 21-19-10-19 10 4-21-15-15 21-3Z" fill="#fff5d1" stroke="#512751" stroke-width="4" stroke-linejoin="round"/>',
    check: '<path d="m40 60 13 13 27-29" fill="none" stroke="#effaff" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>'
  };
  let selection = "todos";
  let currentItems = [];
  let earned = new Set();

  function emblem(item, locked) {
    const holder = document.createElement("span");
    holder.className = locked ? "badge is-locked" : "badge";
    holder.setAttribute("aria-hidden", "true");
    const kind = Object.hasOwn(palette, item.tipo) ? item.tipo : "medalha";
    const [bright, base, shadow] = palette[kind];
    const shape = kind === "carimbo"
      ? "M60 8 100 25 112 59 100 94 60 111 20 94 8 59 20 25Z"
      : kind === "adesivo"
      ? "M60 7 74 21 95 19 101 39 115 53 107 72 106 94 84 98 66 113 48 104 26 106 19 87 6 71 14 52 13 31 34 27Z"
      : "M60 8 96 19 110 40 105 77 91 96 60 112 29 96 15 77 10 40 24 19Z";
    const symbol = item.id === "live-dia-pau" ? icons.mic : kind === "carimbo" ? icons.check : icons.star;
    // SVG comes only from the fixed artwork above, never from the database.
    holder.innerHTML = `<svg viewBox="0 0 120 120" focusable="false"><path d="${shape}" fill="${shadow}" stroke="${shadow}" stroke-width="8" stroke-linejoin="round" transform="translate(0 3)"/><path d="${shape}" fill="${base}" stroke="${bright}" stroke-width="5" stroke-linejoin="round"/><circle cx="60" cy="59" r="37" fill="${shadow}" opacity=".47"/><path d="M25 36 43 21l25-6-8 22-26 19Z" fill="#fff" opacity=".26"/><path d="m85 31 3 7 8 3-8 3-3 7-3-7-8-3 8-3Z" fill="#fff" opacity=".84"/>${symbol}</svg>`;
    return holder;
  }

  function showDetail(item, locked) {
    el("detail-emblem").replaceChildren(emblem(item, locked));
    el("detail-state").textContent = locked ? "AINDA NÃO CONQUISTADO" : "CONQUISTADO";
    el("detail-title").textContent = item.nome;
    el("detail-description").textContent = item.descricao || "Item da coleção DubWorks.";
    detail.showModal();
  }

  function render() {
    const visible = currentItems.filter(item => selection === "todos" || item.tipo === selection);
    gallery.replaceChildren(...visible.map(item => {
      const locked = !earned.has(item.id);
      const row = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = locked ? "collectible is-locked" : "collectible";
      const name = document.createElement("strong");
      name.textContent = item.nome;
      const caption = document.createElement("small");
      caption.textContent = (labels[item.tipo] ?? "Colecionável") + (locked ? " · Bloqueado" : " · Conquistado");
      button.append(emblem(item, locked), name, caption);
      button.addEventListener("click", () => showDetail(item, locked));
      row.append(button);
      return row;
    }));
    filters.hidden = false;
    count.hidden = false;
    count.textContent = `${earned.size} de ${currentItems.length} conquistados`;
    status.textContent = visible.length ? "" : "Nenhum item nesta categoria por enquanto.";
  }

  filters.addEventListener("click", event => {
    const button = event.target.closest("button[data-kind]");
    if (!button) return;
    selection = button.dataset.kind;
    for (const filter of filters.querySelectorAll("button")) filter.setAttribute("aria-pressed", String(filter === button));
    render();
  });

  if (!window.supabase) {
    account.textContent = "O login está indisponível no momento.";
    status.textContent = "Recarregue para tentar de novo.";
    return;
  }

  const client = window.supabase.createClient(
    "https://ieafsidoadmqmurdgvki.supabase.co",
    "sb_publishable_SSXE8vucRzmqvC5CMMfsKw_RYmwqnoy"
  );
  let session;
  let generation = 0;
  let updating = false;

  async function refresh() {
    if (!session || updating || mode === "recovery") return;
    updating = true;
    const request = ++generation;
    try {
      const sync = await client.rpc("sincronizar_resgates_forms");
      if (sync.error) throw sync.error;
      const [catalog, awards] = await Promise.all([
        client.from("medalhas").select("id,nome,tipo,descricao").order("nome"),
        client.from("medalhas_conquistadas").select("medalha_id")
      ]);
      if (catalog.error || awards.error) throw catalog.error ?? awards.error;
      if (request === generation) {
        currentItems = catalog.data;
        earned = new Set(awards.data.map(row => row.medalha_id));
        render();
      }
    } catch {
      if (request === generation) status.textContent = "Não foi possível atualizar a coleção. Tente novamente em instantes.";
    } finally {
      updating = false;
      if (session && request !== generation) setTimeout(refresh, 0);
    }
  }

  const form = el("auth-form");
  const emailInput = el("auth-email");
  const passwordInput = el("auth-password");
  const authMessage = el("auth-message");
  const submit = el("auth-submit");
  const switchMode = el("auth-switch");
  const recover = el("auth-recover");
  const siteUrl = location.origin + location.pathname;
  let mode = "login";
  let busy = false;

  function showForm(next) {
    mode = next;
    form.hidden = false;
    const signingUp = mode === "signup";
    const reset = mode === "reset";
    const recovery = mode === "recovery";
    el("auth-title").textContent = signingUp ? "Criar conta" : reset ? "Recuperar senha"
      : recovery ? "Definir nova senha" : "Entrar no passaporte";
    submit.textContent = signingUp ? "Criar conta" : reset ? "Enviar link"
      : recovery ? "Salvar nova senha" : "Entrar";
    el("auth-email-field").hidden = recovery;
    emailInput.required = !recovery;
    el("auth-password-field").hidden = reset;
    passwordInput.required = !reset;
    passwordInput.minLength = mode === "login" ? 1 : 8;
    passwordInput.autocomplete = mode === "login" ? "current-password" : "new-password";
    passwordInput.value = "";
    switchMode.hidden = recovery;
    switchMode.textContent = mode === "login" ? "Criar conta" : "Voltar para entrar";
    recover.hidden = mode !== "login";
  }

  googleLogin.addEventListener("click", async () => {
    if (location.protocol === "file:") {
      authMessage.textContent = "Abra o passaporte por um endereço HTTP ou HTTPS para entrar com Google.";
      return;
    }
    googleLogin.disabled = true;
    authMessage.textContent = "";
    try {
      const { error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: siteUrl, queryParams: { prompt: "select_account" } }
      });
      if (error) throw error;
    } catch {
      authMessage.textContent = "Não foi possível abrir o login com Google. Tente de novo em instantes.";
      googleLogin.disabled = false;
    }
  });

  login.addEventListener("click", () => {
    authMessage.textContent = "";
    showForm("login");
    emailInput.focus();
  });
  switchMode.addEventListener("click", () => {
    authMessage.textContent = "";
    showForm(mode === "login" ? "signup" : "login");
  });
  recover.addEventListener("click", () => {
    authMessage.textContent = "";
    showForm("reset");
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (busy) return;
    busy = true;
    const operation = mode;
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    authMessage.textContent = "";
    [submit, switchMode, recover].forEach(button => { button.disabled = true; });
    try {
      if (operation === "signup") {
        const { data, error } = await client.auth.signUp({ email, password, options: { emailRedirectTo: siteUrl } });
        if (error) throw error;
        if (!data.session) {
          showForm("login");
          authMessage.textContent = "Confira sua caixa de entrada e confirme o e-mail antes de entrar.";
        }
      } else if (operation === "reset") {
        const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: siteUrl });
        if (error) throw error;
        showForm("login");
        authMessage.textContent = "Se houver uma conta com esse e-mail, você receberá um link de recuperação.";
      } else if (operation === "recovery") {
        const { error } = await client.auth.updateUser({ password });
        if (error) throw error;
        mode = "login";
        form.hidden = true;
        authMessage.textContent = "Senha atualizada.";
        refresh();
      } else {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      authMessage.textContent = error?.code === "email_not_confirmed"
        ? "Confirme seu e-mail pelo link que enviamos antes de entrar."
        : operation === "login" ? "Não foi possível entrar. Confira o e-mail e a senha."
        : "Não foi possível concluir. Tente novamente em alguns instantes.";
    } finally {
      passwordInput.value = "";
      [submit, switchMode, recover].forEach(button => { button.disabled = false; });
      busy = false;
    }
  });
  logout.addEventListener("click", async () => {
    const { error } = await client.auth.signOut({ scope: "local" });
    if (error) status.textContent = "Não foi possível sair da conta.";
  });
  client.auth.onAuthStateChange((event, next) => {
    const changed = event === "INITIAL_SESSION" || event === "PASSWORD_RECOVERY" || session?.user.id !== next?.user.id;
    session = next;
    if (!changed) return;
    generation++;
    if (detail.open) detail.close();
    gallery.replaceChildren();
    currentItems = [];
    earned = new Set();
    filters.hidden = true;
    count.hidden = true;
    login.disabled = false;
    login.hidden = !!session;
    googleLogin.hidden = !!session;
    googleLogin.disabled = false;
    logout.hidden = !session;
    account.textContent = session?.user.email ?? "Entre com Google usando a mesma conta do formulário para ver sua coleção.";
    form.hidden = true;
    if (event === "PASSWORD_RECOVERY") {
      showForm("recovery");
      status.textContent = "Defina uma nova senha para voltar à sua coleção.";
      return;
    }
    mode = "login";
    status.textContent = session ? "Consultando suas conquistas…" : "Sua coleção aparece após o login.";
    if (session) setTimeout(refresh, 0);
  });
  window.addEventListener("focus", refresh);
  setInterval(() => { if (!document.hidden) refresh(); }, 15000);
})();
