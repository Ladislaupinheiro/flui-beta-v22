// /modules/features/inventario/services/SupplierAnalyticsService.js (NOVO E MODULARIZADO)
'use strict';

/**
 * Calcula estatísticas detalhadas para um único fornecedor.
 * Usado em SupplierProfile.js.
 * @param {string} fornecedorId
 * @param {object} state
 * @returns {object} com o perfil do fornecedor.
 */
export function getFornecedorProfile(fornecedorId, state) {
    const { historicoCompras, inventario } = state;
    const comprasDoFornecedor = historicoCompras.filter(c => c.fornecedorId === fornecedorId).sort((a, b) => new Date(a.data) - new Date(b.data));

    if (comprasDoFornecedor.length === 0) {
        return { gastoTotal: 0, produtoMaisComprado: 'Nenhuma compra', dataUltimaCompra: null, frequenciaCompras: 0 };
    }

    const gastoTotal = comprasDoFornecedor.reduce((total, compra) => total + (compra.custoTotal || 0), 0);
    const dataUltimaCompra = new Date(comprasDoFornecedor[comprasDoFornecedor.length - 1].data);

    const gastosPorProduto = comprasDoFornecedor.reduce((acc, compra) => {
        const produto = inventario.find(p => p.id === compra.produtoId);
        if (produto) {
            acc[produto.nome] = (acc[produto.nome] || 0) + (compra.custoTotal || 0);
        }
        return acc;
    }, {});
    
    const [produtoMaisCompradoNome] = Object.entries(gastosPorProduto).sort(([, a], [, b]) => b - a)[0] || ['N/A'];

    let frequenciaCompras = 0;
    if (comprasDoFornecedor.length > 1) {
        const datasUnicas = [...new Set(comprasDoFornecedor.map(c => new Date(c.data).getTime()))];
        const primeiraCompra = datasUnicas[0];
        const ultimaCompra = datasUnicas[datasUnicas.length - 1];
        const diffDias = (ultimaCompra - primeiraCompra) / (1000 * 60 * 60 * 24);
        frequenciaCompras = diffDias > 0 ? Math.round(diffDias / (datasUnicas.length - 1)) : 0;
    }

    return { gastoTotal, produtoMaisComprado: produtoMaisCompradoNome, dataUltimaCompra, frequenciaCompras };
}


/**
 * Agrega o histórico de compras mensais de um fornecedor para o gráfico de evolução.
 * Usado em SupplierAnalytics.js.
 * @param {string} fornecedorId
 * @param {object} state
 * @returns {object} Objeto com `labels` e `data` para o Chart.js.
 */
export function getSupplierSpendingHistory(fornecedorId, state) {
    const labels = [];
    const monthlySpending = {};
    const hoje = new Date();

    for (let i = 5; i >= 0; i--) {
        const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        const monthYear = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        labels.push(d.toLocaleDateString('pt-PT', { month: 'short' }));
        monthlySpending[monthYear] = 0;
    }

    const comprasDoFornecedor = state.historicoCompras.filter(c => c.fornecedorId === fornecedorId);
    comprasDoFornecedor.forEach(compra => {
        const d = new Date(compra.data);
        const monthYear = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (monthlySpending[monthYear] !== undefined) {
            monthlySpending[monthYear] += compra.custoTotal || 0;
        }
    });

    const data = Object.values(monthlySpending);
    return { labels, data };
}

/**
 * Agrega a composição de compras de um fornecedor por produto.
 * Usado em SupplierAnalytics.js.
 * @param {string} fornecedorId
 * @param {object} state
 * @returns {object} Objeto com `labels` e `data` para o gráfico de doughnut.
 */
export function getSupplierPurchaseComposition(fornecedorId, state) {
    const { historicoCompras, inventario } = state;
    const spendingByProduct = {};

    const comprasDoFornecedor = historicoCompras.filter(c => c.fornecedorId === fornecedorId);
    comprasDoFornecedor.forEach(compra => {
        spendingByProduct[compra.produtoId] = (spendingByProduct[compra.produtoId] || 0) + (compra.custoTotal || 0);
    });

    const sortedProducts = Object.entries(spendingByProduct)
        .map(([produtoId, total]) => ({ produtoId, total }))
        .sort((a, b) => b.total - a.total);

    const labels = [];
    const data = [];
    const topN = 3; 

    sortedProducts.slice(0, topN).forEach(item => {
        const produto = inventario.find(p => p.id === item.produtoId);
        labels.push(produto ? produto.nome : 'Desconhecido');
        data.push(item.total);
    });

    if (sortedProducts.length > topN) {
        const othersTotal = sortedProducts.slice(topN).reduce((sum, item) => sum + item.total, 0);
        labels.push('Outros');
        data.push(othersTotal);
    }

    return { labels, data };
}