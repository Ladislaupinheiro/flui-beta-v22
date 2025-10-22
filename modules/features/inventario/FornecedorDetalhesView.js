// /modules/features/inventario/FornecedorDetalhesView.js (ARQUITETURA REATORADA)
'use strict';

import store from '../../shared/services/Store.js';
import Router from '../../app/Router.js';
import * as Toast from '../../shared/components/Toast.js';
import { 
    abrirModalRegistarCompra, 
    abrirModalExportarCompras,
    abrirModalAcoesFlutuantes,
    abrirModalEditFornecedor,
    abrirModalConfirmacao
} from '../../shared/components/Modals.js';

// Importação dos novos componentes-filho
import SupplierProfile from './components/SupplierProfile.js';
import SupplierAnalytics from './components/SupplierAnalytics.js';
import PurchaseHistory from './components/PurchaseHistory.js';

let unsubscribe = null;
let viewNode = null;
let fornecedorAtivoId = null;

function render(fornecedor) {
    if (!fornecedor) return `<div class="empty-state-container"><p>Fornecedor não encontrado.</p></div>`;

    return `
        <header class="page-header sticky-header">
            <button id="btn-voltar-inventario" class="header-action-btn back-btn"><i class="lni lni-arrow-left"></i></button>
            <h2 class="page-title">${fornecedor.nome}</h2>
            <button id="btn-fornecedor-actions" class="header-action-btn"><i class="lni lni-more-alt"></i></button>
        </header>

        <main class="page-content">
            <div id="supplier-profile-container"></div>
            
            <div id="supplier-analytics-container"></div>
            
            <div id="purchase-history-container"></div>
        </main>
        
        <div id="history-overlay-container"></div>
        <button id="btn-fab-registar-compra" class="fab" title="Registar Nova Compra"><i class="lni lni-plus"></i></button>
    `;
}

function mount(fornecedorId) {
    viewNode = document.getElementById('app-root');
    fornecedorAtivoId = fornecedorId;

    const updateAndRender = () => {
        if (!viewNode || !fornecedorAtivoId) return;
        const fornecedor = store.getState().fornecedores.find(f => f.id === fornecedorAtivoId);
        if (!fornecedor) { Router.navigateTo('#inventario'); return; }
        
        viewNode.innerHTML = render(fornecedor);

        // Monta os componentes-filho nos seus respetivos containers
        SupplierProfile.mount(viewNode.querySelector('#supplier-profile-container'), fornecedor);
        SupplierAnalytics.mount(viewNode.querySelector('#supplier-analytics-container'), fornecedorId);
        PurchaseHistory.mount(
            viewNode.querySelector('#purchase-history-container'),
            viewNode.querySelector('#history-overlay-container'),
            fornecedor
        );
    };

    const handleViewClick = (e) => {
        const fornecedor = store.getState().fornecedores.find(f => f.id === fornecedorAtivoId);
        if (!fornecedor) return;

        if (e.target.closest('#btn-voltar-inventario')) { Router.navigateTo('#inventario'); return; }
        if (e.target.closest('#btn-fab-registar-compra')) { abrirModalRegistarCompra(fornecedor, null); return; }
        
        if (e.target.closest('#btn-fornecedor-actions')) {
            abrirModalAcoesFlutuantes(`Ações para ${fornecedor.nome}`, [
                { acao: 'exportar', texto: 'Exportar Histórico', icone: 'lni lni-download', callback: () => abrirModalExportarCompras() },
                { acao: 'editar', texto: 'Editar Dados', icone: 'lni lni-pencil', callback: () => abrirModalEditFornecedor(fornecedor) },
                { acao: 'apagar', texto: 'Eliminar Fornecedor', icone: 'lni lni-trash-can', cor: 'var(--feedback-error)', callback: () => {
                    abrirModalConfirmacao(`Eliminar ${fornecedor.nome}?`, 'Esta ação é irreversível.', () => {
                        store.dispatch({ type: 'DELETE_FORNECEDOR', payload: fornecedor.id });
                        Toast.mostrarNotificacao(`Fornecedor ${fornecedor.nome} eliminado.`);
                        Router.navigateTo('#inventario');
                    });
                }}
            ]);
            return;
        }
    };

    updateAndRender();
    viewNode.addEventListener('click', handleViewClick);
    
    unsubscribe = store.subscribe(() => {
        const fornecedorAindaExiste = store.getState().fornecedores.some(f => f.id === fornecedorAtivoId);
        if(!fornecedorAindaExiste) {
            Router.navigateTo('#inventario');
        }
        // As atualizações de dados agora são geridas internamente pelos componentes-filho
    });
}

function unmount() {
    if (unsubscribe) unsubscribe();
    
    // Desmonta todos os componentes-filho para limpar listeners e estados
    SupplierProfile.unmount();
    SupplierAnalytics.unmount();
    PurchaseHistory.unmount();

    viewNode = null;
    fornecedorAtivoId = null;
    unsubscribe = null;
}

export default { render, mount, unmount };