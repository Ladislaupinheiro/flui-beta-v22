// /modules/features/atendimento/ContaDetalhesView.js (REFATORADO COM ESTRUTURA SEMÂNTICA, SWIPER WEBC E SPLIT BUTTON)
'use strict';

import store from '../../shared/services/Store.js';
import Router from '../../app/Router.js';
import { 
    abrirModalPagamento, 
    abrirModalSeletorQuantidade, 
    abrirModalAcoesPedido,
    abrirModalAcoesFlutuantes,
    abrirModalTrocarCliente
} from '../../shared/components/Modals.js';
import * as Toast from '../../shared/components/Toast.js';

let unsubscribe = null;
let viewNode = null;
let contaAtivaId = null;

// Variáveis de estado para os filtros
let activePrimaryCategoryId = null;
let activeSecondaryCategoryId = null;
let selectedProductIdInSwiper = null;

function renderCategoryFilters() {
    const state = store.getState();
    const categoriasPrimarias = state.categoriasDeProduto.filter(c => c.isSystemDefault);
    
    if (categoriasPrimarias.length > 0 && !activePrimaryCategoryId) {
        activePrimaryCategoryId = categoriasPrimarias[0].id;
    }

    const categoriasSecundarias = state.categoriasDeProduto.filter(c => c.parentId === activePrimaryCategoryId);
    
    if (categoriasSecundarias.length > 0 && !activeSecondaryCategoryId) {
        activeSecondaryCategoryId = categoriasSecundarias[0].id;
    } else if (categoriasSecundarias.length === 0) {
        activeSecondaryCategoryId = null;
    }

    const primaryFiltersHTML = `
        <div class="segmented-control">
            ${categoriasPrimarias.map(cat => `
                <button class="segmented-control-button ${activePrimaryCategoryId === cat.id ? 'active' : ''}" 
                        data-category-id="${cat.id}">
                    ${cat.nome}
                </button>
            `).join('')}
        </div>
    `;

    const secondaryFiltersHTML = categoriasSecundarias.map(cat => `
        <button class="filter-chip ${activeSecondaryCategoryId === cat.id ? 'active' : ''}"
                data-category-id="${cat.id}">
            ${cat.nome}
        </button>
    `).join('');
    
    return { primaryFiltersHTML, secondaryFiltersHTML };
}

function renderPrateleira() {
    if (!viewNode || !activeSecondaryCategoryId) return '';

    const state = store.getState();
    const categoriaSecundaria = state.categoriasDeProduto.find(c => c.id === activeSecondaryCategoryId);
    if (!categoriaSecundaria) return '';

    const produtosDaCategoria = state.inventario.filter(p => 
        p.stockLoja > 0 && p.tags && p.tags.includes(categoriaSecundaria.nome.toLowerCase())
    );
    
    if (produtosDaCategoria.length === 0) {
        return `<div class="empty-state-container small"><p>Nenhum produto disponível.</p></div>`;
    }
    
    // SWIPER ATUALIZADO PARA WEB COMPONENT
    return produtosDaCategoria.map(p => `
        <swiper-slide class="shelf-item-slide">
            <div class="shelf-item" data-product-id="${p.id}">
                <div class="stock-badge-group">
                    <div class="stock-badge" title="Stock na Loja">${p.stockLoja}</div>
                    <div class="stock-badge secondary" title="Stock no Armazém">${p.stockArmazem}</div>
                </div>
                <div class="shelf-item-name">${p.nome}</div>
                <div class="selection-indicator ${selectedProductIdInSwiper === p.id ? 'visible' : ''}"></div>
            </div>
        </swiper-slide>
    `).join('');
}

function renderOrderList(conta) {
    if (!conta || conta.pedidos.length === 0) {
        return `<div class="empty-state-container"><p>Nenhum pedido nesta conta.</p></div>`;
    }

    // A lógica de agrupar pedidos permanece a mesma.
    const state = store.getState();
    const pedidosAgrupados = {};
    conta.pedidos.forEach(item => {
        const produto = state.inventario.find(p => p.id === item.produtoId);
        const tagSecundariaNome = (produto?.tags && produto.tags[0]) ? produto.tags[0].toLowerCase() : 'outros';
        const categoriaSecundaria = state.categoriasDeProduto.find(c => c.nome.toLowerCase() === tagSecundariaNome);
        const categoriaPrimaria = categoriaSecundaria ? state.categoriasDeProduto.find(c => c.id === categoriaSecundaria.parentId) : { id: 'outros', nome: 'Outros' };
        const grupoId = categoriaPrimaria.id;

        if (!pedidosAgrupados[grupoId]) {
            pedidosAgrupados[grupoId] = { nome: categoriaPrimaria.nome, items: [] };
        }
        pedidosAgrupados[grupoId].items.push(item);
    });

    return Object.values(pedidosAgrupados).map(grupo => {
        const classeCategoria = `order-group-${grupo.nome.toLowerCase().replace(/\s+/g, '-')}`;
        const itemsHTML = grupo.items.map(item => `
            <div class="card order-card" data-pedido-id="${item.id}">
                <div class="order-card-details">
                    <span class="order-card-quantity">${item.qtd}x</span>
                    <span class="order-card-name">${item.nome}</span>
                </div>
                <div class="order-card-actions">
                    <span class="order-card-price">${(item.preco * item.qtd).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                    <button class="order-card-menu-btn"><i class="lni lni-more-alt"></i></button>
                </div>
            </div>
        `).join('');

        return `
            <details class="accordion-item" open>
                <summary class="accordion-header">
                    <h3 class="accordion-title ${classeCategoria}">${grupo.nome}</h3>
                    <i class="accordion-icon lni lni-chevron-down"></i>
                </summary>
                <div class="accordion-content">
                    ${itemsHTML}
                </div>
            </details>
        `;
    }).join('');
}

function render(contaId) {
    const state = store.getState();
    const conta = state.contasAtivas.find(c => c.id === contaId);
    // Assegura que o cliente exista, senão redireciona (lógica movida para mount/update)
    const cliente = conta ? state.clientes.find(c => c.id === conta.clienteId) : null;
    if (!conta || !cliente) return `<div class="empty-state-container"><p>Conta ou cliente não encontrado.</p></div>`;

    const { primaryFiltersHTML, secondaryFiltersHTML } = renderCategoryFilters();
    const totalAPagar = conta.pedidos.reduce((total, p) => total + (p.preco * p.qtd), 0);
    const prateleiraHTML = renderPrateleira();

    return `
        <header class="page-header sticky-header with-filters">
            <div class="header-row">
                <button id="btn-voltar-atendimento" class="header-action-btn back-btn"><i class="lni lni-arrow-left"></i></button>
                ${primaryFiltersHTML}
            </div>
            <nav class="filter-bar">
                ${secondaryFiltersHTML}
            </nav>
        </header>

        <main class="page-content with-sticky-footer">
            <div class="card account-summary-card">
                <div class="account-summary-client">
                    <img src="${cliente.fotoDataUrl || './icons/logo-small-192.png'}" alt="Foto de ${cliente.nome}" class="avatar">
                    <span class="account-summary-name">${cliente.nome}</span>
                    <button class="btn-client-actions"><i class="lni lni-chevron-down"></i></button>
                </div>
                <div class="account-summary-total">
                     <span class="total-label">Total a pagar</span>
                     <span class="total-value">${totalAPagar.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                </div>
            </div>
            <div id="order-list-container" class="list-container">
                ${renderOrderList(conta)}
            </div>
        </main>

        <div class="bottom-action-bar expanded">
            <div class="shelf-container">
                <swiper-container slides-per-view="auto" space-between="8">
                    ${prateleiraHTML}
                </swiper-container>
            </div>
            <div class="split-button">
                <button id="btn-pagar" class="button button-primary split-button-main">Pagar</button>
                <button id="btn-pagar-actions" class="button button-primary split-button-trigger"><i class="lni lni-chevron-down"></i></button>
            </div>
        </div>
    `;
}

function mount(contaId) {
    viewNode = document.getElementById('app-root');
    contaAtivaId = contaId;
    
    const bottomNav = document.getElementById('bottom-nav');
    if (bottomNav) bottomNav.style.display = 'none';

    // Função central de re-renderização
    const updateView = () => { 
        if (!viewNode) return;
        const state = store.getState();
        const conta = state.contasAtivas.find(c => c.id === contaAtivaId);
        if(!conta || !state.clientes.find(c => c.id === conta.clienteId)) { Router.navigateTo('#atendimento'); return; }
        
        viewNode.innerHTML = render(contaId);
    };
    
    const handleViewClick = (e) => {
        const state = store.getState();
        const conta = state.contasAtivas.find(c => c.id === contaAtivaId);
        const cliente = conta ? state.clientes.find(c => c.id === conta.clienteId) : null;
        if (!conta || !cliente) return;

        if (e.target.closest('#btn-voltar-atendimento')) { Router.navigateTo('#atendimento'); return; }
        
        const primaryFilterBtn = e.target.closest('.segmented-control-button');
        if (primaryFilterBtn) {
            activePrimaryCategoryId = primaryFilterBtn.dataset.categoryId;
            const subcategorias = state.categoriasDeProduto.filter(c => c.parentId === activePrimaryCategoryId);
            activeSecondaryCategoryId = subcategorias.length > 0 ? subcategorias[0].id : null;
            selectedProductIdInSwiper = null;
            updateView();
            return;
        }

        const secondaryFilterBtn = e.target.closest('.filter-chip');
        if (secondaryFilterBtn) {
            activeSecondaryCategoryId = secondaryFilterBtn.dataset.categoryId;
            selectedProductIdInSwiper = null;
            updateView(); // Re-renderiza a view inteira para atualizar a prateleira e os botões
            return;
        }

        const prateleiraItem = e.target.closest('.shelf-item');
        if (prateleiraItem) {
            const produtoId = prateleiraItem.dataset.productId;
            const produto = state.inventario.find(p => p.id === produtoId);
            selectedProductIdInSwiper = produtoId;
            // Atualiza apenas a prateleira para performance
            const swiperContainer = viewNode.querySelector('swiper-container');
            if(swiperContainer) swiperContainer.innerHTML = renderPrateleira();
            if (produto) {
                abrirModalSeletorQuantidade(produto.nome, 0, (quantidade) => {
                    store.dispatch({ type: 'ADD_ORDER_ITEM', payload: { contaId, produto, quantidade } });
                    Toast.mostrarNotificacao(`${quantidade}x ${produto.nome} adicionado(s).`);
                    selectedProductIdInSwiper = null; // Reseta a seleção
                });
            }
            return;
        }
        
        const itemActionsBtn = e.target.closest('.order-card-menu-btn');
        if (itemActionsBtn) {
            const pedidoId = itemActionsBtn.closest('.order-card').dataset.pedidoId;
            const pedido = conta.pedidos.find(p => p.id === pedidoId);
            if (pedido) {
                abrirModalAcoesPedido(pedido,
                    () => abrirModalSeletorQuantidade(pedido.nome, pedido.qtd, (novaQuantidade) => store.dispatch({ type: 'UPDATE_ORDER_ITEM_QTD', payload: { contaId, pedidoId, novaQuantidade } })),
                    () => store.dispatch({ type: 'REMOVE_ORDER_ITEM', payload: { contaId, pedidoId } })
                );
            }
            return;
        }

        if (e.target.closest('.btn-client-actions')) {
            abrirModalAcoesFlutuantes('Ações do Cliente', [
                { acao: 'ver_perfil', texto: 'Ver Perfil do Cliente', icone: 'lni-user', callback: () => Router.navigateTo(`#cliente-detalhes/${cliente.id}`) },
                { acao: 'trocar_titular', texto: 'Trocar Titular da Conta', icone: 'lni-users', callback: () => {
                    abrirModalTrocarCliente(conta, (novoTitular) => {
                        store.dispatch({ type: 'CHANGE_ACCOUNT_CLIENT', payload: { contaId: conta.id, novoClienteId: novoTitular.clienteId, novoClienteNome: novoTitular.clienteNome } });
                        Toast.mostrarNotificacao(`Conta transferida para ${novoTitular.clienteNome}.`);
                    });
                }}
            ]);
            return;
        }

        if (e.target.closest('#btn-pagar')) {
            if(conta.pedidos.length > 0) abrirModalPagamento(conta);
            else Toast.mostrarNotificacao("Adicione pedidos à conta antes de pagar.", "erro");
            return;
        }
        
        if (e.target.closest('#btn-pagar-actions')) {
            const totalAPagar = conta.pedidos.reduce((total, p) => total + (p.preco * p.qtd), 0);
            if (totalAPagar <= 0) return Toast.mostrarNotificacao("Adicione pedidos à conta.", "erro");
            
            abrirModalAcoesFlutuantes('Opções de Pagamento', [
                { 
                    acao: 'add_divida', 
                    texto: 'Adicionar Total à Dívida', 
                    icone: 'lni-book', 
                    cor: 'var(--feedback-error)', 
                    callback: () => {
                        store.dispatch({ type: 'ADD_DEBT', payload: { clienteId: cliente.id, valor: totalAPagar, descricao: `Consumo da conta #${conta.nome}` } });
                        Toast.mostrarNotificacao(`Dívida adicionada a ${cliente.nome}.`);
                    }
                }
            ]);
            return;
        }
    };
    
    updateView(); // Renderização inicial
    viewNode.addEventListener('click', handleViewClick);
    
    unsubscribe = store.subscribe(() => { 
        if (!viewNode) return;
        const state = store.getState();
        const conta = state.contasAtivas.find(c => c.id === contaAtivaId);
        
        if(!conta || conta.status === 'fechada') {
            Toast.mostrarNotificacao("Conta finalizada.", "sucesso");
            if(unsubscribe) unsubscribe(); 
            Router.navigateTo('#atendimento');
            return;
        }
        
        // Atualizações "cirúrgicas" para melhor performance
        const orderListContainer = viewNode.querySelector('#order-list-container');
        if(orderListContainer) orderListContainer.innerHTML = renderOrderList(conta);

        const totalEl = viewNode.querySelector('.total-value');
        if (totalEl) totalEl.textContent = conta.pedidos.reduce((total, p) => total + (p.preco * p.qtd), 0).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    });
};

function unmount() { 
    if (unsubscribe) unsubscribe();
    
    const bottomNav = document.getElementById('bottom-nav');
    if (bottomNav) bottomNav.style.display = 'grid';

    unsubscribe = null;
    viewNode = null;
    contaAtivaId = null;
    activePrimaryCategoryId = null;
    activeSecondaryCategoryId = null;
    selectedProductIdInSwiper = null;
};

export default { render, mount, unmount };