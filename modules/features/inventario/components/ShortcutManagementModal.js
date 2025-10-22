// /modules/features/inventario/components/ShortcutManagementModal.js (REFATORADO COM ESTRUTURA SEMÂNTICA)
'use strict';

import store from '../../../shared/services/Store.js';
import * as Toast from '../../../shared/components/Toast.js';

export const render = (produto) => {
    const state = store.getState();
    const { priorityProducts } = state.config;
    const { inventario } = state;

    let slotsHTML = '';
    for (let i = 0; i < 3; i++) {
        const produtoId = priorityProducts[i];
        const produtoNoSlot = produtoId ? inventario.find(p => p.id === produtoId) : null;
        const nomeProduto = produtoNoSlot ? produtoNoSlot.nome : 'Vazio';

        slotsHTML += `
            <div class="shortcut-slot-item">
                <p class="shortcut-slot-label">Atalho ${i + 1}: <span class="shortcut-slot-product">${nomeProduto}</span></p>
                <button data-slot-index="${i}" class="button button-primary small btn-atribuir-atalho">Atribuir</button>
            </div>
        `;
    }

    return `
    <div id="modal-shortcut-management-overlay" class="modal-overlay">
        <div class="modal-container">
            <header class="modal-header">
                <div>
                    <h3 class="modal-title">Gerir Atalhos</h3>
                    <p class="modal-subtitle">Atribuir: ${produto.nome}</p>
                </div>
                <button type="button" class="modal-close-button">&times;</button>
            </header>
            
            <div class="modal-body with-padding">
                ${slotsHTML}
            </div>

            <footer class="modal-footer">
                <button class="button-text btn-fechar-modal-footer">Fechar</button>
            </footer>
        </div>
    </div>`;
};

export const mount = (closeModal, produto) => {
    const container = document.getElementById('modal-shortcut-management-overlay');

    container.addEventListener('click', e => {
        const target = e.target.closest('.btn-atribuir-atalho');
        if (target) {
            const slotIndex = parseInt(target.dataset.slotIndex, 10);
            
            const currentShortcuts = [...store.getState().config.priorityProducts];
            
            while (currentShortcuts.length < 3) {
                currentShortcuts.push(null);
            }
            
            const filteredShortcuts = currentShortcuts.map(id => (id === produto.id ? null : id));
            
            filteredShortcuts[slotIndex] = produto.id;

            store.dispatch({ type: 'UPDATE_SHORTCUTS', payload: filteredShortcuts });
            Toast.mostrarNotificacao(`"${produto.nome}" definido como Atalho ${slotIndex + 1}.`);
            closeModal();
        }
    });
    
    container.querySelector('.modal-close-button')?.addEventListener('click', closeModal);
    container.querySelector('.btn-fechar-modal-footer')?.addEventListener('click', closeModal);
    container.addEventListener('click', e => {
        if (e.target.id === 'modal-shortcut-management-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {};