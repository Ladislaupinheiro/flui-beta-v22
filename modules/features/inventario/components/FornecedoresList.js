// /modules/features/inventario/components/FornecedoresList.js (CORRIGIDO: Espaçamento Superior)
'use strict';

import store from '../../../shared/services/Store.js';
import Router from '../../../app/Router.js';
import { getFornecedorProfile } from '../services/SupplierAnalyticsService.js';
import { formatarMoeda } from '../../../shared/lib/utils.js';

let containerNode = null;
let unsubscribe = null;

function renderList() {
    const state = store.getState();
    const fornecedores = state.fornecedores;

    if (fornecedores.length === 0) {
        return `<div class="empty-state-container" style="padding-top: var(--space-8);"><p>Adicione um fornecedor para começar a registar as suas compras de mercadoria.</p></div>`;
    }

    const listHTML = fornecedores.map(f => {
        const profile = getFornecedorProfile(f.id, state);
        return `
            <div class="card supplier-card" data-fornecedor-id="${f.id}">
                <div class="supplier-card-info">
                    <p class="supplier-card-name">${f.nome}</p>
                    <p class="supplier-card-contact">${f.contacto || 'Sem contacto'}</p>
                </div>
                <div class="client-card-metric">
                    <span class="metric-value">${formatarMoeda(profile.gastoTotal)}</span>
                    <span class="metric-label">Gasto Total</span>
                </div>
                <i class="lni lni-chevron-right card-arrow-icon"></i>
            </div>
        `;
    }).join('');

    // *** CORREÇÃO APLICADA AQUI: Adiciona padding-top ao container da lista ***
    return `<div class="list-container" style="padding: var(--space-4) var(--space-4) 0;">${listHTML}</div>`;
}

function handleContainerClick(e) {
    const card = e.target.closest('.supplier-card');
    if (card) {
        Router.navigateTo(`#fornecedor-detalhes/${card.dataset.fornecedorId}`);
    }
}

export function render() {
    return renderList();
}

export function mount(container) {
    containerNode = container;

    // Renderiza o conteúdo inicial DENTRO do container fornecido
    containerNode.innerHTML = renderList();

    containerNode.addEventListener('click', handleContainerClick);

    unsubscribe = store.subscribe(() => {
        if (containerNode) {
            const newHTML = renderList();
            // Morphdom atualiza o conteúdo DENTRO do containerNode
            morphdom(containerNode, `
                <div id="${containerNode.id}" class="${containerNode.className}">
                    ${newHTML}
                </div>
            `, { childrenOnly: true });
        }
    });
}


export function unmount() {
    if (unsubscribe) unsubscribe();
    if (containerNode) {
        containerNode.removeEventListener('click', handleContainerClick);
    }
    containerNode = null;
    unsubscribe = null;
}

export default { render, mount, unmount };