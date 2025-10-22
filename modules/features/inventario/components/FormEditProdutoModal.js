// /modules/features/inventario/components/FormEditProdutoModal.js (REFATORADO COM ESTRUTURA SEMÂNTICA)
'use strict';

import store from '../../../shared/services/Store.js';
import * as Toast from '../../../shared/components/Toast.js';

export const render = (produto) => {
    const state = store.getState();
    const fornecedoresOptions = state.fornecedores.map(f => 
        `<option value="${f.id}" ${f.id === produto.fornecedorId ? 'selected' : ''}>${f.nome}</option>`
    ).join('');

    const tagsComoString = produto.tags ? produto.tags.join(', ') : '';

    return `
<div id="modal-edit-produto-overlay" class="modal-overlay">
    <form id="form-edit-produto" class="modal-container">
        <header class="modal-header">
            <h3 class="modal-title">Editar Produto</h3>
            <button type="button" class="modal-close-button">&times;</button>
        </header>
        <div class="modal-body">
            <div class="form-group">
                <label for="input-edit-produto-nome" class="form-label">Nome do Produto</label>
                <input type="text" id="input-edit-produto-nome" required class="input-field" value="${produto.nome}">
            </div>

            <div class="form-group">
                <label for="select-edit-produto-fornecedor" class="form-label">Fornecedor (não editável)</label>
                <select id="select-edit-produto-fornecedor" disabled class="input-field">
                    ${fornecedoresOptions}
                </select>
            </div>

            <div class="form-group">
                <label for="input-edit-produto-tags" class="form-label">Rótulos (separados por vírgula)</label>
                <input type="text" id="input-edit-produto-tags" class="input-field" placeholder="Ex: cerveja, álcool" value="${tagsComoString}">
            </div>

            <div class="form-group">
                <label for="input-edit-produto-preco-venda" class="form-label">Preço de Venda (Kz)</label>
                <input type="number" id="input-edit-produto-preco-venda" required min="0" step="any" class="input-field" value="${produto.precoVenda}">
            </div>
            
            <div class="form-group">
                <label for="input-edit-produto-stock-minimo" class="form-label">Stock Mínimo de Alerta</label>
                <input type="number" id="input-edit-produto-stock-minimo" required min="0" class="input-field" value="${produto.stockMinimo}">
            </div>
        </div>
        <footer class="modal-footer">
            <button type="submit" class="button button-primary full-width">Salvar Alterações</button>
        </footer>
    </form>
</div>`;
};

export const mount = (closeModal, produto) => {
    const form = document.getElementById('form-edit-produto');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const tags = form.querySelector('#input-edit-produto-tags').value.split(',')
            .map(tag => tag.trim()).filter(Boolean);

        const produtoAtualizado = {
            ...produto,
            nome: form.querySelector('#input-edit-produto-nome').value.trim(),
            precoVenda: parseFloat(form.querySelector('#input-edit-produto-preco-venda').value),
            stockMinimo: parseInt(form.querySelector('#input-edit-produto-stock-minimo').value),
            tags: tags
        };

        store.dispatch({ type: 'UPDATE_PRODUCT', payload: produtoAtualizado });
        Toast.mostrarNotificacao(`Produto "${produtoAtualizado.nome}" atualizado!`);
        closeModal();
    });

    form.querySelector('.modal-close-button').addEventListener('click', closeModal);
    
    document.getElementById('modal-edit-produto-overlay').addEventListener('click', e => {
        if (e.target.id === 'modal-edit-produto-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {};