// /modules/features/clientes/components/FormEditClienteModal.js (REFATORADO COM ESTRUTURA SEMÂNTICA)
'use strict';

import store from '../../../shared/services/Store.js';
import * as Toast from '../../../shared/components/Toast.js';

export const render = (cliente) => `
<div id="modal-edit-cliente-overlay" class="modal-overlay">
    <form id="form-edit-cliente" class="modal-container">
        <header class="modal-header">
            <h3 class="modal-title">Editar Cliente</h3>
            <button type="button" class="modal-close-button">&times;</button>
        </header>
        <div class="modal-body">
            <div class="form-group">
                <label for="input-edit-cliente-nome" class="form-label">Nome Completo</label>
                <input type="text" id="input-edit-cliente-nome" required class="input-field" value="${cliente.nome}">
            </div>
            <div class="form-group">
                <label for="input-edit-cliente-contacto" class="form-label">Contacto (Opcional)</label>
                <input type="tel" id="input-edit-cliente-contacto" class="input-field" value="${cliente.contacto || ''}">
            </div>
        </div>
        <footer class="modal-footer">
            <button type="submit" class="button button-primary full-width">Salvar Alterações</button>
        </footer>
    </form>
</div>`;

export const mount = (closeModal, cliente) => {
    const form = document.getElementById('form-edit-cliente');
    const inputNome = form.querySelector('#input-edit-cliente-nome');
    inputNome.focus();
    inputNome.select();

    form.addEventListener('submit', e => {
        e.preventDefault();
        const nome = inputNome.value.trim();
        if (!nome) {
            return Toast.mostrarNotificacao("O nome do cliente é obrigatório.", "erro");
        }

        const clienteAtualizado = {
            ...cliente,
            nome: nome,
            contacto: form.querySelector('#input-edit-cliente-contacto').value.trim()
        };

        store.dispatch({ type: 'UPDATE_CLIENT', payload: clienteAtualizado });
        Toast.mostrarNotificacao(`Dados de "${nome}" atualizados.`);
        closeModal();
    });

    form.querySelector('.modal-close-button').addEventListener('click', closeModal);
    
    document.getElementById('modal-edit-cliente-overlay').addEventListener('click', e => {
        if (e.target.id === 'modal-edit-cliente-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {};