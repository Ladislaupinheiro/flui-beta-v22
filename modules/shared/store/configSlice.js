// /modules/shared/store/configSlice.js (NOVO)
'use strict';

// Pega o estado inicial de configuração definido no Store.js principal
import { initialState as globalInitialState } from '../services/Store.js'; 

/**
 * Reducer para a fatia 'config' do estado da aplicação.
 * @param {object} state - O estado atual da configuração.
 * @param {object} action - A ação despachada.
 * @returns {object} O novo estado da configuração.
 */
export default function configReducer(state = globalInitialState.config, action) {
    switch (action.type) {
        case 'SET_INITIAL_STATE':
            // Funde a configuração inicial com a carregada da DB
            return { ...globalInitialState.config, ...(action.payload.config || {}) };

        case 'UPDATE_CONFIG':
            return { ...state, ...action.payload };

        case 'UPDATE_SHORTCUTS':
            return { ...state, priorityProducts: action.payload };

        default:
            return state;
    }
}