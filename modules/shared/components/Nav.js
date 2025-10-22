// /modules/shared/components/Nav.js (REFATORADO COM BADGE DE ALERTA DE STOCK)
'use strict';

import Router from '../../app/Router.js';
import store from '../services/Store.js';
import { countLowStockItems } from '../../features/inventario/services/ProductAnalyticsService.js';

const sel = {};
let unsubscribe = null;

function updateStockAlertBadge() {
    const lowStockCount = countLowStockItems(store.getState());
    const badge = sel.navContainer?.querySelector('#stock-alert-badge');
    
    if (badge) {
        if (lowStockCount > 0) {
            badge.textContent = lowStockCount;
            badge.classList.add('visible');
        } else {
            badge.classList.remove('visible');
        }
    }
}

function render() {
    return `
        <nav id="bottom-nav" class="nav-bar">
            <button class="nav-item" data-hash="#dashboard" title="Dashboard">
                <div class="nav-item-indicator"></div>
                <i class="lni lni-grid-alt nav-item-icon"></i>
                <span class="nav-item-label">Dashboard</span>
            </button>
            <button class="nav-item" data-hash="#inventario" title="Inventário">
                <div class="nav-item-indicator"></div>
                <i class="lni lni-dropbox nav-item-icon"></i>
                <span class="nav-item-label">Inventário</span>
                <span id="stock-alert-badge" class="badge"></span>
            </button>
            <button class="nav-item" data-hash="#atendimento" title="Atendimento">
                <div class="nav-item-indicator"></div>
                <i class="lni lni-clipboard nav-item-icon"></i>
                <span class="nav-item-label">Atendimento</span>
            </button>
            <button class="nav-item" data-hash="#clientes" title="Clientes">
                <div class="nav-item-indicator"></div>
                <i class="lni lni-users nav-item-icon"></i>
                <span class="nav-item-label">Clientes</span>
            </button>
            <button class="nav-item" data-hash="#fluxo-caixa" title="Caixa">
                <div class="nav-item-indicator"></div>
                <i class="lni lni-stats-up nav-item-icon"></i>
                <span class="nav-item-label">Caixa</span>
            </button>
            <button class="nav-item" data-hash="#analises" title="Análises">
                <div class="nav-item-indicator"></div>
                <i class="lni lni-bar-chart nav-item-icon"></i>
                <span class="nav-item-label">Análises</span>
            </button>
        </nav>
    `;
}

function mount() {
    sel.navContainer = document.getElementById('bottom-nav');
    if (!sel.navContainer) return;

    sel.navContainer.addEventListener('click', (event) => {
        const navBtn = event.target.closest('.nav-item');
        if (!navBtn || !navBtn.dataset.hash) return;
        
        if (navBtn.classList.contains('active')) {
            const appRoot = document.getElementById('app-root');
            if (appRoot) {
                appRoot.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } else {
            window.location.hash = navBtn.dataset.hash;
        }
    });

    // Atualiza o badge na montagem inicial e subscreve a futuras mudanças
    updateStockAlertBadge();
    unsubscribe = store.subscribe(updateStockAlertBadge);
}

function unmount() {
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
    }
}

function updateActiveState(currentHash) {
    if (!sel.navContainer) {
        sel.navContainer = document.getElementById('bottom-nav');
        if (!sel.navContainer) return;
    }
    
    const baseHash = currentHash.split('/')[0] || '#dashboard';

    sel.navContainer.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.hash === baseHash);
    });
}

export default {
    render,
    mount,
    unmount, // Exporta a função de unmount para ser chamada se necessário
    updateActiveState
};