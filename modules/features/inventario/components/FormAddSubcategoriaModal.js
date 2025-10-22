// /modules/features/inventario/components/FormAddSubcategoriaModal.js (NOVO)
'use strict';

import store from '../../../shared/services/Store.js';
import * as Toast from '../../../shared/components/Toast.js';

export const render = (categoriaPaiPreSelecionadaId = null) => {
    const state = store.getState();
    const categoriasPrimarias = state.categoriasDeProduto.filter(cat => cat.isSystemDefault);
    
    // Se nenhuma categoria pai for pré-selecionada, assume a primeira da lista
    const categoriaPaiAtivaId = categoriaPaiPreSelecionadaId || (categoriasPrimarias.length > 0 ? categoriasPrimarias[0].id : null);

    return `
<div id="modal-add-subcategoria-overlay" class="modal-overlay">
    <form id="form-add-subcategoria" class="modal-container">
        <header class="modal-header">
            <h3 class="modal-title">Nova Subcategoria</h3>
            <button type="button" class="modal-close-button">&times;</button>
        </header>
        <div class="modal-body">
            <div class="form-group">
                <label for="input-subcategoria-nome" class="form-label">Nome da Subcategoria</label>
                <input type="text" id="input-subcategoria-nome" required class="input-field" placeholder="Ex: Cerveja Artesanal">
            </div>
            <div class="form-group">
                <label class="form-label">Associar à Categoria Principal</label>
                <div id="categoria-pai-selector" class="segmented-control-group">
                    ${categoriasPrimarias.map(cp => `
                        <button type="button" class="segmented-control-button ${categoriaPaiAtivaId === cp.id ? 'active' : ''}" data-cat-id="${cp.id}">${cp.nome}</button>
                    `).join('')}
                </div>
            </div>
            <div class="form-group">
                <label for="input-subcategoria-cor" class="form-label">Cor de Identificação</label>
                <div class="form-group-inline">
                    <div class="form-group flex-grow">
                        <input type="text" id="input-subcategoria-cor-text" class="input-field" value="#8B5CF6">
                    </div>
                    <input type="color" id="input-subcategoria-cor-picker" value="#8B5CF6" class="color-input-field">
                </div>
            </div>
        </div>
        <footer class="modal-footer">
            <button type="submit" class="button button-primary full-width">Criar Subcategoria</button>
        </footer>
    </form>
</div>`;
};

export const mount = (closeModal, categoriaPaiPreSelecionadaId) => {
    const form = document.getElementById('form-add-subcategoria');
    const nomeInput = form.querySelector('#input-subcategoria-nome');
    const corTextInput = form.querySelector('#input-subcategoria-cor-text');
    const corPickerInput = form.querySelector('#input-subcategoria-cor-picker');
    const catPaiSelector = form.querySelector('#categoria-pai-selector');
    
    let parentId = categoriaPaiPreSelecionadaId || catPaiSelector.querySelector('.active')?.dataset.catId;
    nomeInput.focus();

    corTextInput.addEventListener('input', (e) => { corPickerInput.value = e.target.value; });
    corPickerInput.addEventListener('input', (e) => { corTextInput.value = e.target.value; });

    catPaiSelector.addEventListener('click', e => {
        const target = e.target.closest('[data-cat-id]');
        if (!target) return;
        parentId = target.dataset.catId;
        catPaiSelector.querySelectorAll('.segmented-control-button').forEach(btn => btn.classList.remove('active'));
        target.classList.add('active');
    });

    form.addEventListener('submit', e => {
        e.preventDefault();
        const nome = nomeInput.value.trim();
        const cor = corPickerInput.value;

        if (!nome || !parentId) { 
            return Toast.mostrarNotificacao("Preencha o nome e selecione a categoria principal.", "erro"); 
        }

        const subcategoriasExistentes = store.getState().categoriasDeProduto
            .filter(cat => cat.parentId === parentId);
        
        if (subcategoriasExistentes.some(sc => sc.nome.toLowerCase() === nome.toLowerCase())) {
            return Toast.mostrarNotificacao(`A subcategoria "${nome}" já existe nesta categoria.`, "erro");
        }

        store.dispatch({ type: 'ADD_PRODUCT_CATEGORY', payload: { nome, cor, parentId } });
        Toast.mostrarNotificacao(`Subcategoria "${nome}" adicionada.`);
        closeModal();
    });

    form.querySelector('.modal-close-button').addEventListener('click', closeModal);
    document.getElementById('modal-add-subcategoria-overlay').addEventListener('click', e => {
        if (e.target.id === 'modal-add-subcategoria-overlay') closeModal();
    });
};

export const unmount = () => {};