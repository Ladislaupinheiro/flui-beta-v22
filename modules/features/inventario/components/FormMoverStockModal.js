// /modules/features/inventario/components/FormMoverStockModal.js (REFATORADO COM BOTTOM SHEET)
'use strict';

import store from '../../../shared/services/Store.js';
import * as Toast from '../../../shared/components/Toast.js';

export const render = (produto) => {
    const stockArmazemTotal = produto.stockArmazem || 0;

    return `
<div id="modal-mover-stock-overlay" class="modal-overlay bottom-sheet">
    <form id="form-mover-stock" class="modal-container bottom-sheet-container">
        <header class="modal-header">
            <div>
                <h3 class="modal-title">Mover Stock para Loja</h3>
                <p class="modal-subtitle">Produto: ${produto.nome}</p>
            </div>
            <button type="button" class="modal-close-button">&times;</button>
        </header>
        <div class="modal-body">
            <div class="stock-summary">
                <span class="stock-label">Disponível no Armazém</span>
                <strong class="stock-value">${stockArmazemTotal} un.</strong>
            </div>
            <div class="form-group">
                <label for="input-mover-stock-quantidade" class="form-label">Quantidade a Mover</label>
                <input type="number" id="input-mover-stock-quantidade" required min="1" max="${stockArmazemTotal}" class="input-field" placeholder="Ex: 12">
            </div>
            <div class="chip-group">
                <button type="button" class="filter-chip" data-qtd="6">+6</button>
                <button type="button" class="filter-chip" data-qtd="12">+12</button>
                <button type="button" class="filter-chip" data-qtd="24">+24</button>
                <button type="button" class="filter-chip" data-action="max">MAX</button>
            </div>
        </div>
        <footer class="modal-footer">
            <button type="submit" class="button button-primary full-width">Mover para Loja</button>
        </footer>
    </form>
</div>`;
};

export const mount = (closeModal, produto) => {
    const form = document.getElementById('form-mover-stock');
    const inputQtd = form.querySelector('#input-mover-stock-quantidade');
    const stockArmazemTotal = produto.stockArmazem || 0;
    inputQtd.focus();

    form.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        if (target.dataset.qtd) {
            const currentVal = parseInt(inputQtd.value, 10) || 0;
            const amountToAdd = parseInt(target.dataset.qtd, 10);
            const newVal = Math.min(currentVal + amountToAdd, stockArmazemTotal);
            inputQtd.value = newVal;
        }

        if (target.dataset.action === 'max') {
            inputQtd.value = stockArmazemTotal;
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const quantidade = parseInt(inputQtd.value);

        if (!produto || isNaN(quantidade) || quantidade <= 0) {
            return Toast.mostrarNotificacao("A quantidade deve ser um número positivo.", "erro");
        }
        if (quantidade > stockArmazemTotal) {
            return Toast.mostrarNotificacao(`Apenas ${stockArmazemTotal} un. disponíveis no armazém.`, "erro");
        }

        store.dispatch({ type: 'MOVE_STOCK', payload: { produtoId: produto.id, quantidade } });
        Toast.mostrarNotificacao(`${quantidade} un. de "${produto.nome}" movidas para a loja.`);
        closeModal();
    });

    form.querySelector('.modal-close-button').addEventListener('click', closeModal);
    
    document.getElementById('modal-mover-stock-overlay').addEventListener('click', e => {
        if (e.target.id === 'modal-mover-stock-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {};