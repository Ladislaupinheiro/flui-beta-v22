// /modules/features/inventario/components/Step3_PurchaseFinalization.js (NOVO COMPONENTE-FILHO)
'use strict';

import { formatarMoeda } from '../../../shared/lib/utils.js';

let containerNode = null;
let onStateChangeCallback = null;
let wizardStateRef = null;

function calculateTotalCost(items) {
    return items.reduce((sum, item) => sum + (item.custoTotalItem || 0), 0);
}

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
    containerNode.querySelector('#metodo-pagamento-group')?.addEventListener('click', handlePaymentMethodClick);
}

function render() {
    if (!wizardStateRef) return '';

    const custoTotalGeral = calculateTotalCost(wizardStateRef.detailedPurchaseItems);
    
    // Atualiza o estado do orquestrador com o custo total geral
    if (onStateChangeCallback) {
        // Usa setTimeout para evitar chamadas de estado dentro do ciclo de render
        setTimeout(() => onStateChangeCallback({ custoTotalCompraGeral: custoTotalGeral }), 0);
    }

    return `
        <div class="finalization-summary-card card text-center">
            <p class="summary-label">Custo total da compra</p>
            <span class="final-cost-value">${formatarMoeda(custoTotalGeral)}</span>
        </div>

        <div class="payment-method-selection">
            <p class="summary-label" style="text-align: center;">Método de Pagamento</p>
            <div id="metodo-pagamento-group" class="segmented-control-group" style="max-width: 300px; margin: 0 auto;">
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