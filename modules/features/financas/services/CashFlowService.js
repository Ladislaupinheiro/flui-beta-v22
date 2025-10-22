// /modules/features/financas/services/CashFlowService.js (NOVO)
'use strict';

/**
 * Agrega o sumário financeiro para o dia atual em tempo real.
 * Usado na FluxoCaixaView (sub-vista "Hoje").
 * @param {object} state - O estado completo da aplicação.
 * @returns {object} com os KPIs do dia e o feed de transações.
 */
export function getFinancialSummaryForToday(state) {
    const hojeString = new Date().toDateString();
    let totalEntradas = 0;
    let totalSaidas = 0;
    const feedDeTransacoes = [];

    // Entradas por Vendas
    state.contasAtivas.filter(c => c.status === 'fechada' && new Date(c.dataFecho).toDateString() === hojeString)
        .forEach(venda => {
            totalEntradas += venda.valorFinal;
            feedDeTransacoes.push({ id: venda.id, timestamp: new Date(venda.dataFecho), type: 'venda', descricao: `Venda #${venda.nome}`, valor: venda.valorFinal });
        });

    // Entradas por Pagamento de Dívida
    state.clientes.forEach(cliente => {
        (cliente.dividas || []).forEach(transacao => {
            if (transacao.tipo === 'credito' && new Date(transacao.data).toDateString() === hojeString) {
                const valorPago = Math.abs(transacao.valor);
                totalEntradas += valorPago;
                feedDeTransacoes.push({ id: transacao.id, timestamp: new Date(transacao.data), type: 'pagamento_divida', descricao: `Pagamento de ${cliente.nome}`, valor: valorPago });
            }
        });
    });
    
    // Saídas por Despesas
    state.despesas.filter(d => new Date(d.data).toDateString() === hojeString)
        .forEach(despesa => {
            totalSaidas += despesa.valor;
            feedDeTransacoes.push({ id: despesa.id, timestamp: new Date(despesa.data), type: 'despesa', descricao: despesa.descricao, valor: -despesa.valor });
        });

    feedDeTransacoes.sort((a, b) => b.timestamp - a.timestamp);
    const saldoDia = totalEntradas - totalSaidas;

    return { totalEntradas, totalSaidas, saldoDia, feedDeTransacoes };
}

/**
 * Calcula o fluxo de caixa acumulado ao longo do dia para o gráfico de linha.
 * @param {object} state O estado completo da aplicação.
 * @returns {object} Objeto com `labels` e `data` para o Chart.js.
 */
export function getDailyCashFlow(state) {
    const { feedDeTransacoes } = getFinancialSummaryForToday(state);
    const hourlyFlow = {};
    const labels = [];
    let accumulatedBalance = 0;

    // Cria slots de 2 em 2 horas das 08h às 02h
    for (let i = 8; i < 24 + 2; i++) {
        const hour = i % 24;
        if (i % 2 === 0) {
            labels.push(`${String(hour).padStart(2, '0')}:00`);
            hourlyFlow[hour] = 0;
            if (hourlyFlow[hour+1] === undefined) hourlyFlow[hour+1] = 0;
        }
    }

    feedDeTransacoes.forEach(trans => {
        const hour = trans.timestamp.getHours();
        if (hourlyFlow[hour] !== undefined) {
            hourlyFlow[hour] += trans.valor;
        }
    });

    const data = [];
    labels.forEach((label) => {
        const hour = parseInt(label.split(':')[0], 10);
        accumulatedBalance += (hourlyFlow[hour] || 0);
        if (hourlyFlow[hour + 1] !== undefined) {
            accumulatedBalance += (hourlyFlow[hour + 1] || 0);
        }
        data.push(accumulatedBalance);
    });

    return { labels, data };
}

/**
 * Calcula a distribuição das fontes de entrada do dia (Vendas vs. Dívidas).
 * @param {object} state O estado completo da aplicação.
 * @returns {object} Objeto com `labels` e `data` para o Chart.js.
 */
export function getIncomeSourceDistribution(state) {
    const { feedDeTransacoes } = getFinancialSummaryForToday(state);
    let totalVendas = 0;
    let totalDividasPagas = 0;

    feedDeTransacoes.forEach(trans => {
        if (trans.type === 'venda') {
            totalVendas += trans.valor;
        } else if (trans.type === 'pagamento_divida') {
            totalDividasPagas += trans.valor;
        }
    });

    if (totalVendas === 0 && totalDividasPagas === 0) {
        return { labels: ['Vendas', 'Dívidas Pagas'], data: [0, 0] };
    }

    return {
        labels: ['Vendas', 'Dívidas Pagas'],
        data: [totalVendas, totalDividasPagas]
    };
}