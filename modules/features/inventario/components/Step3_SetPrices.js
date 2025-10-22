// /modules/features/inventario/components/Step3_SetPrices.js (NOVO COMPONENTE-FILHO)
'use strict';

import store from '../../../shared/services/Store.js';

let containerNode = null;
let onStateChangeCallback = null;
let wizardStateRef = null;

function handlePriceInput(e) {
    const input = e.target.closest('.preco-venda-input');
    if (input && onStateChangeCallback) {
        const produtoId = input.closest('.price-setting-card').dataset.produtoId;
        const novosPrecosVenda = { ...wizardStateRef.precosVenda };
        novosPrecosVenda[produtoId] = input.value;
        onStateChangeCallback({ precosVenda: novosPrecosVenda });
    }
}

function attachListeners() {
    containerNode?.addEventListener('input', handlePriceInput);
}

function render() {
    if (!wizardStateRef) return '';

    const itensParaPrecoHTML = wizardStateRef.itensCompra.map(item => {
        const custoUnitario = item.quantidadeTotal > 0 ? (item.custoTotalItem / item.quantidadeTotal) : 0;
        const precoVendaAtual = wizardStateRef.precosVenda[item.produtoId] || '';
        const precoMenorQueCusto = precoVendaAtual !== '' && parseFloat(precoVendaAtual) < custoUnitario;

        return `
            <div class="card price-setting-card" data-produto-id="${item.produtoId}">
                <p class="price-setting-name">${item.nome}</p>
                <div class="form-group">
                    <label for="preco-venda-${item.produtoId}" class="form-label">Preço Venda (Kz)</label>
                    <input type="number" id="preco-venda-${item.produtoId}" class="input-field preco-venda-input"
                           min="0" step="any" value="${precoVendaAtual}" placeholder="0,00">
                    ${precoMenorQueCusto ? '<p class="warning-text"><i class="lni lni-warning"></i> Preço abaixo do custo!</p>' : ''}
                </div>
            </div>
        `;
    }).join('');

    return `
        <p class="form-help-text">Defina o preço de venda para os produtos registados nesta compra.</p>
        <div class="list-container">
            ${itensParaPrecoHTML}
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