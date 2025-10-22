// /modules/shared/store/categoriasDeProdutoSlice.js (NOVO)
'use strict';

/**
 * Reducer para a fatia 'categoriasDeProduto' do estado da aplicação.
 * @param {Array} state - O estado atual da lista de categorias.
 * @param {object} action - A ação despachada.
 * @returns {Array} O novo estado da lista de categorias.
 */
export default function categoriasDeProdutoReducer(state = [], action) {
    switch (action.type) {
        case 'SET_INITIAL_STATE':
            // Garante que o estado inicial tenha as categorias padrão se o payload estiver vazio
            return action.payload.categoriasDeProduto && action.payload.categoriasDeProduto.length > 0 
                   ? action.payload.categoriasDeProduto 
                   : []; // A lógica de criação das categorias padrão fica no carregarEstadoInicial

        case 'ADD_PRODUCT_CATEGORY': {
            const { nome, cor, parentId } = action.payload;
            const novaCategoria = { id: crypto.randomUUID(), nome, cor, parentId: parentId || null, isSystemDefault: false };
            // Evita duplicados dentro da mesma categoria pai (case-insensitive)
            if (state.some(cat => cat.parentId === parentId && cat.nome.toLowerCase() === nome.toLowerCase())) {
                return state;
            }
            return [...state, novaCategoria];
        }

        case 'DELETE_PRODUCT_CATEGORY': {
            const categoriaId = action.payload;
            const categoriaParaApagar = state.find(cat => cat.id === categoriaId);
            // Protege contra a exclusão de categorias do sistema
            if (categoriaParaApagar && categoriaParaApagar.isSystemDefault) { 
                return state; 
            }
            return state.filter(cat => cat.id !== categoriaId);
        }

        default:
            return state;
    }
}