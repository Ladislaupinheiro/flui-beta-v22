// /modules/features/inventario/components/PurchaseHistory.js (NOVO)
'use strict';

import store from '../../../shared/services/Store.js';
import { formatarMoeda } from '../../../shared/lib/utils.js';

let containerNode = null;
let overlayContainerNode = null;
let unsubscribe = null;
let currentFornecedor = null;

// Estado local para o calendário
let dataCalendario = new Date();
let dataSelecionada = null;

function renderListaComprasDoDia(data) {
    const state = store.getState();
    const comprasDoDia = state.historicoCompras.filter(c => 
        c.fornecedorId === currentFornecedor.id && new Date(c.data).toDateString() === data.toDateString()
    );

    if (comprasDoDia.length === 0) {
        return `<p class="empty-list-message small">Nenhuma compra registada neste dia.</p>`;
    }

    return comprasDoDia.map(compra => {
        const produtoComprado = state.inventario.find(p => p.id === compra.produtoId);
        const nomeProduto = produtoComprado ? produtoComprado.nome : 'Produto removido';
        return `
            <div class="list-item-condensed">
                <p>${compra.quantidade}x ${nomeProduto}</p>
                <p class="font-bold">${formatarMoeda(compra.valorTotal)}</p>
            </div>
        `;
    }).join('');
}

function openHistoryOverlay(date) {
    if (!overlayContainerNode || !currentFornecedor) return;

    dataSelecionada = date;
    overlayContainerNode.innerHTML = `
        <div id="history-details-overlay" class="history-overlay">
            <div class="history-card">
                <button class="history-card-close-btn">&times;</button>
                <div class="card-header">Compras de ${date.toLocaleDateString('pt-PT')}</div>
                <div class="card-body-list">${renderListaComprasDoDia(date)}</div>
            </div>
        </div>
    `;
    
    const overlay = overlayContainerNode.querySelector('#history-details-overlay');
    setTimeout(() => overlay.classList.add('visible'), 10);
    renderCalendar(); // Re-renderiza o calendário para mostrar a seleção
}

function closeHistoryOverlay() {
    const overlay = overlayContainerNode?.querySelector('#history-details-overlay');
    if (!overlay) return;
    
    overlay.classList.remove('visible');
    overlay.addEventListener('transitionend', () => {
        if (overlayContainerNode) overlayContainerNode.innerHTML = '';
        dataSelecionada = null;
        renderCalendar(); // Re-renderiza para remover a seleção
    }, { once: true });
}

function renderCalendar() {
    if (!containerNode || !currentFornecedor) return;

    const ano = dataCalendario.getFullYear();
    const mes = dataCalendario.getMonth();
    const calendarioTitulo = containerNode.querySelector('#calendario-compras-titulo');
    const calendarioGrid = containerNode.querySelector('#calendario-compras-grid');
    if (!calendarioTitulo || !calendarioGrid) return;

    calendarioTitulo.textContent = new Date(ano, mes).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
    calendarioGrid.innerHTML = '';

    const comprasDoFornecedor = store.getState().historicoCompras.filter(c => c.fornecedorId === currentFornecedor.id);
    const diasComCompras = new Set(comprasDoFornecedor.map(c => new Date(c.data).toDateString()));
    const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();

    for (let i = 0; i < primeiroDiaSemana; i++) calendarioGrid.appendChild(document.createElement('div'));

    for (let dia = 1; dia <= diasNoMes; dia++) {
        const diaAtual = new Date(ano, mes, dia);
        const diaAtualStr = diaAtual.toDateString();
        const temCompra = diasComCompras.has(diaAtualStr);
        const isSelected = dataSelecionada && diaAtualStr === dataSelecionada.toDateString();
        
        const diaEl = document.createElement('div');
        diaEl.className = 'calendar-day';
        diaEl.textContent = dia;
        if (isSelected) diaEl.classList.add('selected');
        if (temCompra) diaEl.classList.add('has-event');
        if (!temCompra) diaEl.classList.add('disabled');

        if(temCompra) diaEl.dataset.dia = dia;
        calendarioGrid.appendChild(diaEl);
    }
}

function handleContainerClick(e) {
    if (e.target.closest('#btn-mes-anterior-compras')) {
        dataCalendario.setMonth(dataCalendario.getMonth() - 1);
        renderCalendar();
    } else if (e.target.closest('#btn-mes-seguinte-compras')) {
        dataCalendario.setMonth(dataCalendario.getMonth() + 1);
        renderCalendar();
    } else {
        const diaBtn = e.target.closest('.calendar-grid [data-dia]');
        if (diaBtn) {
            const dia = parseInt(diaBtn.dataset.dia, 10);
            const dataClicada = new Date(dataCalendario.getFullYear(), dataCalendario.getMonth(), dia);
            openHistoryOverlay(dataClicada);
        }
    }
}

function handleOverlayClick(e) {
    const overlay = e.target.closest('#history-details-overlay');
    if (overlay && (e.target === overlay || e.target.closest('.history-card-close-btn'))) {
        closeHistoryOverlay();
    }
}

function render() {
    return `
        <div class="card">
            <details class="accordion-item" open>
                <summary class="accordion-header" style="padding: 16px;">
                    <h4 class="accordion-title">HISTÓRICO DETALHADO</h4>
                    <i class="accordion-icon lni lni-chevron-down"></i>
                </summary>
                <div class="accordion-content" style="gap: 0;">
                    <div class="calendar-container">
                        <div class="calendar-nav">
                            <button id="btn-mes-anterior-compras" class="calendar-nav-btn"><i class="lni lni-chevron-left"></i></button>
                            <h5 id="calendario-compras-titulo" class="calendar-month-title"></h5>
                            <button id="btn-mes-seguinte-compras" class="calendar-nav-btn"><i class="lni lni-chevron-right"></i></button>
                        </div>
                        <div class="calendar-weekdays"><span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span></div>
                        <div id="calendario-compras-grid" class="calendar-grid"></div>
                        <p class="calendar-legend">Dias com compras registadas</p>
                    </div>
                </div>
            </details>
        </div>
    `;
}

function mount(container, overlayContainer, fornecedor) {
    if (!container || !overlayContainer || !fornecedor) return;

    containerNode = container;
    overlayContainerNode = overlayContainer;
    currentFornecedor = fornecedor;
    dataCalendario = new Date(); // Reset calendar to current month on mount
    dataSelecionada = null;

    containerNode.innerHTML = render();
    renderCalendar();

    containerNode.addEventListener('click', handleContainerClick);
    overlayContainerNode.addEventListener('click', handleOverlayClick);

    unsubscribe = store.subscribe(() => {
        if (containerNode) {
            renderCalendar();
        }
    });
}

function unmount() {
    if (unsubscribe) unsubscribe();
    if (containerNode) containerNode.removeEventListener('click', handleContainerClick);
    if (overlayContainerNode) overlayContainerNode.removeEventListener('click', handleOverlayClick);
    
    containerNode = null;
    overlayContainerNode = null;
    unsubscribe = null;
    currentFornecedor = null;
}

export default { render, mount, unmount };