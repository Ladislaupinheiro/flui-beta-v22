// /modules/features/clientes/services/ClientAnalyticsService.js (ATUALIZADO COM HISTÓRICO E SALDO DE DÍVIDA)
'use strict';

/**
 * Calcula o gasto total e o saldo da dívida de cada cliente.
 * Usado na ClientesView para o ranking.
 * @param {object} state - O estado completo da aplicação.
 * @returns {Array<object>} Uma lista de objetos de cliente com `gastoTotal` e `saldoDivida`.
 */
export function getRankedClients(state) {
    const { clientes, historicoFechos, contasAtivas } = state;
    const gastosPorCliente = {};

    // Processa contas históricas e do dia para calcular o gasto total
    const processarContas = (contas) => {
        contas.forEach(conta => {
            if (conta.clienteId) {
                gastosPorCliente[conta.clienteId] = (gastosPorCliente[conta.clienteId] || 0) + (conta.valorFinal || 0);
            }
        });
    };
    const contasHistoricas = historicoFechos.flatMap(fecho => fecho.contasFechadas || []);
    processarContas(contasHistoricas);
    const contasDeHoje = contasAtivas.filter(conta => conta.status === 'fechada');
    processarContas(contasDeHoje);

    return clientes
        .map(cliente => {
            // Calcula o saldo da dívida para cada cliente
            const saldoDivida = (cliente.dividas || []).reduce((total, d) => {
                return total + (d.tipo === 'debito' ? d.valor : -Math.abs(d.valor));
            }, 0);

            return {
                ...cliente,
                gastoTotal: gastosPorCliente[cliente.id] || 0,
                saldoDivida: saldoDivida
            };
        })
        .sort((a, b) => b.gastoTotal - a.gastoTotal);
}

/**
 * Calcula estatísticas detalhadas e a data da última visita para um único cliente.
 * Usado na ClienteDetalhesView.
 * @param {string} clienteId 
 * @param {object} state 
 * @returns {object}
 */
export function calculateClientProfile(clienteId, state) {
    const { historicoFechos, contasAtivas } = state;
    const profile = { gastoTotal: 0, visitas: 0, ticketMedio: 0, produtosPreferidos: {}, dataUltimaVisita: null };
    
    const todasAsContasDoCliente = [
        ...historicoFechos.flatMap(fecho => fecho.contasFechadas || []),
        ...contasAtivas.filter(conta => conta.status === 'fechada')
    ].filter(conta => conta.clienteId === clienteId);

    if (todasAsContasDoCliente.length === 0) {
        profile.produtosPreferidos = [];
        return profile;
    }

    const diasDeVisita = new Set();
    let datasDeVisita = [];
    todasAsContasDoCliente.forEach(conta => {
        profile.gastoTotal += conta.valorFinal || 0;
        if (conta.dataFecho) {
            const data = new Date(conta.dataFecho);
            diasDeVisita.add(data.toDateString());
            datasDeVisita.push(data);
        }
        (conta.pedidos || []).forEach(pedido => {
            profile.produtosPreferidos[pedido.nome] = (profile.produtosPreferidos[pedido.nome] || 0) + pedido.qtd;
        });
    });

    if (datasDeVisita.length > 0) {
        profile.dataUltimaVisita = new Date(Math.max.apply(null, datasDeVisita));
    }

    profile.visitas = diasDeVisita.size;
    if (profile.visitas > 0) profile.ticketMedio = profile.gastoTotal / profile.visitas;
    profile.produtosPreferidos = Object.entries(profile.produtosPreferidos)
        .sort(([, a], [, b]) => b - a).slice(0, 3).map(([nome, qtd]) => ({ nome, qtd }));

    return profile;
}

/**
 * NOVO: Agrega o histórico de gastos mensais de um cliente para o gráfico de atividade.
 * @param {string} clienteId
 * @param {object} state
 * @returns {object} Objeto com `labels` e `data` para o Chart.js.
 */
export function getSpendingHistory(clienteId, state) {
    const { historicoFechos, contasAtivas } = state;
    const labels = [];
    const data = [];
    const monthlySpending = {};

    const hoje = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        const monthYear = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        labels.push(d.toLocaleDateString('pt-PT', { month: 'short' }));
        monthlySpending[monthYear] = 0;
        data.push(0);
    }
    
    const todasAsContasDoCliente = [
        ...historicoFechos.flatMap(fecho => fecho.contasFechadas || []),
        ...contasAtivas.filter(conta => conta.status === 'fechada')
    ].filter(conta => conta.clienteId === clienteId);

    todasAsContasDoCliente.forEach(conta => {
        const d = new Date(conta.dataFecho);
        const monthYear = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (monthlySpending[monthYear] !== undefined) {
            monthlySpending[monthYear] += conta.valorFinal || 0;
        }
    });

    Object.keys(monthlySpending).forEach((monthYear, index) => {
        data[index] = monthlySpending[monthYear];
    });

    return { labels, data };
}


/**
 * Agrega insights de clientes para um determinado período.
 * Usado na AnálisesView.
 * @param {object} state 
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {object}
 */
export function getCustomerInsightsForPeriod(state, startDate, endDate) {
    const { historicoFechos, clientes, contasAtivas } = state;
    
    const insightsPorCliente = {};

    const processarContas = (contas) => {
        contas.forEach(conta => {
            if (conta.clienteId) {
                if (!insightsPorCliente[conta.clienteId]) {
                    insightsPorCliente[conta.clienteId] = { 
                        id: conta.clienteId, 
                        gastoTotal: 0,
                        visitasSet: new Set()
                    };
                }
                insightsPorCliente[conta.clienteId].gastoTotal += conta.valorFinal || 0;
                if (conta.dataFecho) {
                    insightsPorCliente[conta.clienteId].visitasSet.add(new Date(conta.dataFecho).toDateString());
                }
            }
        });
    };
    
    const fechosNoPeriodo = historicoFechos.flatMap(f => f.contasFechadas || []).filter(c => new Date(c.dataFecho) >= startDate && new Date(c.dataFecho) <= endDate);
    processarContas(fechosNoPeriodo);

    const contasDeHojeNoPeriodo = contasAtivas.filter(c => c.status === 'fechada' && new Date(c.dataFecho) >= startDate && new Date(c.dataFecho) <= endDate);
    processarContas(contasDeHojeNoPeriodo);

    const topSpenders = Object.values(insightsPorCliente)
        .map(insight => ({
            ...insight,
            nome: (clientes.find(c => c.id === insight.id) || {}).nome || 'Cliente Removido',
            visitas: insight.visitasSet.size
        }))
        .filter(c => c.gastoTotal > 0)
        .sort((a, b) => b.gastoTotal - a.gastoTotal);
        
    const newCustomersCount = clientes.filter(c => new Date(c.dataRegisto) >= startDate && new Date(c.dataRegisto) <= endDate).length;
    
    const totalVisits = Object.values(insightsPorCliente).reduce((total, insight) => total + insight.visitasSet.size, 0);

    return { topSpenders, newCustomersCount, totalVisits };
}