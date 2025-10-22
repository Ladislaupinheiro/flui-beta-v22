// /modules/features/inventario/components/FormGerirCategoriasModal.js (REFATORADO COM NOVA UI DE GESTÃO)
'use strict';

import store from '../../../shared/services/Store.js';
import * as Toast from '../../../shared/components/Toast.js';
import { abrirModalConfirmacao, abrirModalAddSubcategoria } from '../../../shared/components/Modals.js';

function renderListaCategorias() {
    const state = store.getState();
    const categoriasPrimarias = state.categoriasDeProduto.filter(cat => cat.isSystemDefault);

    if (categoriasPrimarias.length === 0) {
        return `<p class="empty-list-message">Nenhuma categoria principal encontrada.</p>`;
    }

    return categoriasPrimarias.map(primaria => {
        const filhasHTML = state.categoriasDeProduto
            .filter(sec => sec.parentId === primaria.id)
            .sort((a, b) => a.nome.localeCompare(b.nome)) // Ordena alfabeticamente
            .map(sec => `
                <div class="subcategory-item">
                    <div class="subcategory-info">
                        <div class="color-swatch" style="background-color: ${sec.cor};"></div>
                        <span class="subcategory-name">${sec.nome}</span>
                    </div>
                    ${!sec.isSystemDefault ? `
                    <button class="button-icon delete btn-apagar-categoria" data-id="${sec.id}" data-nome="${sec.nome}" title="Apagar Subcategoria">
                        <i class="lni lni-trash-can"></i>
                    </button>` : ''}
                </div>
            `).join('');

        return `
            <div class="card">
                <div class="card-header">
                    <h4>${primaria.nome}</h4>
                </div>
                <div class="card-body-list">
                    ${filhasHTML || '<p class="empty-list-message small">Nenhuma subcategoria.</p>'}
                    <button class="button button-secondary dashed small btn-add-subcategoria-inline" data-parent-id="${primaria.id}">
                        + Adicionar Subcategoria
                    </button>
                </div>
            </div>
        `;
    }).join('');
}


export const render = () => `
<div id="modal-gerir-categorias-overlay" class="modal-overlay">
    <div class="modal-container">
        <header class="modal-header">
            <h3 class="modal-title">Gerir Categorias</h3>
            <button type="button" class="modal-close-button">&times;</button>
        </header>
        
        <div id="lista-categorias-container" class="modal-body with-padding">
            ${renderListaCategorias()}
        </div>

        <footer class="modal-footer">
            <button class="button button-secondary full-width btn-fechar-modal">Fechar</button>
        </footer>
    </div>
</div>`;

export const mount = (closeModal) => {
    const container = document.getElementById('modal-gerir-categorias-overlay');
    
    // Subscrição para re-renderizar a lista quando uma nova categoria é adicionada
    let unsubscribe = store.subscribe(() => {
        const listaContainer = document.getElementById('lista-categorias-container');
        if (listaContainer) {
            listaContainer.innerHTML = renderListaCategorias();
        }
    });

    container.addEventListener('click', e => {
        const btnApagar = e.target.closest('.btn-apagar-categoria');
        if (btnApagar) {
            const { id, nome } = btnApagar.dataset;
            abrirModalConfirmacao(
                `Apagar Subcategoria?`,
                `Tem a certeza que deseja apagar a subcategoria "${nome}"?`,
                () => {
                    store.dispatch({ type: 'DELETE_PRODUCT_CATEGORY', payload: id });
                    Toast.mostrarNotificacao(`Subcategoria "${nome}" apagada.`);
                }
            );
            return;
        }

        const btnAdicionar = e.target.closest('.btn-add-subcategoria-inline');
        if (btnAdicionar) {
            const parentId = btnAdicionar.dataset.parentId;
            abrirModalAddSubcategoria(parentId);
            return;
        }
        
        if (e.target.closest('.btn-fechar-modal') || e.target.closest('.modal-close-button')) {
            closeModal();
            return;
        }
    });
    
    // Wrapper para a função closeModal para garantir que a subscrição é cancelada
    const enhancedCloseModal = () => {
        if (unsubscribe) unsubscribe();
        unsubscribe = null;
        closeModal();
    };

    container.querySelector('.modal-close-button').addEventListener('click', enhancedCloseModal, { once: true });
    container.querySelector('.btn-fechar-modal').addEventListener('click', enhancedCloseModal, { once: true });
    container.addEventListener('click', e => {
        if (e.target.id === 'modal-gerir-categorias-overlay') {
            enhancedCloseModal();
        }
    });
};

export const unmount = () => {
    // A lógica de unmount agora é tratada dentro do enhancedCloseModal
};