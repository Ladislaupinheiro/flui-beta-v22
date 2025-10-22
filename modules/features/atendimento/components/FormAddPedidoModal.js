// /modules/features/atendimento/components/FormAddPedidoModal.js (REFATORADO COM ESTRUTURA SEMÂNTICA)
'use strict';

import store from '../../../shared/services/Store.js';
import * as Toast from '../../../shared/components/Toast.js';
import { debounce } from '../../../shared/lib/utils.js';

let produtoSelecionado = null;
let confirmationTimeout = null;

function showState(stateName) {
    const productStateDiv = document.getElementById('state-product-selection');
    const quantityStateDiv = document.getElementById('state-quantity-selection');
    const confirmationStateDiv = document.getElementById('state-confirmation');

    if (!productStateDiv || !quantityStateDiv || !confirmationStateDiv) return;

    productStateDiv.classList.toggle('hidden', stateName !== 'product');
    quantityStateDiv.classList.toggle('hidden', stateName !== 'quantity');
    confirmationStateDiv.classList.toggle('hidden', stateName !== 'confirmation');
}

function renderizarResultadosBusca(termo) {
    const resultadosContainer = document.getElementById('autocomplete-results');
    const shortcutsContainer = document.getElementById('shortcuts-container');
    if (!resultadosContainer) return;

    if (!termo || termo.length < 2) {
        resultadosContainer.innerHTML = '';
        resultadosContainer.classList.add('hidden');
        if (shortcutsContainer) shortcutsContainer.classList.remove('hidden');
        return;
    }
    
    if (shortcutsContainer) shortcutsContainer.classList.add('hidden');
    const resultados = store.getState().inventario.filter(p => p.nome.toLowerCase().includes(termo.toLowerCase()) && p.stockLoja > 0);
    
    if (resultados.length > 0) {
        resultadosContainer.innerHTML = resultados.map(produto => `
            <div class="search-result-item interactive" data-product-id="${produto.id}">
                <span class="search-result-name">${produto.nome}</span>
                <span class="search-result-stock">Loja: <strong>${produto.stockLoja}</strong></span>
            </div>
        `).join('');
        resultadosContainer.classList.remove('hidden');
    } else {
        resultadosContainer.innerHTML = `<p class="empty-list-message">Nenhum produto encontrado.</p>`;
        resultadosContainer.classList.remove('hidden');
    }
}

export const render = (conta) => {
    const state = store.getState();
    const shortcutIds = state.config.priorityProducts || [];
    const shortcutProducts = shortcutIds.map(id => state.inventario.find(p => p.id === id)).filter(Boolean);

    return `
    <div id="modal-add-pedido-overlay" class="modal-overlay">
        <form id="form-add-pedido" class="modal-container">
            <header class="modal-header">
                <h3 id="modal-header-title" class="modal-title">Adicionar Pedido a ${conta.nome}</h3>
                <button type="button" class="modal-close-button">&times;</button>
            </header>
            
            <div class="modal-body">
                <div id="state-product-selection">
                    <div id="shortcuts-container" class="shortcut-container">
                        ${shortcutProducts.map(p => `
                            <button type="button" class="shortcut-button" data-product-id="${p.id}">
                                ${p.nome}
                            </button>
                        `).join('')}
                    </div>
                    <div class="form-group with-autocomplete">
                        <input type="search" id="input-busca-produto-pedido" class="input-field" placeholder="Ou procure por outro produto..." autocomplete="off">
                        <div id="autocomplete-results" class="autocomplete-results hidden"></div>
                    </div>
                </div>

                <div id="state-quantity-selection" class="hidden">
                    <div id="quantity-grid" class="quantity-grid">
                        ${[...Array(12).keys()].map(i => `<button type="button" class="quantity-grid-button" data-qtd="${i + 1}">${i + 1}</button>`).join('')}
                    </div>
                </div>

                <div id="state-confirmation" class="hidden confirmation-state">
                    <div class="confirmation-icon success">
                        <i class="lni lni-checkmark-circle"></i>
                    </div>
                    <p id="confirmation-text" class="confirmation-message"></p>
                    <button type="button" id="btn-add-more" class="button button-secondary dashed full-width">
                        + Adicionar mais
                    </button>
                </div>
            </div>
        </form>
    </div>`;
};

export const mount = (closeModal, contaId) => {
    const conta = store.getState().contasAtivas.find(c => c.id === contaId);
    if (!conta) return closeModal();

    const form = document.getElementById('form-add-pedido');
    const headerTitle = document.getElementById('modal-header-title');
    const productSelectionDiv = document.getElementById('state-product-selection');
    const quantitySelectionDiv = document.getElementById('state-quantity-selection');
    
    const handleProductSelection = (produtoId) => {
        produtoSelecionado = store.getState().inventario.find(p => p.id === produtoId);
        if (produtoSelecionado) {
            headerTitle.textContent = `Qtd. para ${produtoSelecionado.nome}`;
            showState('quantity');
        }
    };
    
    const handleQuantitySelection = (qtd) => {
        store.dispatch({ type: 'ADD_ORDER_ITEM', payload: { contaId, produto: produtoSelecionado, quantidade: qtd } });
        
        document.getElementById('confirmation-text').textContent = `${qtd}x ${produtoSelecionado.nome} adicionado(s)`;
        showState('confirmation');

        clearTimeout(confirmationTimeout);
        confirmationTimeout = setTimeout(() => {
            headerTitle.textContent = `Adicionar Pedido a ${conta.nome}`;
            showState('product');
        }, 4000);
    };

    productSelectionDiv.addEventListener('click', e => {
        const shortcutBtn = e.target.closest('.shortcut-button');
        const searchResult = e.target.closest('.search-result-item');
        if (shortcutBtn) handleProductSelection(shortcutBtn.dataset.productId);
        if (searchResult) handleProductSelection(searchResult.dataset.productId);
    });
    
    document.getElementById('input-busca-produto-pedido').addEventListener('input', debounce(e => renderizarResultadosBusca(e.target.value), 300));
    
    quantitySelectionDiv.addEventListener('click', e => {
        const quantityBtn = e.target.closest('.quantity-grid-button');
        if (quantityBtn) handleQuantitySelection(parseInt(quantityBtn.dataset.qtd, 10));
    });

    document.getElementById('btn-add-more').addEventListener('click', () => {
        clearTimeout(confirmationTimeout);
        headerTitle.textContent = `Adicionar Pedido a ${conta.nome}`;
        showState('product');
    });

    form.querySelector('.modal-close-button').addEventListener('click', closeModal);
    document.getElementById('modal-add-pedido-overlay').addEventListener('click', e => {
        if (e.target.id === 'modal-add-pedido-overlay') closeModal();
    });
    
    showState('product');
};

export const unmount = () => {
    produtoSelecionado = null;
    clearTimeout(confirmationTimeout);
};