// /modules/shared/store/despesasSlice.js (NOVO)
'use strict';

/**
 * Reducer para a fatia 'despesas' do estado da aplicação.
 * @param {Array} state - O estado atual da lista de despesas.
 * @param {object} action - A ação despachada.
 * @returns {Array} O novo estado da lista de despesas.
 */
export default function despesasReducer(state = [], action) {
    switch (action.type) {
        case 'SET_INITIAL_STATE':
            return action.payload.despesas || [];

        case 'ADD_EXPENSE':
            return [...state, action.payload];

        default:
            return state;
    }
}