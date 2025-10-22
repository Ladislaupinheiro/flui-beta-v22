// /modules/shared/store/atendimentoSlice.js (NOVO)
'use strict';

/**
 * Reducer para a fatia 'contasAtivas' do estado da aplicação.
 * @param {Array} state - O estado atual das contas ativas.
 * @param {object} action - A ação despachada.
 * @returns {Array} O novo estado das contas ativas.
 */
export default function atendimentoReducer(state = [], action) {
    switch (action.type) {
        case 'SET_INITIAL_STATE':
            return action.payload.contasAtivas || [];

        case 'ADD_ACCOUNT': {
            const novaContaPayload = action.payload;
            const novaConta = { id: crypto.randomUUID(), pedidos: [], dataAbertura: new Date().toISOString(), status: 'ativa', ...novaContaPayload };
            return [...state, novaConta];
        }

        case 'CHANGE_ACCOUNT_CLIENT': {
            const { contaId, novoClienteId, novoClienteNome } = action.payload;
            return state.map(conta => 
                conta.id === contaId 
                ? { ...conta, clienteId: novoClienteId, nome: novoClienteNome } 
                : conta
            );
        }

        case 'ADD_ORDER_ITEM': {
            const { contaId, produto, quantidade } = action.payload;
            return state.map(conta => {
                if (conta.id !== contaId) return conta;

                const pedidos = [...conta.pedidos];
                const pedidoExistenteIndex = pedidos.findIndex(p => p.produtoId === produto.id);

                if (pedidoExistenteIndex > -1) {
                    const p = pedidos[pedidoExistenteIndex];
                    pedidos[pedidoExistenteIndex] = { ...p, qtd: p.qtd + quantidade };
                } else {
                    pedidos.push({ id: crypto.randomUUID(), produtoId: produto.id, nome: produto.nome, preco: produto.precoVenda, custo: produto.custoUnitario || 0, qtd: quantidade });
                }
                return { ...conta, pedidos };
            });
        }

        case 'REMOVE_ORDER_ITEM': {
            const { contaId, pedidoId } = action.payload;
            return state.map(c => 
                c.id === contaId 
                ? { ...c, pedidos: c.pedidos.filter(p => p.id !== pedidoId) } 
                : c
            );
        }

        case 'UPDATE_ORDER_ITEM_QTD': {
            const { contaId, pedidoId, novaQuantidade } = action.payload;
            return state.map(c => 
                c.id === contaId 
                ? { ...c, pedidos: c.pedidos.map(p => p.id === pedidoId ? { ...p, qtd: novaQuantidade } : p) } 
                : c
            );
        }

        case 'FINALIZE_PAYMENT': {
            const { contaId, metodoPagamento } = action.payload;
            return state.map(c => {
                if (c.id === contaId && c.status === 'ativa') {
                    const valorFinal = c.pedidos.reduce((total, p) => total + (p.preco * p.qtd), 0);
                    return { ...c, status: 'fechada', metodoPagamento, dataFecho: new Date().toISOString(), valorFinal };
                }
                return c;
            });
        }

        case 'ARCHIVE_DAY': {
            // Remove as contas que foram fechadas, mantendo apenas as ativas.
            return state.filter(c => c.status === 'ativa');
        }

        default:
            return state;
    }
}