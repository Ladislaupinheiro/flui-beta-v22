// /modules/features/inventario/components/SupplierProfile.js (NOVO)
'use strict';

import store from '../../../shared/services/Store.js';
import { getFornecedorProfile } from '../services/SupplierAnalyticsService.js';
import { formatarMoeda } from '../../../shared/lib/utils.js';

let containerNode = null;
let unsubscribe = null;
let currentFornecedorId = null;

function render(fornecedor) {
    const profile = getFornecedorProfile(fornecedor.id, store.getState());

    return `
        <div class="card stats-grid supplier-stats">
             <div class="stat-item">
                <span class="stat-value primary">${formatarMoeda(profile.gastoTotal)}</span>
                <span class="stat-label">Gasto Total</span>
            </div>
             <div class="stat-item">
                <span class="stat-value">${profile.produtoMaisComprado}</span>
                <span class="stat-label">Produto Principal</span>
            </div>
        </div>
    `;
}

function mount(container, fornecedor) {
    if (!container || !fornecedor) return;

    containerNode = container;
    currentFornecedorId = fornecedor.id;

    containerNode.innerHTML = render(fornecedor);

    unsubscribe = store.subscribe(() => {
        if (containerNode && currentFornecedorId) {
            const state = store.getState();
            // Verifica se o fornecedor ainda existe antes de tentar re-renderizar
            const updatedFornecedor = state.fornecedores.find(f => f.id === currentFornecedorId);
            if (updatedFornecedor) {
                containerNode.innerHTML = render(updatedFornecedor);
            }
        }
    });
}

function unmount() {
    if (unsubscribe) unsubscribe();
    unsubscribe = null;
    containerNode = null;
    currentFornecedorId = null;
}

export default { render, mount, unmount };