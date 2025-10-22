'use strict';

import store from '../../../shared/services/Store.js';
import Router from '../../../app/Router.js';
import {
    abrirModalMoverStock,
    abrirModalEditProduto,
    abrirModalRegistarCompra,
    abrirModalAcoesFlutuantes,
    abrirModalConfirmacao,
    abrirModalGerirCategorias,
    abrirModalFiltroSubcategoria
} from '../../../shared/components/Modals.js';
import * as Toast from '../../../shared/components/Toast.js';
import { formatarMoeda, debounce } from '../../../shared/lib/utils.js';

let containerNode = null;
let unsubscribe = null;
let swiperInstances = [];

let localState = {
    activePrimaryFilter: store.getState().categoriasDeProduto.find(c => c.isSystemDefault)?.id || 'all',
    activeSecondaryFilter: null,
    searchTerm: ''
};

function destroySwipers() {
    swiperInstances.forEach(swiper => {
        if (swiper && typeof swiper.destroy === 'function') {
            swiper.destroy(true, true);
        } else if (swiper?.swiper && typeof swiper.swiper.destroy === 'function') {
             swiper.swiper.destroy(true, true);
        }
    });
    swiperInstances = [];
}

async function initializeSwipers() {
    destroySwipers();
    if (!containerNode) return;
    const swiperContainers = containerNode.querySelectorAll('swiper-container.product-carousel');
    swiperInstances = [];
    for (const swiperEl of swiperContainers) {
        if (document.body.contains(swiperEl)) {
             try {
                swiperEl.slidesPerView = 1;
                swiperEl.spaceBetween = 16;
                swiperEl.pagination = { clickable: true };

                if (!swiperEl.swiper) {
                    await swiperEl.initialize();
                } else {
                     swiperEl.swiper.update();
                }
                swiperInstances.push(swiperEl);
            } catch (error) {
                console.error("Erro ao inicializar Swiper Web Component:", error, swiperEl);
            }
        }
    }
}


function renderGrid() {
    const state = store.getState();
    const { inventario, categoriasDeProduto } = state;

    let produtosVisiveis = inventario.filter(p => p.stockLoja > 0 || p.stockArmazem > 0 || p.ultimaVenda !== null);

    const subcategoriasDaPrincipal = categoriasDeProduto
        .filter(c => c.parentId === localState.activePrimaryFilter)
        .map(c => c.nome.toLowerCase());

    if (subcategoriasDaPrincipal.length > 0) {
        produtosVisiveis = produtosVisiveis.filter(p => p.tags && p.tags.some(tag => subcategoriasDaPrincipal.includes(tag.toLowerCase())));
    } else if (localState.activePrimaryFilter !== 'all') {
         produtosVisiveis = [];
    }

    if (localState.activeSecondaryFilter) {
        produtosVisiveis = produtosVisiveis.filter(p => p.tags && p.tags.includes(localState.activeSecondaryFilter));
    }

    if (localState.searchTerm) {
        produtosVisiveis = produtosVisiveis.filter(p => p.nome.toLowerCase().includes(localState.searchTerm));
    }

    const produtosAgrupados = produtosVisiveis.reduce((acc, produto) => {
        const subcategoriaNome = produto.tags && produto.tags[0] ? produto.tags[0] : 'sem subcategoria';
        if (!acc[subcategoriaNome]) acc[subcategoriaNome] = [];
        acc[subcategoriaNome].push(produto);
        return acc;
    }, {});


    const subcategoriasOrdenadas = Object.keys(produtosAgrupados).sort((a, b) => a.localeCompare(b));

    const carrosseisHTML = subcategoriasOrdenadas.map(subcategoria => {
        const produtos = produtosAgrupados[subcategoria];
        const catData = categoriasDeProduto.find(c => c.nome.toLowerCase() === subcategoria.toLowerCase());
        const corCategoria = catData ? catData.cor : 'var(--text-placeholder)';

        const chunkSize = 3;
        const paginasDeProdutos = [];
        for (let i = 0; i < produtos.length; i += chunkSize) {
            paginasDeProdutos.push(produtos.slice(i, i + chunkSize));
        }

        const slidesHTML = paginasDeProdutos.map(pagina => `
            <swiper-slide>
                <div class="product-page-container">
                ${pagina.map(p => `
                    <div class="card product-card" data-produto-id="${p.id}" style="--category-color: ${corCategoria};">
                        <button class="button-icon product-card-menu-btn"><i class="lni lni-more-alt"></i></button>
                        <div class="product-card-main-area">
                            <div class="product-card-info">
                                <div>
                                    <h3 class="product-card-name">${p.nome}</h3>
                                    <p class="product-card-price ${p.precoVenda === null ? 'warning-text' : ''}">
                                        ${p.precoVenda !== null ? formatarMoeda(p.precoVenda) : 'Preço Indefinido!'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="product-card-stock-area">
                            <div class="stock-compartment"><label class="stock-label">Armazém</label><div class="stock-controls"><span class="stock-value">${p.stockArmazem}</span><button class="stock-action-button add" title="Registar Compra"><i class="lni lni-plus"></i></button></div></div>
                            <div class="stock-compartment"><label class="stock-label">Loja</label><div class="stock-controls"><span class="stock-value">${p.stockLoja}</span><button class="stock-action-button move" title="Mover para Loja"><i class="lni lni-chevron-right"></i></button></div></div>
                        </div>
                    </div>
                `).join('')}
                </div>
            </swiper-slide>`).join('');

        return `
            <h3 class="category-carousel-title">${subcategoria}</h3>
            <swiper-container class="product-carousel" init="false" pagination="true" slides-per-view="1" space-between="16">
                ${slidesHTML}
            </swiper-container>
            `;
    }).join('');

    return carrosseisHTML.trim() === '' ? `<div class="empty-state-container"><p>Nenhum produto encontrado com os filtros atuais.</p></div>` : carrosseisHTML;
}


function updateGridContent() {
    if (!containerNode) return;
    const gridContainer = containerNode.querySelector('#inventario-produtos-grid');
    if (!gridContainer) return;

    destroySwipers();
    const newHTML = renderGrid();

    morphdom(gridContainer, `
        <div id="inventario-produtos-grid" class="page-content-no-padding with-sticky-filters">
            ${newHTML}
        </div>
    `, { childrenOnly: true });

    initializeSwipers();
}

function render() {
    const state = store.getState();
    const categoriasPrincipais = state.categoriasDeProduto.filter(c => c.isSystemDefault);
    if (!localState.activePrimaryFilter || !categoriasPrincipais.some(c => c.id === localState.activePrimaryFilter)) {
         localState.activePrimaryFilter = categoriasPrincipais[0]?.id || 'all';
    }
    return `
        <div id="product-filters-container" class="sticky-filters">
             <div class="search-actions-bar">
                <div class="search-input-container">
                     <input type="search" id="input-busca-produto" class="search-input" placeholder="Encontrar produto..." value="${localState.searchTerm}">
                     <i class="lni lni-search-alt search-icon"></i>
                </div>
                <button id="btn-produto-actions" class="header-action-btn" title="Mais Ações"><i class="lni lni-more-alt"></i></button>
            </div>
            <div class="primary-filter-bar">
                <div class="segmented-control category-tabs">
                    ${categoriasPrincipais.map(cat => `<button class="segmented-control-button ${localState.activePrimaryFilter === cat.id ? 'active' : ''}" data-primary-filter="${cat.id}">${cat.nome}</button>`).join('')}
                </div>
            </div>
        </div>
        <div id="inventario-produtos-grid" class="page-content-no-padding with-sticky-filters">
            ${renderGrid()}
        </div>
    `;
}

function handleContainerClick(e) {
    const state = store.getState();

    const primaryFilterBtn = e.target.closest('[data-primary-filter]');
    if (primaryFilterBtn) {
        const primaryId = primaryFilterBtn.dataset.primaryFilter;
        containerNode?.querySelectorAll('.category-tabs .segmented-control-button').forEach(btn => btn.classList.remove('active'));
        primaryFilterBtn.classList.add('active');
        if (localState.activePrimaryFilter !== primaryId) {
            localState.activePrimaryFilter = primaryId;
            localState.activeSecondaryFilter = null;
            const subcategorias = state.categoriasDeProduto.filter(c => c.parentId === primaryId);
            const categoriaPai = state.categoriasDeProduto.find(c => c.id === primaryId);
            abrirModalFiltroSubcategoria(subcategorias, categoriaPai?.nome || '', (subcategoriaSelecionada) => {
                localState.activeSecondaryFilter = subcategoriaSelecionada ? subcategoriaSelecionada.nome.toLowerCase() : null;
                updateGridContent();
            });
             return;
        }
        return;
    }

    if (e.target.closest('#btn-produto-actions')) {
        abrirModalAcoesFlutuantes('Mais Opções', [
            { acao: 'ver_catalogo', texto: 'Ver Catálogo Global', icone: 'lni-book', callback: () => Router.navigateTo('#settings/catalogo-global') },
            { acao: 'gerir_categorias', texto: 'Gerir Categorias', icone: 'lni-layers', callback: () => abrirModalGerirCategorias() }
        ]);
        return;
    }

    const productCard = e.target.closest('.product-card');
    if (productCard) {
        const produto = state.inventario.find(p => p.id === productCard.dataset.produtoId);
        if (!produto) return;

        if (e.target.closest('.product-card-menu-btn')) {
             abrirModalAcoesFlutuantes(`Ações para ${produto.nome}`, [
                { acao: 'editar_inventario', texto: 'Editar Preço/Stock Mín.', icone: 'lni-pencil', callback: () => abrirModalEditProduto(produto) },
                { acao: 'apagar', texto: 'Apagar Produto', icone: 'lni-trash-can', cor: 'var(--feedback-error)', callback: () => {
                    abrirModalConfirmacao(`Apagar ${produto.nome}?`, 'Esta ação removerá o produto do inventário e catálogo. É irreversível.', () => {
                        store.dispatch({ type: 'DELETE_PRODUCT', payload: produto.id });
                        Toast.mostrarNotificacao(`Produto ${produto.nome} apagado.`);
                    });
                }}
            ]);
        } else if (e.target.closest('.stock-action-button.move')) {
            abrirModalMoverStock(produto);
        } else if (e.target.closest('.stock-action-button.add')) {
            const fornecedorAssociado = null;
            abrirModalRegistarCompra(fornecedorAssociado, produto);
        }
        return;
    }
}

const handleSearch = debounce((e) => {
    localState.searchTerm = e.target.value.toLowerCase();
    updateGridContent();
}, 300);

function mount(container) {
    containerNode = container;
    containerNode.innerHTML = render();
    containerNode.addEventListener('click', handleContainerClick);
    const searchInput = containerNode.querySelector('#input-busca-produto');
    if (searchInput) searchInput.addEventListener('input', handleSearch);
    initializeSwipers();
    unsubscribe = store.subscribe(() => {
        if (containerNode) {
            const currentSearchValue = containerNode.querySelector('#input-busca-produto')?.value || '';
            const currentPrimaryFilter = localState.activePrimaryFilter;
            updateGridContent();
            const searchInputAfterRender = containerNode.querySelector('#input-busca-produto');
            if(searchInputAfterRender) searchInputAfterRender.value = currentSearchValue;
             containerNode?.querySelectorAll('.category-tabs .segmented-control-button').forEach(btn => {
                 btn.classList.toggle('active', btn.dataset.primaryFilter === currentPrimaryFilter);
             });
        }
    });
}

function unmount() {
    destroySwipers();
    if (unsubscribe) unsubscribe();
    if (containerNode) {
        containerNode.removeEventListener('click', handleContainerClick);
        const searchInput = containerNode.querySelector('#input-busca-produto');
        if (searchInput) searchInput.removeEventListener('input', handleSearch);
    }
    containerNode = null;
    unsubscribe = null;
    const defaultPrimaryFilter = store.getState().categoriasDeProduto.find(c => c.isSystemDefault)?.id || 'all';
    localState = { activePrimaryFilter: defaultPrimaryFilter, activeSecondaryFilter: null, searchTerm: '' };
}

export default { render, mount, unmount };