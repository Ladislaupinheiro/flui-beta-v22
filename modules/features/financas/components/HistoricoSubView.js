// /modules/features/financas/components/HistoricoSubView.js (NOVO)
'use strict';

import store from '../../../shared/services/Store.js';
import { abrirModalFechoGlobal, abrirModalExportarCompras } from '../../../shared/components/Modals.js';
import { getPerformanceTrendForPeriod } from '../services/FinancialReportingService.js';
import { formatarMoeda } from '../../../shared/lib/utils.js';

let containerNode = null;
let unsubscribe = null;
let performanceChart = null;

let localState = {
    activePeriod: 'esteMes',
    dataCalendario: new Date(),
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

function renderPerformanceChart() {
    if (performanceChart) performanceChart.destroy();
    const ctx = containerNode?.querySelector('#performance-chart')?.getContext('2d');
    if (!ctx) return;

    const { startDate, endDate } = getPeriodDates(localState.activePeriod);
    const chartData = getPerformanceTrendForPeriod(store.getState(), startDate, endDate);

    const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--border-decorative').trim();
    const fontColor = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim();

    performanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: [{
                data: chartData.data,
                backgroundColor: chartData.colors,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `Saldo: ${formatarMoeda(c.raw)}` }}},
            scales: {
                y: { beginAtZero: true, ticks: { color: fontColor, callback: value => (value / 1000) + 'k' }, grid: { color: gridColor }},
                x: { ticks: { color: fontColor }, grid: { display: false }}
            }
        }
    });
}

function renderCalendarGrid() {
    const state = store.getState();
    const ano = localState.dataCalendario.getFullYear();
    const mes = localState.dataCalendario.getMonth();
    const calendarioTitulo = containerNode.querySelector('#calendario-titulo');
    const calendarioGrid = containerNode.querySelector('#calendario-grid-dias');
    if (!calendarioTitulo || !calendarioGrid) return;

    calendarioTitulo.textContent = new Date(ano, mes).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
    calendarioGrid.innerHTML = '';

    const diasComEventos = new Set(state.historicoFechos.map(f => new Date(f.data).toDateString()));
    const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();

    for (let i = 0; i < primeiroDiaSemana; i++) calendarioGrid.appendChild(document.createElement('div'));

    for (let dia = 1; dia <= diasNoMes; dia++) {
        const diaAtual = new Date(ano, mes, dia);
        const diaAtualStr = diaAtual.toDateString();
        const temEvento = diasComEventos.has(diaAtualStr);

        const diaEl = document.createElement('div');
        diaEl.className = 'calendar-day';
        diaEl.textContent = dia;
        if (temEvento) {
            diaEl.classList.add('has-event');
            diaEl.dataset.dia = dia;
        } else {
            diaEl.classList.add('disabled');
        }
        calendarioGrid.appendChild(diaEl);
    }
}

function render() {
    return `
        <nav class="filter-bar" style="padding: 16px;">
            <button class="filter-chip ${localState.activePeriod === '7d' ? 'active' : ''}" data-period="7d">Últimos 7 dias</button>
            <button class="filter-chip ${localState.activePeriod === 'esteMes' ? 'active' : ''}" data-period="esteMes">Este Mês</button>
            <button class="filter-chip ${localState.activePeriod === 'mesPassado' ? 'active' : ''}" data-period="mesPassado">Mês Passado</button>
        </nav>
        <div class="card">
            <details class="accordion-item" open>
                <summary class="accordion-header" style="padding: 16px;"><h4 class="accordion-title">Desempenho Diário (Saldo)</h4><i class="accordion-icon lni lni-chevron-down"></i></summary>
                <div class="accordion-content"><div class="chart-container"><canvas id="performance-chart"></canvas></div></div>
            </details>
        </div>
        <div class="card">
            <details class="accordion-item">
                <summary class="accordion-header" style="padding: 16px;"><h4 class="accordion-title">Navegador de Relatórios Diários</h4><i class="accordion-icon lni lni-chevron-down"></i></summary>
                <div class="accordion-content">
                    <div class="calendar-container">
                        <div class="calendar-nav">
                            <button id="btn-mes-anterior" class="calendar-nav-btn"><i class="lni lni-chevron-left"></i></button>
                            <h5 id="calendario-titulo" class="calendar-month-title"></h5>
                            <button id="btn-mes-seguinte" class="calendar-nav-btn"><i class="lni lni-chevron-right"></i></button>
                        </div>
                        <div class="calendar-weekdays"><span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span></div>
                        <div id="calendario-grid-dias" class="calendar-grid"></div>
                        <p class="calendar-legend">Dias com fecho de caixa arquivado</p>
                    </div>
                </div>
            </details>
        </div>
        <div class="bottom-action-bar">
            <button id="btn-exportar-relatorio" class="button button-secondary full-width">
                <i class="lni lni-download"></i> Exportar Relatório de Compras
            </button>
        </div>
    `;
}

function handleContainerClick(e) {
    const periodBtn = e.target.closest('[data-period]');
    if (periodBtn) {
        localState.activePeriod = periodBtn.dataset.period;
        containerNode.querySelector('.filter-bar').innerHTML = `
            <button class="filter-chip ${localState.activePeriod === '7d' ? 'active' : ''}" data-period="7d">Últimos 7 dias</button>
            <button class="filter-chip ${localState.activePeriod === 'esteMes' ? 'active' : ''}" data-period="esteMes">Este Mês</button>
            <button class="filter-chip ${localState.activePeriod === 'mesPassado' ? 'active' : ''}" data-period="mesPassado">Mês Passado</button>
        `;
        renderPerformanceChart();
        return;
    }

    if (e.target.closest('#btn-exportar-relatorio')) {
        abrirModalExportarCompras();
        return;
    }

    const diaBtn = e.target.closest('.calendar-grid [data-dia]');
    if (diaBtn) {
        const dia = parseInt(diaBtn.dataset.dia, 10);
        const dataClicada = new Date(localState.dataCalendario.getFullYear(), localState.dataCalendario.getMonth(), dia).toDateString();
        const relatorioDoDia = store.getState().historicoFechos.find(f => new Date(f.data).toDateString() === dataClicada);
        if (relatorioDoDia) abrirModalFechoGlobal(relatorioDoDia, true);
        return;
    }
    
    if (e.target.closest('#btn-mes-anterior')) {
        localState.dataCalendario.setMonth(localState.dataCalendario.getMonth() - 1);
        renderCalendarGrid();
    } else if (e.target.closest('#btn-mes-seguinte')) {
        localState.dataCalendario.setMonth(localState.dataCalendario.getMonth() + 1);
        renderCalendarGrid();
    }
}

export function mount(container) {
    containerNode = container;
    localState = { activePeriod: 'esteMes', dataCalendario: new Date() };
    
    containerNode.innerHTML = render();
    renderPerformanceChart();
    renderCalendarGrid();
    
    containerNode.addEventListener('click', handleContainerClick);
    
    unsubscribe = store.subscribe(() => {
        if(containerNode) {
            renderCalendarGrid();
        }
    });
}

export function unmount() {
    if (unsubscribe) unsubscribe();
    if (performanceChart) performanceChart.destroy();
    
    containerNode?.removeEventListener('click', handleContainerClick);
    
    containerNode = null;
    unsubscribe = null;
    performanceChart = null;
}

export default { render, mount, unmount };