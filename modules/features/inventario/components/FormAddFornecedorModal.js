// /modules/features/inventario/components/FormAddFornecedorModal.js (REFATORADO COM ESTRUTURA SEMÂNTICA)
'use strict';

import store from '../../../shared/services/Store.js';
import * as Toast from '../../../shared/components/Toast.js';

export const render = () => `
<div id="modal-add-fornecedor-overlay" class="modal-overlay">
    <form id="form-add-fornecedor" class="modal-container">
        <header class="modal-header">
            <h3 class="modal-title">Novo Fornecedor</h3>
            <button type="button" class="modal-close-button">&times;</button>
        </header>
        <div class="modal-body">
            <div class="form-group">
                <label for="input-fornecedor-nome" class="form-label">Nome da Empresa</label>
                <input type="text" id="input-fornecedor-nome" required class="input-field" placeholder="Nome do fornecedor">
            </div>
            <div class="form-group">
                <label for="input-fornecedor-contacto" class="form-label">Contacto (Telefone/Email)</label>
                <input type="text" id="input-fornecedor-contacto" class="input-field">
            </div>
            <div class="form-group">
                <label for="input-fornecedor-localizacao" class="form-label">Localização (Opcional)</label>
                <input type="text" id="input-fornecedor-localizacao" class="input-field">
            </div>
        </div>
        <footer class="modal-footer">
            <button type="submit" class="button button-primary full-width">Registar Fornecedor</button>
        </footer>
    </form>
</div>`;

export const mount = (closeModal) => {
    const form = document.getElementById('form-add-fornecedor');
    const inputNome = form.querySelector('#input-fornecedor-nome');
    inputNome.focus();
    
    form.addEventListener('submit', e => {
        e.preventDefault();
        const nome = inputNome.value.trim();
        const contacto = form.querySelector('#input-fornecedor-contacto').value.trim();
        const localizacao = form.querySelector('#input-fornecedor-localizacao').value.trim();

        if (!nome) {
            return Toast.mostrarNotificacao("O nome do fornecedor é obrigatório.", "erro");
        }

        const payload = { nome, contacto, localizacao };
        store.dispatch({ type: 'ADD_FORNECEDOR', payload });

        Toast.mostrarNotificacao(`Fornecedor "${nome}" adicionado com sucesso.`);
        closeModal();
    });

    form.querySelector('.modal-close-button').addEventListener('click', closeModal);
    
    document.getElementById('modal-add-fornecedor-overlay').addEventListener('click', e => {
        if (e.target.id === 'modal-add-fornecedor-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {};