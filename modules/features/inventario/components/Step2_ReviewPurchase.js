// /modules/features/inventario/components/Step2_ReviewPurchase.js (NOVO COMPONENTE-FILHO)
'use strict';

import { formatarMoeda } from '../../../shared/lib/utils.js';

let containerNode = null;
let onStateChangeCallback = null;
let wizardStateRef = null;

function handlePaymentMethodClick(e) {
    const target = e.target.closest('[data-metodo]');
    if (target && onStateChangeCallback) {
        const novoMetodo = target.dataset.metodo;
        if (wizardStateRef.metodoPagamento !== novoMetodo) {
            onStateChangeCallback({ metodoPagamento: novoMetodo });
        }
    }
}

function attachListeners() {
    const metodoGroup = containerNode.querySelector('#metodo-pagamento-group-step2');
    metodoGroup?.addEventListener('click', handlePaymentMethodClick);
}

function render() {
    if (!wizardStateRef) return '';

    const totalCompra = wizardStateRef.itensCompra.reduce((total, item) => total + item.custoTotalItem, 0);
    const totalItens = wizardStateRef.itensCompra.length;

    const itensRevisaoHTML = wizardStateRef.itensCompra.map(item => `
        <div class="card review-item-card">
            <p class="review-item-name">${item.nome}</p>
            <p class="review-item-details">
                ${item.quantidadeTotal} un. (${item.embalagens} x ${item.unidadesPorEmbalagem}) | Custo: ${formatarMoeda(item.custoTotalItem)}
            </p>
        </div>
    `).join('');

    return `
        <div class="form-group">
            <label class="form-label">Revisão dos Itens</label>
            <div class="list-container">
                ${itensRevisaoHTML}
            </div>
        </div>
        <div class="form-group summary-section">
            <p class="summary-line">Total de Itens: <strong>${totalItens}</strong></p>
            <p class="summary-line total-line">Custo Total da Compra: <strong class="total-value">${formatarMoeda(totalCompra)}</strong></p>
        </div>
         <div class="form-group">
            <label class="form-label">Método de Pagamento</label>
            <div id="metodo-pagamento-group-step2" class="segmented-control-group">
                <button type="button" class="segmented-control-button ${wizardStateRef.metodoPagamento === 'Numerário' ? 'active' : ''}" data-metodo="Numerário">Numerário</button>
                <button type="button" class="segmented-control-button ${wizardStateRef.metodoPagamento === 'TPA' ? 'active' : ''}" data-metodo="TPA">TPA</button>
            </div>
        </div>
    `;
}

export const mount = (container, initialState, onStateChange) => {
    containerNode = container;
    wizardStateRef = initialState;
    onStateChangeCallback = onStateChange;

    containerNode.innerHTML = render();
    attachListeners();
};

export const unmount = () => {
    containerNode = null;
    onStateChangeCallback = null;
    wizardStateRef = null;
};

export default { render, mount, unmount };