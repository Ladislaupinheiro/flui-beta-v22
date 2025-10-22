// /modules/features/analises/AnálisesView.js (MODULARIZADO)
'use strict';

import store from '../../shared/services/Store.js';
// *** ALTERAÇÃO: Importa do novo serviço de relatórios históricos ***
import { getFinancialMetricsForPeriod, getSalesTrendForPeriod } from '../financas/services/FinancialReportingService.js';
import { getProductPerformanceForPeriod } from '../inventario/services/ProductAnalyticsService.js';
import { getCustomerInsightsForPeriod } from '../clientes/services/ClientAnalyticsService.js';
import { formatarMoeda } from '../../shared/lib/utils.js';

let viewNode = null;
let activeSubView = 'vendas';
let salesChart = null;
let performanceDataCache = {
    vendas: null,
    clientes: null,
    produtos: null
};
let unsubscribe = null;

function renderChart(labels, data) {
    if (salesChart) salesChart.destroy();
    const ctx = viewNode?.querySelector('#sales-trend-chart')?.getContext('2d');
    if (!ctx) return;
    const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--border-decorative').trim();
    const fontColor = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim();
    const barColor = getComputedStyle(document.documentElement).getPropertyValue('--brand-primary').trim();

    salesChart = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{ data, backgroundColor: `${barColor}80`, borderColor: barColor, borderWidth: 1, borderRadius: 4 }] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `Receita: ${formatarMoeda(c.raw)}` }}},
            scales: {
                y: { beginAtZero: true, ticks: { color: fontColor, callback: value => (value / 1000) + 'k' }, grid: { color: gridColor }},
                x: { ticks: { color: fontColor }, grid: { display: false }}
            }
        }
    });
}

function renderVendasSubView() {
    const { resumo, salesTrend } = performanceDataCache.vendas || {};
    if (!resumo || !salesTrend) return `<p class="empty-list-message">A carregar dados de vendas...</p>`;

    return `
        <div class="stats-grid kpi-grid">
            <div class="stat-item"><span class="stat-value primary">${formatarMoeda(resumo.receitaTotal)}</span><span class="stat-label">Receita Total</span></div>
            <div class="stat-item"><span class="stat-value success">${formatarMoeda(resumo.lucroBrutoTotal)}</span><span class="stat-label">Lucro Bruto</span></div>
            <div class="stat-item"><span class="stat-value error">${formatarMoeda(resumo.despesasTotais)}</span><span class="stat-label">Despesas</span></div>
        </div>
        <div class="card">
            <div class="card-header">Tendências de Vendas</div>
            <div class="chart-container"><canvas id="sales-trend-chart"></canvas></div>
        </div>
        <div class="card">
            <div class="card-header">Sumário Operacional</div>
            <div class="summary-grid">
                <div class="summary-item"><span class="summary-value">${formatarMoeda(resumo.mediaDiaria)}</span><span class="summary-label">Média Diária</span></div>
                <div class="summary-item"><span class="summary-value">${resumo.diasOperacionais}</span><span class="summary-label">Dias Operacionais</span></div>
            </div>
        </div>
    `;
}

function renderClientesSubView() {
    const { insights } = performanceDataCache.clientes || {};
    if (!insights) return `<p class="empty-list-message">A carregar dados de clientes...</p>`;

    const topSpendersHTML = insights.topSpenders.slice(0, 5).map((cliente, index) => `
        <div class="performance-list-item">
            <div class="item-info"><span class="item-rank">${index + 1}.</span><p class="item-name">${cliente.nome}</p></div>
            <span class="item-value text-success">${formatarMoeda(cliente.gastoTotal)}</span>
        </div>`).join('');

    return `
        <div class="stats-grid kpi-grid">
            <div class="stat-item"><span class="stat-value">${insights.newCustomersCount}</span><span class="stat-label">Novos Clientes</span></div>
            <div class="stat-item"><span class="stat-value">${insights.totalVisits}</span><span class="stat-label">Visitas Totais</span></div>
        </div>
        <div class="card">
            <div class="card-header">Top 5 Clientes (por Gasto)</div>
            <div class="card-body with-padding">${topSpendersHTML || '<p class="empty-list-message small">Nenhum gasto de cliente registado.</p>'}</div>
        </div>
    `;
}

function renderProdutosSubView() {
    const { performance } = performanceDataCache.produtos || {};
    if (!performance) return `<p class="empty-list-message">A carregar dados de produtos...</p>`;

    const createListHTML = (data, valueFormatter) => data.slice(0, 5).map((item, index) => `
        <div class="performance-list-item">
            <p class="item-name">${index + 1}. ${item.nome}</p>
            <span class="item-value">${valueFormatter(item)}</span>
        </div>`).join('');

    return `
        <div class="card">
            <div class="card-header">Top 5 Vendas (Quantidade)</div>
            <div class="card-body with-padding">${createListHTML(performance.topSellers, item => `<strong>${item.qtd}</strong> un.`)}</div>
        </div>
        <div class="card">
            <div class="card-header">Top 5 Rentáveis (Lucro)</div>
            <div class="card-body with-padding">${createListHTML(performance.topProfit, item => `<strong class="text-success">${formatarMoeda(item.lucro)}</strong>`)}</div>
        </div>
        <div class="card">
            <div class="card-header">Top 5 Estagnados (Sem Venda)</div>
            <div class="card-body with-padding">${createListHTML(performance.zombieProducts, item => `<span class="text-secondary text-sm">${item.ultimaVenda ? `Últ. venda: ${new Date(item.ultimaVenda).toLocaleDateString('pt-PT')}`: 'Nunca'}</span>`)}</div>
        </div>
    `;
}

function updateView() {
    if (!viewNode) return;
    const subviewContainer = viewNode.querySelector('#analises-subview-container');
    if (!subviewContainer) return;

    switch (activeSubView) {
        case 'vendas': 
            subviewContainer.innerHTML = renderVendasSubView(); 
            if(performanceDataCache.vendas?.salesTrend) {
                renderChart(performanceDataCache.vendas.salesTrend.labels, performanceDataCache.vendas.salesTrend.data);
            }
            break;
        case 'clientes': 
            subviewContainer.innerHTML = renderClientesSubView(); 
            break;
        case 'produtos': 
            subviewContainer.innerHTML = renderProdutosSubView(); 
            break;
    }
}

function fetchDataForView() {
    try {
        const state = store.getState();
        const periodoSelect = viewNode?.querySelector('#periodo-analise-select');
        const periodo = periodoSelect ? periodoSelect.value : '30d';

        const endDate = new Date();
        let startDate = new Date();
        switch (periodo) {
            case '7d': startDate.setDate(endDate.getDate() - 6); break;
            case '30d': startDate.setDate(endDate.getDate() - 29); break;
            case 'esteMes': startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1); break;
            case 'mesPassado':
                startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1);
                endDate = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
                break;
        }
        
        performanceDataCache.vendas = {
            resumo: getFinancialMetricsForPeriod(state, new Date(startDate), new Date(endDate)),
            salesTrend: getSalesTrendForPeriod(state, new Date(startDate), new Date(endDate))
        };
        performanceDataCache.clientes = { insights: getCustomerInsightsForPeriod(state, new Date(startDate), new Date(endDate)) };
        performanceDataCache.produtos = { performance: getProductPerformanceForPeriod(state, new Date(startDate), new Date(endDate)) };

        updateView();
    } catch (error) {
        console.error("Erro ao buscar ou processar dados para AnálisesView:", error);
    }
}

function render() {
    return `
        <header class="page-header sticky-header with-filters">
            <div class="header-row"><h2 class="page-title">Análises</h2></div>
            <div class="segmented-control">
                <button class="segmented-control-button active" data-subview="vendas">Vendas</button>
                <button class="segmented-control-button" data-subview="clientes">Clientes</button>
                <button class="segmented-control-button" data-subview="produtos">Produtos</button>
            </div>
        </header>
        <div class="search-and-filter-bar">
            <select id="periodo-analise-select" class="input-field">
                <option value="7d">Últimos 7 dias</option>
                <option value="30d" selected>Últimos 30 dias</option>
                <option value="esteMes">Este Mês</option>
                <option value="mesPassado">Mês Passado</option>
            </select>
        </div>
        <main id="analises-subview-container" class="page-content"></main>
    `;
}

function mount(containerId = 'app-root') {
    viewNode = document.getElementById(containerId);
    if(!viewNode) return;
    viewNode.innerHTML = render();

    viewNode.querySelector('#periodo-analise-select')?.addEventListener('change', fetchDataForView);
    viewNode.querySelector('.segmented-control')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.segmented-control-button');
        if (btn && btn.dataset.subview !== activeSubView) {
            viewNode.querySelectorAll('.segmented-control-button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeSubView = btn.dataset.subview;
            updateView();
        }
    });

    fetchDataForView();
    unsubscribe = store.subscribe(fetchDataForView);
}

function unmount() {
    if (salesChart) { salesChart.destroy(); salesChart = null; }
    if (unsubscribe) unsubscribe();
    viewNode = null;
    unsubscribe = null;
    performanceDataCache = { vendas: null, clientes: null, produtos: null };
}

export default { render, mount, unmount };