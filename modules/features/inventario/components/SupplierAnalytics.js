// /modules/features/inventario/components/SupplierAnalytics.js (MODULARIZADO)
'use strict';

import store from '../../../shared/services/Store.js';
// *** ALTERAÇÃO: Importa do novo serviço dedicado a fornecedores ***
import { 
    getSupplierSpendingHistory, 
    getSupplierPurchaseComposition 
} from '../services/SupplierAnalyticsService.js';
import { formatarMoeda } from '../../../shared/lib/utils.js';

let containerNode = null;
let unsubscribe = null;
let currentFornecedorId = null;
let historyChart = null;
let compositionChart = null;

function renderSpendingHistoryChart() {
    if (historyChart) historyChart.destroy();
    const ctx = containerNode?.querySelector('#spending-history-chart')?.getContext('2d');
    if (!ctx || !currentFornecedorId) return;

    const historyData = getSupplierSpendingHistory(currentFornecedorId, store.getState());
    const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--border-decorative').trim();
    const fontColor = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim();
    const barColor = getComputedStyle(document.documentElement).getPropertyValue('--brand-primary').trim();

    historyChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: historyData.labels, datasets: [{ data: historyData.data, backgroundColor: `${barColor}B3`, borderRadius: 4 }] },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `Gasto: ${formatarMoeda(c.raw)}` }}},
            scales: {
                y: { beginAtZero: true, ticks: { display: false }, grid: { color: gridColor, drawBorder: false }},
                x: { ticks: { color: fontColor }, grid: { display: false }}
            }
        }
    });
}

function renderPurchaseCompositionChart() {
    if (compositionChart) compositionChart.destroy();
    const ctx = containerNode?.querySelector('#purchase-composition-chart')?.getContext('2d');
    if (!ctx || !currentFornecedorId) return;

    const compositionData = getSupplierPurchaseComposition(currentFornecedorId, store.getState());
    const fontColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim();

    if (compositionData.data.length === 0) {
        ctx.canvas.parentElement.innerHTML = `<p class="empty-list-message small">Nenhuma compra registada para análise.</p>`;
        return;
    }

    compositionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: compositionData.labels,
            datasets: [{
                data: compositionData.data,
                backgroundColor: ['#006D38', '#64DD8F', '#FBBF24', '#8a9ba8'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { color: fontColor } },
                tooltip: { callbacks: { label: (c) => `${c.label}: ${formatarMoeda(c.raw)}` }}
            }
        }
    });
}

function render() {
    return `
        <div class="card">
            <details class="accordion-item" open>
                <summary class="accordion-header" style="padding: 16px;">
                    <h4 class="accordion-title">Evolução de Compras</h4>
                    <i class="accordion-icon lni lni-chevron-down"></i>
                </summary>
                <div class="accordion-content">
                    <div class="chart-container"><canvas id="spending-history-chart"></canvas></div>
                </div>
            </details>
        </div>
        
        <div class="card">
             <details class="accordion-item" open>
                <summary class="accordion-header" style="padding: 16px;">
                    <h4 class="accordion-title">Composição de Compras</h4>
                    <i class="accordion-icon lni lni-chevron-down"></i>
                </summary>
                <div class="accordion-content">
                    <div class="chart-container"><canvas id="purchase-composition-chart"></canvas></div>
                </div>
            </details>
        </div>
    `;
}

function mount(container, fornecedorId) {
    if (!container || !fornecedorId) return;
    
    containerNode = container;
    currentFornecedorId = fornecedorId;

    containerNode.innerHTML = render();
    renderSpendingHistoryChart();
    renderPurchaseCompositionChart();

    unsubscribe = store.subscribe(() => {
        if (containerNode && currentFornecedorId) {
            renderSpendingHistoryChart();
            renderPurchaseCompositionChart();
        }
    });
}

function unmount() {
    if (unsubscribe) unsubscribe();
    if (historyChart) historyChart.destroy();
    if (compositionChart) compositionChart.destroy();
    
    unsubscribe = null;
    containerNode = null;
    currentFornecedorId = null;
    historyChart = null;
    compositionChart = null;
}

export default { render, mount, unmount };