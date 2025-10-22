// /modules/features/financas/components/DespesasSubView.js (NOVO)
'use strict';

import store from '../../../shared/services/Store.js';
import { abrirModalNovaDespesa } from '../../../shared/components/Modals.js';
import { getSpendingByCategoryForPeriod } from '../services/FinancialReportingService.js';
import { formatarMoeda } from '../../../shared/lib/utils.js';

let containerNode = null;
let unsubscribe = null;
let spendingCategoryChart = null;

let localState = {
    activePeriod: 'esteMes',
};

function getPeriodDates(period) {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    switch (period) {
        case '7d': startDate.setDate(endDate.getDate() - 6); break;
        case 'esteMes': startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1); break;
        case 'mesPassado':
            startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1);
            endDate = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
            endDate.setHours(23, 59, 59, 999);
            break;
    }
    return { startDate, endDate };
}

function renderSpendingByCategoryChart() {
    if (spendingCategoryChart) spendingCategoryChart.destroy();
    const ctx = containerNode?.querySelector('#spending-category-chart')?.getContext('2d');
    if (!ctx) return;

    const { startDate, endDate } = getPeriodDates(localState.activePeriod);
    const chartData = getSpendingByCategoryForPeriod(store.getState(), startDate, endDate);

    if (chartData.data.length === 0) {
        ctx.canvas.parentElement.innerHTML = `<p class="empty-list-message small">Nenhuma despesa registada no período.</p>`;
        return;
    }

    const fontColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim();

    spendingCategoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: chartData.labels,
            datasets: [{
                data: chartData.data,
                backgroundColor: [
                    getComputedStyle(document.documentElement).getPropertyValue('--feedback-error').trim(),
                    '#F2B8B5', '#8a9ba8', '#5a6d7a'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: fontColor } },
                tooltip: { callbacks: { label: (c) => `${c.label}: ${formatarMoeda(c.raw)}` }}
            }
        }
    });
}

function render() {
    const { startDate, endDate } = getPeriodDates(localState.activePeriod);
    const despesasNoPeriodo = store.getState().despesas.filter(d => {
        const dataDespesa = new Date(d.data);
        return dataDespesa >= startDate && dataDespesa <= endDate;
    });
    const totalDespesas = despesasNoPeriodo.reduce((sum, d) => sum + d.valor, 0);

    return `
        <nav class="filter-bar" style="padding: 16px;">
             <button class="filter-chip ${localState.activePeriod === '7d' ? 'active' : ''}" data-period="7d">Últimos 7 dias</button>
            <button class="filter-chip ${localState.activePeriod === 'esteMes' ? 'active' : ''}" data-period="esteMes">Este Mês</button>
            <button class="filter-chip ${localState.activePeriod === 'mesPassado' ? 'active' : ''}" data-period="mesPassado">Mês Passado</button>
        </nav>
        <div class="kpi-highlight">
            <span class="kpi-label">Total Gasto no Período</span>
            <span class="kpi-value error">${formatarMoeda(totalDespesas)}</span>
        </div>
        <div class="card">
            <details class="accordion-item" open>
                <summary class="accordion-header" style="padding: 16px;"><h4 class="accordion-title">Despesas por Categoria</h4><i class="accordion-icon lni lni-chevron-down"></i></summary>
                <div class="accordion-content">
                    <div class="chart-container" style="min-height: 200px;"><canvas id="spending-category-chart"></canvas></div>
                </div>
            </details>
        </div>
        <button id="btn-fab-nova-despesa" class="fab" title="Adicionar Nova Despesa"><i class="lni lni-plus"></i></button>
    `;
}

function handleContainerClick(e) {
    const periodBtn = e.target.closest('[data-period]');
    if (periodBtn) {
        localState.activePeriod = periodBtn.dataset.period;
        // Re-renderiza o componente para atualizar o KPI e os filtros
        mount(containerNode);
        return;
    }

    if (e.target.closest('#btn-fab-nova-despesa')) {
        abrirModalNovaDespesa();
        return;
    }
}

export function mount(container) {
    containerNode = container;
    
    containerNode.innerHTML = render();
    renderSpendingByCategoryChart();
    
    containerNode.addEventListener('click', handleContainerClick);
    
    unsubscribe = store.subscribe(() => {
        if(containerNode) {
            mount(containerNode); // Re-monta para refletir novas despesas
        }
    });
}

export function unmount() {
    if (unsubscribe) unsubscribe();
    if (spendingCategoryChart) spendingCategoryChart.destroy();
    
    containerNode?.removeEventListener('click', handleContainerClick);
    
    containerNode = null;
    unsubscribe = null;
    spendingCategoryChart = null;
}

export default { render, mount, unmount };