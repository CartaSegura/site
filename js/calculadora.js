(function () {
  "use strict";

  function formatMoney(value) {
    if (value == null || isNaN(value)) return "—";
    return "R$ " + value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function parseNum(id) {
    var el = document.getElementById(id);
    if (!el || el.value === "" || el.value === null) return null;
    var n = parseFloat(el.value.replace(/\s/g, "").replace(",", "."));
    return isNaN(n) ? null : n;
  }

  function runSimulation() {
    var valorCredito = parseNum("valor-credito");
    var valorParcela = parseNum("valor-parcela");
    var prazoRestante = parseNum("prazo-restante");
    var valorPago = parseNum("valor-pago");
    var desagioPctInput = parseNum("desagio-vendedor");
    var capitalDisponivelComprador = parseNum("comprador-capital-disponivel");

    if (valorCredito === null || valorParcela === null || prazoRestante === null) {
      document.getElementById("calc-result").setAttribute("hidden", "");
      return;
    }

    var saldoDevedor = valorParcela * prazoRestante;
    var saldoBom = valorCredito - saldoDevedor;
    if (saldoBom < 0) saldoBom = 0;

    var desagioPct = desagioPctInput !== null && desagioPctInput > 0 ? desagioPctInput : 0;
    var fatorDesagio = 1 - desagioPct / 100;
    var valorVendaSugerido = saldoBom * fatorDesagio;
    var lucroVendedor = valorPago !== null ? valorVendaSugerido - valorPago : null;
    var economia = valorCredito - valorVendaSugerido;

    /* Visão do vendedor */
    document.getElementById("result-vendedor-credito").textContent = formatMoney(valorCredito);
    document.getElementById("result-vendedor-saldo-devedor").textContent = formatMoney(saldoDevedor);
    document.getElementById("result-vendedor-saldo-bom").textContent = formatMoney(saldoBom);
    document.getElementById("result-vendedor-investido").textContent = formatMoney(valorPago);
    document.getElementById("result-vendedor-desagio").textContent =
      desagioPct !== 0 ? desagioPct.toFixed(1).replace(".", ",") + " %" : "0 % (sem deságio)";
    document.getElementById("result-vendedor-valor-venda").textContent = formatMoney(valorVendaSugerido);
    document.getElementById("result-lucro-vendedor").textContent = lucroVendedor !== null ? formatMoney(lucroVendedor) : "—";

    var takeawayVendedor = document.getElementById("takeaway-vendedor");
    if (saldoBom <= 0) {
      takeawayVendedor.textContent =
        "Pelos valores informados, o saldo devedor é igual ou maior que o crédito, então não há saldo bom para aplicar deságio. Revise os dados ou fale com nossa equipe.";
    } else if (desagioPct === 0) {
      takeawayVendedor.textContent =
        "Com saldo bom de " + formatMoney(saldoBom) + " e deságio de 0%, o valor sugerido de venda da carta é " +
        formatMoney(valorVendaSugerido) + ". Você pode ajustar o deságio para ver diferentes cenários de preço.";
    } else if (lucroVendedor !== null && lucroVendedor > 0) {
      takeawayVendedor.textContent =
        "Com saldo bom de " + formatMoney(saldoBom) + " e deságio de " + desagioPct.toFixed(1).replace(".", ",") +
        "%, o valor sugerido de venda é " + formatMoney(valorVendaSugerido) +
        " e seu lucro estimado em relação ao que já pagou é de " + formatMoney(lucroVendedor) + ".";
    } else {
      takeawayVendedor.textContent =
        "Com base no crédito, saldo devedor e deságio informado, sugerimos um valor de venda de " +
        formatMoney(valorVendaSugerido) + ". Fale com a Carta Segura para validar condições reais.";
    }

    /* Visão do comprador */
    document.getElementById("result-comprador-paga").textContent = formatMoney(valorVendaSugerido);
    document.getElementById("result-comprador-credito").textContent = formatMoney(valorCredito);
    document.getElementById("result-comprador-capital-disponivel").textContent = formatMoney(capitalDisponivelComprador);

    var rowEconomia = document.getElementById("row-economia");
    var resultEconomia = document.getElementById("result-economia");
    var takeawayComprador = document.getElementById("takeaway-comprador");
    if (economia > 0) {
      rowEconomia.classList.remove("calc-result__row--hidden");
      resultEconomia.textContent = formatMoney(economia);
      if (capitalDisponivelComprador !== null && capitalDisponivelComprador >= valorVendaSugerido) {
        takeawayComprador.textContent =
          "Você investe aproximadamente " + formatMoney(valorVendaSugerido) + " para obter um crédito de " +
          formatMoney(valorCredito) + ", economizando cerca de " + formatMoney(economia) +
          " em relação ao valor de face. Seu capital disponível é suficiente para esta carta.";
      } else if (capitalDisponivelComprador !== null) {
        takeawayComprador.textContent =
          "Você investe aproximadamente " + formatMoney(valorVendaSugerido) + " para obter um crédito de " +
          formatMoney(valorCredito) + ", economizando cerca de " + formatMoney(economia) +
          ". Hoje seu capital disponível (" + formatMoney(capitalDisponivelComprador) +
          ") ainda não cobre todo o valor sugerido de investimento, mas podemos avaliar opções.";
      } else {
        takeawayComprador.textContent =
          "Você paga cerca de " + formatMoney(valorVendaSugerido) + " e obtém um crédito de " + formatMoney(valorCredito) +
          " — uma economia de " + formatMoney(economia) +
          " em relação ao valor de face, com custo menor que empréstimo ou financiamento no mercado.";
      }
    } else {
      rowEconomia.classList.add("calc-result__row--hidden");
      resultEconomia.textContent = "—";
      takeawayComprador.textContent =
        "Você adquire um crédito de " + formatMoney(valorCredito) + " pagando aproximadamente " + formatMoney(valorVendaSugerido) +
        ". Consulte condições com a Carta Segura para uma proposta personalizada.";
    }

    document.getElementById("calc-result").removeAttribute("hidden");
  }

  var form = document.getElementById("calc-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var interesse = getInteresseValue();

      // Para perfil comprador, não rodamos simulação — apenas mantemos os dados
      // para o botão de contato (WhatsApp) nas seções da página.
      if (interesse === "comprar") {
        return;
      }

      // Garante que os campos essenciais (contato, interesse e dados da carta)
      // estejam preenchidos e válidos antes de rodar a simulação do vendedor.
      if (!form.reportValidity()) {
        return;
      }

      runSimulation();
    });
    form.addEventListener("reset", function () {
      setTimeout(function () {
        document.getElementById("calc-result").setAttribute("hidden", "");
      }, 0);
    });
  }

  var inputs = [
    "valor-credito",
    "valor-parcela",
    "prazo-restante",
    "valor-pago",
    "desagio-vendedor",
    "comprador-capital-disponivel"
  ];
  inputs.forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener("input", runSimulation);
  });

  function getValue(id) {
    var el = document.getElementById(id);
    return el && el.value ? el.value.trim() : "";
  }

  function getInteresseLabel() {
    var value = getInteresseValue();
    if (value === "comprar") return "Comprar carta contemplada";
    if (value === "vender") return "Vender carta contemplada";
    return "";
  }

  function getInteresseValue() {
    var el = document.getElementById("contato-interesse");
    return el ? el.value : "";
  }

  function updateInterestView() {
    var interesse = getInteresseValue();
    var perfilCompraSection = document.getElementById("perfil-compra-section");
    var viewVendedor = document.getElementById("view-vendedor");
    var viewComprador = document.getElementById("view-comprador");
    var dadosCartaSection = document.getElementById("dados-carta-section");
    var btnCalcular = document.getElementById("btn-calcular");
    var btnWhatsForm = document.getElementById("btn-whatsapp-form");

    if (!perfilCompraSection || !viewVendedor || !viewComprador) {
      return;
    }

    if (interesse === "vender") {
      if (dadosCartaSection) dadosCartaSection.removeAttribute("hidden");
      perfilCompraSection.setAttribute("hidden", "");
      viewVendedor.removeAttribute("hidden");
      viewComprador.setAttribute("hidden", "");
      if (btnCalcular) {
        btnCalcular.removeAttribute("hidden");
        btnCalcular.style.display = "";
      }
      if (btnWhatsForm) {
        btnWhatsForm.setAttribute("hidden", "");
        btnWhatsForm.style.display = "none";
      }
    } else if (interesse === "comprar") {
      if (dadosCartaSection) dadosCartaSection.setAttribute("hidden", "");
      perfilCompraSection.removeAttribute("hidden");
      viewComprador.removeAttribute("hidden");
      viewVendedor.setAttribute("hidden", "");
      if (btnCalcular) {
        btnCalcular.setAttribute("hidden", "");
        btnCalcular.style.display = "none";
      }
      if (btnWhatsForm) {
        btnWhatsForm.removeAttribute("hidden");
        btnWhatsForm.style.display = "";
      }
    } else {
      if (dadosCartaSection) dadosCartaSection.setAttribute("hidden", "");
      perfilCompraSection.removeAttribute("hidden");
      viewVendedor.removeAttribute("hidden");
      viewComprador.removeAttribute("hidden");
      if (btnCalcular) {
        btnCalcular.removeAttribute("hidden");
        btnCalcular.style.display = "";
      }
      if (btnWhatsForm) {
        btnWhatsForm.removeAttribute("hidden");
        btnWhatsForm.style.display = "";
      }
    }
  }

  function buildWhatsAppMessage() {
    var nome = getValue("contato-nome");
    var email = getValue("contato-email");
    var telefone = getValue("contato-telefone");
    var interesse = getInteresseLabel();
    var valorCredito = parseNum("valor-credito");
    var valorParcela = parseNum("valor-parcela");
    var prazoRestante = parseNum("prazo-restante");
    var valorPago = parseNum("valor-pago");
    var desagioPctInput = parseNum("desagio-vendedor");
    var saldoDevedor = valorParcela !== null && prazoRestante !== null ? valorParcela * prazoRestante : null;
    var saldoBom = valorCredito !== null && saldoDevedor !== null ? Math.max(valorCredito - saldoDevedor, 0) : null;
    var desagioPct = desagioPctInput !== null && desagioPctInput > 0 ? desagioPctInput : 0;
    var fatorDesagio = saldoBom !== null ? 1 - desagioPct / 100 : null;
    var valorVendaSugerido = saldoBom !== null && fatorDesagio !== null ? saldoBom * fatorDesagio : null;

    var tipoBemVendedor = getValue("tipo-bem-vendedor");
    var administradora = getValue("administradora-consorcio");
    var dataContemplacao = getValue("data-contemplacao");
    var taxaAdm = parseNum("taxa-adm");

    var compradorValorCredito = parseNum("comprador-valor-credito");
    var compradorCapitalDisponivel = parseNum("comprador-capital-disponivel");
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

    if (valorCredito !== null || saldoDevedor !== null || valorPago !== null || saldoBom !== null || valorVendaSugerido !== null) {
      lines.push("*Dados da carta:*");
      if (valorCredito !== null) lines.push("• Crédito nominal da carta: " + formatMoney(valorCredito));
      if (saldoDevedor !== null) lines.push("• Saldo devedor restante (estimado): " + formatMoney(saldoDevedor));
      if (saldoBom !== null) lines.push("• Saldo bom (crédito − saldo devedor): " + formatMoney(saldoBom));
      if (desagioPct !== 0) {
        lines.push("• Deságio aplicado sobre o saldo bom: " + desagioPct.toFixed(1).replace(".", ",") + " %");
      } else {
        lines.push("• Deságio aplicado sobre o saldo bom: 0 % (sem deságio)");
      }
      if (valorVendaSugerido !== null) {
        lines.push("• Valor sugerido de venda da carta: " + formatMoney(valorVendaSugerido));
      }
      if (valorPago !== null) lines.push("• Valor já pago pelo vendedor: " + formatMoney(valorPago));
      if (tipoBemVendedor) lines.push("• Tipo de bem: " + tipoBemVendedor);
      if (administradora) lines.push("• Administradora do consórcio: " + administradora);
      if (dataContemplacao) lines.push("• Data da contemplação: " + dataContemplacao);
      if (taxaAdm !== null) lines.push("• Taxa de administração original: " + taxaAdm.toFixed(1).replace(".", ",") + " %");
      lines.push("");
    }

    if (
      compradorValorCredito !== null ||
      compradorCapitalDisponivel !== null ||
      compradorFinalidade ||
      compradorTipoBem
    ) {
      lines.push("*Perfil de compra:*");
      if (compradorValorCredito !== null) {
        lines.push("• Valor de crédito desejado: " + formatMoney(compradorValorCredito));
      }
      if (compradorCapitalDisponivel !== null) {
        lines.push("• Capital disponível para entrada: " + formatMoney(compradorCapitalDisponivel));
      }
      if (compradorFinalidade) {
        lines.push("• Finalidade da compra: " + compradorFinalidade);
      }
      if (compradorTipoBem) {
        lines.push("• Tipo de bem de interesse: " + compradorTipoBem);
      }
    }

    return lines.join("\n");
  }

  function getWhatsAppUrl() {
    var base = "https://wa.me/5527992289588";
    var text = buildWhatsAppMessage();
    if (!text || text === "Olá! Preenchi a simulação no site Carta Segura.\n\n") {
      return base;
    }
    return base + "?text=" + encodeURIComponent(text);
  }

  document.querySelectorAll(".js-whatsapp-enrich").forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      window.open(getWhatsAppUrl(), "_blank", "noopener,noreferrer");
    });
  });

  document.querySelectorAll(".calc-toggle__option").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var value = btn.getAttribute("data-value");
      var hidden = document.getElementById("contato-interesse");
      if (!hidden) return;

      hidden.value = value;

      document
        .querySelectorAll(".calc-toggle__option")
        .forEach(function (b) {
          b.classList.toggle("is-active", b === btn);
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });

      updateInterestView();
      runSimulation();
    });
  });

  // estado inicial da tela respeita interesse padrão (vendedor)
  updateInterestView();
})();
