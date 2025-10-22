// /modules/shared/store/tagsDeClienteSlice.js (NOVO)
'use strict';

/**
 * Reducer para a fatia 'tagsDeCliente' do estado da aplicação.
 * @param {Array} state - O estado atual da lista de tags.
 * @param {object} action - A ação despachada.
 * @returns {Array} O novo estado da lista de tags.
 */
export default function tagsDeClienteReducer(state = [], action) {
    switch (action.type) {
        case 'SET_INITIAL_STATE':
            return action.payload.tagsDeCliente || [];

        case 'ADD_CLIENT_TAG': {
            const novaTag = { id: crypto.randomUUID(), ...action.payload };
            // Evita duplicados (case-insensitive)
            if (state.some(tag => tag.nome.toLowerCase() === novaTag.nome.toLowerCase())) {
                return state;
            }
            return [...state, novaTag];
        }

        default:
            return state;
    }
}