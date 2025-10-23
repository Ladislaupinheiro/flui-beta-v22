// /modules/features/financas/components/HojeSubView.js (FOOTER REMOVIDO)
'use strict';

import store from '../../../shared/services/Store.js';
// abrirModalFechoGlobal e calcularRelatorioDia não são mais necessários aqui
import { getFinancialSummaryForToday, getIncomeSourceDistribution } from '../services/CashFlowService.js';
import { formatarMoeda } from '../../../shared/lib/utils.js';

let containerNode = null;
let unsubscribe = null;
let incomeSourceChart = null;

function renderIncomeSourceChart() {
    if (incomeSourceChart) incomeSourceChart.destroy();
    const ctx = containerNode?.querySelector('#income-source-chart')?.getContext('2d');
    if (!ctx) return;

    const chartData = getIncomeSourceDistribution(store.getState());
    if (chartData.data.every(d => d === 0)) {
        ctx.canvas.parentElement.innerHTML = `<p class="empty-list-message small">Nenhuma entrada registada hoje.</p>`;
        return;
    }

    const fontColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim();

    incomeSourceChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: chartData.labels,
            datasets: [{
                data: chartData.data,
                backgroundColor: [
                    getComputedStyle(document.documentElement).getPropertyValue('--brand-primary').trim(),
                    getComputedStyle(document.documentElement).getPropertyValue('--brand-accent').trim()
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
    const summary = getFinancialSummaryForToday(store.getState());
    const feedHTML = summary.feedDeTransacoes.length > 0 ? summary.feedDeTransacoes.map(item => {
        const isEntrada = item.valor > 0;
        return `
            <div class="transaction-item">
                <div class="transaction-icon"><i class="lni ${isEntrada ? 'lni-arrow-up-circle' : 'lni-arrow-down-circle'}"></i></div>
                <div class="transaction-details">
                    <p class="transaction-description">${item.descricao}</p>
                    <p class="transaction-date">${item.timestamp.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <span class="transaction-amount ${isEntrada ? 'transaction-credit' : 'transaction-debit'}">${formatarMoeda(item.valor)}</span>
            </div>
        `;
    }).join('') : `<div class="empty-state-container"><p>Nenhuma transação registada hoje.</p></div>`;

    // *** FOOTER REMOVIDO DAQUI ***
    return `
        <div class="kpi-highlight">
            <span class="kpi-label">Saldo Atual do Dia</span>
            <span class="kpi-value ${summary.saldoDia >= 0 ? 'success' : 'error'}">${formatarMoeda(summary.saldoDia)}</span>
        </div>
        <div class="card">
            <details class="accordion-item" open>
                <summary class="accordion-header" style="padding: 16px;"><h4 class="accordion-title">Últimas Transações</h4><i class="accordion-icon lni lni-chevron-down"></i></summary>
                <div class="accordion-content"><div class="transaction-list">${feedHTML}</div></div>
            </details>
        </div>
        <div class="card">
             <details class="accordion-item">
                <summary class="accordion-header" style="padding: 16px;"><h4 class="accordion-title">Fontes de Entrada</h4><i class="accordion-icon lni lni-chevron-down"></i></summary>
                <div class="accordion-content"><div class="chart-container" style="min-height: 200px;"><canvas id="income-source-chart"></canvas></div></div>
            </details>
        </div>
       
    `;
}

// *** handleContainerClick REMOVIDO pois não há mais ações locais ***
// function handleContainerClick(e) { ... }

export function mount(container) {
    containerNode = container;
    containerNode.innerHTML = render();
    renderIncomeSourceChart();

    // *** Listener de clique removido ***
    // containerNode.addEventListener('click', handleContainerClick);

    unsubscribe = store.subscribe(() => {
        if(containerNode) {
            // Usa morphdom para atualizar eficientemente
            const newHTML = render();
            morphdom(containerNode, `
                <div id="${containerNode.id}" class="${containerNode.className}">
                    ${newHTML}
                </div>
            `, { childrenOnly: true });
            renderIncomeSourceChart(); // Re-renderiza o gráfico após atualização do DOM
        }
    });
}

export function unmount() {
    if (unsubscribe) unsubscribe();
    if (incomeSourceChart) incomeSourceChart.destroy();

    // *** Listener de clique removido ***
    // containerNode?.removeEventListener('click', handleContainerClick);

    containerNode = null;
    unsubscribe = null;
    incomeSourceChart = null;
}

export default { render, mount, unmount };