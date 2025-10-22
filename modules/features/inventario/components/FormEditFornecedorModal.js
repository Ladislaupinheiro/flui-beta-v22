// /modules/features/inventario/components/FormEditFornecedorModal.js (NOVO)
'use strict';

import store from '../../../shared/services/Store.js';
import * as Toast from '../../../shared/components/Toast.js';

export const render = (fornecedor) => `
<div id="modal-edit-fornecedor-overlay" class="modal-overlay">
    <form id="form-edit-fornecedor" class="modal-container">
        <header class="modal-header">
            <h3 class="modal-title">Editar Fornecedor</h3>
            <button type="button" class="modal-close-button">&times;</button>
        </header>
        <div class="modal-body">
            <div class="form-group">
                <label for="input-fornecedor-nome" class="form-label">Nome da Empresa</label>
                <input type="text" id="input-fornecedor-nome" required class="input-field" value="${fornecedor.nome}">
            </div>
            <div class="form-group">
                <label for="input-fornecedor-contacto" class="form-label">Contacto (Telefone/Email)</label>
                <input type="text" id="input-fornecedor-contacto" class="input-field" value="${fornecedor.contacto || ''}">
            </div>
            <div class="form-group">
                <label for="input-fornecedor-localizacao" class="form-label">Localização (Opcional)</label>
                <input type="text" id="input-fornecedor-localizacao" class="input-field" value="${fornecedor.localizacao || ''}">
            </div>
        </div>
        <footer class="modal-footer">
            <button type="submit" class="button button-primary full-width">Salvar Alterações</button>
        </footer>
    </form>
</div>`;

export const mount = (closeModal, fornecedor) => {
    const form = document.getElementById('form-edit-fornecedor');
    const inputNome = form.querySelector('#input-fornecedor-nome');
    inputNome.focus();
    inputNome.select();

    form.addEventListener('submit', e => {
        e.preventDefault();
        const nome = inputNome.value.trim();
        if (!nome) {
            return Toast.mostrarNotificacao("O nome do fornecedor é obrigatório.", "erro");
        }

        const fornecedorAtualizado = {
            ...fornecedor,
            nome: nome,
            contacto: form.querySelector('#input-fornecedor-contacto').value.trim(),
            localizacao: form.querySelector('#input-fornecedor-localizacao').value.trim()
        };

        store.dispatch({ type: 'UPDATE_FORNECEDOR', payload: fornecedorAtualizado });
        Toast.mostrarNotificacao("Dados do fornecedor atualizados.");
        closeModal();
    });

    form.querySelector('.modal-close-button').addEventListener('click', closeModal);
    
    document.getElementById('modal-edit-fornecedor-overlay').addEventListener('click', e => {
        if (e.target.id === 'modal-edit-fornecedor-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {};