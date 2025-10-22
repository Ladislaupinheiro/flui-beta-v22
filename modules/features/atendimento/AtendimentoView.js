// /modules/features/atendimento/AtendimentoView.js (ARQUITETURA CORRIGIDA E COM AVATARES INTELIGENTES)
'use strict';

import store from '../../shared/services/Store.js';
import Router from '../../app/Router.js';
import { abrirModalAddCliente } from '../../shared/components/Modals.js';
import * as Toast from '../../shared/components/Toast.js';
import { gerarIniciais, gerarAvatarDeIniciaisSVG } from '../../shared/lib/utils.js';

let unsubscribe = null;
let viewNode = null;
let activeFilter = 'todos';
let searchTerm = '';

const isNovo = cliente => (new Date() - new Date(cliente.dataRegisto)) / (1000 * 60 * 60 * 24) <= 7;
const isAtivo = (contasAtivas, clienteId) => contasAtivas.some(c => c.clienteId === clienteId && c.status === 'ativa');
const temTag = (cliente, tag) => cliente.tags && cliente.tags.some(t => t.toLowerCase() === tag.toLowerCase());

function renderClientList() {
    if (!viewNode) return;
    const state = store.getState();
    const { clientes, contasAtivas } = state;
    let clientesFiltrados = clientes;

    switch (activeFilter) {
        case 'ativos': clientesFiltrados = clientes.filter(c => isAtivo(contasAtivas, c.id)); break;
        case 'novos': clientesFiltrados = clientes.filter(isNovo); break;
        case 'todos': break;
        default: clientesFiltrados = clientes.filter(c => temTag(c, activeFilter)); break;
    }

    if (searchTerm) {
        clientesFiltrados = clientesFiltrados.filter(c => c.nome.toLowerCase().includes(searchTerm));
    }

    const listaContainer = viewNode.querySelector('#lista-clientes-atendimento');
    if (!listaContainer) return;
    if (clientesFiltrados.length === 0) {
        listaContainer.innerHTML = `<div class="empty-state-container"><p>Nenhum cliente encontrado.</p></div>`;
        return;
    }

    listaContainer.innerHTML = clientesFiltrados.map(cliente => {
        // *** LÓGICA DO AVATAR INTELIGENTE APLICADA AQUI ***
        const avatarSrc = cliente.fotoDataUrl 
            ? cliente.fotoDataUrl 
            : gerarAvatarDeIniciaisSVG(gerarIniciais(cliente.nome));

        return `
        <div class="card client-card" data-cliente-id="${cliente.id}" data-cliente-nome="${cliente.nome}">
            <div class="client-card-info">
                <img src="${avatarSrc}" alt="Avatar de ${cliente.nome}" class="avatar">
                <p class="client-card-name">${cliente.nome}</p>
                ${isAtivo(contasAtivas, cliente.id) ? '<span class="status-indicator active"></span>' : ''}
            </div>
            <i class="lni lni-chevron-right card-arrow-icon"></i>
        </div>
    `}).join('');
}

function updateFilterButtons() {
    if (!viewNode) return;
    viewNode.querySelectorAll('.filter-chip').forEach(btn => {
        const filterName = btn.dataset.filter;
        if (filterName) { // Garante que o botão tem o data-attribute
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
            <input type="search" id="input-busca-cliente" class="search-input" placeholder="Encontrar cliente...">
        </header>
        <nav class="filter-bar">
            <button class="filter-chip active" data-filter="todos">Todos</button>
            <button class="filter-chip" data-filter="ativos">Ativos</button>
            <button class="filter-chip" data-filter="novos">Novos</button>
            ${userTagsHTML}
        </nav>
        <main class="page-content">
            <div id="lista-clientes-atendimento" class="list-container"></div>
        </main>
        <button id="btn-fab-atendimento" class="fab" title="Adicionar Novo Cliente"><i class="lni lni-plus"></i></button>
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

        const fab = e.target.closest('#btn-fab-atendimento');
        if (fab) {
            abrirModalAddCliente((novoCliente) => {
                const payload = { nome: novoCliente.nome, clienteId: novoCliente.id };
                store.dispatch({ type: 'ADD_ACCOUNT', payload });
                const contaCriada = store.getState().contasAtivas.find(c => c.clienteId === novoCliente.id && c.status === 'ativa');
                if(contaCriada) Router.navigateTo(`#conta-detalhes/${contaCriada.id}`);
            });
            return;
        }

        const clienteCard = e.target.closest('.client-card');
        if (clienteCard) {
            const { clienteId, clienteNome } = clienteCard.dataset;
            const state = store.getState();
            let contaAtiva = state.contasAtivas.find(c => c.clienteId === clienteId && c.status === 'ativa');
            
            if (contaAtiva) {
                Router.navigateTo(`#conta-detalhes/${contaAtiva.id}`);
            } else {
                const payload = { nome: clienteNome, clienteId: clienteId };
                store.dispatch({ type: 'ADD_ACCOUNT', payload });
                const novaConta = store.getState().contasAtivas.find(c => c.clienteId === clienteId && c.status === 'ativa');
                if(novaConta) Router.navigateTo(`#conta-detalhes/${novaConta.id}`);
            }
            return;
        }
    };

    const handleSearch = e => {
        searchTerm = e.target.value.toLowerCase();
        renderClientList();
    };
    
    viewNode.addEventListener('click', handleViewClick);
    viewNode.querySelector('#input-busca-cliente').addEventListener('input', handleSearch);

    unsubscribe = store.subscribe(() => {
        if (!viewNode) return;
        renderClientList();
        // A atualização dos filtros é desnecessária aqui, pois só mudam com clique
    });

    renderClientList();
    updateFilterButtons();
}

function unmount() {
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
    }
    viewNode = null;
}

export default {
    render,
    mount,
    unmount
};