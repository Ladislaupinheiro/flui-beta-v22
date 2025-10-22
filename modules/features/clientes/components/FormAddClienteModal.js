// /modules/features/clientes/components/FormAddClienteModal.js (REFATORADO COM TAGIFY.JS)
'use strict';

import store from '../../../shared/services/Store.js';
import * as Toast from '../../../shared/components/Toast.js';

export const render = () => `
<div id="modal-add-cliente-overlay" class="modal-overlay">
    <form id="form-add-cliente" class="modal-container">
        <header class="modal-header">
            <h3 class="modal-title">Novo Cliente</h3>
            <button type="button" class="modal-close-button">&times;</button>
        </header>
        <div class="modal-body">
            <div class="form-group">
                <label for="input-cliente-nome" class="form-label">Nome Completo</label>
                <input type="text" id="input-cliente-nome" required class="input-field" placeholder="Nome do cliente">
            </div>
            <div class="form-group">
                <label for="input-cliente-contacto" class="form-label">Contacto (Opcional)</label>
                <input type="tel" id="input-cliente-contacto" class="input-field" placeholder="9xx xxx xxx">
            </div>
            <div class="form-group">
                <label for="input-cliente-tags" class="form-label">Rótulos (Ex: VIP, Amigo)</label>
                <input id="input-cliente-tags" class="input-field" placeholder="Adicione ou crie rótulos...">
            </div>
        </div>
        <footer class="modal-footer">
            <button type="submit" class="button button-primary full-width">Registar Cliente</button>
        </footer>
    </form>
</div>`;

export const mount = (closeModal, onClientAddedCallback) => {
    const form = document.getElementById('form-add-cliente');
    const inputNome = form.querySelector('#input-cliente-nome');
    const tagsInput = form.querySelector('#input-cliente-tags');
    inputNome.focus();
    
    const state = store.getState();
    const whitelistTags = state.tagsDeCliente.map(t => t.nome);

    // Inicialização do Tagify.js
    const tagify = new Tagify(tagsInput, {
        whitelist: whitelistTags,
        dropdown: {
            enabled: 0, // Mostra o dropdown de sugestões ao começar a digitar
            closeOnSelect: false // Permite adicionar múltiplas tags do dropdown
        },
        // A customização visual será feita via CSS para alinhar com os nossos tokens.
    });

    form.addEventListener('submit', e => {
        e.preventDefault();
        const nome = inputNome.value.trim();
        if (!nome) {
            return Toast.mostrarNotificacao("O nome do cliente é obrigatório.", "erro");
        }

        const novasTags = tagify.value.map(t => t.value);
        
        // Verifica se já existe um cliente com o mesmo nome (case-insensitive)
        if (state.clientes.some(c => c.nome.toLowerCase() === nome.toLowerCase())) {
            return Toast.mostrarNotificacao(`Já existe um cliente registado com o nome "${nome}".`, "erro");
        }

        const novoCliente = {
            id: crypto.randomUUID(),
            nome,
            contacto: form.querySelector('#input-cliente-contacto').value.trim(),
            dataRegisto: new Date().toISOString(),
            dividas: [],
            tags: novasTags,
            fotoDataUrl: null,
        };

        store.dispatch({ type: 'ADD_CLIENT', payload: novoCliente });
        
        // Sincroniza as novas tags com a lista global no Store
        novasTags.forEach(tagName => {
            if (!state.tagsDeCliente.some(t => t.nome.toLowerCase() === tagName.toLowerCase())) {
                store.dispatch({ type: 'ADD_CLIENT_TAG', payload: { nome: tagName } });
            }
        });

        Toast.mostrarNotificacao(`Cliente "${nome}" adicionado.`);
        closeModal();
        
        if (typeof onClientAddedCallback === 'function') {
            onClientAddedCallback(novoCliente);
        }
    });

    form.querySelector('.modal-close-button').addEventListener('click', closeModal);
    
    document.getElementById('modal-add-cliente-overlay').addEventListener('click', e => {
        if (e.target.id === 'modal-add-cliente-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {};