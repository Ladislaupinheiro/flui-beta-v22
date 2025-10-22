// /modules/features/financas/services/FinancialReportingService.js (NOVO, REATORADO E CORRIGIDO)
'use strict';

/**
 * Calcula as métricas financeiras (receita, lucro, despesas, etc.) para um determinado período.
 * Usado na AnálisesView.
 * @param {object} state 
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {object} com o resumo financeiro.
 */
export function getFinancialMetricsForPeriod(state, startDate, endDate) {
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const fechosNoPeriodo = state.historicoFechos.filter(fecho => new Date(fecho.data) >= startDate && new Date(fecho.data) <= endDate);
    const despesasNoPeriodo = state.despesas.filter(despesa => new Date(despesa.data) >= startDate && new Date(despesa.data) <= endDate);

    const resumo = { 
        receitaTotal: 0, 
        lucroBrutoTotal: 0, 
        despesasTotais: 0,
        saldoFinal: 0,
        mediaDiaria: 0,
        diasOperacionais: new Set(fechosNoPeriodo.map(f => new Date(f.data).toDateString())).size
    };

    fechosNoPeriodo.forEach(fecho => {
        (fecho.contasFechadas || []).forEach(conta => {
            (conta.pedidos || []).forEach(pedido => {
                resumo.receitaTotal += pedido.preco * pedido.qtd;
                resumo.lucroBrutoTotal += (pedido.preco - (pedido.custo || 0)) * pedido.qtd;
            });
        });
    });

    state.clientes.forEach(cliente => {
        (cliente.dividas || []).forEach(transacao => {
            if (transacao.tipo === 'credito') {
                const dataPagamento = new Date(transacao.data);
                if (dataPagamento >= startDate && dataPagamento <= endDate) {
                    const valorPago = Math.abs(transacao.valor);
                    resumo.receitaTotal += valorPago;
                    resumo.lucroBrutoTotal += valorPago;
                }
            }
        });
    });

    despesasNoPeriodo.forEach(despesa => { resumo.despesasTotais += despesa.valor || 0; });
    
    resumo.saldoFinal = resumo.lucroBrutoTotal - resumo.despesasTotais;
    if (resumo.diasOperacionais > 0) {
        resumo.mediaDiaria = resumo.receitaTotal / resumo.diasOperacionais;
    }

    return resumo;
}

/**
 * Gera os dados de tendência de vendas para o gráfico da AnálisesView.
 * @param {object} state 
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {object} com 'labels' e 'data' para o gráfico.
 */
export function getSalesTrendForPeriod(state, startDate, endDate) {
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const salesByDay = {};
    // *** CORREÇÃO DO BUG #2 APLICADA AQUI ***
    // Substituído o loop 'for' instável por um loop 'while' robusto.
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        salesByDay[currentDate.toISOString().split('T')[0]] = 0;
        currentDate.setDate(currentDate.getDate() + 1);
    }

    const processarVendasParaTrend = (contas) => {
        contas.forEach(conta => {
            const dataFecho = new Date(conta.dataFecho);
            // Garante que a data está dentro do período antes de processar
            if (dataFecho >= startDate && dataFecho <= endDate) {
                const dayString = dataFecho.toISOString().split('T')[0];
                if (salesByDay[dayString] !== undefined) {
                    let dailyTotal = conta.valorFinal || 0;
                    salesByDay[dayString] += dailyTotal;
                }
            }
        });
    };
    
    const fechosNoPeriodo = state.historicoFechos.flatMap(f => f.contasFechadas || []);
    processarVendasParaTrend(fechosNoPeriodo);

    const contasDeHojeNoPeriodo = state.contasAtivas.filter(c => c.status === 'fechada');
    processarVendasParaTrend(contasDeHojeNoPeriodo);

    const sortedDays = Object.keys(salesByDay).sort();
    
    const labels = sortedDays.map(dayString => {
        const [year, month, day] = dayString.split('-').map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));
        return date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
    });
    const data = sortedDays.map(day => salesByDay[day]);

    return { labels, data };
}


/**
 * Gera a tendência de performance (saldo final diário) para um período.
 * @param {object} state 
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {object} Objeto com `labels`, `data` e `colors` para o gráfico de barras.
 */
export function getPerformanceTrendForPeriod(state, startDate, endDate) {
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const performanceByDay = {};
    // *** CORREÇÃO DO BUG #2 APLICADA AQUI TAMBÉM POR CONSISTÊNCIA ***
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        performanceByDay[currentDate.toISOString().split('T')[0]] = 0;
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    state.historicoFechos.forEach(fecho => {
        const dataFecho = new Date(fecho.data);
        if (dataFecho >= startDate && dataFecho <= endDate) {
            const dayString = dataFecho.toISOString().split('T')[0];
            if (performanceByDay[dayString] !== undefined) {
                performanceByDay[dayString] = fecho.saldoFinal || 0;
            }
        }
    });

    const sortedDays = Object.keys(performanceByDay).sort();
    const labels = sortedDays.map(dayString => {
        const [year, month, day] = dayString.split('-').map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));
        return date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
    });
    const data = sortedDays.map(day => performanceByDay[day]);
    const colors = data.map(value => value >= 0 ? '#64DD8F' : '#B3261E');

    return { labels, data, colors };
}

/**
 * Agrega as despesas por categoria para um determinado período.
 * @param {object} state 
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {object} Objeto com `labels` e `data` para o gráfico de doughnut.
 */
export function getSpendingByCategoryForPeriod(state, startDate, endDate) {
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const despesasNoPeriodo = state.despesas.filter(despesa => {
        const dataDespesa = new Date(despesa.data);
        return dataDespesa >= startDate && dataDespesa <= endDate;
    });

    const spendingByCategory = {};

    despesasNoPeriodo.forEach(despesa => {
        const categoria = despesa.categoria || 'Outros'; // Assume uma propriedade 'categoria'
        spendingByCategory[categoria] = (spendingByCategory[categoria] || 0) + despesa.valor;
    });
    
    const labels = Object.keys(spendingByCategory).filter(cat => spendingByCategory[cat] > 0);
    const data = labels.map(cat => spendingByCategory[cat]);

    return { labels, data };
}