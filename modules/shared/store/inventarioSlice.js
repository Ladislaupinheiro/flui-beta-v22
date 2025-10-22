// /modules/shared/store/inventarioSlice.js (CORRIGIDO: Bug de Custo Zero)
'use strict';

export default function inventarioReducer(state = [], action) {
    switch (action.type) {
        case 'SET_INITIAL_STATE':
            return (action.payload.inventario || []).map(p => ({
                custoUnitario: 0,
                precoVenda: null,
                stockMinimo: 1,
                ...p
            }));

        case 'ADD_PRODUCT': {
            const novoProdutoPayload = action.payload;
            const novoProduto = {
                id: crypto.randomUUID(),
                stockLoja: 0,
                stockArmazem: 0,
                ultimaVenda: null,
                custoUnitario: 0,
                precoVenda: null,
                stockMinimo: novoProdutoPayload.stockMinimo || 1,
                ...novoProdutoPayload
            };
            if (state.some(p => p.nome.toLowerCase() === novoProduto.nome.toLowerCase())) {
                console.warn(`Tentativa de adicionar produto duplicado: "${novoProduto.nome}"`);
                return state;
            }
            return [...state, novoProduto];
        }

        case 'UPDATE_PRODUCT':
            const produtoAtualizadoPayload = action.payload;
            return state.map(p => (p.id === produtoAtualizadoPayload.id ? { ...p, ...produtoAtualizadoPayload } : p));

        case 'DELETE_PRODUCT':
            return state.filter(p => p.id !== action.payload);

        case 'SET_SELLING_PRICE': {
            const { produtoId, precoVenda } = action.payload;
            return state.map(p =>
                p.id === produtoId
                ? { ...p, precoVenda: precoVenda }
                : p
            );
        }

        case 'MOVE_STOCK': {
            const { produtoId, quantidade } = action.payload;
            return state.map(p =>
                p.id === produtoId
                ? { ...p, stockArmazem: Math.max(0, p.stockArmazem - quantidade), stockLoja: p.stockLoja + quantidade }
                : p
            );
        }

        case 'ADD_COMPRA': {
            // *** CORREÇÃO APLICADA AQUI ***
            // Alterado de 'valorTotal' para 'custoTotal' para corresponder ao payload enviado.
            const { produtoId, quantidade, custoTotal } = action.payload;
            const custoUnitarioCalculado = quantidade > 0 ? (custoTotal / quantidade) : undefined;

            return state.map(produto => {
                if (produto.id === produtoId) {
                    const novoStockArmazem = produto.stockArmazem + quantidade;
                    const novoCustoUnitario = custoUnitarioCalculado !== undefined ? custoUnitarioCalculado : produto.custoUnitario;
                    return {
                        ...produto,
                        stockArmazem: novoStockArmazem,
                        custoUnitario: novoCustoUnitario
                    };
                }
                return produto;
            });
        }


        case 'FINALIZE_PAYMENT': {
            const { contaFinalizada } = action.payload;
            if (!contaFinalizada || !contaFinalizada.pedidos) return state;

            const vendasPorProduto = contaFinalizada.pedidos.reduce((acc, pedido) => {
                acc[pedido.produtoId] = (acc[pedido.produtoId] || 0) + pedido.qtd;
                return acc;
            }, {});

            return state.map(produto => {
                if (vendasPorProduto[produto.id]) {
                    const novoStockLoja = Math.max(0, produto.stockLoja - vendasPorProduto[produto.id]);
                    return { ...produto, stockLoja: novoStockLoja, ultimaVenda: new Date().toISOString() };
                }
                return produto;
            });
        }

        case 'ARCHIVE_DAY': {
            return state.map(item => ({
                ...item,
                stockArmazem: item.stockArmazem + item.stockLoja,
                stockLoja: 0
            }));
        }

        default:
            return state;
    }
}