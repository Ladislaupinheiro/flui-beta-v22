// /modules/app/Router.js (VERSÃO ESTÁVEL ANTERIOR)
'use strict';

import Nav from '../shared/components/Nav.js';
import DashboardView from '../features/dashboard/DashboardView.js';
import InventarioView from '../features/inventario/InventarioView.js';
import AtendimentoView from '../features/atendimento/AtendimentoView.js';
import ClientesView from '../features/clientes/ClientesView.js';
import ClienteDetalhesView from '../features/clientes/ClienteDetalhesView.js';
import FornecedorDetalhesView from '../features/inventario/FornecedorDetalhesView.js';
import ContaDetalhesView from '../features/atendimento/ContaDetalhesView.js';
import FluxoCaixaView from '../features/financas/FluxoCaixaView.js';
import AnálisesView from '../features/analises/AnálisesView.js';
import SettingsView from '../features/settings/SettingsView.js';
import BusinessInfoView from '../features/settings/BusinessInfoView.js';
import CatalogoGlobalView from '../features/settings/CatalogoGlobalView.js'; // <-- NOVA 

const sel = {};
let currentView = null;

const routes = {
    '#dashboard': DashboardView,
    '#inventario': InventarioView,
    '#atendimento': AtendimentoView,
    '#clientes': ClientesView,
    '#cliente-detalhes': ClienteDetalhesView,
    '#fornecedor-detalhes': FornecedorDetalhesView,
    '#conta-detalhes': ContaDetalhesView,
    '#fluxo-caixa': FluxoCaixaView,
    '#analises': AnálisesView,
    '#settings': SettingsView,
    '#settings/business-info': BusinessInfoView,
    '#settings/catalogo-global': CatalogoGlobalView // <-- NOVA ROTA
};

function loadRoute() {
    let hash = window.location.hash || '#dashboard';
    let viewModule;
    let params = null;

    if (hash.startsWith('#cliente-detalhes/')) {
        viewModule = routes['#cliente-detalhes'];
        params = hash.split('/')[1];
    } else if (hash.startsWith('#fornecedor-detalhes/')) {
        viewModule = routes['#fornecedor-detalhes'];
        params = hash.split('/')[1];
    } else if (hash.startsWith('#conta-detalhes/')) {
        viewModule = routes['#conta-detalhes'];
        params = hash.split('/')[1];
    } else if (hash.startsWith('#inventario/')) {
        viewModule = routes['#inventario'];
        params = hash.split('/')[1];
    } else {
        viewModule = routes[hash];
    }

    if (!viewModule) {
        console.warn(`Rota não encontrada para o hash: ${hash}. A redirecionar para o dashboard.`);
        window.location.hash = '#dashboard';
        return;
    }

    if (currentView && typeof currentView.unmount === 'function') {
        currentView.unmount();
    }

    if (sel.appRoot) {
        sel.appRoot.innerHTML = viewModule.render(params);
        if (typeof viewModule.mount === 'function') {
            // A chamada original passava apenas os parâmetros, não o ID do container
            viewModule.mount(params);
        }
    }
    
    currentView = viewModule;

    Nav.updateActiveState(hash);
}

function init() {
    sel.appRoot = document.getElementById('app-root');
    if (!sel.appRoot) {
        console.error("Elemento 'app-root' não encontrado. A aplicação não pode ser renderizada.");
        return;
    }

    if (!document.getElementById('bottom-nav')) {
        sel.appRoot.insertAdjacentHTML('afterend', Nav.render());
        Nav.mount();
    }

    window.addEventListener('hashchange', loadRoute);
    loadRoute();
}

export default {
    init,
    navigateTo: (hash) => {
        window.location.hash = hash;
    }
};