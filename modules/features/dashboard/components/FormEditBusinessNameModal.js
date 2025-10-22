// /modules/features/dashboard/components/FormEditBusinessNameModal.js (REFATORADO COM ESTRUTURA SEMÂNTICA)
'use strict';

import store from '../../../shared/services/Store.js';
import * as Toast from '../../../shared/components/Toast.js';

export const render = (nomeAtual) => `
<div id="modal-edit-business-name-overlay" class="modal-overlay">
    <form id="form-edit-business-name" class="modal-container">
        <header class="modal-header">
            <h3 class="modal-title">Nome do Estabelecimento</h3>
            <button type="button" class="modal-close-button">&times;</button>
        </header>
        <div class="modal-body">
            <div class="form-group">
                <label for="input-edit-business-name" class="form-label">Novo Nome</label>
                <input type="text" id="input-edit-business-name" required class="input-field" value="${nomeAtual}">
            </div>
        </div>
        <footer class="modal-footer">
            <button type="submit" class="button button-primary full-width">Salvar Nome</button>
        </footer>
    </form>
</div>`;

export const mount = (closeModal, nomeAtual) => {
    const form = document.getElementById('form-edit-business-name');
    const inputNome = form.querySelector('#input-edit-business-name');
    inputNome.focus();
    inputNome.select();

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const novoNome = inputNome.value.trim();
        if (novoNome && novoNome !== nomeAtual) {
            store.dispatch({ type: 'UPDATE_CONFIG', payload: { businessName: novoNome } });
            Toast.mostrarNotificacao("Nome do estabelecimento atualizado.");
        }
        closeModal();
    });

    form.querySelector('.modal-close-button').addEventListener('click', closeModal);
    
    document.getElementById('modal-edit-business-name-overlay').addEventListener('click', e => {
        if (e.target.id === 'modal-edit-business-name-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {};