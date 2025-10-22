// /modules/shared/store/clientesSlice.js (NOVO)
'use strict';

/**
 * Reducer para a fatia 'clientes' do estado da aplicação.
 * Lida com a criação, atualização, exclusão e gestão de dívidas dos clientes.
 * @param {Array} state - O estado atual da lista de clientes.
 * @param {object} action - A ação despachada.
 * @returns {Array} O novo estado da lista de clientes.
 */
export default function clientesReducer(state = [], action) {
    switch (action.type) {
        case 'SET_INITIAL_STATE':
            return action.payload.clientes || [];

        case 'ADD_CLIENT': {
            const novoClientePayload = action.payload;
            const novoCliente = { 
                id: crypto.randomUUID(), 
                dataRegisto: new Date().toISOString(), 
                dividas: [], 
                fotoDataUrl: null, 
                ...novoClientePayload 
            };
            return [...state, novoCliente];
        }

        case 'UPDATE_CLIENT': {
            const clientePayload = action.payload;
            return state.map(c => 
                c.id === clientePayload.id 
                ? { ...c, ...clientePayload } 
                : c
            );
        }

        case 'DELETE_CLIENT':
            return state.filter(c => c.id !== action.payload);
        
        case 'ADD_DEBT': {
            const { clienteId, valor, descricao } = action.payload;
            return state.map(c => {
                if (c.id === clienteId) {
                    const novaDivida = { id: crypto.randomUUID(), data: new Date().toISOString(), valor, descricao, tipo: 'debito' };
                    const dividasAtualizadas = [...(c.dividas || []), novaDivida];
                    return { ...c, dividas: dividasAtualizadas };
                }
                return c;
            });
        }

        case 'SETTLE_DEBT': {
            const { clienteId, valor, metodoPagamento } = action.payload;
            return state.map(c => {
                if (c.id === clienteId) {
                    const novoCredito = { id: crypto.randomUUID(), data: new Date().toISOString(), valor, descricao: `Pagamento (${metodoPagamento})`, tipo: 'credito' };
                    const dividasAtualizadas = [...(c.dividas || []), novoCredito];
                    return { ...c, dividas: dividasAtualizadas };
                }
                return c;
            });
        }

        default:
            return state;
    }
}