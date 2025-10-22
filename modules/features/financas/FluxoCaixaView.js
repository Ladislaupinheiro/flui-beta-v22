// /modules/features/financas/FluxoCaixaView.js (ORQUESTRADOR MODULARIZADO FINAL)
'use strict';

import store from '../../shared/services/Store.js';

// Importa os novos componentes-filho
import HojeSubView from './components/HojeSubView.js';
import HistoricoSubView from './components/HistoricoSubView.js';
import DespesasSubView from './components/DespesasSubView.js';

let unsubscribe = null;
let viewNode = null;
let activeChild = null; // Guarda a referência do módulo filho ativo

// Estado local do orquestrador, apenas para controlar a aba ativa
let localState = {
    activeSubView: 'hoje',
};

function unmountChild() {
    if (activeChild && typeof activeChild.unmount === 'function') {
        activeChild.unmount();
    }
    activeChild = null;
}

function mountChild() {
    unmountChild();
    const container = viewNode.querySelector('#fluxo-caixa-content');
    if (!container) return;

    switch(localState.activeSubView) {
        case 'hoje':
            activeChild = HojeSubView;
            HojeSubView.mount(container);
            break;
        case 'historico':
            activeChild = HistoricoSubView;
            HistoricoSubView.mount(container);
            break;
        case 'despesas':
            activeChild = DespesasSubView;
            DespesasSubView.mount(container);
            break;
    }
}

function render() {
    return `
        <header class="page-header sticky-header">
            <div class="header-row">
                <h2 class="page-title">Caixa</h2>
            </div>
            <div class="tab-nav">
                <button class="tab-button ${localState.activeSubView === 'hoje' ? 'active' : ''}" data-subview="hoje">Hoje</button>
                <button class="tab-button ${localState.activeSubView === 'historico' ? 'active' : ''}" data-subview="historico">Histórico</button>
                <button class="tab-button ${localState.activeSubView === 'despesas' ? 'active' : ''}" data-subview="despesas">Despesas</button>
            </div>
        </header>
        <main id="fluxo-caixa-content" class="page-content"></main>
        `;
}

function handleTabClick(e) {
    const subviewBtn = e.target.closest('[data-subview]');
    if (subviewBtn && subviewBtn.dataset.subview !== localState.activeSubView) {
        localState.activeSubView = subviewBtn.dataset.subview;
        
        // Atualiza a classe 'active' nas abas
        viewNode.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.subview === localState.activeSubView);
        });

        // Monta o novo conteúdo
        mountChild();
    }
}

function mount() {
    viewNode = document.getElementById('app-root');
    localState.activeSubView = 'hoje';
    if(!viewNode) return;
    
    viewNode.innerHTML = render();
    mountChild(); // Monta o conteúdo da aba inicial

    viewNode.querySelector('.tab-nav').addEventListener('click', handleTabClick);

    // A subscrição no orquestrador é agora desnecessária, pois cada filho se subscreve
    // unsubscribe = store.subscribe(() => {}); 
}

function unmount() {
    unmountChild(); // Garante que o último filho ativo seja desmontado
    if (unsubscribe) unsubscribe();
    
    const tabNav = viewNode?.querySelector('.tab-nav');
    if(tabNav) tabNav.removeEventListener('click', handleTabClick);

    viewNode = null;
    unsubscribe = null;
    activeChild = null;
}

export default { render, mount, unmount };