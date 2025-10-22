// /modules/shared/store/combineReducers.js (NOVO)
'use strict';

/**
 * Combina um objeto de reducers "slice" num único "root reducer".
 * @param {object} slices - Um objeto onde cada chave corresponde a uma parte do estado
 * e cada valor é o reducer responsável por essa parte.
 * @returns {Function} O root reducer que pode ser usado pelo Store.
 */
export default function combineReducers(slices) {
    return function rootReducer(state = {}, action) {
        const nextState = {};
        let hasChanged = false;

        for (const key in slices) {
            const previousStateForKey = state[key];
            const nextStateForKey = slices[key](previousStateForKey, action);
            
            nextState[key] = nextStateForKey;
            hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
        }
        
        // Se nenhum reducer alterou o seu estado, retornamos o estado original
        // para manter a imutabilidade e evitar re-renderizações desnecessárias.
        return hasChanged ? { ...state, ...nextState } : state;
    };
}