// /modules/features/settings/CatalogoGlobalView.js (CORRIGIDO E FINALIZADO)
'use strict';

import store from '../../shared/services/Store.js';
import Router from '../../app/Router.js';
import { abrirModalAddProduto } from '../../shared/components/Modals.js';
import { debounce } from '../../shared/lib/utils.js';

let viewNode = null;
let unsubscribe = null;
let searchTerm = '';

function renderProductList() {
    const state = store.getState();
    const { inventario, categoriasDeProduto } = state;
    
    let produtosVisiveis = inventario;

    if (searchTerm) {
        produtosVisiveis = produtosVisiveis.filter(p => p.nome.toLowerCase().includes(searchTerm));
    }

    if (produtosVisiveis.length === 0) {
        return `<div class="empty-state-container"><p>Nenhum produto encontrado no catálogo.</p></div>`;
    }

    produtosVisiveis.sort((a, b) => a.nome.localeCompare(b.nome));

    return produtosVisiveis.map(produto => {
        const subcategoria = produto.tags && produto.tags[0] ? produto.tags[0] : 'N/A';
        return `
            <div class="card catalog-item-card" data-produto-id="${produto.id}">
                <div class="catalog-item-info">
                    <span class="catalog-item-name">${produto.nome}</span>
                    <span class="catalog-item-category">${subcategoria}</span>
                </div>
                <div class="catalog-item-actions">
                    <button class="button-icon btn-edit-catalog-item" title="Editar Produto">
                        <i class="lni lni-pencil"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function render() {
    return `
        <div class="view-container">
            <header class="page-header sticky-header">
                <button type="button" id="btn-back-to-inventory" class="header-action-btn back-btn">
                    <i class="lni lni-arrow-left"></i>
                </button>
                <h2 class="page-title">Catálogo Global</h2>
                <div></div>
            </header>

            <div class="search-and-filter-bar">
                 <input type="search" id="input-busca-catalogo-global" class="search-input" placeholder="Buscar no catálogo..." value="${searchTerm}">
            </div>

            <main id="catalogo-list-container" class="page-content list-container">
                ${renderProductList()}
            </main>

            <button id="btn-fab-add-catalog-item" class="fab" title="Adicionar Novo Produto ao Catálogo">
                <i class="lni lni-plus"></i>
            </button>
        </div>
    `;
}

const handleSearch = debounce((e) => {
    searchTerm = e.target.value.toLowerCase();
    if (viewNode) {
        const listContainer = viewNode.querySelector('#catalogo-list-container');
        if (listContainer) {
            listContainer.innerHTML = renderProductList();
        }
    }
}, 300);

function handleViewClick(e) {
    if (e.target.closest('#btn-back-to-inventory')) {
        Router.navigateTo('#inventario');
        return;
    }

    if (e.target.closest('#btn-fab-add-catalog-item')) {
        abrirModalAddProduto();
        return;
    }

    const editButton = e.target.closest('.btn-edit-catalog-item');
    if (editButton) {
        const card = editButton.closest('.catalog-item-card');
        const produtoId = card?.dataset.produtoId;
        if (produtoId) {
            const produto = store.getState().inventario.find(p => p.id === produtoId);
            if (produto) {
                abrirModalAddProduto(produto);
            }
        }
        return;
    }
}

function mount(containerId = 'app-root') {
    viewNode = document.getElementById(containerId);
    if (!viewNode) return;

    viewNode.innerHTML = render();
    viewNode.addEventListener('click', handleViewClick);
    const searchInput = viewNode.querySelector('#input-busca-catalogo-global');
    if (searchInput) searchInput.addEventListener('input', handleSearch);

    unsubscribe = store.subscribe(() => {
        if (viewNode) {
            const listContainer = viewNode.querySelector('#catalogo-list-container');
            if (listContainer) {
                 const newListHTML = renderProductList();
                 morphdom(listContainer, `
                    <main id="catalogo-list-container" class="page-content list-container">
                        ${newListHTML}
                    </main>
                 `, { childrenOnly: true });
            }
        }
    });
}

function unmount() {
    if (unsubscribe) unsubscribe();
    if (viewNode) {
         viewNode.removeEventListener('click', handleViewClick);
         const searchInput = viewNode.querySelector('#input-busca-catalogo-global');
         if (searchInput) searchInput.removeEventListener('input', handleSearch);
    }
    viewNode = null;
    unsubscribe = null;
    searchTerm = '';
}

export default { render, mount, unmount };