// /modules/shared/store/historicoComprasSlice.js (NOVO)
'use strict';

/**
 * Reducer para a fatia 'historicoCompras' do estado da aplicação.
 * @param {Array} state - O estado atual do histórico de compras.
 * @param {object} action - A ação despachada.
 * @returns {Array} O novo estado do histórico de compras.
 */
export default function historicoComprasReducer(state = [], action) {
    switch (action.type) {
        case 'SET_INITIAL_STATE':
            return action.payload.historicoCompras || [];

        case 'ADD_COMPRA': {
            const novaCompra = { id: crypto.randomUUID(), data: new Date().toISOString(), ...action.payload };
            return [...state, novaCompra];
        }

        default:
            return state;
    }
}