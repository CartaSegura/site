(function () {
  "use strict";

  // --- Constantes ---
  var WHATSAPP_BASE = "https://wa.me/5527992289588";
  var DESAGIO_PCT = 0;

  var INPUT_IDS = [
    "valor-credito",
    "valor-parcela",
    "prazo-restante",
    "valor-pago",
    "comprador-capital-disponivel"
  ];

  // --- Utilitários ---
  function formatMoney(value) {
    if (value == null || isNaN(value)) return "—";
    return "R$ " + value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatPct(value) {
    if (value == null || isNaN(value)) return "0 %";
    return value.toFixed(1).replace(".", ",") + " %";
  }

  function parseNum(id) {
    var el = document.getElementById(id);
    if (!el || el.value === "" || el.value === null) return null;
    var n = parseFloat(String(el.value).replace(/\s/g, "").replace(",", "."));
    return isNaN(n) ? null : n;
  }

  function getValue(id) {
    var el = document.getElementById(id);
    return el && el.value ? String(el.value).trim() : "";
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function trackEvent(name, params) {
    if (typeof window.gtag === "function") {
      window.gtag("event", name, params || {});
    }
  }

  // --- Estado do formulário ---
  function getInteresseValue() {
    var el = document.getElementById("contato-interesse");
    return el ? el.value : "";
  }

  function getInteresseLabel() {
    var v = getInteresseValue();
    if (v === "comprar") return "Comprar carta contemplada";
    if (v === "vender") return "Vender carta contemplada";
    return "";
  }

  function getFormState() {
    var valorCredito = parseNum("valor-credito");
    var valorParcela = parseNum("valor-parcela");
    var prazoRestante = parseNum("prazo-restante");
    var valorPago = parseNum("valor-pago");
    var capitalComprador = parseNum("comprador-capital-disponivel");

    var saldoDevedor = valorParcela != null && prazoRestante != null
      ? valorParcela * prazoRestante
      : null;
    var saldoBom = valorCredito != null && saldoDevedor != null
      ? Math.max(valorCredito - saldoDevedor, 0)
      : null;
    var fatorDesagio = 1 - DESAGIO_PCT / 100;
    var valorVenda = saldoBom != null ? saldoBom * fatorDesagio : null;
    var lucroVendedor = valorPago != null && valorVenda != null ? valorVenda - valorPago : null;
    var economia = valorCredito != null && valorVenda != null ? valorCredito - valorVenda : null;

    return {
      valorCredito: valorCredito,
      valorParcela: valorParcela,
      prazoRestante: prazoRestante,
      valorPago: valorPago,
      capitalComprador: capitalComprador,
      saldoDevedor: saldoDevedor,
      saldoBom: saldoBom,
      valorVenda: valorVenda,
      lucroVendedor: lucroVendedor,
      economia: economia
    };
  }

  // --- Cálculo e validação ---
  function hasRequiredSellerInputs(state) {
    return state.valorCredito != null && state.valorParcela != null && state.prazoRestante != null;
  }

  // --- Renderização do resultado ---
  function renderVendedor(state) {
    var s = state;
    setText("result-vendedor-credito", formatMoney(s.valorCredito));
    setText("result-vendedor-saldo-devedor", formatMoney(s.saldoDevedor));
    setText("result-vendedor-saldo-bom", formatMoney(s.saldoBom));
    setText("result-vendedor-investido", formatMoney(s.valorPago));
    setText("result-vendedor-desagio", DESAGIO_PCT !== 0 ? formatPct(DESAGIO_PCT) + "" : "0 % (sem deságio)");
    setText("result-vendedor-valor-venda", formatMoney(s.valorVenda));
    setText("result-lucro-vendedor", s.lucroVendedor != null ? formatMoney(s.lucroVendedor) : "—");

    var takeaway = "";
    if (s.saldoBom <= 0) {
      takeaway = "Pelos valores informados, o saldo devedor é igual ou maior que o crédito, então não há saldo bom para aplicar deságio. Revise os dados ou fale com nossa equipe.";
    } else if (DESAGIO_PCT === 0) {
      takeaway = "Com saldo bom de " + formatMoney(s.saldoBom) + " e deságio de 0%, o valor sugerido de venda da carta é " + formatMoney(s.valorVenda) + ".";
    } else if (s.lucroVendedor != null && s.lucroVendedor > 0) {
      takeaway = "Com saldo bom de " + formatMoney(s.saldoBom) + " e deságio de " + formatPct(DESAGIO_PCT) + ", o valor sugerido de venda é " + formatMoney(s.valorVenda) + " e seu lucro estimado em relação ao que já pagou é de " + formatMoney(s.lucroVendedor) + ".";
    } else {
      takeaway = "Com base no crédito e saldo devedor informado, sugerimos um valor de venda de " + formatMoney(s.valorVenda) + ". Fale com a Carta Segura para validar condições reais.";
    }
    setText("takeaway-vendedor", takeaway);
  }

  function renderComprador(state) {
    var s = state;
    setText("result-comprador-paga", formatMoney(s.valorVenda));
    setText("result-comprador-credito", formatMoney(s.valorCredito));
    setText("result-comprador-capital-disponivel", formatMoney(s.capitalComprador));

    var rowEconomia = document.getElementById("row-economia");
    var resultEconomia = document.getElementById("result-economia");
    if (rowEconomia) {
      if (s.economia > 0) {
        rowEconomia.classList.remove("calc-result__row--hidden");
        setText("result-economia", formatMoney(s.economia));
      } else {
        rowEconomia.classList.add("calc-result__row--hidden");
        setText("result-economia", "—");
      }
    }

    var takeaway = "";
    if (s.economia > 0) {
      if (s.capitalComprador != null && s.capitalComprador >= s.valorVenda) {
        takeaway = "Você investe aproximadamente " + formatMoney(s.valorVenda) + " para obter um crédito de " + formatMoney(s.valorCredito) + ", economizando cerca de " + formatMoney(s.economia) + " em relação ao valor de face. Seu capital disponível é suficiente para esta carta.";
      } else if (s.capitalComprador != null) {
        takeaway = "Você investe aproximadamente " + formatMoney(s.valorVenda) + " para obter um crédito de " + formatMoney(s.valorCredito) + ", economizando cerca de " + formatMoney(s.economia) + ". Hoje seu capital disponível (" + formatMoney(s.capitalComprador) + ") ainda não cobre todo o valor sugerido de investimento, mas podemos avaliar opções.";
      } else {
        takeaway = "Você paga cerca de " + formatMoney(s.valorVenda) + " e obtém um crédito de " + formatMoney(s.valorCredito) + " — uma economia de " + formatMoney(s.economia) + " em relação ao valor de face.";
      }
    } else {
      takeaway = "Você adquire um crédito de " + formatMoney(s.valorCredito) + " pagando aproximadamente " + formatMoney(s.valorVenda) + ". Consulte condições com a Carta Segura para uma proposta personalizada.";
    }
    setText("takeaway-comprador", takeaway);
  }

  function runSimulation() {
    var state = getFormState();

    if (!hasRequiredSellerInputs(state)) {
      var resultEl = document.getElementById("calc-result");
      if (resultEl) resultEl.setAttribute("hidden", "");
      return;
    }

    renderVendedor(state);
    renderComprador(state);

    var resultEl = document.getElementById("calc-result");
    if (resultEl) resultEl.removeAttribute("hidden");

    trackEvent("calc_simulation", {
      role: "seller",
      currency: "BRL",
      credito_nominal: state.valorCredito,
      saldo_devedor: state.saldoDevedor,
      saldo_bom: state.saldoBom,
      desagio_percent: DESAGIO_PCT,
      valor_venda_sugerido: state.valorVenda,
      lucro_vendedor: state.lucroVendedor,
      economia_comprador: state.economia
    });
  }

  // --- WhatsApp ---
  function buildWhatsAppMessage() {
    var state = getFormState();
    var nome = getValue("contato-nome");
    var email = getValue("contato-email");
    var telefone = getValue("contato-telefone");
    var interesse = getInteresseLabel();
    var tipoBem = getValue("tipo-bem-vendedor");
    var administradora = getValue("administradora-consorcio");
    var compradorCredito = parseNum("comprador-valor-credito");
    var compradorCapital = parseNum("comprador-capital-disponivel");
    var compradorFinalidade = getValue("comprador-finalidade");
    var compradorTipoBem = getValue("comprador-tipo-bem");

    var lines = ["Olá! Preenchi a simulação no site Carta Segura.", ""];

    if (nome || email || telefone || interesse) {
      lines.push("*Dados para contato:*");
      if (nome) lines.push("• Nome: " + nome);
      if (email) lines.push("• E-mail: " + email);
      if (telefone) lines.push("• Telefone: " + telefone);
      if (interesse) lines.push("• Interesse: " + interesse);
      lines.push("");
    }

    var temDadosCarta = state.valorCredito != null || state.saldoDevedor != null || state.valorPago != null ||
      state.saldoBom != null || state.valorVenda != null;
    if (temDadosCarta) {
      lines.push("*Dados da carta:*");
      if (state.valorCredito != null) lines.push("• Crédito nominal da carta: " + formatMoney(state.valorCredito));
      if (state.saldoDevedor != null) lines.push("• Saldo devedor restante (estimado): " + formatMoney(state.saldoDevedor));
      if (state.saldoBom != null) lines.push("• Saldo bom (crédito − saldo devedor): " + formatMoney(state.saldoBom));
      lines.push("• Deságio aplicado sobre o saldo bom: 0 % (sem deságio)");
      if (state.valorVenda != null) lines.push("• Valor sugerido de venda da carta: " + formatMoney(state.valorVenda));
      if (state.valorPago != null) lines.push("• Valor já pago pelo vendedor: " + formatMoney(state.valorPago));
      if (tipoBem) lines.push("• Tipo de bem: " + tipoBem);
      if (administradora) lines.push("• Administradora do consórcio: " + administradora);
      lines.push("");
    }

    if (compradorCredito != null || compradorCapital != null || compradorFinalidade || compradorTipoBem) {
      lines.push("*Perfil de compra:*");
      if (compradorCredito != null) lines.push("• Valor de crédito desejado: " + formatMoney(compradorCredito));
      if (compradorCapital != null) lines.push("• Capital disponível para entrada: " + formatMoney(compradorCapital));
      if (compradorFinalidade) lines.push("• Finalidade da compra: " + compradorFinalidade);
      if (compradorTipoBem) lines.push("• Tipo de bem de interesse: " + compradorTipoBem);
    }

    return lines.join("\n");
  }

  function getWhatsAppUrl() {
    var text = buildWhatsAppMessage();
    if (!text || text === "Olá! Preenchi a simulação no site Carta Segura.\n\n") {
      return WHATSAPP_BASE;
    }
    return WHATSAPP_BASE + "?text=" + encodeURIComponent(text);
  }

  // --- UI: interesse (vendedor/comprador) ---
  function updateInterestView() {
    var interesse = getInteresseValue();
    var sections = {
      perfilCompra: document.getElementById("perfil-compra-section"),
      viewVendedor: document.getElementById("view-vendedor"),
      viewComprador: document.getElementById("view-comprador"),
      dadosCarta: document.getElementById("dados-carta-section"),
      btnCalcular: document.getElementById("btn-calcular"),
      btnWhatsForm: document.getElementById("btn-whatsapp-form")
    };

    if (!sections.perfilCompra || !sections.viewVendedor || !sections.viewComprador) return;

    function show(el, show) {
      if (!el) return;
      if (show) {
        el.removeAttribute("hidden");
        el.style.display = "";
      } else {
        el.setAttribute("hidden", "");
        el.style.display = "none";
      }
    }

    if (interesse === "vender") {
      show(sections.dadosCarta, true);
      show(sections.perfilCompra, false);
      show(sections.viewVendedor, true);
      show(sections.viewComprador, false);
      show(sections.btnCalcular, true);
      show(sections.btnWhatsForm, false);
    } else if (interesse === "comprar") {
      show(sections.dadosCarta, false);
      show(sections.perfilCompra, true);
      show(sections.viewVendedor, false);
      show(sections.viewComprador, true);
      show(sections.btnCalcular, false);
      show(sections.btnWhatsForm, true);
    } else {
      show(sections.dadosCarta, false);
      show(sections.perfilCompra, true);
      show(sections.viewVendedor, true);
      show(sections.viewComprador, true);
      show(sections.btnCalcular, true);
      show(sections.btnWhatsForm, true);
    }
  }

  // --- Inicialização ---
  function bindForm() {
    var form = document.getElementById("calc-form");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (getInteresseValue() === "comprar") return;
      if (!form.reportValidity()) return;
      runSimulation();
    });

    form.addEventListener("reset", function () {
      setTimeout(function () {
        var el = document.getElementById("calc-result");
        if (el) el.setAttribute("hidden", "");
      }, 0);
    });
  }

  function bindInputs() {
    INPUT_IDS.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener("input", runSimulation);
    });
  }

  function bindToggle() {
    document.querySelectorAll(".calc-toggle__option").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var value = btn.getAttribute("data-value");
        var hidden = document.getElementById("contato-interesse");
        if (!hidden) return;
        hidden.value = value;
        document.querySelectorAll(".calc-toggle__option").forEach(function (b) {
          b.classList.toggle("is-active", b === btn);
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });
        updateInterestView();
        runSimulation();
      });
    });
  }

  function bindWhatsAppLinks() {
    document.querySelectorAll(".js-whatsapp-enrich").forEach(function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        trackEvent("calc_whatsapp_click", {
          interesse: getInteresseValue() || "indefinido",
          has_seller_data: parseNum("valor-credito") !== null,
          has_buyer_data: parseNum("comprador-valor-credito") !== null || parseNum("comprador-capital-disponivel") !== null
        });
        window.open(getWhatsAppUrl(), "_blank", "noopener,noreferrer");
      });
    });
  }

  bindForm();
  bindInputs();
  bindToggle();
  bindWhatsAppLinks();
  updateInterestView();
})();
