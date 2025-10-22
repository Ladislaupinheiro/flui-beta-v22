// /modules/features/clientes/components/FormAddDividaModal.js (REFATORADO COM ESTRUTURA SEMÂNTICA)
'use strict';

import store from '../../../shared/services/Store.js';
import * as Toast from '../../../shared/components/Toast.js';

export const render = (cliente) => `
<div id="modal-add-divida-overlay" class="modal-overlay">
    <form id="form-add-divida" class="modal-container">
        <header class="modal-header">
            <div>
                <h3 class="modal-title">Adicionar Dívida</h3>
                <p class="modal-subtitle">Cliente: ${cliente.nome}</p>
            </div>
            <button type="button" class="modal-close-button">&times;</button>
        </header>
        <div class="modal-body">
            <div class="form-group">
                <label for="input-divida-valor" class="form-label">Valor da Dívida (Kz)</label>
                <input type="number" id="input-divida-valor" required min="1" class="input-field">
            </div>
            <div class="form-group">
                <label for="input-divida-descricao" class="form-label">Descrição</label>
                <input type="text" id="input-divida-descricao" required class="input-field" placeholder="Ex: 2 Cervejas">
            </div>
        </div>
        <footer class="modal-footer">
            <button type="submit" class="button button-error full-width">Adicionar Dívida</button>
        </footer>
    </form>
</div>`;

export const mount = (closeModal, cliente) => {
    const form = document.getElementById('form-add-divida');
    const inputValor = form.querySelector('#input-divida-valor');
    inputValor.focus();

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const valor = parseFloat(inputValor.value);
        const descricao = form.querySelector('#input-divida-descricao').value.trim();

        if (!valor || valor <= 0 || !descricao) {
            return Toast.mostrarNotificacao("Preencha todos os campos com valores válidos.", "erro");
        }

        store.dispatch({ type: 'ADD_DEBT', payload: { clienteId: cliente.id, valor, descricao } });
        Toast.mostrarNotificacao("Dívida adicionada com sucesso.");
        closeModal();
    });

    form.querySelector('.modal-close-button').addEventListener('click', closeModal);

    document.getElementById('modal-add-divida-overlay').addEventListener('click', e => {
        if (e.target.id === 'modal-add-divida-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {};