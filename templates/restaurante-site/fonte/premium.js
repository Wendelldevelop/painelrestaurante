/* Site do restaurante em JavaScript puro. Dados: CONFIG e CARDAPIO (inseridos na montagem). */
(function () {
  "use strict";

  /* ---------- modo do site ----------
     "pasta": cada página é um arquivo (index.html, cardapio.html...), bom para o Google e mais rápido.
     arquivo único: tudo num HTML só, navegando por #cardapio, #reservas... */
  const MULTI = document.documentElement.dataset.modo === "pasta";
  const PAG = document.body.dataset.pagina || "";
  const L = MULTI
    ? { inicio: "index.html", cardapio: "cardapio.html", reservas: "reservas.html", sobre: "sobre.html", pedido: "pedido.html" }
    : { inicio: "#inicio", cardapio: "#cardapio", reservas: "#reservas", sobre: "#sobre", pedido: "#pedido" };
  // "pedidos": false no config = só cardápio (pratos e preços), sem pedido nem reserva
  // "painel" = pedido vai para a cozinha (PDV); só pode pedir quem escaneou o QR da mesa
  const PAINEL = CONFIG.pedidos === "painel";
  const MESA0 = new URLSearchParams(location.search).get("mesa") || (CONFIG.mesa ? String(CONFIG.mesa) : "") || (() => { try { return sessionStorage.getItem("cb-mesa") || ""; } catch (e) { return ""; } })();
  // balcão: pedido sem mesa, com senha chamada na TV ("balcao": false no config desliga; QR do balcão usa ?balcao)
  const BALCAO = PAINEL && CONFIG.balcao !== false;
  const BALCAO0 = BALCAO && new URLSearchParams(location.search).has("balcao");
  const PEDIDOS = CONFIG.pedidos !== false && !(PAINEL && !MESA0 && !BALCAO0);
  const DELIVERY = CONFIG.pedidos === true && CONFIG.entrega?.delivery !== false; // "delivery": false no config tira a entrega
  const ESGOTADOS = new Set(CONFIG.esgotados || []); // pratos que acabaram hoje (o painel atualiza ao vivo)
  document.documentElement.toggleAttribute("data-vitrine", !PEDIDOS);
  const lp = (id) => (MULTI && PAG !== "cardapio" ? L.cardapio : "") + "#prato-" + id;

  /* ---------- utilidades ---------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const reais = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const linkWhats = (msg) => `https://wa.me/${CONFIG.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
  const item = (id) => CARDAPIO.find((i) => i.id === id);
  const norm = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } };
  const ler = (k, padrao) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : padrao; } catch (e) { return padrao; } };
  const semMovimento = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  const CATS = ["entradas", "principais", "executivo", "massas", "sobremesas", "bebidas", "vinhos"];
  const NOME_CAT = { entradas: "Entradas", principais: "Principais", executivo: "Executivo", massas: "Massas", sobremesas: "Sobremesas", bebidas: "Bebidas", vinhos: "Vinhos" };
  const NOTA_CAT = {
    entradas: "Para abrir o apetite e dividir na mesa.",
    principais: "Da brasa de lenha, no tempo que cada corte pede.",
    massas: "Abertas na casa toda manhã.",
    sobremesas: "Feitas na casa, em porções para dividir ou não.",
    bebidas: "Sucos da fruta, chope e drinques.",
    vinhos: "Servidos em taça.",
  };
  const ALERG = { gluten: "glúten", lactose: "lactose", frutos_do_mar: "frutos do mar", amendoim: "amendoim", ovo: "ovo", soja: "soja" };
  const RESTR = { vegetariano: "vegetariano", vegano: "vegano", sem_gluten: "sem glúten" };
  const FILTROS = { vegetariano: "Vegetariano", vegano: "Vegano", sem_gluten: "Sem glúten", sem_lactose: "Sem lactose", picante: "Picante" };
  const DIAS = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  const NOME_DIA = { domingo: "Domingo", segunda: "Segunda", terca: "Terça", quarta: "Quarta", quinta: "Quinta", sexta: "Sexta", sabado: "Sábado" };
  const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

  // ícones Lucide (traço único de 1,5), usados só onde ajudam
  const IC = {
    seta: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    volta: '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  };
  const ic = (n) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${IC[n]}</svg>`;

  /* ---------- fotos ----------
     "…/fotos/nome" = foto tratada pelo fotos.py, em dois tamanhos (640 e 1280).
     Também aceita link completo (https://…) ou foto embutida (data:…). */
  const local = (src) => /(^|\/)fotos\/[^.]+$/.test(src);
  const foto = (src, alt, sizes = "(max-width: 960px) 100vw, 50vw", prioridade = false) => {
    if (!src) return "";
    const s = local(src) ? `src="${esc(src)}-1280.webp" srcset="${esc(src)}-640.webp 640w, ${esc(src)}-1280.webp 1280w" sizes="${sizes}"` : `src="${esc(src)}"`;
    return `<img ${s} alt="${esc(alt)}" ${prioridade ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
  };
  document.addEventListener("load", (ev) => { if (ev.target.tagName === "IMG") ev.target.classList.add("ok"); }, true);
  const marcarFotos = () => $$(".foto img").forEach((im) => { if (im.complete && im.naturalWidth) im.classList.add("ok"); });
  const figura = (it, sizes) => `<figure><a class="foto" href="${lp(it.id)}" aria-label="Ver ${esc(it.nome)}">${foto(it.foto, it.nome, sizes)}</a><figcaption class="legenda"><a href="${lp(it.id)}">${esc(it.nome)}</a><span class="preco">${reais(it.preco)}</span></figcaption></figure>`;

  /* ---------- horários ---------- */
  const minutos = (h) => { const [a, b] = h.split(":").map(Number); return a * 60 + b; };
  const fimTurno = (t) => { const a = minutos(t.abre), f = minutos(t.fecha); return f <= a ? f + 1440 : f; };
  function agoraFuso() {
    const p = new Intl.DateTimeFormat("en-US", { timeZone: CONFIG.fuso, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
    const g = (t) => p.find((x) => x.type === t).value;
    return { dia: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(g("weekday")), min: +g("hour") * 60 + +g("minute") };
  }
  const hora = (h) => (h === "00:00" ? "meia-noite" : h.replace(/^0/, "").replace(":00", "h").replace(":", "h"));
  // quando a casa fecha (se aberta) ou quando abre de novo (se fechada)
  function situacao() {
    const { dia, min } = agoraFuso();
    const hoje = CONFIG.horarios[DIAS[dia]].find((t) => min >= minutos(t.abre) && min < fimTurno(t));
    const ontem = CONFIG.horarios[DIAS[(dia + 6) % 7]].find((t) => fimTurno(t) > 1440 && min < fimTurno(t) - 1440);
    if (hoje || ontem) return { aberto: true, texto: `fecha ${(hoje || ontem).fecha === "00:00" ? "à" : "às"} ${hora((hoje || ontem).fecha)}` };
    for (let k = 0; k < 8; k++) {
      const d = (dia + k) % 7;
      const t = CONFIG.horarios[DIAS[d]].find((x) => k > 0 || minutos(x.abre) > min);
      if (t) return { aberto: false, texto: `abre ${k === 0 ? "hoje" : k === 1 ? "amanhã" : NOME_DIA[DIAS[d]].toLowerCase()} às ${hora(t.abre)}` };
    }
    return { aberto: false, texto: "" };
  }
  const textoHorario = (ts) => (ts.length ? ts.map((t) => `${t.abre} – ${t.fecha}`).join(" · ") : "Fechado");
  const statusCurto = () => { const x = situacao(); return `<span class="estado ${x.aberto ? "" : "fechado"}">${x.aberto ? "Aberto agora" : "Fechado agora"}</span>`; };
  const status = () => { const x = situacao(); return `<span class="estado ${x.aberto ? "" : "fechado"}" data-dyn="status">${x.aberto ? "Aberto agora" : "Fechado"}${x.texto ? " · " + x.texto : ""}</span>`; };
  const tabelaHorarios = () => {
    const hoje = DIAS[agoraFuso().dia];
    return `<dl class="horarios" data-dyn="horarios">${[...DIAS.slice(1), DIAS[0]].map((d) => `<div class="${d === hoje ? "hoje" : ""}"><dt>${NOME_DIA[d]}${d === hoje ? " (hoje)" : ""}</dt><dd>${textoHorario(CONFIG.horarios[d])}</dd></div>`).join("")}</dl>`;
  };

  /* ---------- modo mesa: o QR Code da mesa abre o cardápio com ?mesa=12 ---------- */
  const mesa = (() => {
    const m = new URLSearchParams(location.search).get("mesa") || (CONFIG.mesa ? String(CONFIG.mesa) : "");
    try { if (m) sessionStorage.setItem("cb-mesa", m.replace(/\D/g, "").slice(0, 3)); return sessionStorage.getItem("cb-mesa") || ""; } catch (e) { return m || ""; }
  })();

  /* ---------- carrinho ---------- */
  let carrinho = ler("cb-carrinho", []).filter((c) => item(c.id));
  const qtdTotal = () => carrinho.reduce((s, c) => s + c.qtd, 0);
  function salvarCarrinho() {
    guardar("cb-carrinho", carrinho);
    const n = qtdTotal();
    $$("[data-contador]").forEach((c) => { c.hidden = n === 0; c.textContent = n; });
    $$("[data-abrir-pedido]").forEach((b) => b.setAttribute("aria-label", `Abrir pedido, ${n} ${n === 1 ? "item" : "itens"}`));
    if (!$("#gaveta").hidden) desenharGaveta();
  }
  function adicionar(id, qtd = 1, obs = "", sug = false, extra = 0) {
    if (ESGOTADOS.has(id)) return;
    // botão rápido "Adicionar": prato com escolha obrigatória entra com a primeira opção (dá para trocar na ficha do prato)
    if (!obs && item(id)?.opcoes) {
      const pad = item(id).opcoes.filter((g) => g.obrigatorio).map((g) => g.itens[0]);
      obs = pad.map((o) => o.nome).join(", ");
      extra = pad.reduce((t, o) => t + (o.preco || 0), 0);
    }
    const chave = id + "::" + obs.trim().toLowerCase();
    const ex = carrinho.find((c) => c.chave === chave);
    if (ex) ex.qtd += qtd; else carrinho.push({ chave, id, qtd, obs: obs.trim(), sug, extra });
    salvarCarrinho();
    if (!sug) sugerir(id);
  }

  // conta da mesa: itens vêm do painel (já sem os cancelados); serviço e divisão escolhidos pelo cliente
  let extrato = { itens: [], total: 0 };
  const contaTotal = () => extrato.total * ($("#servico")?.checked ? 1.1 : 1);
  function calcConta() {
    $("#v-serv").textContent = reais($("#servico").checked ? extrato.total * 0.1 : 0);
    $("#v-total").textContent = reais(contaTotal());
    const n = $("#pessoas").value, k = $("#servico").checked ? 1.1 : 1;
    $("#v-pessoa").innerHTML = n === "pessoa" ? partes().map((x) => `${esc(x.nome)}: <b>${reais(x.total * k)}</b>`).join("<br>") : +n > 1 ? `${reais(contaTotal() / +n)} por pessoa` : "";
  }
  // comanda individual: total de cada pessoa da mesa
  const partes = () => Object.values(extrato.itens.reduce((g, i) => { const k = i.pessoa || "Mesa"; (g[k] = g[k] || { nome: k, total: 0 }).total += i.qtd * i.preco; return g; }, {}));
  function mostrarConta(d) {
    extrato = d;
    const pes = partes(), varias = pes.length > 1;
    $("#conteudo").innerHTML = `<div class="largura pagina estreita pagina-conta"><p class="sobre">Mesa ${esc(mesa)}</p><h1>Sua conta</h1>
      ${d.itens.length ? `<div class="conta" style="margin-top:var(--e6)">${(varias ? pes : [{ nome: "" }]).map((pp) => `${varias ? `<p class="entre comanda-nome"><b>${esc(pp.nome)}</b><span class="preco">${reais(pp.total)}</span></p>` : ""}<ul>${d.itens.filter((i) => !varias || (i.pessoa || "Mesa") === pp.nome).map((i) => `<li class="entre"><span>${i.qtd}× ${esc(i.nome)}${i.obs ? `<br><small class="nota">${esc(i.obs)}</small>` : ""}</span><span class="preco">${reais(i.qtd * i.preco)}</span></li>`).join("")}</ul>`).join("")}
      <p class="entre" style="margin-top:var(--e4)"><span>Subtotal</span><span class="preco">${reais(d.total)}</span></p>
      <label class="entre"><span><input type="checkbox" id="servico" checked> Serviço (10%, opcional)</span><span class="preco" id="v-serv"></span></label>
      <p class="entre" style="margin-top:var(--e3)"><b>Total</b><span class="preco conta-total" id="v-total"></span></p></div>
      <form class="form" style="margin-top:var(--e6);gap:var(--e5)" onsubmit="return false"><fieldset><legend>Como vai pagar</legend><div class="opcoes">
        ${["Pix", "Crédito", "Débito", "Dinheiro"].map((f, i) => `<label class="opcao"><input type="radio" name="pagamento" value="${f}" ${i === 1 ? "checked" : ""}><strong>${f}</strong></label>`).join("")}</div></fieldset>
      <label><span>Dividir a conta</span><select class="campo" id="pessoas">${varias ? `<option value="pessoa">Cada um paga o seu (comanda individual)</option>` : ""}${[1, 2, 3, 4, 5, 6].map((n) => `<option value="${n}">${n === 1 ? "Não dividir" : "Igual entre " + n + " pessoas"}</option>`).join("")}</select></label>
      <p class="lead" id="v-pessoa"></p>
      <p class="nota">O pagamento é feito na maquininha do restaurante: o garçom leva até a sua mesa.</p>
      <button type="button" class="btn btn-pri" data-fechar-conta>Fechar conta e chamar a maquininha</button></form>`
      : `<p class="texto" style="margin-top:var(--e5)">Ainda não há pedidos nesta mesa.</p>`}</div>`;
    window.scrollTo(0, 0);
    if (!d.itens.length) return;
    $("#servico").onchange = calcConta;
    $("#pessoas").onchange = calcConta;
    calcConta();
  }

  // venda extra: ao adicionar um prato, sugere o que combina com ele (harmonização do cardápio)
  function sugerir(id) {
    const it = item(id);
    const s = it && it.harmonizacao.map(item).find((h) => h && !carrinho.some((c) => c.id === h.id));
    if (!s || !PEDIDOS) return;
    $("#sugestao")?.remove();
    document.body.insertAdjacentHTML("beforeend", `<div id="sugestao" class="sugestao" role="status"><span>Vai bem com <b>${esc(s.nome)}</b> · ${reais(s.preco)}</span><button type="button" class="btn btn-pri" data-sug="${s.id}">Adicionar</button><button type="button" class="fechar" data-sug-fechar aria-label="Dispensar">${ic("x")}</button></div>`);
    clearTimeout(sugerir.t);
    sugerir.t = setTimeout(() => $("#sugestao")?.remove(), 7000);
  }
  function alterar(chave, qtd) {
    carrinho = qtd <= 0 ? carrinho.filter((c) => c.chave !== chave) : carrinho.map((c) => (c.chave === chave ? { ...c, qtd } : c));
    salvarCarrinho();
  }
  let nomeMesa = ler("cb-nome", ""); // comanda individual: quem está pedindo neste celular
  const precoUn = (c) => (item(c.id)?.preco ?? 0) + (c.extra || 0); // preço do prato + adicionais escolhidos
  const subtotal = () => carrinho.reduce((s, c) => s + precoUn(c) * c.qtd, 0);

  /* ---------- peças comuns ---------- */
  const e = CONFIG.endereco;
  const F = CONFIG.sobre.fotos;
  const rota = `https://www.google.com/maps/dir/?api=1&destination=${CONFIG.coordenadas.lat},${CONFIG.coordenadas.lng}`;
  const waze = `https://waze.com/ul?ll=${CONFIG.coordenadas.lat},${CONFIG.coordenadas.lng}&navigate=yes`;
  const tel = "tel:+55" + CONFIG.telefone.replace(/\D/g, "");
  const canais = CONFIG.canais || {};
  const anos = new Date().getFullYear() - CONFIG.fundacao;
  const porCat = (c) => CARDAPIO.filter((i) => i.categoria === c);
  const pratoDaCasa = () => item(CONFIG.pratoDoChefe) || CARDAPIO.find((i) => i.foto) || CARDAPIO[0];
  const btnIfood = (cls = "link") => (canais.ifood ? `<a class="${cls}" href="${esc(canais.ifood)}" target="_blank" rel="noopener">Pedir no iFood</a>` : "");

  const btnAdd = (it) => (!PEDIDOS ? "" : ESGOTADOS.has(it.id) ? `<button type="button" class="adicionar esgotado" data-add="${it.id}" disabled>Esgotado hoje</button>` : `<button type="button" class="adicionar" data-add="${it.id}" aria-label="Adicionar ${esc(it.nome)} ao pedido">Adicionar</button>`);
  const insta = CONFIG.instagram || "";
  const redes = (cls = "link") => [insta && `<a class="${cls}" href="${esc(insta)}" target="_blank" rel="noopener">Instagram${CONFIG.instagramUsuario ? " " + esc(CONFIG.instagramUsuario) : ""}</a>`, CONFIG.facebook && `<a class="${cls}" href="${esc(CONFIG.facebook)}" target="_blank" rel="noopener">Facebook</a>`, `<a class="${cls}" href="${linkWhats(`Olá, ${CONFIG.nome}!`)}" target="_blank" rel="noopener">WhatsApp</a>`].filter(Boolean).join("");

  // restrições e alergênicos em texto curto, sem ícone
  const marcas = (it) => {
    const r = it.restricoes.filter((x) => !(it.restricoes.includes("vegano") && x === "vegetariano")).map((x) => RESTR[x]);
    if (it.picante) r.push(it.picante > 1 ? "bem picante" : "picante");
    if (it.alergenicos.length) r.push("contém " + it.alergenicos.map((a) => ALERG[a]).join(", "));
    return r.join(" · ");
  };
  const linha = (it) => `<li class="item">
    <div class="item-linha"><h3><a href="${lp(it.id)}">${esc(it.nome)}</a></h3>${it.selo ? `<span class="marca-item">${esc(it.selo.toLowerCase())}</span>` : ""}<span class="fio" aria-hidden="true"></span><span class="preco">${reais(it.preco)}</span></div>
    <p>${esc(it.descricao)}</p>
    <div class="item-pe"><span>${esc(marcas(it))}</span>${btnAdd(it)}</div>
  </li>`;
  const comodidades = () => (CONFIG.comodidades || []).length ? `<dl class="comodidades">${CONFIG.comodidades.map((c) => `<div><dt>${esc(c.titulo)}</dt><dd>${esc(c.texto)}</dd></div>`).join("")}</dl>` : "";
  const infoHoje = () => { const h = CONFIG.horarios[DIAS[agoraFuso().dia]], x = situacao(); return `<div data-dyn="hoje"><dt class="rotulo">Hoje</dt><dd><span class="estado ${x.aberto ? "" : "fechado"}">${x.aberto ? "Aberto agora" : "Fechado agora"}</span>${x.texto ? ", " + x.texto : ""}${h.length ? `<br>${textoHorario(h)}` : ""}</dd></div>`; };
  const DYN = { status: () => status(), horarios: () => tabelaHorarios(), hoje: () => infoHoje() };

  /* ---------- início ---------- */
  function paginaInicio() {
    const casa = pratoDaCasa();
    const capa = CONFIG.capa || { titulo: CONFIG.slogan, texto: CONFIG.descricao };
    const vitrine = (CONFIG.destaques || []).map(item).filter((i) => i && i.foto).slice(0, 3);
    const tres = vitrine.length === 3 ? vitrine : CARDAPIO.filter((i) => i.foto && i.id !== casa.id).slice(0, 3);
    const [d0, ...resto] = CONFIG.depoimentos;
    const av = CONFIG.avaliacao || {};
    return `
    <section class="largura capa">
      <div class="capa-texto">
        <p class="rotulo">${esc(CONFIG.cozinha)} · ${esc(e.bairro)}, ${esc(e.cidade)}</p>
        <h1>${esc(capa.titulo)}</h1>
        <p class="lead">${esc(capa.texto)}</p>
        <p class="capa-estado">${status()}</p>
        <div class="acoes">${PEDIDOS ? `<a class="btn btn-pri" href="${L.reservas}">Reservar mesa</a>${DELIVERY ? `<a class="btn btn-sec" href="${L.cardapio}">Pedir delivery</a>` : ""}<a class="link" href="${L.cardapio}">Ver o cardápio ${ic("seta")}</a>${btnIfood()}` : `<a class="btn btn-pri" href="${L.cardapio}">Ver o cardápio</a>${redes()}`}</div>
      </div>
      <figure class="capa-foto">
        ${capa.video ? `<div class="foto capa-video"><video autoplay muted loop playsinline preload="auto" poster="${esc(capa.poster || "")}" aria-label="Carne selando na grelha em brasa"><source src="${esc(capa.video)}" type="video/mp4"></video></div>` : `<a class="foto" href="${lp(casa.id)}" aria-label="Ver ${esc(casa.nome)}">${foto(casa.foto, casa.nome, "(max-width: 960px) 100vw, 45vw", true)}</a>`}
        <figcaption class="legenda"><span>Na brasa de lenha, todos os dias</span><a href="${lp(casa.id)}">${esc(casa.nome)}, ${reais(casa.preco)}</a></figcaption>
      </figure>
    </section>

    <section class="fatos" aria-label="Informações práticas"><div class="largura"><dl>
      ${infoHoje()}
      <div><dt class="rotulo">Endereço</dt><dd>${esc(e.rua)}, ${esc(e.bairro)}<br><a href="${rota}" target="_blank" rel="noopener">Como chegar</a></dd></div>
      ${DELIVERY ? `<div><dt class="rotulo">Delivery e retirada</dt><dd>${esc(CONFIG.entrega.tempoDelivery)}, taxa de ${reais(CONFIG.entrega.taxa)}<br><a href="${L.cardapio}">Pedir pelo site</a></dd></div>` : `<div><dt class="rotulo">Siga a casa</dt><dd class="acoes">${redes()}</dd></div>`}
    </dl></div></section>

    <section class="secao clara casa"><div class="largura casa-grade">
      <div class="casa-texto">
        <p class="rotulo">A casa</p>
        <p class="lead">${esc(CONFIG.sobre.historiaResumo)}</p>
        <p class="nota assinatura">${esc(CONFIG.fundadores)}, ${CONFIG.fundacao}</p>
        <p><a class="link" href="${L.sobre}">A história da casa ${ic("seta")}</a></p>
      </div>
      <figure class="casa-foto"><div class="foto">${foto(F.salao, `Salão do ${CONFIG.nome}`, "(max-width: 960px) 100vw, 40vw")}</div><figcaption class="legenda"><span>${esc(e.referencia)}</span></figcaption></figure>
    </div></section>

    <section class="secao clara mesa-sec"><div class="largura">
      <header class="cat-cab"><p class="rotulo">Os mais pedidos</p><h2>Da cozinha para a mesa</h2><span class="fio-orn" aria-hidden="true"></span></header>
      <ul class="mesa-pratos">${CARDAPIO.filter((i) => (CONFIG.destaques || []).includes(i.id) && i.fotoRedonda).map(pratoMesa).join("")}</ul>
      <p class="centro mesa-mais"><a class="btn btn-sec" href="${L.cardapio}">Ver o cardápio completo</a></p>
    </div></section>

    <section class="secao morna"><div class="largura duas">
      <div class="bloco"><p class="rotulo">Como a gente cozinha</p><h2>${esc(CONFIG.cozinha)}</h2>${F.brasa ? `<div class="foto" style="aspect-ratio:4/3">${foto(F.brasa, "Carne assando sobre a brasa de lenha", "(max-width: 960px) 100vw, 40vw")}</div>` : ""}</div>
      <ol class="principios">${CONFIG.especialidades.map((s, i) => `<li><span class="n" aria-hidden="true">0${i + 1}</span><h3>${esc(s.titulo)}</h3><p>${esc(s.texto)}</p></li>`).join("")}</ol>
    </div></section>

    <section class="secao clara"><div class="largura">
      <p class="rotulo">O que dizem</p>
      <blockquote class="vozes-grande">${esc(d0.texto)}</blockquote>
      <p class="autor"><b>${esc(d0.nome)}</b> · ${esc(d0.origem)}</p>
      <div class="vozes-outras">${resto.slice(0, 2).map((d) => `<div><blockquote>${esc(d.texto)}</blockquote><p class="autor"><b>${esc(d.nome)}</b> · ${esc(d.origem)}</p></div>`).join("")}</div>
      ${av.verificada ? `<p class="aviso-exemplo">Nota ${String(av.media).replace(".", ",")} em ${av.total.toLocaleString("pt-BR")} avaliações no ${esc(av.fonte)}.</p>` : `<p class="aviso-exemplo">Depoimentos de demonstração. Troque pelos reais antes de publicar.</p>`}
    </div></section>

    ${PEDIDOS && (CONFIG.eventos || []).length ? `<section class="secao"><div class="largura duas">
      <div class="bloco"><p class="rotulo">Festas e encontros</p><h2>A casa também recebe grupos</h2><p><a class="btn btn-sec" href="${linkWhats(`Olá, ${CONFIG.nome}! Quero um orçamento para um evento.`)}" target="_blank" rel="noopener">Pedir orçamento</a></p></div>
      <ul class="linhas">${CONFIG.eventos.map((ev) => `<li><h3>${esc(ev.titulo)}</h3><p>${esc(ev.texto)}</p><a class="link" href="${linkWhats(`Olá, ${CONFIG.nome}! Quero saber sobre ${ev.titulo.toLowerCase()}.`)}" target="_blank" rel="noopener">Consultar data</a></li>`).join("")}</ul>
    </div></section>` : ""}

    <section class="convite">
      <div class="foto">${foto(F.mesa || F.salao, "", "100vw")}</div>
      <div class="largura">
        ${PEDIDOS ? `<h2>Reserve uma mesa</h2>
        <p>Leva um minuto. A confirmação chega pelo WhatsApp.</p>
        <div class="acoes"><a class="btn btn-pri" href="${L.reservas}">Reservar mesa</a>${DELIVERY ? `<a class="link" href="${L.cardapio}">Pedir delivery ${ic("seta")}</a>` : `<a class="link" href="${L.cardapio}">Ver o cardápio ${ic("seta")}</a>`}</div>` : `<h2>Venha conhecer a casa</h2>
        <p>Novidades, pratos do dia e bastidores da cozinha nas redes.</p>
        <div class="acoes"><a class="btn btn-pri" href="${L.cardapio}">Ver o cardápio</a>${redes()}</div>`}
      </div>
    </section>

    <section class="secao"><div class="largura visita">
      <div class="bloco">
        <p class="rotulo">Onde estamos</p>
        <h2>${esc(e.rua)}</h2>
        <address>${esc(e.bairro)}, ${esc(e.cidade)} — ${esc(e.estado)}</address>
        <div class="acoes"><a class="link" href="${rota}" target="_blank" rel="noopener">Abrir no Google Maps</a><a class="link" href="${waze}" target="_blank" rel="noopener">Abrir no Waze</a></div>
        ${comodidades()}
      </div>
      <div class="bloco"><p class="rotulo">Horários</p><p>${status()}</p>${tabelaHorarios()}</div>
      <div class="bloco">
        <p class="rotulo">Fale com a gente</p>
        <a class="fone" href="${tel}">${esc(CONFIG.telefone)}</a>
        ${PEDIDOS ? `<a class="link" href="${linkWhats(`Olá, ${CONFIG.nome}!`)}" target="_blank" rel="noopener">Chamar no WhatsApp</a>${btnIfood()}` : `<div class="acoes">${redes()}</div>`}
        <p class="nota">${CONFIG.pagamentos.map(esc).join(", ")}.</p>
      </div>
    </div></section>`;
  }

  /* ---------- cardápio ---------- */
  const ORDEM = ["executivo", "entradas", "principais", "massas", "sobremesas", "bebidas", "vinhos"];
  const ABRE = { entradas: "Para começar", principais: "Da brasa", massas: "Feitas na casa", sobremesas: "Para fechar", bebidas: "Para beber", vinhos: "Na taça" };
  const ingr = (it) => it.ingredientes.slice(0, 4).map((x) => x.charAt(0).toUpperCase() + x.slice(1)).join(" · ");

  // Executivo: painel vinho com a lista numerada e a roleta de pratos
  function secaoExecutivo() {
    const itens = porCat("executivo");
    const ex = CONFIG.executivo;
    return `<section id="cat-executivo" data-cat class="exec"><div class="largura">
      <div class="exec-painel">
        <header class="exec-cab"><p class="rotulo">${esc(ex.chamada || "Almoço do dia")}</p><h2>${esc(ex.titulo || "Executivo")}</h2><p class="exec-dias">${esc(ex.dias)}</p></header>
        <div class="exec-grade">
          <ol class="exec-lista">${itens.map((it, i) => `<li><button type="button" class="exec-item" data-roda="${i}" aria-pressed="${i === 0}">
            <span class="exec-n">${i + 1}</span>
            <span class="exec-txt"><span class="exec-linha"><b>${esc(it.nome)}</b><span class="preco">${reais(it.preco)}</span></span><span class="exec-detalhe">${esc(it.detalhe || it.descricao)}</span><span class="exec-ingr">${esc(ingr(it))}</span></span>
          </button></li>`).join("")}</ol>
          <div class="roleta" data-roleta aria-roledescription="carrossel" aria-label="Pratos do executivo">
            <div class="roleta-palco">
              <span class="roleta-sombra" aria-hidden="true"></span>
              ${itens.map((it, i) => `<img class="roleta-prato" data-i="${i}" src="${esc(it.fotoCima || "")}" alt="${esc(it.nome)}" ${i ? 'hidden loading="lazy"' : 'fetchpriority="high"'} decoding="async" draggable="false">`).join("")}
            </div>
            <div class="roleta-info" aria-live="polite">
              <p class="roleta-n"></p>
              <h3 class="roleta-nome"></h3>
              <p class="roleta-preco preco"></p>
              <div class="roleta-acoes">${PEDIDOS ? `<button type="button" class="btn btn-claro" data-roleta-add>Adicionar ao pedido</button>` : ""}<a class="link" data-roleta-ver href="#">Ver o prato</a></div>
            </div>
            <div class="roleta-nav">
              <button type="button" class="roleta-seta" data-passo="-1" aria-label="Prato anterior">${ic("volta")}</button>
              <div class="roleta-miniaturas">${itens.map((it, i) => `<button type="button" class="roleta-mini" data-roda="${i}" aria-label="${esc(it.nome)}" aria-pressed="${i === 0}"><img src="${esc(it.fotoCima || "")}" alt="" loading="lazy" decoding="async"></button>`).join("")}</div>
              <button type="button" class="roleta-seta" data-passo="1" aria-label="Próximo prato">${ic("seta")}</button>
            </div>
          </div>
        </div>
        <p class="exec-inclui">${esc(ex.inclui)}.</p>
      </div>
    </div></section>`;
  }

  function ligarRoleta() {
    const r = $("[data-roleta]");
    if (!r) return;
    const itens = porCat("executivo");
    const pratos = $$(".roleta-prato", r);
    let atual = 0, ocupado = false;
    const info = (i) => {
      const it = itens[i];
      $(".roleta-n", r).textContent = `${String(i + 1).padStart(2, "0")} / ${String(itens.length).padStart(2, "0")}`;
      $(".roleta-nome", r).textContent = it.nome;
      $(".roleta-preco", r).textContent = reais(it.preco);
      if ($("[data-roleta-add]", r)) $("[data-roleta-add]", r).dataset.add = it.id;
      $("[data-roleta-ver]", r).href = lp(it.id);
      $$("[data-roda]").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.roda === i)));
    };
    function ir(i) {
      i = (i + itens.length) % itens.length;
      if (i === atual || ocupado) return;
      const sai = pratos[atual], entra = pratos[i];
      const dir = i > atual ? 1 : -1;
      atual = i;
      info(i);
      const nome = $(".roleta-nome", r);
      if (!entra.animate) { sai.hidden = true; entra.hidden = false; return; }
      ocupado = true;
      entra.hidden = false;
      const mola = { duration: 820, easing: "cubic-bezier(.22,.8,.24,1)", fill: "both" };
      // o prato atual rola para fora girando; o novo chega rolando por um arco e para no centro
      sai.animate([{ transform: "none", opacity: 1 }, { transform: `translate(${-75 * dir}%, 30%) rotate(${-220 * dir}deg) scale(.55)`, opacity: 0 }], mola);
      entra.animate([{ transform: `translate(${85 * dir}%, -55%) rotate(${240 * dir}deg) scale(.55)`, opacity: 0, offset: 0 }, { opacity: 1, offset: .35 }, { transform: "none", opacity: 1 }], mola).onfinish = () => { sai.hidden = true; sai.getAnimations().forEach((a) => a.cancel()); ocupado = false; };
      nome.animate([{ opacity: 0, transform: "translateY(.4em)" }, { opacity: 1, transform: "none" }], { duration: 420, delay: 260, easing: "ease-out", fill: "backwards" });
    }
    $$("[data-roda]").forEach((b) => b.addEventListener("click", () => ir(+b.dataset.roda)));
    $$("[data-passo]", r).forEach((b) => b.addEventListener("click", () => ir(atual + +b.dataset.passo)));
    // arrastar para o lado troca o prato (celular)
    let x0 = null;
    const palco = $(".roleta-palco", r);
    palco.addEventListener("pointerdown", (e) => { x0 = e.clientX; });
    palco.addEventListener("pointerup", (e) => { if (x0 !== null && Math.abs(e.clientX - x0) > 40) ir(atual + (e.clientX < x0 ? 1 : -1)); x0 = null; });
    r.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") ir(atual + 1); if (e.key === "ArrowLeft") ir(atual - 1); });
    info(0);
  }

  // traço feito à mão em volta do prato (dois arcos abertos, girados para não ficarem iguais)
  const traco = (i) => `<svg class="pm-traco" viewBox="0 0 200 200" aria-hidden="true" style="transform:rotate(${(i * 73) % 360}deg)"><path d="M38 156 A86 86 0 1 1 168 150"/><path d="M50 170 A90 90 0 0 0 132 192" class="fino"/></svg>`;

  // prato na mesa: foto redonda vista de cima, nome em cursiva, descrição e preço ao lado
  const pratoMesa = (it, i) => `<li class="pm ${i % 2 ? "dir" : "esq"}">
      <a class="pm-prato" href="${lp(it.id)}" aria-label="Ver ${esc(it.nome)}"><span class="pm-louca"><img src="${esc(it.fotoRedonda)}" alt="${esc(it.nome)}" loading="lazy" decoding="async"></span>${traco(i)}${it.selo ? `<span class="pm-selo">${esc(it.selo)}</span>` : ""}</a>
      <div class="pm-txt">
        <h3><a href="${lp(it.id)}">${esc(it.nome)}</a></h3>
        <span class="pm-fio" aria-hidden="true"></span>
        <p class="pm-desc">${esc(it.descricao)}</p>
        <p class="pm-pe"><span class="pm-preco preco">${reais(it.preco)}</span>${btnAdd(it)}</p>
        ${marcas(it) ? `<p class="pm-marcas">${esc(marcas(it))}</p>` : ""}
      </div>
    </li>`;

  function categoria(cat, n) {
    const itens = porCat(cat);
    const comFoto = itens.filter((x) => x.fotoRedonda);
    const resto = itens.filter((x) => !x.fotoRedonda);
    return `<section id="cat-${cat}" data-cat class="categoria"><div class="largura">
      <header class="cat-cab"><p class="rotulo">${String(n).padStart(2, "0")} · ${esc(ABRE[cat] || "")}</p><h2>${NOME_CAT[cat]}</h2><span class="fio-orn" aria-hidden="true"></span><p class="categoria-nota">${esc(NOTA_CAT[cat] || "")}</p></header>
      ${comFoto.length ? `<ul class="mesa-pratos">${comFoto.map(pratoMesa).join("")}</ul>` : ""}
      ${resto.length ? `<ul class="lista lista-resto">${resto.map(linha).join("")}</ul>` : ""}
    </div></section>`;
  }

  // bebidas e vinhos: duas colunas de lista, como no fim de um cardápio impresso
  const colunaBar = (cat) => `<div id="cat-${cat}" data-cat class="bar-col">
      <h3 class="bar-tit">${NOME_CAT[cat]}</h3><p class="categoria-nota">${esc(NOTA_CAT[cat] || "")}</p>
      <ul>${porCat(cat).map((it) => `<li class="bar-item"><div class="bar-linha"><a href="${lp(it.id)}">${esc(it.nome)}</a><span class="fio" aria-hidden="true"></span><span class="preco">${reais(it.preco)}</span></div><p>${esc(it.descricao)}</p>${btnAdd(it)}</li>`).join("")}</ul>
    </div>`;
  const secaoBar = (n) => `<section class="categoria bar-sec"><div class="largura">
      <header class="cat-cab"><p class="rotulo">${String(n).padStart(2, "0")} · Para beber</p><h2>Bebidas e vinhos</h2><span class="fio-orn" aria-hidden="true"></span></header>
      <div class="bar-cols">${colunaBar("bebidas")}${colunaBar("vinhos")}</div>
    </div></section>`;

  function paginaCardapio() {
    return `<div class="cardapio clara">
    ${PAINEL && !PEDIDOS ? `<p class="aviso-mesa"><span class="largura">Para fazer o pedido, escaneie o QR Code da sua mesa.</span></p>` : ""}
    ${PEDIDOS && mesa ? `<p class="aviso-mesa"><span class="largura">Você está na <b>mesa ${esc(mesa)}</b>. Monte o pedido e envie: a equipe leva até você.</span>${PAINEL ? `<span class="mesa-acoes"><button type="button" class="btn btn-sec" data-chamar="garcom">Chamar garçom</button><button type="button" class="btn btn-sec" data-chamar="conta">Pedir a conta</button></span>` : ""}</p>` : ""}
    <section class="largura cab-pagina centro">
      <p class="rotulo">${esc(CONFIG.nome)} · desde ${CONFIG.fundacao}</p>
      <h1>Cardápio</h1>
      <span class="fio-orn" aria-hidden="true"></span>
      <p class="texto">${PEDIDOS ? "Toque no nome de um prato para ver os ingredientes e pedir do seu jeito." : "Toque no nome de um prato para ver os ingredientes. Preços em reais."}</p>
      <div class="busca"><label class="sr" for="busca">Buscar no cardápio</label><input id="busca" type="search" placeholder="Buscar prato ou ingrediente"><button type="button" class="marcador" id="btn-filtros" aria-expanded="false" aria-controls="filtros">Filtros</button></div>
      <div class="filtros" id="filtros" hidden>${Object.entries(FILTROS).map(([k, v]) => `<button type="button" class="marcador" data-filtro="${k}" aria-pressed="false">${v}</button>`).join("")}</div>
    </section>
    <nav class="indice" aria-label="Categorias do cardápio"><div class="largura"><ul>${ORDEM.map((c) => `<li><a href="${L.cardapio}" data-ir="${c}">${NOME_CAT[c]}</a></li>`).join("")}</ul></div></nav>
    <div id="ilustrado">${secaoExecutivo()}${["entradas", "principais", "massas", "sobremesas"].map((c, i) => categoria(c, i + 1)).join("")}${secaoBar(5)}</div>
    <section id="resultados" class="largura secao" hidden aria-live="polite"></section>
    </div>`;
  }

  function ligarCardapio() {
    let filtros = [];
    const busca = $("#busca");
    const atende = (it, f) =>
      f === "vegetariano" ? it.restricoes.includes("vegetariano") || it.restricoes.includes("vegano")
      : f === "vegano" ? it.restricoes.includes("vegano")
      : f === "sem_gluten" ? !it.alergenicos.includes("gluten")
      : f === "sem_lactose" ? !it.alergenicos.includes("lactose")
      : it.picante > 0;
    function aplicar() {
      const termo = norm(busca.value.trim());
      const ativo = termo || filtros.length;
      $("#ilustrado").hidden = Boolean(ativo);
      $("#resultados").hidden = !ativo;
      if (!ativo) return;
      const r = CARDAPIO.filter((it) => filtros.every((f) => atende(it, f)) && (!termo || norm(it.nome).includes(termo) || norm(it.descricao).includes(termo) || it.ingredientes.some((x) => norm(x).includes(termo))));
      $("#resultados").innerHTML = `<div class="cab-secao"><h2>${r.length} ${r.length === 1 ? "prato encontrado" : "pratos encontrados"}</h2><button type="button" class="marcador" id="limpar">Limpar e ver tudo</button></div>${r.length ? `<ul class="lista">${r.map(linha).join("")}</ul>` : '<p class="texto">Nada com essa combinação. Tente outra busca ou tire algum filtro.</p>'}`;
      $("#limpar").onclick = limpar;
    }
    function limpar() {
      filtros = [];
      busca.value = "";
      $$("[data-filtro]").forEach((b) => b.setAttribute("aria-pressed", "false"));
      $("#btn-filtros").textContent = "Filtros";
      aplicar();
    }
    busca.addEventListener("input", aplicar);
    $("#btn-filtros").onclick = () => {
      const f = $("#filtros");
      f.hidden = !f.hidden;
      $("#btn-filtros").setAttribute("aria-expanded", String(!f.hidden));
    };
    $$("[data-filtro]").forEach((b) => (b.onclick = () => {
      const k = b.dataset.filtro;
      filtros = filtros.includes(k) ? filtros.filter((x) => x !== k) : [...filtros, k];
      b.setAttribute("aria-pressed", String(filtros.includes(k)));
      $("#btn-filtros").textContent = filtros.length ? `Filtros (${filtros.length})` : "Filtros";
      aplicar();
    }));
    // categorias: rola até a seção e marca a que está na tela
    $$("[data-ir]").forEach((a) => (a.onclick = (ev) => {
      ev.preventDefault();
      if ($("#ilustrado").hidden) limpar();
      document.getElementById("cat-" + a.dataset.ir)?.scrollIntoView({ behavior: semMovimento() ? "auto" : "smooth", block: "start" });
    }));
    const obs = new IntersectionObserver((ents) => {
      const v = ents.filter((x) => x.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (!v) return;
      const c = v.target.id.replace("cat-", "");
      $$("[data-ir]").forEach((a) => {
        const atual = a.dataset.ir === c;
        a.setAttribute("aria-current", String(atual));
        if (atual) a.closest("ul").scrollTo({ left: a.offsetLeft - 60, behavior: "auto" });
      });
    }, { rootMargin: "-160px 0px -60% 0px" });
    $$("[data-cat]").forEach((s) => obs.observe(s));
    ligarRoleta();
  }

  /* ---------- reservas ---------- */
  const pad = (n) => String(n).padStart(2, "0");
  const hojeFuso = () => new Intl.DateTimeFormat("en-CA", { timeZone: CONFIG.fuso, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const somarDias = (d, n) => { const [a, m, dd] = d.split("-").map(Number); const t = new Date(Date.UTC(a, m - 1, dd + n)); return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`; };
  const diaSemana = (d) => { const [a, m, dd] = d.split("-").map(Number); return new Date(Date.UTC(a, m - 1, dd)).getUTCDay(); };
  const porExtenso = (d) => { const [, m, dd] = d.split("-").map(Number); return `${NOME_DIA[DIAS[diaSemana(d)]].toLowerCase()}, ${dd} de ${MESES[m - 1]}`; };
  function horarios(data) {
    const r = CONFIG.reservas;
    const limite = data === hojeFuso() ? agoraFuso().min + r.antecedenciaMinimaHoras * 60 : -1;
    const out = [];
    CONFIG.horarios[DIAS[diaSemana(data)]].forEach((t) => {
      const ini = minutos(t.abre), ult = fimTurno(t) - r.ultimaChegadaAntesDeFecharMin;
      for (let m = ini; m <= ult; m += r.intervaloMinutos) if (m >= limite) out.push({ h: `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`, turno: ini < 1020 ? "Almoço" : "Jantar" });
    });
    return out;
  }

  function paginaReservas() {
    return `<div class="largura pagina">
      <h1>Reserve uma mesa</h1>
      <p class="texto">Seguramos a mesa por 15 minutos. Para mais de ${CONFIG.reservas.maxPessoas} pessoas ou eventos, fale com a gente pelo WhatsApp.</p>
      <form id="form-reserva" class="reserva-grade" novalidate>
        <div class="passos">
          <fieldset><legend>1. Quantas pessoas</legend><div class="qtd"><button type="button" data-p="-1" aria-label="Menos uma pessoa">−</button><output id="pessoas">2</output><button type="button" data-p="1" aria-label="Mais uma pessoa">+</button></div><p id="grupo" class="erros" style="margin-top:var(--e4)" hidden></p></fieldset>
          <fieldset><legend>2. Dia</legend><div class="dias" id="dias"></div></fieldset>
          <fieldset><legend>3. Horário</legend><div id="horas"></div></fieldset>
        </div>
        <aside class="resumo">
          <div><p class="rotulo">Sua reserva</p><p class="resumo-dia" id="res-dia"></p><p id="res-hora" class="nota"></p></div>
          <div class="form">
            <label><span>Nome</span><input class="campo" id="r-nome" autocomplete="name"></label>
            <label><span>Telefone com DDD</span><input class="campo" id="r-tel" type="tel" inputmode="tel" autocomplete="tel"></label>
            <fieldset><legend>Ocasião (opcional)</legend><div class="tira" id="ocasioes">${["Aniversário", "Jantar a dois", "Negócios", "Família"].map((o) => `<button type="button" class="marcador" aria-pressed="false">${o}</button>`).join("")}</div></fieldset>
            <label><span>Observações (opcional)</span><textarea id="r-obs" rows="2" placeholder="Cadeirão, acessibilidade, alergias"></textarea></label>
          </div>
          <div id="r-erros" class="erros" role="alert" hidden></div>
          <button class="btn btn-pri btn-bloco" type="submit">Enviar pelo WhatsApp</button>
          <p class="nota">A reserva vale depois que a equipe confirmar pelo WhatsApp.</p>
        </aside>
      </form>
    </div>`;
  }

  function ligarReservas() {
    const st = { pessoas: 2, data: "", hora: "", ocasiao: "" };
    const hoje = hojeFuso();
    const dias = Array.from({ length: 14 }, (_, i) => somarDias(hoje, i));
    st.data = dias.find((d) => horarios(d).length) || "";
    function desenhar() {
      const grande = st.pessoas > CONFIG.reservas.maxPessoas;
      $("#pessoas").textContent = st.pessoas;
      const g = $("#grupo");
      g.hidden = !grande;
      g.innerHTML = grande ? `Para mais de ${CONFIG.reservas.maxPessoas} pessoas montamos um espaço sob medida. <a href="${linkWhats(`Olá, ${CONFIG.nome}! Quero reservar para um grupo de ${st.pessoas} pessoas.`)}" target="_blank" rel="noopener">Fale com a gente pelo WhatsApp</a>.` : "";
      $("#dias").innerHTML = dias.map((d, i) => {
        const fechado = !CONFIG.horarios[DIAS[diaSemana(d)]].length;
        return `<button type="button" class="dia" data-d="${d}" aria-pressed="${st.data === d}" ${fechado || grande ? "disabled" : ""}><small>${i === 0 ? "Hoje" : i === 1 ? "Amanhã" : NOME_DIA[DIAS[diaSemana(d)]].slice(0, 3)}</small><b>${+d.slice(8)}</b><span class="sr">, ${porExtenso(d)}${fechado ? ", fechado" : ""}</span></button>`;
      }).join("");
      const hs = st.data ? horarios(st.data) : [];
      if (!hs.some((x) => x.h === st.hora)) st.hora = "";
      $("#horas").innerHTML = hs.length
        ? ["Almoço", "Jantar"].map((t) => { const l = hs.filter((x) => x.turno === t); return l.length ? `<p class="turno">${t}</p><div class="horas">${l.map((x) => `<button type="button" class="hora" data-h="${x.h}" aria-pressed="${st.hora === x.h}" ${grande ? "disabled" : ""}>${x.h}</button>`).join("")}</div>` : ""; }).join("")
        : `<p class="nota">${st.data === hoje ? "Não há mais horários para hoje. Escolha outro dia." : "Escolha um dia."}</p>`;
      $("#res-dia").textContent = st.data ? porExtenso(st.data) : "Escolha o dia";
      $("#res-hora").textContent = `${st.hora ? "às " + st.hora : "Escolha o horário"} · ${st.pessoas} ${st.pessoas === 1 ? "pessoa" : "pessoas"}`;
    }
    $$("[data-p]").forEach((b) => (b.onclick = () => { st.pessoas = Math.min(30, Math.max(1, st.pessoas + +b.dataset.p)); desenhar(); }));
    $("#dias").onclick = (ev) => { const b = ev.target.closest("[data-d]"); if (b) { st.data = b.dataset.d; desenhar(); } };
    $("#horas").onclick = (ev) => { const b = ev.target.closest("[data-h]"); if (b) { st.hora = b.dataset.h; desenhar(); } };
    $("#ocasioes").onclick = (ev) => {
      const b = ev.target.closest("button"); if (!b) return;
      st.ocasiao = st.ocasiao === b.textContent ? "" : b.textContent;
      $$("#ocasioes button").forEach((x) => x.setAttribute("aria-pressed", String(x.textContent === st.ocasiao)));
    };
    $("#form-reserva").onsubmit = (ev) => {
      ev.preventDefault();
      const nome = $("#r-nome").value.trim(), fone = $("#r-tel").value.trim(), obs = $("#r-obs").value.trim();
      const err = [];
      if (!st.hora) err.push("Escolha um horário.");
      if (!nome) err.push("Informe seu nome.");
      if (fone.replace(/\D/g, "").length < 10) err.push("Informe um telefone com DDD.");
      $("#r-erros").hidden = !err.length;
      $("#r-erros").innerHTML = err.join("<br>");
      if (err.length) return;
      const msg = [`*Pedido de reserva — ${CONFIG.nome}*`, "", `*Data:* ${porExtenso(st.data)}`, `*Horário:* ${st.hora}`, `*Pessoas:* ${st.pessoas}`, ...(st.ocasiao ? [`*Ocasião:* ${st.ocasiao}`] : []), ...(obs ? [`*Observações:* ${obs}`] : []), "", `*Nome:* ${nome}`, `*Telefone:* ${fone}`, "", "Aguardo a confirmação. Obrigado!"].join("\n");
      window.open(linkWhats(msg), "_blank", "noopener");
    };
    desenhar();
  }

  /* ---------- a casa e contato ---------- */
  function paginaSobre() {
    const c = CONFIG.sobre.chef;
    return `<section class="largura pagina" style="padding-bottom:var(--e8)">
      <p class="rotulo">A casa · desde ${CONFIG.fundacao}</p>
      <h1 style="margin-top:var(--e4);max-width:14ch">${anos} anos com o fogo aceso</h1>
      <p class="lead" style="margin-top:var(--e5);max-width:26em">${esc(CONFIG.sobre.historiaResumo)}</p>
    </section>
    <section class="secao morna"><div class="largura duas">
      <figure><div class="foto" style="aspect-ratio:4/5">${foto(F.entrada, `Salão do ${CONFIG.nome}`, "(max-width: 960px) 100vw, 40vw")}</div><figcaption class="legenda"><span>${esc(e.referencia)}</span></figcaption></figure>
      <div class="bloco"><h2>Da garagem ao casarão</h2>
        <dl class="tempo">${CONFIG.sobre.historia.map((m) => `<div><dt>${m.ano}</dt><dd><b>${esc(m.titulo)}</b><span>${esc(m.texto)}</span></dd></div>`).join("")}</dl>
      </div>
    </div></section>
    <section class="secao clara"><div class="largura chef">
      <div class="foto">${foto(c.foto, `${c.nome} na cozinha`, "(max-width: 960px) 100vw, 40vw")}</div>
      <div><p class="rotulo">Quem cozinha</p><blockquote style="margin-top:var(--e4)">${esc(c.texto)}</blockquote><p class="autor"><b>${esc(c.nome)}</b> · ${esc(c.cargo)}</p></div>
    </div></section>
    <section class="secao"><div class="largura">
      <div class="cab-secao"><h2>O casarão por dentro</h2></div>
      <div class="galeria">${F.galeria.slice(0, 3).map((g, i) => `<div class="foto">${foto(g, `Ambiente do restaurante, foto ${i + 1}`, "(max-width: 768px) 100vw, 40vw")}</div>`).join("")}</div>
    </div></section>
    <section class="secao morna" id="contato"><div class="largura contato">
      <div class="bloco" style="gap:var(--e6)">
        <div class="bloco"><p class="rotulo">Endereço e contato</p><h2>${esc(e.rua)}</h2><address>${esc(e.bairro)}, ${esc(e.cidade)} — ${esc(e.estado)} · CEP ${esc(e.cep)}</address>
          <div class="acoes"><a class="link" href="${rota}" target="_blank" rel="noopener">Abrir no Google Maps</a><a class="link" href="${waze}" target="_blank" rel="noopener">Abrir no Waze</a></div>
          <a class="fone" href="${tel}">${esc(CONFIG.telefone)}</a>
          <div class="acoes"><a class="link" href="${linkWhats(`Olá, ${CONFIG.nome}!`)}" target="_blank" rel="noopener">WhatsApp</a>${CONFIG.instagram ? `<a class="link" href="${esc(CONFIG.instagram)}" target="_blank" rel="noopener">Instagram${CONFIG.instagramUsuario ? " " + esc(CONFIG.instagramUsuario) : ""}</a>` : ""}</div>
        </div>
        <div class="bloco"><p class="rotulo">Horários</p><p>${status()}</p>${tabelaHorarios()}</div>
        ${comodidades()}
      </div>
      <div id="mapa" class="mapa" role="region" aria-label="Mapa com a localização do restaurante"></div>
    </div></section>`;
  }

  function ligarMapa() {
    const el = $("#mapa");
    if (!el) return;
    const { lat, lng } = CONFIG.coordenadas;
    el.innerHTML = `<iframe title="Mapa com a localização do ${esc(CONFIG.nome)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen src="https://www.google.com/maps?q=${lat},${lng}&z=16&hl=pt-BR&output=embed"></iframe>`;
  }

  /* ---------- finalizar pedido ---------- */
  function paginaPedido() {
    if (!carrinho.length) return `<div class="largura pagina estreita"><h1>Seu pedido está vazio</h1><p class="texto">Escolha os pratos no cardápio e eles aparecem aqui.</p><p style="margin-top:var(--e6)"><a class="btn btn-pri" href="${L.cardapio}">Ver o cardápio</a></p></div>`;
    return `<div class="largura pagina estreita">
      <h1>Seu pedido</h1>
      <form id="form-pedido" class="form" style="margin-top:var(--e7);gap:var(--e6)" novalidate>
        ${PAINEL ? `<fieldset><legend>Como você quer receber</legend><div class="opcoes">${mesa ? `<label class="opcao"><input type="radio" name="tipo" value="mesa" checked><strong>Na mesa ${esc(mesa)}</strong><small>A equipe leva até você</small></label>` : ""}${BALCAO ? `<label class="opcao"><input type="radio" name="tipo" value="retirada" ${mesa ? "" : "checked"}><strong>Retirar no balcão</strong><small>Você recebe uma senha e é chamado na TV</small></label>` : ""}</div></fieldset>` : `<fieldset><legend>Como você quer receber</legend><div class="opcoes">
          ${mesa ? `<label class="opcao"><input type="radio" name="tipo" value="mesa" checked><strong>Na mesa ${esc(mesa)}</strong><small>A equipe leva até você</small></label>` : ""}
          ${DELIVERY ? `<label class="opcao"><input type="radio" name="tipo" value="delivery" ${mesa ? "" : "checked"}><strong>Delivery</strong><small>${reais(CONFIG.entrega.taxa)} · ${esc(CONFIG.entrega.tempoDelivery)}</small></label>` : ""}
          <label class="opcao"><input type="radio" name="tipo" value="retirada" ${!mesa && !DELIVERY ? "checked" : ""}><strong>Retirada</strong><small>Sem taxa · ${esc(CONFIG.entrega.tempoRetirada)}</small></label>
        </div></fieldset>`}
        <div class="conta" id="itens-pedido"></div>
        <div class="form-duas">
          <label><span>${PAINEL ? "Seu nome (para a sua comanda)" : "Nome"}</span><input class="campo" name="nome" autocomplete="name" ${PAINEL ? `value="${esc(nomeMesa)}" placeholder="Ex.: Ana"` : ""}></label>
          <label class="fora-mesa"><span>Telefone com DDD</span><input class="campo" name="tel" type="tel" inputmode="tel" autocomplete="tel"></label>
          <label class="so-delivery" style="grid-column:1/-1"><span>Endereço de entrega</span><input class="campo" name="end" autocomplete="street-address" placeholder="Rua, número e bairro"></label>
          <label class="so-delivery" style="grid-column:1/-1"><span>Complemento (opcional)</span><input class="campo" name="comp" placeholder="Apto, bloco, referência"></label>
        </div>
        <label class="fora-mesa"><span>Pagamento na entrega</span><select class="campo" name="pag">${CONFIG.pagamentos.map((p) => `<option>${esc(p)}</option>`).join("")}</select></label>
        <label><span>Observações (opcional)</span><textarea name="obs" rows="2" placeholder="${PAINEL ? "Trazer tudo junto, sem pressa" : "Interfone quebrado, ligar ao chegar"}"></textarea></label>
        <div id="p-erros" class="erros" role="alert" hidden></div>
        <button class="btn btn-pri" type="submit" id="enviar-pedido">${PAINEL ? "Enviar pedido para a cozinha" : "Enviar pedido pelo WhatsApp"}</button>
      </form>
    </div>`;
  }

  function ligarPedido() {
    const f = $("#form-pedido");
    if (!f) return;
    const tipo = () => f.tipo?.value || (PAINEL ? "mesa" : "");
    function desenhar() {
      const sub = subtotal(), taxa = tipo() === "delivery" ? CONFIG.entrega.taxa : 0;
      $("#itens-pedido").innerHTML = `<ul>${carrinho.map((c) => { const it = item(c.id); return `<li class="entre"><span>${c.qtd}× ${esc(it.nome)}${c.obs ? `<br><small class="nota">${esc(c.obs)}</small>` : ""}</span><span class="preco">${reais(precoUn(c) * c.qtd)}</span></li>`; }).join("")}</ul><p class="entre" style="margin-top:var(--e4)"><span>Subtotal</span><span class="preco">${reais(sub)}</span></p>${taxa ? `<p class="entre"><span>Taxa de entrega</span><span class="preco">${reais(taxa)}</span></p>` : ""}<p class="entre" style="margin-top:var(--e3)"><b>Total</b><span class="preco conta-total">${reais(sub + taxa)}</span></p>`;
      $$(".so-delivery").forEach((x) => (x.hidden = tipo() !== "delivery"));
      $$(".fora-mesa").forEach((x) => (x.hidden = tipo() === "mesa" || PAINEL));
      $("#enviar-pedido").textContent = `${PAINEL ? "Enviar pedido para a cozinha" : "Enviar pedido pelo WhatsApp"} · ${reais(sub + taxa)}`;
    }
    f.addEventListener("change", desenhar);
    f.onsubmit = (ev) => {
      ev.preventDefault();
      const d = Object.fromEntries(new FormData(f));
      const sub = subtotal(), deliv = tipo() === "delivery", taxa = deliv ? CONFIG.entrega.taxa : 0;
      const err = [];
      if (!PAINEL && !d.nome.trim()) err.push("Informe seu nome.");
      if (PAINEL && tipo() === "retirada" && !d.nome.trim()) err.push("Informe seu nome para chamarmos você no balcão.");
      if (tipo() !== "mesa" && !PAINEL && d.tel.replace(/\D/g, "").length < 10) err.push("Informe um telefone com DDD.");
      if (deliv && !d.end.trim()) err.push("Informe o endereço de entrega.");
      if (deliv && sub < CONFIG.entrega.pedidoMinimo) err.push(`O pedido mínimo para delivery é ${reais(CONFIG.entrega.pedidoMinimo)}.`);
      $("#p-erros").hidden = !err.length;
      $("#p-erros").innerHTML = err.join("<br>");
      if (err.length) return;
      const linhas = carrinho.map((c) => { const it = item(c.id); return `• ${c.qtd}x ${it.nome} — ${reais(precoUn(c) * c.qtd)}${c.obs ? `\n   _Obs.: ${c.obs}_` : ""}`; });
      const naMesa = tipo() === "mesa";
      const msg = [`*Novo pedido — ${CONFIG.nome}*`, `*Tipo:* ${naMesa ? "Na mesa " + mesa : deliv ? "Delivery" : "Retirada no balcão"}`, "", "*Itens*", ...linhas, "", `Subtotal: ${reais(sub)}`, ...(deliv ? [`Taxa de entrega: ${reais(taxa)}`] : []), `*Total: ${reais(sub + taxa)}*`, "", `*Nome:* ${d.nome.trim()}`, `*Telefone:* ${d.tel.trim()}`, ...(deliv ? [`*Endereço:* ${d.end.trim()}${d.comp.trim() ? " — " + d.comp.trim() : ""}`] : []), ...(naMesa ? [] : [`*Pagamento:* ${d.pag}`]), ...(d.obs.trim() ? [`*Observações:* ${d.obs.trim()}`] : [])].join("\n");
      // modo painel: o pedido vai direto para o PDV (aqui, a tela ao lado na demonstração)
      if (CONFIG.pedidos === "painel") {
        const num = Date.now() % 100000;
        const pedido = { tipo: "pedido", num, mesa: naMesa ? mesa : "", modo: naMesa ? "Mesa" : deliv ? "Delivery" : "Retirada", nome: d.nome.trim(), obs: d.obs.trim(),
          itens: carrinho.map((c) => ({ nome: item(c.id).nome, qtd: c.qtd, obs: c.obs, preco: precoUn(c), cat: item(c.id).categoria, sug: !!c.sug })), total: sub + taxa };
        nomeMesa = d.nome.trim();
        try { localStorage.setItem("cb-nome", JSON.stringify(nomeMesa)); } catch (e) {}
        let confirmado = false;
        const enviar = () => { if (!confirmado) { window.parent.postMessage(pedido, "*"); setTimeout(enviar, 3000); } };
        enviar();
        carrinho = [];
        salvarCarrinho();
        $("#conteudo").innerHTML = `<div class="largura pagina estreita"><h1>Pedido enviado</h1><p class="texto">Chegou na cozinha. Acompanhe aqui:</p><p class="lead" id="status-pedido" style="margin-top:var(--e4)">Enviando…</p><p style="margin-top:var(--e6)"><a class="btn btn-sec" href="${L.cardapio}">Pedir mais</a>${naMesa ? ` <button type="button" class="btn btn-sec" data-chamar="garcom">Chamar garçom</button> <button type="button" class="btn btn-sec" data-chamar="conta">Pedir a conta</button>` : ""}</p></div>`;
        window.scrollTo(0, 0);
        window.addEventListener("message", (ev) => {
          if (ev.data?.num === num && ev.data.tipo === "recebido") { confirmado = true; if ($("#status-pedido")?.textContent === "Enviando…") $("#status-pedido").textContent = "Recebido"; }
          if (ev.data?.tipo === "status" && ev.data.num === num && $("#status-pedido")) $("#status-pedido").textContent = ev.data.status;
        });
        return;
      }
      window.open(linkWhats(msg), "_blank", "noopener");
      carrinho = [];
      salvarCarrinho();
      $("#conteudo").innerHTML = `<div class="largura pagina estreita"><h1>Pedido enviado</h1><p class="texto">Confirme a mensagem no WhatsApp que abriu. A equipe responde por lá.</p><p style="margin-top:var(--e6)"><a class="btn btn-sec" href="${L.cardapio}">Voltar ao cardápio</a></p></div>`;
    };
    desenhar();
  }

  /* ---------- pedido (gaveta) ---------- */
  function desenharGaveta() {
    const g = $("#gaveta");
    const sub = subtotal();
    const falta = Math.max(0, CONFIG.entrega.pedidoMinimo - sub);
    g.innerHTML = `<header><h2 id="titulo-gaveta">Seu pedido</h2><button type="button" class="fechar" data-fechar aria-label="Fechar pedido">${ic("x")}</button></header>${
      carrinho.length
        ? `<ul>${carrinho.map((c) => { const it = item(c.id); return `<li><div class="entre"><b>${esc(it.nome)}</b><span class="preco">${reais(precoUn(c) * c.qtd)}</span></div>${c.obs ? `<p class="nota">${esc(c.obs)}</p>` : ""}<div class="contas"><button type="button" data-menos="${esc(c.chave)}" aria-label="Diminuir ${esc(it.nome)}">−</button><b>${c.qtd}</b><button type="button" data-mais="${esc(c.chave)}" aria-label="Aumentar ${esc(it.nome)}">+</button><button type="button" class="remover" data-remover="${esc(c.chave)}">Remover</button></div></li>`; }).join("")}</ul>
          <footer><p class="entre"><span>Subtotal</span><span class="preco conta-total">${reais(sub)}</span></p>${PAINEL ? `<p class="nota">${mesa ? `Mesa ${esc(mesa)}: o` : "O"} pedido vai direto para a cozinha.</p>` : `<p class="nota">Delivery: mais ${reais(CONFIG.entrega.taxa)}, ${esc(CONFIG.entrega.tempoDelivery)}. Retirada sem taxa.</p>`}${!PAINEL && falta ? `<p class="nota">Faltam ${reais(falta)} para o pedido mínimo de delivery.</p>` : ""}<a class="btn btn-pri btn-bloco" href="${L.pedido}" data-fechar>Finalizar pedido</a></footer>`
        : `<div class="vazio"><h3>Seu pedido está vazio</h3><p class="nota">Escolha os pratos no cardápio.</p><a class="btn btn-sec" href="${L.cardapio}" data-fechar>Ver o cardápio</a></div>`
    }`;
  }
  function abrirGaveta() {
    desenharGaveta();
    $("#gaveta").hidden = false;
    $("#fundo-gaveta").hidden = false;
    requestAnimationFrame(() => $("#gaveta").classList.add("aberta"));
    document.body.style.overflow = "hidden";
    $("#gaveta [data-fechar]")?.focus();
  }
  function fecharGaveta() {
    $("#gaveta").classList.remove("aberta");
    $("#fundo-gaveta").hidden = true;
    document.body.style.overflow = "";
    setTimeout(() => ($("#gaveta").hidden = true), 260);
  }

  /* ---------- ficha do prato ---------- */
  function abrirPrato(id) {
    const it = item(id);
    if (!it) return;
    const harm = it.harmonizacao.map(item).filter(Boolean);
    const comPonto = /picanha|filé|bife|contra-filé|salmão/.test(it.ingredientes.join(" ")) && ["principais", "executivo"].includes(it.categoria);
    const mk = marcas(it);
    const m = $("#modal");
    m.innerHTML = `<div class="ficha-topo"><a class="link" href="${L.cardapio}" data-fechar-prato>${ic("volta")} Cardápio</a><button type="button" class="fechar" data-fechar-prato aria-label="Fechar">${ic("x")}</button></div>
      <div class="ficha ${it.fotoRedonda || it.fotoCima ? "" : "sem-foto"}">
        ${it.fotoRedonda || it.fotoCima ? `<div class="ficha-foto ${it.fotoCima ? "ficha-cima" : "ficha-mesa"}"><span class="ficha-prato"><span class="pm-louca"><img src="${esc(it.fotoRedonda || it.fotoCima)}" alt="${esc(it.nome)}"></span>${it.fotoRedonda ? traco(2) : ""}</span></div>` : ""}
        <div class="ficha-corpo">
          <div class="bloco">
            <p class="rotulo">${NOME_CAT[it.categoria]}${it.selo ? " · " + esc(it.selo) : ""}</p>
            <h1>${esc(it.nome)}</h1>
            <p class="lead">${esc(it.descricao)}</p>
            <p class="ficha-preco preco">${reais(it.preco)}</p>
            ${mk ? `<p class="nota">${esc(mk.charAt(0).toUpperCase() + mk.slice(1))}.</p>` : ""}
          </div>
          ${PEDIDOS ? `<div class="ficha-grupo"><h2 class="rotulo">Ingredientes</h2><div class="tira">${it.ingredientes.map((x) => `<button type="button" class="marcador ingrediente" aria-pressed="false" data-ing="${esc(x)}">${esc(x)}</button>`).join("")}</div><p class="nota">Toque num ingrediente para pedir sem ele.</p></div>
          ${comPonto ? `<div class="ficha-grupo"><h2 class="rotulo">Ponto da carne</h2><div class="tira" id="ponto">${["Mal passado", "Ao ponto", "Bem passado"].map((s) => `<button type="button" class="marcador" aria-pressed="false">${s}</button>`).join("")}</div></div>` : ""}
          ${(it.opcoes || []).map((g, gi) => `<div class="ficha-grupo opc" data-g="${gi}"><h2 class="rotulo">${esc(g.nome)} <span class="opc-tipo">${g.obrigatorio ? "escolha 1" : "opcional"}</span></h2><div class="tira">${g.itens.map((o, oi) => `<button type="button" class="marcador" aria-pressed="${g.obrigatorio && oi === 0}" data-o="${oi}">${esc(o.nome)}${o.preco ? `<small> + ${reais(o.preco)}</small>` : ""}</button>`).join("")}</div></div>`).join("")}
          <div class="ficha-grupo"><label for="obs" class="rotulo">Observações</label><textarea id="obs" rows="2" maxlength="140" placeholder="Molho à parte, sem pimenta"></textarea></div>` : `<div class="ficha-grupo"><h2 class="rotulo">Ingredientes</h2><p>${esc(it.ingredientes.map((x, i) => (i ? x : x.charAt(0).toUpperCase() + x.slice(1))).join(", "))}.</p></div>`}
          ${harm.length ? `<div class="ficha-grupo"><h2 class="rotulo">Vai bem com</h2><div class="combina">${harm.map((h) => `<a class="link" href="${lp(h.id)}">${esc(h.nome)}, ${reais(h.preco)}</a>`).join("")}</div></div>` : ""}
          <p class="nota">Em caso de alergia grave, confirme com a equipe antes de pedir.</p>
        </div>
      </div>
      ${PEDIDOS ? `<div class="ficha-barra"><div class="qtd"><button type="button" data-q="-1" aria-label="Diminuir quantidade">−</button><output id="q">1</output><button type="button" data-q="1" aria-label="Aumentar quantidade">+</button></div><button type="button" class="btn btn-pri" id="add-modal"><span>Adicionar ao pedido</span><span id="add-preco" class="preco">${reais(it.preco)}</span></button></div>` : ""}`;
    m.hidden = false;
    m.scrollTop = 0;
    document.body.style.overflow = "hidden";
    marcarFotos();

    let q = 1, ponto = "";
    const tirados = new Set();
    const escolhas = (it.opcoes || []).map((g) => new Set(g.obrigatorio ? [0] : []));
    const extraUn = () => escolhas.reduce((t, set, gi) => t + [...set].reduce((u, oi) => u + (it.opcoes[gi].itens[oi].preco || 0), 0), 0);
    const atualizaPreco = () => { if ($("#add-preco")) $("#add-preco").textContent = reais((it.preco + extraUn()) * q); };
    $$(".opc", m).forEach((el) => (el.onclick = (ev) => {
      const b = ev.target.closest("[data-o]"); if (!b) return;
      const gi = +el.dataset.g, g = it.opcoes[gi], oi = +b.dataset.o, set = escolhas[gi];
      if (g.escolha === "varias") { if (set.has(oi)) set.delete(oi); else set.add(oi); }
      else if (set.has(oi) && !g.obrigatorio) set.clear();
      else { set.clear(); set.add(oi); }
      $$("[data-o]", el).forEach((x) => x.setAttribute("aria-pressed", String(set.has(+x.dataset.o))));
      atualizaPreco();
    }));
    $$(".ingrediente", m).forEach((b) => (b.onclick = () => {
      const x = b.dataset.ing;
      if (tirados.has(x)) tirados.delete(x); else tirados.add(x);
      b.setAttribute("aria-pressed", String(tirados.has(x)));
    }));
    $("#ponto")?.addEventListener("click", (ev) => {
      const b = ev.target.closest("button"); if (!b) return;
      ponto = ponto === b.textContent ? "" : b.textContent;
      $$("#ponto button").forEach((x) => x.setAttribute("aria-pressed", String(x.textContent === ponto)));
    });
    $$("[data-q]", m).forEach((b) => (b.onclick = () => { q = Math.min(20, Math.max(1, q + +b.dataset.q)); $("#q").textContent = q; atualizaPreco(); }));
    if (PEDIDOS) $("#add-modal").onclick = () => {
      const opc = escolhas.flatMap((set, gi) => [...set].sort().map((oi) => (it.opcoes[gi].escolha === "varias" ? "+ " : "") + it.opcoes[gi].itens[oi].nome));
      const obs = [...opc, ponto, ...[...tirados].map((x) => "sem " + x), $("#obs").value.trim()].filter(Boolean).join(", ");
      adicionar(it.id, q, obs, false, extraUn());
      fecharPrato();
      abrirGaveta();
    };
    $("button[data-fechar-prato]", m).focus();
  }
  function fecharPrato() {
    $("#modal").hidden = true;
    $("#modal").innerHTML = "";
    document.body.style.overflow = "";
    if (location.hash.startsWith("#prato-")) history.replaceState(null, "", MULTI ? location.pathname + location.search : "#" + (paginaAtual || "inicio"));
  }

  /* ---------- roteamento ---------- */
  let paginaAtual = "";
  const PAGINAS = { inicio: [paginaInicio], cardapio: [paginaCardapio, ligarCardapio], reservas: [paginaReservas, ligarReservas], sobre: [paginaSobre, ligarMapa], pedido: [paginaPedido, ligarPedido] };
  const TITULOS = { cardapio: "Cardápio", reservas: "Reservas", sobre: "A casa e contato", pedido: "Seu pedido" };
  const marcarNav = (pag) => $$("[data-nav]").forEach((a) => a.setAttribute("aria-current", a.dataset.nav === pag ? "page" : "false"));

  // arquivo único: troca o conteúdo conforme o # do endereço
  // promoções por horário (happy hour, prato do dia): o painel liga e desliga; o preço muda no cardápio e no pedido
  const PROMOS = {};
  function faixaPromo() {
    $("#faixa-promo")?.remove();
    const t = Object.values(PROMOS);
    if (t.length && paginaAtual === "cardapio") $("#conteudo").insertAdjacentHTML("afterbegin", `<div id="faixa-promo" class="faixa-promo" role="status">${t.map((x) => `<p>🔥 ${esc(x)}</p>`).join("")}</div>`);
  }
  // demonstração: o painel troca nome, iniciais e cor para mostrar o sistema "com a cara" do cliente
  let marcaAtual = { nome: CONFIG.nome, ini: CONFIG.logo?.iniciais || "" };
  function aplicarMarca(d) {
    if (d.cor) document.documentElement.style.setProperty("--brasa", d.cor);
    const pares = [[marcaAtual.nome, d.nome], [marcaAtual.nome.toUpperCase(), d.nome.toUpperCase()], [marcaAtual.ini, d.ini]].filter(([a, b]) => a && b && a !== b);
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) { let t = n.nodeValue; pares.forEach(([a, b]) => { if (t.includes(a)) t = t.split(a).join(b); }); if (t !== n.nodeValue) n.nodeValue = t; }
    document.title = document.title.split(marcaAtual.nome).join(d.nome);
    CONFIG.nome = d.nome; if (CONFIG.logo) CONFIG.logo.iniciais = d.ini;
    marcaAtual = { nome: d.nome, ini: d.ini };
  }
  function aplicarPromo(d) {
    Object.entries(d.precos || {}).forEach(([id, pr]) => { const it = item(id); if (!it) return; if (it.precoOrig == null) it.precoOrig = it.preco; it.preco = d.ativa ? pr : it.precoOrig; });
    if (d.ativa) PROMOS[d.id] = d.titulo; else delete PROMOS[d.id];
    salvarCarrinho();
    if (!MULTI && paginaAtual === "cardapio") { const y = window.scrollY; paginaAtual = null; irPara("cardapio"); window.scrollTo(0, y); } else faixaPromo();
  }
  function irPara(pag) {
    if (pag === paginaAtual) return;
    paginaAtual = pag;
    const [html, ligar] = PAGINAS[pag];
    $("#conteudo").innerHTML = html();
    if (ligar) ligar();
    faixaPromo();
    window.scrollTo(0, 0);
    marcarFotos();
    marcarNav(pag);
    document.title = pag === "inicio" ? (CONFIG.site?.titulo || CONFIG.nome) : `${TITULOS[pag]} | ${CONFIG.nome}`;
  }
  let rotaAtual = null;
  function rotear() {
    const h = location.hash.slice(1) || rotaAtual || "";
    if (h.startsWith("prato-")) {
      if (!paginaAtual) irPara("cardapio");
      abrirPrato(h.slice(6));
      return;
    }
    if (!$("#modal").hidden) fecharPrato();
    irPara(PAGINAS[h] && (PEDIDOS || !["reservas", "pedido"].includes(h)) ? h : "inicio");
  }
  // pasta: a página já vem escrita no HTML; só liga os botões e atualiza o que depende da hora
  function iniciarPagina() {
    const pag = PAGINAS[PAG] ? PAG : "inicio";
    paginaAtual = pag;
    const [html, ligar] = PAGINAS[pag];
    const raiz = $("#conteudo");
    // a página vem pronta sem mesa; se o QR trouxe a mesa no modo PDV, ela é refeita com os botões de pedido
    if (raiz.dataset.pre === pag && !(PAINEL && MESA0)) $$("[data-dyn]", raiz).forEach((el) => { el.outerHTML = DYN[el.dataset.dyn](); });
    else raiz.innerHTML = html();
    if (PEDIDOS && pag === "cardapio" && mesa && !$(".aviso-mesa")) $(".cardapio")?.insertAdjacentHTML("afterbegin", `<p class="aviso-mesa"><span class="largura">Você está na <b>mesa ${esc(mesa)}</b>. Monte o pedido e envie: a equipe leva até você.</span>${PAINEL ? `<span class="mesa-acoes"><button type="button" class="btn btn-sec" data-chamar="garcom">Chamar garçom</button><button type="button" class="btn btn-sec" data-chamar="conta">Pedir a conta</button></span>` : ""}</p>`);
    if (ligar) ligar();
    marcarFotos();
    marcarNav(pag);
    const prato = () => {
      const h = location.hash.slice(1);
      if (h.startsWith("prato-") && pag === "cardapio") abrirPrato(h.slice(6));
      else if (!$("#modal").hidden) fecharPrato();
    };
    window.addEventListener("hashchange", prato);
    prato();
  }

  /* ---------- início ---------- */
  window.iniciarSite = function () {
    $$("[data-status]").forEach((el) => (el.innerHTML = statusCurto()));
    salvarCarrinho();
    $$("[data-abrir-pedido]").forEach((b) => (b.onclick = abrirGaveta));
    $("#fundo-gaveta").onclick = fecharGaveta;
    window.addEventListener("message", (ev) => {
      if (ev.data?.tipo === "promo") return aplicarPromo(ev.data);
      if (ev.data?.tipo === "marca") return aplicarMarca(ev.data);
      if (ev.data?.tipo === "extrato" && String(ev.data.mesa) === String(mesa)) return mostrarConta(ev.data);
      if (ev.data?.tipo === "fechada" && String(ev.data.mesa ?? mesa) === String(mesa)) {
        const alvo = $(".pagina-conta") || $("#status-pedido")?.closest(".pagina");
        const link = CONFIG.avaliacao?.link || "https://www.google.com/search?q=" + encodeURIComponent(CONFIG.nome + " avaliações");
        if (alvo) alvo.innerHTML = `<h1>Obrigado pela visita!</h1><p class="texto">Pagamento confirmado e conta fechada. Gostou? Sua avaliação ajuda muito a casa.</p>${ev.data.cashback ? `<p class="cashback">🎁 Você ganhou <b>${reais(ev.data.cashback)}</b> de cashback para usar na próxima visita.</p>` : ""}<p style="margin-top:var(--e6)"><a class="btn btn-pri" href="${link}" target="_blank" rel="noopener">Avaliar no Google</a></p>`;
        return;
      }
      if (ev.data?.tipo !== "esgotado") return;
      ev.data.ativo ? ESGOTADOS.add(ev.data.id) : ESGOTADOS.delete(ev.data.id);
      $$(`[data-add="${ev.data.id}"]`).forEach((b) => { b.disabled = ev.data.ativo; b.classList.toggle("esgotado", ev.data.ativo); b.textContent = ev.data.ativo ? "Esgotado hoje" : "Adicionar"; });
    });
    document.addEventListener("click", (ev) => {
      const add = ev.target.closest("[data-add]");
      if (add) {
        adicionar(add.dataset.add);
        add.classList.add("ok");
        add.textContent = "Adicionado";
        setTimeout(() => { add.classList.remove("ok"); add.textContent = "Adicionar"; }, 1300);
      }
      const sg = ev.target.closest("[data-sug]");
      if (sg) { adicionar(sg.dataset.sug, 1, "", true); $("#sugestao")?.remove(); }
      if (ev.target.closest("[data-sug-fechar]")) $("#sugestao")?.remove();
      const cm = ev.target.closest("[data-chamar]");
      if (cm && cm.dataset.chamar === "conta" && PAINEL) {
        // o cliente vê a conta (vinda do painel) e fecha pelo celular; paga na maquininha do restaurante
        window.parent.postMessage({ tipo: "ver-conta", mesa }, "*");
      } else if (cm) {
        window.parent.postMessage({ tipo: cm.dataset.chamar, mesa }, "*");
        cm.textContent = cm.dataset.chamar === "conta" ? "Conta pedida" : "Garçom chamado";
        cm.disabled = true;
        setTimeout(() => { cm.disabled = false; cm.textContent = cm.dataset.chamar === "conta" ? "Pedir a conta" : "Chamar garçom"; }, 8000);
      }
      const fc = ev.target.closest("[data-fechar-conta]");
      if (fc) {
        const pg = $(".pagina-conta input[name=pagamento]:checked")?.value || "Crédito", dv = $("#pessoas").value, tot = contaTotal(), k = $("#servico").checked ? 1.1 : 1;
        const cada = dv === "pessoa" ? partes().map((x) => ({ nome: x.nome, total: x.total * k })) : null, pes = cada ? cada.length : +dv;
        window.parent.postMessage({ tipo: "conta", mesa, pagamento: pg, pessoas: pes, partes: cada, servico: $("#servico").checked, total: tot }, "*");
        fc.outerHTML = `<p class="lead" id="status-pedido">Pronto! O garçom já está levando a maquininha (${esc(pg)}${cada ? ", cada um paga o seu" : pes > 1 ? `, dividido em ${pes}` : ""}).</p>`;
      }
      if (ev.target.closest("#gaveta [data-fechar]")) fecharGaveta();
      if (ev.target.closest("[data-fechar-prato]")) { ev.preventDefault(); fecharPrato(); }
      const g = ev.target.closest("#gaveta [data-menos], #gaveta [data-mais], #gaveta [data-remover]");
      if (g) {
        const ch = g.dataset.menos || g.dataset.mais || g.dataset.remover;
        const c = carrinho.find((x) => x.chave === ch);
        if (c) alterar(ch, g.dataset.remover ? 0 : c.qtd + (g.dataset.mais ? 1 : -1));
      }
    });
    document.addEventListener("keydown", (ev) => {
      if (ev.key !== "Escape") return;
      if (!$("#modal").hidden) fecharPrato();
      else if (!$("#gaveta").hidden) fecharGaveta();
    });
    const ano = $("#ano"); if (ano) ano.textContent = new Date().getFullYear();
    $$("[data-whats]").forEach((a) => (a.href = linkWhats(`Olá, ${CONFIG.nome}! Vim pelo site.`)));
    $$("[data-tel]").forEach((a) => (a.href = tel));
    $$("[data-insta]").forEach((a) => { if (insta) a.href = insta; else a.remove(); });
    if (MULTI) return iniciarPagina();
    window.addEventListener("hashchange", rotear);
    // troca de página sem recarregar (funciona também com o site embutido, como na demonstração do PDV)
    document.addEventListener("click", (ev) => {
      const a = ev.target.closest('a[href^="#"]');
      const h = a && a.getAttribute("href").slice(1);
      if (!h || ev.defaultPrevented || !(PAGINAS[h] || h.startsWith("prato-"))) return;
      ev.preventDefault();
      try { history.pushState(null, "", "#" + h); } catch (e) { /* endereço fixo: segue só na tela */ }
      rotaAtual = h;
      rotear();
    });
    window.addEventListener("popstate", () => { rotaAtual = location.hash.slice(1); rotear(); });
    rotear();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", window.iniciarSite);
  else window.iniciarSite();
})();
