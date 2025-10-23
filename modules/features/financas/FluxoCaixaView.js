// /modules/features/financas/FluxoCaixaView.js (REMOVIDOS FOOTERS, ADICIONADO MENU AÇÕES)
'use strict';

import store from '../../shared/services/Store.js';
import { abrirModalAcoesFlutuantes, abrirModalExportarCompras } from '../../shared/components/Modals.js'; // Adiciona abrirModalAcoesFlutuantes
import HojeSubView from './components/HojeSubView.js';
import HistoricoSubView from './components/HistoricoSubView.js';
import DespesasSubView from './components/DespesasSubView.js';
import { calcularRelatorioDia } from './services/ReportingService.js'; // Importa para ação Arquivar

let unsubscribe = null;
let viewNode = null;
let activeChild = null;

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
        <header class="page-header sticky-header caixa-header">
            <div class="header-row"> 
             
                <div style="width: 40px;"></div>
                <div class="main-segmented-control-container">
                     <div class="segmented-control main-tabs">
                        <button class="segmented-control-button ${localState.activeSubView === 'hoje' ? 'active' : ''}" data-subview="hoje">Hoje</button>
                        <button class="segmented-control-button ${localState.activeSubView === 'historico' ? 'active' : ''}" data-subview="historico">Histórico</button>
                        <button class="segmented-control-button ${localState.activeSubView === 'despesas' ? 'active' : ''}" data-subview="despesas">Despesas</button>
                    </div>
                </div>
             
                <button id="btn-caixa-actions" class="header-action-btn" style="width: 40px;">
                     ${localState.activeSubView !== 'despesas' ? '<i class="lni lni-more-alt"></i>' : ''} 
                </button>
            </div>
        </header>
        <main id="fluxo-caixa-content" class="page-content"></main>
        
    `;
}

function handleTabClick(e) {
    const subviewBtn = e.target.closest('[data-subview]');
    if (subviewBtn && subviewBtn.dataset.subview !== localState.activeSubView) {
        localState.activeSubView = subviewBtn.dataset.subview;

        viewNode.querySelectorAll('.main-tabs .segmented-control-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.subview === localState.activeSubView);
        });

        // Re-renderiza o header para mostrar/esconder o botão de ações
        const headerRow = viewNode.querySelector('.header-row');
        const actionsButtonHTML = `
            <button id="btn-caixa-actions" class="header-action-btn" style="width: 40px;">
                 ${localState.activeSubView !== 'despesas' ? '<i class="lni lni-more-alt"></i>' : ''}
            </button>`;
        headerRow.querySelector('#btn-caixa-actions')?.remove(); // Remove o botão antigo
        headerRow.insertAdjacentHTML('beforeend', actionsButtonHTML); // Adiciona o novo (ou vazio)

        mountChild();
    }
}

function handleHeaderActionsClick() {
    if (localState.activeSubView === 'hoje') {
        abrirModalAcoesFlutuantes('Ações do Dia', [
            { acao: 'arquivar', texto: 'Arquivar e Fechar Dia', icone: 'lni lni-archive', callback: () => {
                 // Lógica de arquivar movida do HojeSubView para cá
                 // Nota: Precisamos passar 'closeModal' para handleArquivarDia ou refatorar
                 // Por simplicidade agora, chamamos diretamente o modal de confirmação
                 abrirModalConfirmacao(
                    'Arquivar o Dia?',
                    'Esta ação não pode ser desfeita.', // Mensagem simplificada
                    () => {
                        const relatorio = calcularRelatorioDia(store.getState());
                        store.dispatch({ type: 'ARCHIVE_DAY', payload: { relatorio } });
                        Toast.mostrarNotificacao("Dia arquivado com sucesso!");
                        PWAService.showLocalNotification('Dia Fechado!', { body: `Saldo: ${formatarMoeda(relatorio.saldoFinal)}`});
                    }
                 );
            }}
        ]);
    } else if (localState.activeSubView === 'historico') {
        abrirModalAcoesFlutuantes('Ações do Histórico', [
            { acao: 'exportar_compras', texto: 'Exportar Relatório de Compras', icone: 'lni lni-download', callback: () => abrirModalExportarCompras() }
            // Poderíamos adicionar exportação de fechos aqui também
        ]);
    }
}


function mount() {
    viewNode = document.getElementById('app-root');
    localState.activeSubView = 'hoje';
    if(!viewNode) return;

    viewNode.innerHTML = render();
    mountChild();

    viewNode.querySelector('.main-tabs')?.addEventListener('click', handleTabClick);
    viewNode.addEventListener('click', (e) => { // Listener delegado para o botão de ações
        if (e.target.closest('#btn-caixa-actions')) {
            handleHeaderActionsClick();
        }
    });
}

function unmount() {
    unmountChild();
    if (unsubscribe) unsubscribe();

    const tabContainer = viewNode?.querySelector('.main-tabs');
    if(tabContainer) tabContainer.removeEventListener('click', handleTabClick);
    // Remover listener delegado não é estritamente necessário se viewNode for limpo

    viewNode = null;
    unsubscribe = null;
    activeChild = null;
}

export default { render, mount, unmount };