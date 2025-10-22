// /modules/shared/store/fornecedoresSlice.js (NOVO)
'use strict';

/**
 * Reducer para a fatia 'fornecedores' do estado da aplicação.
 * @param {Array} state - O estado atual da lista de fornecedores.
 * @param {object} action - A ação despachada.
 * @returns {Array} O novo estado da lista de fornecedores.
 */
export default function fornecedoresReducer(state = [], action) {
    switch (action.type) {
        case 'SET_INITIAL_STATE':
            return action.payload.fornecedores || [];

        case 'ADD_FORNECEDOR': {
            const novoFornecedor = { id: crypto.randomUUID(), catalogo: [], ...action.payload };
            return [...state, novoFornecedor];
        }

        case 'UPDATE_FORNECEDOR': {
            const fornecedorAtualizado = action.payload;
            return state.map(f => (f.id === fornecedorAtualizado.id ? fornecedorAtualizado : f));
        }

        case 'DELETE_FORNECEDOR':
            return state.filter(f => f.id !== action.payload);

        case 'ADD_PRODUCT_TO_CATALOG': {
            const { fornecedorId, produto } = action.payload;
            return state.map(f => {
                if (f.id === fornecedorId) {
                    const produtoCatalogo = { id: crypto.randomUUID(), ...produto };
                    const catalogoAtualizado = [...(f.catalogo || []), produtoCatalogo];
                    return { ...f, catalogo: catalogoAtualizado };
                }
                return f;
            });
        }

        default:
            return state;
    }
}