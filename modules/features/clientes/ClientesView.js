// /modules/features/clientes/ClientesView.js (ARQUITETURA REATORADA)
'use strict';

import store from '../../shared/services/Store.js';
import Router from '../../app/Router.js';
import { abrirModalAddCliente } from '../../shared/components/Modals.js';
import { getRankedClients } from './services/ClientAnalyticsService.js';
import { formatarMoeda, gerarIniciais, gerarAvatarDeIniciaisSVG } from '../../shared/lib/utils.js';

let unsubscribe = null;
let viewNode = null;
let activeFilter = 'todos';
let searchTerm = '';

const isNovo = cliente => (new Date() - new Date(cliente.dataRegisto)) / (1000 * 60 * 60 * 24) <= 7;
const temDivida = cliente => cliente.saldoDivida > 0;
const temTag = (cliente, tag) => cliente.tags && cliente.tags.some(t => t.toLowerCase() === tag.toLowerCase());

function renderClientList() {
    if (!viewNode) return;

    const state = store.getState();
    const clientesRankeados = getRankedClients(state);
    
    let clientesFiltrados = clientesRankeados;
    switch (activeFilter) {
        case 'novos': clientesFiltrados = clientesRankeados.filter(isNovo); break;
        case 'com divida': clientesFiltrados = clientesRankeados.filter(temDivida); break;
        case 'todos': break;
        default: clientesFiltrados = clientesRankeados.filter(c => temTag(c, activeFilter)); break;
    }
    if (searchTerm) {
        clientesFiltrados = clientesFiltrados.filter(c => c.nome.toLowerCase().includes(searchTerm));
    }

    const listaContainer = viewNode.querySelector('#lista-clientes-relatorio');
    if (!listaContainer) return;
    if (clientesFiltrados.length === 0) {
        listaContainer.innerHTML = `<div class="empty-state-container"><p>Nenhum cliente encontrado.</p></div>`;
        return;
    }

    listaContainer.innerHTML = clientesFiltrados.map((cliente, index) => {
        const ranking = clientesRankeados.findIndex(c => c.id === cliente.id) + 1;
        const avatarSrc = cliente.fotoDataUrl 
            ? cliente.fotoDataUrl 
            : gerarAvatarDeIniciaisSVG(gerarIniciais(cliente.nome));

        return `
        <div class="card client-card-detailed" data-cliente-id="${cliente.id}">
             ${cliente.saldoDivida > 0 ? `<div class="debt-chip top-right">${formatarMoeda(cliente.saldoDivida)}</div>` : ''}
            <div class="client-card-avatar-container">
                <span class="client-card-rank">${ranking}.</span>
                <img src="${avatarSrc}" alt="Avatar de ${cliente.nome}" class="avatar">
            </div>

            <div class="client-card-text">
                <p class="client-card-name">${cliente.nome}</p>
                <div class="chip-group">
                    ${(cliente.tags || []).map(tag => `<span class="chip">${tag}</span>`).join('')}
                </div>
            </div>

            <div class="client-card-metric">
                <span class="metric-value">${formatarMoeda(cliente.gastoTotal || 0)}</span>
                <span class="metric-label">Gasto Total</span>
            </div>
        </div>
    `}).join('');
}

function updateFilterButtons() {
    if(!viewNode) return;
    viewNode.querySelectorAll('.filter-chip').forEach(btn => {
        const filterName = btn.dataset.filter;
        if (filterName) {
            btn.classList.toggle('active', filterName.toLowerCase() === activeFilter);
        }
    });
}

function render() {
    const state = store.getState();
    const userTagsHTML = state.tagsDeCliente.map(tag => 
        `<button class="filter-chip" data-filter="${tag.nome.toLowerCase()}">${tag.nome}</button>`
    ).join('');

    return `
        <header class="page-header sticky-header">
            <input type="search" id="input-busca-cliente-relatorio" class="search-input" placeholder="Encontrar cliente...">
        </header>
        <nav class="filter-bar">
            <button class="filter-chip active" data-filter="todos">Todos</button>
            <button class="filter-chip" data-filter="com divida">Com Dívida</button>
            <button class="filter-chip" data-filter="novos">Novos</button>
            ${userTagsHTML}
        </nav>
        <main class="page-content">
            <div id="lista-clientes-relatorio" class="list-container"></div>
        </main>
        <button id="btn-fab-add-cliente-relatorio" class="fab"><i class="lni lni-plus"></i></button>
    `;
}

function mount() {
    viewNode = document.getElementById('app-root');
    viewNode.innerHTML = render();

    activeFilter = 'todos';
    searchTerm = '';

    const handleViewClick = (e) => {
        const filterBtn = e.target.closest('.filter-chip');
        if (filterBtn && filterBtn.dataset.filter) {
            activeFilter = filterBtn.dataset.filter.toLowerCase();
            updateFilterButtons();
            renderClientList();
            return;
        }

        const fab = e.target.closest('#btn-fab-add-cliente-relatorio');
        if (fab) {
            abrirModalAddCliente();
            return;
        }

        const clienteCard = e.target.closest('.client-card-detailed');
        if (clienteCard) {
            const clienteId = clienteCard.dataset.clienteId;
            Router.navigateTo(`#cliente-detalhes/${clienteId}`);
            return;
        }
    };

    const handleSearch = e => {
        searchTerm = e.target.value.toLowerCase();
        renderClientList();
    };

    viewNode.addEventListener('click', handleViewClick);
    viewNode.querySelector('#input-busca-cliente-relatorio').addEventListener('input', handleSearch);

    unsubscribe = store.subscribe(() => {
        if (!viewNode) return;
        renderClientList();
        // Não é necessário atualizar os botões aqui, pois só mudam com o clique.
    });

    renderClientList();
}

function unmount() {
    if (unsubscribe) unsubscribe();
    viewNode = null;
    unsubscribe = null;
}

export default { render, mount, unmount };