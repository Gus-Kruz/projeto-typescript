// Type guards para validar os dados recebidos da API
function isString(valor) {
    return typeof valor === "string";
}
function isNumber(valor) {
    return typeof valor === "number" && !Number.isNaN(valor);
}
function isRecord(valor) {
    return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}
function isStatusTransacao(valor) {
    return (isString(valor) &&
        (valor === "Paga" ||
            valor === "Recusada pela operadora de cartão" ||
            valor === "Aguardando pagamento" ||
            valor === "Estornada"));
}
function isFormaPagamento(valor) {
    return valor === "Cartão de Crédito" || valor === "Boleto";
}
function isTransacao(valor) {
    if (!isRecord(valor)) {
        return false;
    }
    return (isStatusTransacao(valor["Status"]) &&
        isNumber(valor["ID"]) &&
        isString(valor["Data"]) &&
        isString(valor["Nome"]) &&
        isFormaPagamento(valor["Forma de Pagamento"]) &&
        isString(valor["Email"]) &&
        isString(valor["Valor (R$)"]) &&
        isNumber(valor["Cliente Novo"]));
}
function isTransacaoArray(valor) {
    return Array.isArray(valor) && valor.every(isTransacao);
}
// Função para tratar os valores
function converterValorParaNumero(valorBruto) {
    const valorLimpo = valorBruto
        .replace(/R\$\s?/g, "")
        .replace(/\./g, "")
        .replace(",", ".")
        .trim();
    if (valorLimpo === "" || valorLimpo === "-") {
        return null;
    }
    const numero = Number(valorLimpo);
    if (Number.isNaN(numero)) {
        return null;
    }
    return numero;
}
// Função para formatar o valor em reais
function formatarDinheiro(valor) {
    return valor.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}
// fetch simples para obter os dados da API, com tratamento de erros e validação do formato dos dados
async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (!isTransacaoArray(data)) {
            throw new Error("Formato de dados inválido recebido da API.");
        }
        return data;
    }
    catch (error) {
        console.error("Error fetching data:", error);
        throw error;
    }
}
// Função para calcular o total das transações pagas e estornadas, tratando os valores corretamente
function calcularTotal(transacoes) {
    return transacoes
        .filter((transacao) => transacao.Status === "Paga" || transacao.Status === "Estornada")
        .reduce((total, transacao) => {
        const valor = converterValorParaNumero(transacao["Valor (R$)"]);
        if (valor === null) {
            return total;
        }
        return total + valor;
    }, 0);
}
// Funções para o número de transações
function calcularNumeroTransacoes(transacoes) {
    return transacoes.length;
}
function calcularNumeroCartao(transacoes) {
    return transacoes.filter((transacao) => transacao["Forma de Pagamento"] === "Cartão de Crédito").length;
}
function calcularNumeroBoleto(transacoes) {
    return transacoes.filter((transacao) => transacao["Forma de Pagamento"] === "Boleto").length;
}
function metodoMaisUtilizado(transacoes) {
    const numeroCartao = calcularNumeroCartao(transacoes);
    const numeroBoleto = calcularNumeroBoleto(transacoes);
    if (numeroCartao > numeroBoleto) {
        return "Cartão de Crédito";
    }
    if (numeroBoleto > numeroCartao) {
        return "Boleto";
    }
    return "Empate";
}
function displayResults(transacoes) {
    const totalTransacoesElement = document.getElementById("total_transacoes");
    const totalElement = document.getElementById("total");
    const totalCartaoElement = document.getElementById("total_cartao");
    const totalBoletoElement = document.getElementById("total_boleto");
    const meioValorElement = document.getElementById("meio_valor");
    if (totalTransacoesElement) {
        totalTransacoesElement.textContent = String(calcularNumeroTransacoes(transacoes));
    }
    if (totalElement) {
        totalElement.textContent = `R$ ${formatarDinheiro(calcularTotal(transacoes))}`;
    }
    if (totalCartaoElement) {
        totalCartaoElement.textContent = String(calcularNumeroCartao(transacoes));
    }
    if (totalBoletoElement) {
        totalBoletoElement.textContent = String(calcularNumeroBoleto(transacoes));
    }
    if (meioValorElement) {
        meioValorElement.textContent = metodoMaisUtilizado(transacoes);
    }
}
async function iniciar() {
    const transacoes = await fetchData("https://api.origamid.dev/json/transacoes.json");
    displayResults(transacoes);
}
void iniciar();
export {};
//# sourceMappingURL=projeto.js.map