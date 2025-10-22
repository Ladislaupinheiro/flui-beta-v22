// /modules/shared/store/historicoFechosSlice.js (NOVO)
'use strict';

/**
 * Reducer para a fatia 'historicoFechos' do estado da aplicação.
 * @param {Array} state - O estado atual do histórico de fechos.
 * @param {object} action - A ação despachada.
 * @returns {Array} O novo estado do histórico de fechos.
 */
export default function historicoFechosReducer(state = [], action) {
    switch (action.type) {
        case 'SET_INITIAL_STATE':
            return action.payload.historicoFechos || [];

        case 'ARCHIVE_DAY':
            return [...state, action.payload.relatorio];

        default:
            return state;
    }
}